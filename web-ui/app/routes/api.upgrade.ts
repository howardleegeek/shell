import { readFileSync } from 'node:fs'
import path from 'node:path'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/cloudflare'

type UpgradeMode = 'transparent' | 'uups' | 'beacon'

const templateCache = new Map<UpgradeMode, string>()

const modeTemplateMap: Record<UpgradeMode, string> = {
  transparent: 'TransparentProxy.sol.template',
  uups: 'UUPSProxy.sol.template',
  beacon: 'BeaconProxy.sol.template',
}

function sanitizeContractName(name?: string): string {
  if (!name) return 'MyContract'
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[^a-zA-Z_]+/, '')
  return cleaned.length > 0 ? cleaned : 'MyContract'
}

function loadTemplate(mode: UpgradeMode, contractName: string): string {
  if (!templateCache.has(mode)) {
    const templatePath = path.resolve(process.cwd(), 'templates/upgrade', modeTemplateMap[mode])
    templateCache.set(mode, readFileSync(templatePath, 'utf8'))
  }
  const template = templateCache.get(mode) ?? ''
  return template.replace(/\{\{contractName\}\}/g, contractName)
}

function storageLayoutHint(contractName: string): string {
  return `/**
 * STORAGE LAYOUT CHECK REMINDER:
 * Run \`forge inspect ${contractName} storage-layout\` before upgrading.
 * Keep variable order and types stable across versions to avoid slot collisions.
 */`
}

function generateUpgradeScript(mode: UpgradeMode, contractName: string): string {
  if (mode === 'transparent') {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ${contractName}TransparentUpgradeScript {
    function deployProxy(address implementation, address admin, bytes memory initCalldata) external returns (address) {
        return address(new TransparentUpgradeableProxy(implementation, admin, initCalldata));
    }

    function upgradeProxy(address proxyAdmin, address payable proxyAddress, address newImplementation) external {
        ProxyAdmin(proxyAdmin).upgrade(ITransparentUpgradeableProxy(proxyAddress), newImplementation);
    }
}`
  }

  if (mode === 'uups') {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ${contractName}UUPSUpgradeScript {
    function deployProxy(address implementation, bytes memory initCalldata) external returns (address) {
        return address(new ERC1967Proxy(implementation, initCalldata));
    }

    function upgradeProxy(address proxyAddress, address newImplementation, bytes memory upgradeCallData) external {
        (bool success, ) = proxyAddress.call(
            abi.encodeWithSignature("upgradeToAndCall(address,bytes)", newImplementation, upgradeCallData)
        );
        require(success, "UUPS upgrade failed");
    }
}`
  }

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract ${contractName}BeaconUpgradeScript {
    function deployBeacon(address implementation, address owner) external returns (address) {
        return address(new UpgradeableBeacon(implementation, owner));
    }

    function deployBeaconProxy(address beacon, bytes memory initCalldata) external returns (address) {
        return address(new BeaconProxy(beacon, initCalldata));
    }

    function upgradeBeacon(address beacon, address newImplementation) external {
        UpgradeableBeacon(beacon).upgradeTo(newImplementation);
    }
}`
}

export function generateUpgradeCode(mode: UpgradeMode, rawContractName: string): string {
  const contractName = sanitizeContractName(rawContractName)
  return [
    loadTemplate(mode, contractName),
    '',
    storageLayoutHint(contractName),
    '',
    generateUpgradeScript(mode, contractName),
  ].join('\n')
}

export async function action({ request }: ActionFunctionArgs) {
  const body = (await request.json().catch(() => ({}))) as { mode?: string; contractName?: string; contract?: string }
  const mode = (body.mode ?? 'transparent') as UpgradeMode
  const validModes: UpgradeMode[] = ['transparent', 'uups', 'beacon']

  if (!validModes.includes(mode)) {
    return json({ error: 'Invalid mode. Must be transparent, uups, or beacon.' }, { status: 400 })
  }

  const contractName = sanitizeContractName(body.contractName ?? body.contract)
  try {
    return json({
      success: true,
      mode,
      contractName,
      code: generateUpgradeCode(mode, contractName),
    })
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upgrade code',
      },
      { status: 500 },
    )
  }
}

export async function loader(_args: LoaderFunctionArgs) {
  return json({
    modes: ['transparent', 'uups', 'beacon'],
    status: 'ok',
  })
}

export const __testUtils = {
  sanitizeContractName,
  generateUpgradeScript,
}
