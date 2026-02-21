#!/usr/bin/env python3
import json
import os
import shlex
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

"""
Multi-chain deploy orchestrator
This script reads deploy.config.json (or deploy.config.sample.json) and deploys a contract
to multiple networks in parallel using the specified tool per network (forge or hardhat).

Usage:
  # Generate a config first (optional):
  # - copy deploy.config.sample.json to deploy.config.json and fill in RPC URLs
  # Run the orchestrator:
  python3 scripts/multi_chain_deploy.py --config deploy.config.json
"""


def load_config(config_path: str) -> Dict[str, Any]:
    if not os.path.isfile(config_path):
        print(f"Config file not found: {config_path}")
        sys.exit(2)
    with open(config_path, "r") as f:
        try:
            cfg = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON in config: {e}")
            sys.exit(2)
    return cfg


def build_forge_cmd(
    network: Dict[str, Any], deploy_script: str, constructor_args: List[str]
) -> List[str]:
    cmd = [
        "forge",
        "script",
        deploy_script,
        "--fork-url",
        network.get("rpc", ""),
        "--broadcast",
    ]
    if network.get("chain_id"):  # forge may use --chain-id in some setups
        cmd += ["--chain-id", str(network["chain_id"])]
    if constructor_args:
        # join args as a single string for --constructor-args
        cmd += ["--constructor-args", " ".join(constructor_args)]
    return cmd


def build_hardhat_cmd(network: Dict[str, Any], script_path: str) -> List[str]:
    # Hardhat command: npx hardhat run <script> --network <name>
    name = network.get("name", "network")
    return ["npx", "hardhat", "run", script_path, "--network", name]


def deploy_to_network(
    network: Dict[str, Any], contracts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    name = network.get("name", "unknown")
    tool = network.get("tool", "forge").lower()
    rpc = network.get("rpc", "")
    chain_id = network.get("chain_id")
    status = {
        "network": name,
        "tool": tool,
        "status": "pending",
        "tx": None,
        "error": None,
    }
    constructor_args = []
    if network.get("constructor_args"):
        constructor_args = list(map(str, network["constructor_args"]))

    # For simplicity, assume one contract per network in this orchestrator
    contract = contracts[0] if contracts else None
    if not contract:
        status["status"] = "failed"
        status["error"] = "No contract defined in config"
        return status
    deploy_script = contract.get("deploy_script", "")
    if not deploy_script:
        status["status"] = "failed"
        status["error"] = "deploy_script not defined for contract"
        return status

    try:
        if tool == "forge":
            cmd = build_forge_cmd(network, deploy_script, constructor_args)
        elif tool == "hardhat":
            cmd = build_hardhat_cmd(network, deploy_script)
        else:
            status["status"] = "failed"
            status["error"] = f"Unsupported tool: {tool}"
            return status

        # Run the command
        cmd_str = " ".join(shlex.quote(p) for p in cmd)
        print(f"[deploy:{name}] Running: {cmd_str}")
        res = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=60 * 60,
        )
        stdout = res.stdout
        if res.returncode != 0:
            status["status"] = "failed"
            status["error"] = (
                f"Command failed with exit code {res.returncode}: {stdout[:500]}"
            )
        else:
            status["status"] = "completed"
            # Very simple: capture last line as a possible tx hash hint
            status["tx"] = stdout.strip().splitlines()[-1] if stdout.strip() else None
    except Exception as e:
        status["status"] = "failed"
        status["error"] = str(e)
    return status


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config", default="deploy.config.json", help="Path to deploy config JSON"
    )
    args = parser.parse_args()

    cfg = load_config(args.config)
    networks = cfg.get("networks", [])
    contracts = cfg.get("contracts", [])
    if not networks:
        print("No networks defined in config.")
        sys.exit(2)
    # Persist progress
    progress_lines: List[str] = []

    results = []
    # Run in parallel if requested
    workers = min(len(networks), os.cpu_count() or 2)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_net = {
            executor.submit(deploy_to_network, net, contracts): net for net in networks
        }
        for fut in as_completed(future_to_net):
            net = future_to_net[fut]
            try:
                res = fut.result()
            except Exception as exc:
                res = {
                    "network": net.get("name", "unknown"),
                    "tool": net.get("tool", "forge"),
                    "status": "failed",
                    "error": str(exc),
                }
            results.append(res)
            progress_lines.append(
                f"{net.get('name', 'unknown')} -> {res.get('status', 'unknown')}"
            )

    # Write a simple deploy summary to progress.txt
    with open("progress.txt", "w") as pf:
        pf.write("Deployment progress:\n")
        for line in progress_lines:
            pf.write(line + "\n")

    # Save a compact result to deploy_results.json
    with open("deploy_results.json", "w") as dr:
        json.dump(results, dr, indent=2)

    # Exit code depending on results
    any_failed = any(
        r.get("status") not in ("completed", "success", "completed") for r in results
    )
    if any_failed:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
