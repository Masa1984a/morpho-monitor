// World App Vault on OP Mainnet and World Chain
// Reference: Vault.md

import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { optimism } from 'viem/chains';

// World Chain configuration
const WORLD_CHAIN = {
  id: 480,
  name: 'World Chain',
  network: 'worldchain',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] }
  }
} as const;

// Vault contract addresses
const VAULT_OP_ADDRESS = '0x21c4928109acB0659A88AE5329b5374A3024694C';
const VAULT_WORLD_ADDRESS = '0x14a028cC500108307947dca4a1Aa35029FB66CE0';

// WLD token addresses
const WLD_OP_ADDRESS = '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1';
const WLD_WORLD_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003';

// Vault ABI
const VAULT_ABI = parseAbi([
  'function getDeposit(address) view returns (uint256 amount, uint256 endTime, uint256 depositedAmount, uint256 lastInterestCalculation)',
  'function balanceOf(address) view returns (uint256)'
]);

// ERC20 ABI
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]);

export interface WorldAppVaultBalance {
  amountNow: string;           // Current balance including interest (formatted)
  principal: string;           // Original deposited amount (formatted)
  accruedInterest: string;     // Accrued interest (formatted)
  amountNowUsd: number;        // USD value of current balance
  principalUsd: number;        // USD value of principal
  accruedInterestUsd: number;  // USD value of accrued interest
  endTime: number;             // UNIX timestamp
  lastCalc: number;            // Last interest calculation timestamp
  symbol: 'WLD';
  decimals: number;
}

export interface CombinedVaultBalance {
  optimism: WorldAppVaultBalance | null;
  worldChain: WorldAppVaultBalance | null;
  total: {
    amountNow: string;
    principal: string;
    accruedInterest: string;
    amountNowUsd: number;
    principalUsd: number;
    accruedInterestUsd: number;
  };
}

export class WorldAppVaultClient {
  private static instance: WorldAppVaultClient;
  private opClient;
  private worldClient;
  private debugLogs: string[] = [];
  private externalLogger?: (message: string) => void;

  private constructor() {
    // OP Mainnet client
    this.opClient = createPublicClient({
      chain: optimism,
      transport: http('https://mainnet.optimism.io')
    });

    // World Chain client
    this.worldClient = createPublicClient({
      chain: WORLD_CHAIN,
      transport: http()
    });
  }

  public setExternalLogger(logger: (message: string) => void) {
    this.externalLogger = logger;
  }

  private log(message: string) {
    console.log(message);
    this.debugLogs.push(message);
    if (this.externalLogger) {
      this.externalLogger(message);
    }
  }

  clearDebugLogs() {
    this.debugLogs = [];
  }

  static getInstance(): WorldAppVaultClient {
    if (!WorldAppVaultClient.instance) {
      WorldAppVaultClient.instance = new WorldAppVaultClient();
    }
    return WorldAppVaultClient.instance;
  }

