import path from 'path';
import fs from 'fs';

type UpgradeMode = 'transparent' | 'uups' | 'beacon';

const templateCache = new Map<UpgradeMode, string>();

function loadTemplate(mode: UpgradeMode): string {
    if (templateCache.has(mode)) {
        return templateCache.get(mode)!;
    }
    
    // Map mode to the exact template file name expected in templates/upgrade
    const baseName = mode === 'uups' ? 'UUPSProxy' : (mode.charAt(0).toUpperCase() + mode.slice(1) + 'Proxy')
    const templatePath = path.resolve(
        process.cwd(),
        `templates/upgrade/${baseName}.sol.template`
    );
    
    try {
        const content = fs.readFileSync(templatePath, 'utf8');
        templateCache.set(mode, content);
        return content;
    } catch {
        return '';
    }
}

function generateUpgradeCode(mode: UpgradeMode, contractName: string): string {
    const template = loadTemplate(mode);
    let code = template.replace(/\{\{contractName\}\}/g, contractName);
    
    const storageLayoutHint = `
/**
 * STORAGE LAYOUT CHECK REMINDER:
 * Before upgrading, ensure the new implementation maintains compatible storage layout.
 * Run: forge inspect ${contractName} storage-layout
 * or use OpenZeppelin's upgradeable contracts to ensure no storage slot collisions.
 * 
 * Important checks:
 * - New state variables cannot be added before existing ones
 * - State variable types must remain the same
 * - Storage gaps may be needed for future upgrades
 */
`;
    
    const upgradeScript = generateUpgradeScript(mode, contractName);
    
    return code + '\n\n' + storageLayoutHint + '\n\n' + upgradeScript;
}

function generateUpgradeScript(mode: UpgradeMode, contractName: string): string {
    const scripts: Record<UpgradeMode, string> = {
        transparent: `
// Upgrade Script for Transparent Proxy
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ${contractName}TransparentUpgradeScript {
    
    function upgradeProxy(
        address proxyAddress,
        address newImplementation,
        address proxyAdmin
    ) external {
        ProxyAdmin(proxyAdmin).upgrade(
            TransparentUpgradeableProxy(proxyAddress),
            newImplementation
        );
    }
    
    function deployProxy(
        address logic,
        address admin,
        bytes memory initData
    ) external returns (address) {
        return address(new TransparentUpgradeableProxy(logic, admin, initData));
    }
}
`,
        uups: `
// Upgrade Script for UUPS Proxy
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ${contractName}UUPSUpgradeScript {
    
    function upgradeProxy(
        address proxyAddress,
        address newImplementation,
        bytes memory data
    ) external {
        (bool success, ) = proxyAddress.call(
            abi.encodeWithSignature("upgradeTo(address)", newImplementation)
        );
        if (initData.length > 0) {
            (bool initSuccess, ) = proxyAddress.call(initData);
            require(initSuccess, "Initialization failed");
        }
        require(success, "Upgrade failed");
    }
    
    function deployProxy(
        address implementation,
        bytes memory initData
    ) external returns (address) {
        return address(new ERC1967Proxy(implementation, initData));
    }
}
`,
        beacon: `
// Upgrade Script for Beacon Proxy
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract ${contractName}BeaconUpgradeScript {
    
    function upgradeBeacon(
        address beaconAddress,
        address newImplementation
    ) external {
        UpgradeableBeacon(beaconAddress).upgradeTo(newImplementation);
    }
    
    function deployBeacon(
        address implementation,
        address owner
    ) external returns (address) {
        return address(new UpgradeableBeacon(implementation, owner));
    }
    
    function deployBeaconProxy(
        address beacon,
        bytes memory data
    ) external returns (address) {
        return address(new BeaconProxy(beacon, data));
    }
}
`
    };
    
    return scripts[mode];
}

export async function action(req: any) {
    let body = {};
    try {
        body = await req.json();
    } catch {}
    
    const mode = (body?.mode as UpgradeMode) || 'transparent';
    const contractName = (body?.contractName as string) || body?.contract as string || 'MyContract';
    
    if (!['transparent', 'uups', 'beacon'].includes(mode)) {
        return new Response(JSON.stringify({ 
            error: 'Invalid mode. Must be transparent, uups, or beacon' 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    try {
        const code = generateUpgradeCode(mode, contractName);
        return new Response(JSON.stringify({ 
            code,
            mode,
            contractName,
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ 
            error: String(e),
            fallback: generateFallbackCode(mode, contractName)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function loader() {
    return new Response(JSON.stringify({ 
        modes: ['transparent', 'uups', 'beacon'],
        version: '1.0'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

function generateFallbackCode(mode: UpgradeMode, contractName: string): string {
    return `// Fallback generated code for ${contractName} with ${mode} proxy
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage layout check reminder:
// Run: forge inspect <contract> storage-layout
// Ensure new implementation maintains compatible storage layout before upgrading

contract ${contractName}${mode.charAt(0).toUpperCase() + mode.slice(1)}Proxy {
    // ${mode === 'transparent' ? 'TransparentUpgradeableProxy' : mode === 'uups' ? 'ERC1967Proxy' : 'BeaconProxy'} implementation
}
`;
}
