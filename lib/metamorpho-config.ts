// MetaMorpho Vault configuration for World Chain
// MetaMorpho vaults are single-asset lending vaults built on top of Morpho Blue

export interface MetaMorphoVault {
  vaultAddress: `0x${string}`;
  assetSymbol: string;
  assetAddress: `0x${string}`;
  decimals: number;
  name: string;
}

// MetaMorpho Vaults on World Chain
export const METAMORPHO_VAULTS: MetaMorphoVault[] = [
  {
    vaultAddress: '0xb1E80387EbE53Ff75a89736097D34dC8D9E9045B',
    assetSymbol: 'USDC',
    assetAddress: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
    decimals: 6,
    name: 'MetaMorpho USDC Vault'
  },
  {
    vaultAddress: '0x348831b46876d3dF2Db98BdEc5E3B4083329Ab9f',
    assetSymbol: 'WLD',
    assetAddress: '0x2cfc85d8e48f8eab294be644d9e25c3030863003',
    decimals: 18,
    name: 'MetaMorpho WLD Vault'
  },
  {
    vaultAddress: '0x0Db7E405278c2674F462aC9D9eb8b8346D1c1571',
    assetSymbol: 'WETH',
    assetAddress: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    name: 'MetaMorpho WETH Vault'
  },
  {
    vaultAddress: '0xBC8C37467c5Df9D50B42294B8628c25888BECF61',
    assetSymbol: 'WBTC',
    assetAddress: '0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3',
    decimals: 8,
    name: 'MetaMorpho WBTC Vault'
  }
];

// Get all vault addresses
export function getVaultAddresses(): `0x${string}`[] {
  return METAMORPHO_VAULTS.map(vault => vault.vaultAddress);
}

// Get vault by address
export function getVaultByAddress(address: string): MetaMorphoVault | undefined {
  return METAMORPHO_VAULTS.find(
    vault => vault.vaultAddress.toLowerCase() === address.toLowerCase()
  );
}

// Get vault by asset symbol
export function getVaultByAssetSymbol(symbol: string): MetaMorphoVault | undefined {
  return METAMORPHO_VAULTS.find(vault => vault.assetSymbol === symbol);
}