  private async getVaultBalanceFromChain(
    client: any,
    vaultAddress: string,
    wldAddress: string,
    address: string,
    chainName: string,
    wldPriceUsd: number = 0
  ): Promise<WorldAppVaultBalance | null> {
    this.log(`\n=== Fetching Vault Balance on ${chainName} ===`);
    this.log(`User address: ${address}`);
    this.log(`Vault contract: ${vaultAddress}`);

    try {
      const userAddress = address as `0x${string}`;

      // Get vault deposit info
      this.log('Calling getDeposit...');
      const result = await client.readContract({
        address: vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'getDeposit',
        args: [userAddress]
      });

      // viem returns a tuple as an array
      const [amount, endTime, depositedAmount, lastInterestCalculation] = result as [bigint, bigint, bigint, bigint];

      this.log(`  amount: ${amount.toString()}`);
      this.log(`  endTime: ${endTime.toString()}`);
      this.log(`  depositedAmount: ${depositedAmount.toString()}`);
      this.log(`  lastInterestCalculation: ${lastInterestCalculation.toString()}`);

      // Check if user has any deposit
      if (amount === 0n && depositedAmount === 0n) {
        this.log('No Vault deposit found (amount and depositedAmount are both 0)');
        return null;
      }

      // Get WLD decimals
      this.log('Getting WLD token decimals...');
      const decimals = await client.readContract({
        address: wldAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }) as number;

      this.log(`  WLD decimals: ${decimals}`);

      // Format amounts
      const amountNow = formatUnits(amount, decimals);
      const principal = formatUnits(depositedAmount, decimals);
      const accruedInterest = formatUnits(amount - depositedAmount, decimals);

      this.log(`  Formatted amountNow: ${amountNow} WLD`);
      this.log(`  Formatted principal: ${principal} WLD`);
      this.log(`  Formatted accrued interest: ${accruedInterest} WLD`);

      // Calculate USD values
      const amountNowUsd = parseFloat(amountNow) * wldPriceUsd;
      const principalUsd = parseFloat(principal) * wldPriceUsd;
      const accruedInterestUsd = parseFloat(accruedInterest) * wldPriceUsd;

      this.log(`  WLD price: $${wldPriceUsd}`);
      this.log(`  USD values: amount=$${amountNowUsd}, principal=$${principalUsd}, interest=$${accruedInterestUsd}`);

      const vaultBalance: WorldAppVaultBalance = {
        amountNow,
        principal,
        accruedInterest,
        amountNowUsd,
        principalUsd,
        accruedInterestUsd,
        endTime: Number(endTime),
        lastCalc: Number(lastInterestCalculation),
        symbol: 'WLD',
        decimals
      };

      this.log(`✓ Vault balance fetched successfully on ${chainName}`);
      return vaultBalance;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`ERROR on ${chainName}: ${errorMsg}`);
      console.error(`Error fetching Vault balance on ${chainName}:`, error);
      return null;
    }
  }

  async getVaultBalance(address: string, wldPriceUsd: number = 0): Promise<WorldAppVaultBalance | null> {
    // Backwards compatibility: return OP Mainnet vault balance
    return this.getVaultBalanceFromChain(
      this.opClient,
      VAULT_OP_ADDRESS,
      WLD_OP_ADDRESS,
      address,
      'OP Mainnet',
      wldPriceUsd
    );
  }

  async getCombinedVaultBalance(address: string, wldPriceUsd: number = 0): Promise<CombinedVaultBalance> {
    this.clearDebugLogs();
    this.log(`\n=== Fetching Combined Vault Balance (OP + World Chain) ===`);

    // Fetch from both chains in parallel
    const [opBalance, worldBalance] = await Promise.all([
      this.getVaultBalanceFromChain(
        this.opClient,
        VAULT_OP_ADDRESS,
        WLD_OP_ADDRESS,
        address,
        'OP Mainnet',
        wldPriceUsd
      ),
      this.getVaultBalanceFromChain(
        this.worldClient,
        VAULT_WORLD_ADDRESS,
        WLD_WORLD_ADDRESS,
        address,
        'World Chain',
        wldPriceUsd
      )
    ]);

    // Calculate totals
    const totalAmountNow = (
      parseFloat(opBalance?.amountNow || '0') +
      parseFloat(worldBalance?.amountNow || '0')
    ).toString();

    const totalPrincipal = (
      parseFloat(opBalance?.principal || '0') +
      parseFloat(worldBalance?.principal || '0')
    ).toString();

    const totalAccruedInterest = (
      parseFloat(opBalance?.accruedInterest || '0') +
      parseFloat(worldBalance?.accruedInterest || '0')
    ).toString();

    const totalAmountNowUsd = (opBalance?.amountNowUsd || 0) + (worldBalance?.amountNowUsd || 0);
    const totalPrincipalUsd = (opBalance?.principalUsd || 0) + (worldBalance?.principalUsd || 0);
    const totalAccruedInterestUsd = (opBalance?.accruedInterestUsd || 0) + (worldBalance?.accruedInterestUsd || 0);

    this.log(`\n=== Total Vault Balance ===`);
    this.log(`  Total amount: ${totalAmountNow} WLD ($${totalAmountNowUsd.toFixed(2)})`);
    this.log(`  Total principal: ${totalPrincipal} WLD ($${totalPrincipalUsd.toFixed(2)})`);
    this.log(`  Total accrued interest: ${totalAccruedInterest} WLD ($${totalAccruedInterestUsd.toFixed(2)})`);

    return {
      optimism: opBalance,
      worldChain: worldBalance,
      total: {
        amountNow: totalAmountNow,
        principal: totalPrincipal,
        accruedInterest: totalAccruedInterest,
        amountNowUsd: totalAmountNowUsd,
        principalUsd: totalPrincipalUsd,
        accruedInterestUsd: totalAccruedInterestUsd
      }
    };
  }

  // Get spending balance (normal WLD balance)
  async getSpendingBalance(address: string, wldPriceUsd: number = 0): Promise<{
    balance: string;
    balanceUsd: number;
    symbol: 'WLD';
  } | null> {
    // Backwards compatibility: return OP Mainnet spending balance
    return this.getSpendingBalanceFromChain(
      this.opClient,
      WLD_OP_ADDRESS,
      address,
      'OP Mainnet',
      wldPriceUsd
    );
  }

  private async getSpendingBalanceFromChain(
    client: any,
    wldAddress: string,
    address: string,
    chainName: string,
    wldPriceUsd: number = 0
  ): Promise<{
    balance: string;
    balanceUsd: number;
    symbol: 'WLD';
  } | null> {
    this.log(`\n=== Fetching Spending Balance on ${chainName} ===`);
    this.log(`User address: ${address}`);

    try {
      const userAddress = address as `0x${string}`;

      const [balanceRaw, decimals] = await Promise.all([
        client.readContract({
          address: wldAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }) as Promise<bigint>,
        client.readContract({
          address: wldAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }) as Promise<number>
      ]);

      this.log(`  Raw balance: ${balanceRaw.toString()}`);
      this.log(`  Decimals: ${decimals}`);

      if (balanceRaw === 0n) {
        this.log('No spending balance');
        return null;
      }

      const balance = formatUnits(balanceRaw, decimals);
      const balanceUsd = parseFloat(balance) * wldPriceUsd;

      this.log(`  Formatted balance: ${balance} WLD`);
      this.log(`  USD value: $${balanceUsd}`);
      this.log(`✓ Spending balance fetched successfully on ${chainName}`);

      return {
        balance,
        balanceUsd,
        symbol: 'WLD'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`ERROR on ${chainName}: ${errorMsg}`);
      console.error(`Error fetching Spending balance on ${chainName}:`, error);
      return null;
    }
  }

  async getCombinedSpendingBalance(address: string, wldPriceUsd: number = 0): Promise<{
    optimism: { balance: string; balanceUsd: number; symbol: 'WLD' } | null;
    worldChain: { balance: string; balanceUsd: number; symbol: 'WLD' } | null;
    total: { balance: string; balanceUsd: number; symbol: 'WLD' };
  }> {
    this.log(`\n=== Fetching Combined Spending Balance (OP + World Chain) ===`);

    // Fetch from both chains in parallel
    const [opBalance, worldBalance] = await Promise.all([
      this.getSpendingBalanceFromChain(
        this.opClient,
        WLD_OP_ADDRESS,
        address,
        'OP Mainnet',
        wldPriceUsd
      ),
      this.getSpendingBalanceFromChain(
        this.worldClient,
        WLD_WORLD_ADDRESS,
        address,
        'World Chain',
        wldPriceUsd
      )
    ]);

    // Calculate totals
    const totalBalance = (
      parseFloat(opBalance?.balance || '0') +
      parseFloat(worldBalance?.balance || '0')
    ).toString();

    const totalBalanceUsd = (opBalance?.balanceUsd || 0) + (worldBalance?.balanceUsd || 0);

    this.log(`\n=== Total Spending Balance ===`);
    this.log(`  Total balance: ${totalBalance} WLD ($${totalBalanceUsd.toFixed(2)})`);

    return {
      optimism: opBalance,
      worldChain: worldBalance,
      total: {
        balance: totalBalance,
        balanceUsd: totalBalanceUsd,
        symbol: 'WLD'
      }
    };
  }
}
