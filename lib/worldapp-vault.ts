// World App Vault on OP Mainnet
// Reference: Vault.md

import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { optimism } from 'viem/chains';

// Vault contract address on OP Mainnet
const VAULT_ADDRESS = '0x21c4928109acB0659A88AE5329b5374A3024694C';
const WLD_TOKEN_ADDRESS = '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1';

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

export class WorldAppVaultClient {
  private static instance: WorldAppVaultClient;
  private client;
  private debugLogs: string[] = [];
  private externalLogger?: (message: string) => void;

  private constructor() {
    // Use public OP Mainnet RPC
    this.client = createPublicClient({
      chain: optimism,
      transport: http('https://mainnet.optimism.io')
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

  async getVaultBalance(address: string, wldPriceUsd: number = 0): Promise<WorldAppVaultBalance | null> {
    this.clearDebugLogs();
    this.log(`\n=== Fetching World App Vault Balance ===`);
    this.log(`User address: ${address}`);
    this.log(`Vault contract: ${VAULT_ADDRESS}`);

    try {
      const userAddress = address as `0x${string}`;

      // Get vault deposit info
      this.log('Calling getDeposit...');
      const result = await this.client.readContract({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'getDeposit',
        args: [userAddress]
      });

      this.log(`  Raw result type: ${typeof result}`);
      this.log(`  Raw result is array: ${Array.isArray(result)}`);

      // viem returns a tuple as an array
      const [amount, endTime, depositedAmount, lastInterestCalculation] = result as [bigint, bigint, bigint, bigint];

      this.log(`  Raw result (tuple): [${result.toString()}]`);
      this.log(`  amount: ${amount.toString()}`);
      this.log(`  endTime: ${endTime.toString()}`);
      this.log(`  depositedAmount: ${depositedAmount.toString()}`);
      this.log(`  lastInterestCalculation: ${lastInterestCalculation.toString()}`);

      // Assign to BigInts for clarity
      const amountBigInt = amount;
      const depositedAmountBigInt = depositedAmount;

      // Check if user has any deposit
      if (amountBigInt === 0n && depositedAmountBigInt === 0n) {
        this.log('No Vault deposit found (amount and depositedAmount are both 0)');
        return null;
      }

      // Get WLD decimals
      this.log('Getting WLD token decimals...');
      const decimals = await this.client.readContract({
        address: WLD_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }) as number;

      this.log(`  WLD decimals: ${decimals}`);

      // Format amounts
      const amountNow = formatUnits(amountBigInt, decimals);
      const principal = formatUnits(depositedAmountBigInt, decimals);
      const accruedInterest = formatUnits(amountBigInt - depositedAmountBigInt, decimals);

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

      this.log('✓ Vault balance fetched successfully');
      return vaultBalance;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`ERROR: ${errorMsg}`);
      console.error('Error fetching World App Vault balance:', error);
      return null;
    }
  }

  // Get spending balance (normal WLD balance on OP Mainnet)
  async getSpendingBalance(address: string, wldPriceUsd: number = 0): Promise<{
    balance: string;
    balanceUsd: number;
    symbol: 'WLD';
  } | null> {
    this.log(`\n=== Fetching World App Spending Balance ===`);
    this.log(`User address: ${address}`);

    try {
      const userAddress = address as `0x${string}`;

      const [balanceRaw, decimals] = await Promise.all([
        this.client.readContract({
          address: WLD_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }) as Promise<bigint>,
        this.client.readContract({
          address: WLD_TOKEN_ADDRESS as `0x${string}`,
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
      this.log('✓ Spending balance fetched successfully');

      return {
        balance,
        balanceUsd,
        symbol: 'WLD'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`ERROR: ${errorMsg}`);
      console.error('Error fetching World App Spending balance:', error);
      return null;
    }
  }
}
