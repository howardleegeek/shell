#!/usr/bin/env python3
"""
Storage Layout Visualizer for EVM contracts

Features:
- Import storage layout from forge's storage-layout JSON (forge inspect --json)
- Print a slot-by-slot table with slot, offset, name, type, size
- Compute packing efficiency per slot and provide simple optimization tips
- Diff two storage layouts (old vs new)
- Read a storage slot live from an Ethereum-compatible RPC and decode a few basic types

Usage:
- layout: visualize a layout JSON (or fetch from forge if contract is provided)
- diff: compare two layout JSONs
- read: read a live storage slot and decode using a provided type hint
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from typing import Any, Dict, List, Optional, Tuple


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_entries(obj: Any) -> List[Dict[str, Any]]:
    # Recursively extract candidate storage entries from forge JSON
    entries: List[Dict[str, Any]] = []

    def add_from_dict(d: Dict[str, Any]) -> None:
        # Heuristic: a storage entry has at least one of: 'name'/'label'/'type'/'slot'
        if not isinstance(d, dict):
            return
        keys = set(d.keys())
        if any(
            k in keys
            for k in ("name", "label", "type", "slot", "offset", "bytes", "start")
        ):
            slot = d.get("slot") or d.get("start") or d.get("slotIndex") or d.get("idx")
            offset = d.get("offset") or 0
            name = d.get("name") or d.get("label") or d.get("storage") or ""
            type_ = d.get("type") or d.get("storage_type") or d.get("layout_type") or ""
            b = d.get("bytes") or d.get("size") or None
            try:
                slot_i = int(slot) if slot is not None else None
            except (TypeError, ValueError):
                slot_i = None
            entry = {
                "slot": slot_i,
                "offset": int(offset) if offset is not None else 0,
                "name": str(name) if name is not None else "",
                "type": str(type_) if type_ is not None else "",
                "bytes": int(b) if b is not None else None,
            }
            # Only keep entries that have at least a name
            if entry["name"] or entry["type"]:
                entries.append(entry)

        # dive deeper
        for v in d.values():
            if isinstance(v, dict):
                add_from_dict(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        add_from_dict(item)

    add_from_dict(obj if isinstance(obj, dict) else {})
    # Deduplicate while preserving order
    seen = set()
    uniq: List[Dict[str, Any]] = []
    for e in entries:
        t = (e.get("slot"), e.get("offset"), e.get("name"), e.get("type"))
        if t not in seen:
            seen.add(t)
            uniq.append(e)
    return uniq


def format_table(entries: List[Dict[str, Any]]) -> List[str]:
    lines: List[str] = []
    header = f"{'Slot':>6} | {'Offset':>6} | {'Name':<20} | {'Type':<25} | {'Bytes':>6}"
    lines.append(header)
    lines.append("-" * len(header))
    for e in sorted(
        entries,
        key=lambda x: (
            x.get("slot") if x.get("slot") is not None else -1,
            x.get("offset", 0),
        ),
    ):
        slot = e.get("slot")
        offset = e.get("offset", 0)
        name = (e.get("name") or "")[:20]
        typ = (e.get("type") or "")[:25]
        b = e.get("bytes")
        b_str = str(b) if b is not None else ""
        lines.append(
            f"{str(slot):>6} | {str(offset):>6} | {name:<20} | {typ:<25} | {b_str:>6}"
        )
    return lines


def compute_packing(entries: List[Dict[str, Any]]) -> Dict[int, int]:
    # Map slot -> bytes used (approximate). If multiple items share a slot, take max end = offset + bytes or 32 if unknown
    used: Dict[int, int] = {}
    for e in entries:
        s = int(e.get("slot") or 0)
        off = int(e.get("offset") or 0)
        sz = e.get("bytes")
        end = off + (int(sz) if sz is not None else 32)
        if s in used:
            used[s] = max(used[s], end)
        else:
            used[s] = end
    return used


def layout_to_str(
    entries_old: List[Dict[str, Any]], entries_new: List[Dict[str, Any]]
) -> str:
    old_map = {(e.get("slot"), e.get("offset")): e for e in entries_old}
    new_map = {(e.get("slot"), e.get("offset")): e for e in entries_new}
    s = []
    s.append("Slot-level diff:")
    slots_all = [e.get("slot") for e in entries_old] + [
        e.get("slot") for e in entries_new
    ]
    slots = sorted([s for s in slots_all if s is not None])
    for slot in slots:
        old_in_slot = [e for e in entries_old if e.get("slot") == slot]
        new_in_slot = [e for e in entries_new if e.get("slot") == slot]
        old_desc = ", ".join([f"{e.get('name')}:{e.get('type')}" for e in old_in_slot])
        new_desc = ", ".join([f"{e.get('name')}:{e.get('type')}" for e in new_in_slot])
        if old_desc != new_desc:
            s.append(f"  Slot {slot}: old=[{old_desc}]  new=[{new_desc}]")
    if len(s) == 1:
        s.append("  (no changes reported)")
    return "\n".join(s)


def read_live_storage(rpc_url: str, contract: str, slot_index: int) -> Tuple[str, str]:
    # eth_getStorageAt expects slot as 0x.. hex string
    import requests

    payload = {
        "jsonrpc": "2.0",
        "method": "eth_getStorageAt",
        "params": [contract, hex(slot_index), "latest"],
        "id": 1,
    }
    resp = requests.post(rpc_url, json=payload, timeout=20)
    if resp.status_code != 200:
        raise RuntimeError(f"RPC error: {resp.status_code} {resp.text}")
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"RPC error: {data['error']}")
    value = data.get("result")  # 32-byte hex string
    if not value:
        value = "0x" + "0" * 64
    # Decode basic types if possible later; return hex string and raw
    return value, contract


def decode_value(hex32: str, typ: str) -> str:
    # naive decoding for common solidity types
    if hex32.startswith("0x"):
        raw = bytes.fromhex(hex32[2:].rjust(64, "0"))
    else:
        raw = bytes.fromhex(hex32.rjust(64, "0"))
    if typ.startswith("address"):
        return "0x" + raw[-20:].hex()
    if typ.startswith("uint") or typ.startswith("int"):
        try:
            return str(int.from_bytes(raw, "big", signed=typ.startswith("int")))
        except Exception:
            return raw.hex()
    if typ == "bool":
        return str(bool(int.from_bytes(raw, "big")))
    if typ.startswith("bytes"):
        # fixed-size bytes<N>
        if typ != "bytes":
            n = int(typ[5:]) if len(typ) > 5 else 32
            return raw[:n].hex()
        return raw.hex()
    return hex32


def write_progress(message: str) -> None:
    path = os.path.join(os.getcwd(), "progress.txt")
    with open(path, "a", encoding="utf-8") as f:
        f.write(message + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(prog="storage-layout-cli", add_help=True)
    subparsers = parser.add_subparsers(dest="cmd", required=True)

    # layout command
    p_layout = subparsers.add_parser(
        "layout", help="Visualize storage layout from json or forge"
    )
    p_layout.add_argument("--contract", help="Contract name to fetch layout via forge")
    p_layout.add_argument(
        "--json", help="Path to storage layout json (forge inspect --json)"
    )
    p_layout.add_argument(
        "--old-json", dest="old_json", help="Old layout json for comparison"
    )
    p_layout.add_argument(
        "--new-json", dest="new_json", help="New layout json for comparison"
    )

    # diff command
    p_diff = subparsers.add_parser("diff", help="Diff two storage-layout jsons")
    p_diff.add_argument("--old-json", required=True)
    p_diff.add_argument("--new-json", required=True)

    # read command
    p_read = subparsers.add_parser("read", help="Read a live storage slot from an RPC")
    p_read.add_argument(
        "--rpc-url", default="http://localhost:8545", help="RPC URL of an Ethereum node"
    )
    p_read.add_argument(
        "--contract-address", required=True, help="Contract address to read from"
    )
    p_read.add_argument("--slot", type=int, required=True, help="Slot index to read")
    p_read.add_argument(
        "--type", required=False, help="Expected Solidity type for decoding (optional)"
    )

    args = parser.parse_args()

    # Ensure we have a progress file
    write_progress(f"Command: {args.cmd}")

    if args.cmd == "layout":
        # Load JSON either from path or fetch via forge
        layout_path = None
        if args.json:
            layout_path = args.json
        elif args.contract:
            # try to fetch via forge
            cmd = ["forge", "inspect", args.contract, "storage-layout", "--json"]
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, check=True)
                data = res.stdout
                # write to temp file
                tmp = os.path.join(os.getcwd(), "tmp_storage_layout.json")
                with open(tmp, "w", encoding="utf-8") as f:
                    f.write(data)
                layout_path = tmp
            except Exception as e:
                print(f"Error fetching layout via forge: {e}")
                return 1
        else:
            print("Error: provide --json path or --contract to fetch via forge")
            return 2

        layout = load_json(layout_path)
        entries = extract_entries(layout)
        lines = format_table(entries)
        print("\n".join(lines))

        # packing info
        packing = compute_packing(entries)
        total_slots = len(packing)
        used_bytes = sum(min(v, 32) for v in packing.values())
        efficiency = int((used_bytes / (32 * max(1, total_slots))) * 100)
        print()
        print(f"Packing efficiency: {efficiency}% across {total_slots} slots (approx).")
        # naive optimization hint
        if any(v < 32 for v in packing.values()):
            print(
                "Optimization hint: Consider reordering state variables to improve packing within slots."
            )

        write_progress("layout-produced")
        return 0

    if args.cmd == "diff":
        old = load_json(args.old_json)
        new = load_json(args.new_json)
        old_entries = extract_entries(old)
        new_entries = extract_entries(new)
        diff_text = layout_to_str(old_entries, new_entries)
        print(diff_text)
        write_progress("diff-produced")
        return 0

    if args.cmd == "read":
        try:
            value_hex, _ = read_live_storage(
                args.rpc_url, args.contract_address, args.slot
            )
            typ = args.type or ""
            decoded = decode_value(value_hex, typ) if typ else value_hex
            print(f"Slot 0x{args.slot:x} value: {value_hex} -> {decoded}")
            write_progress("read-success")
            return 0
        except Exception as e:
            print(f"Error reading storage: {e}")
            write_progress("read-failed")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
