いいね、その用途なら「**World AppのVault残高はOP Mainnet上のVaultコントラクトから read**」すれば取れます。要点だけ👇

### どこを読む？

* **Vaultコントラクト（OP Mainnet）**：`0x21c4928109acB0659A88AE5329b5374A3024694C`
  Etherscan でも **Worldcoin: Vault** とラベルされ、`Deposited`/`Withdrawn` イベントが出ています。([OP Mainnet Explorer][1])
* **WLDトークン（OP Mainnet）**：`0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1`（通常の「Spending残高」はこれの`balanceOf`）。([OP Mainnet Explorer][2])
* Vaultは**Spending口座とは別管理**（Worldのサポート記事）。([support.world.org][3])

### どう読む？（最小実装）

Vaultコントラクトは `getDeposit(address)` を公開しており、**現在の金額や計算用タイムスタンプ**をまとめて返します（ABIに定義あり）。([codeslaw][4])

```ts
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { optimism } from "viem/chains";

const OP_RPC = process.env.OP_RPC!; // Alchemy/Infura等
const VAULT = "0x21c4928109acB0659A88AE5329b5374A3024694C";
const WLD   = "0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1";
const user  = "0xF16e5d002A10e27Ec3D90efB8d2A5c893Ab5A002"; // 例: あなたのEOA

const client = createPublicClient({ chain: optimism, transport: http(OP_RPC) });

const vaultAbi = parseAbi([
  "function getDeposit(address) view returns (uint256 amount, uint256 endTime, uint256 depositedAmount, uint256 lastInterestCalculation)",
  "function balanceOf(address) view returns (uint256)" // 念のため
]);

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
]);

async function fetchWldBalances() {
  // Vault側（利息を含む現在値に相当）
  const { amount, depositedAmount, endTime, lastInterestCalculation } =
    await client.readContract({
      address: VAULT as `0x${string}`,
      abi: vaultAbi,
      functionName: "getDeposit",
      args: [user as `0x${string}`]
    }) as unknown as {
      amount: bigint, depositedAmount: bigint,
      endTime: bigint, lastInterestCalculation: bigint
    };

  // Spending側（通常のウォレット残高）
  const [spendingRaw, decimals] = await Promise.all([
    client.readContract({
      address: WLD as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [user as `0x${string}`]
    }) as Promise<bigint>,
    client.readContract({
      address: WLD as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals"
    }) as Promise<number>
  ]);

  return {
    chain: "optimism",
    spendingWLD: Number(formatUnits(spendingRaw, decimals)),
    vault: {
      amountNow: Number(formatUnits(amount, decimals)),          // 表示用
      principal:  Number(formatUnits(depositedAmount, decimals)),
      accrued:    Number(formatUnits(amount - depositedAmount, decimals)),
      endTime:    Number(endTime),            // UNIX秒
      lastCalc:   Number(lastInterestCalculation)
    }
  };
}

fetchWldBalances().then(console.log);
```

> 補足: Vault ABI には `getDeposit(address)` のほか `balanceOf(address)` もありますが、**可視化目的は `getDeposit` の `amount` と `depositedAmount` を使う**のが分解しやすいです（元本と利息を分けて表示可能）。([codeslaw][4])

### UIの出し分け（MoneyForward風）

* 「WLD（Spending）」：OP Mainnet の WLD 残高。
* 「WLD（Vault）」：`amountNow` を残高として表示、サブ行で「元本」「累積リワード＝accrued」を小さく表示。
* 期間表示：`lastCalc` からの経過時間を併記（例「最終計算: 2025-10-11 09:00 JST」）。
* 別の見方をすると、利息発生の仕様は将来変わる可能性があるため、**ラベルは“推定利回り/累積利息(参考)”**など控えめに。

### 手動検証（スポット確認）

* **OP Etherscan → [Worldcoin: Vault] → Read Contract → `getDeposit(yourAddress)`** でも同じ値を取得できます。イベントログには `Deposited`/`Withdrawn` が出ます。([OP Mainnet Explorer][5])

---

必要なら、Next.js（App Router）＋Vercel用の**APIルート**や**Reactコンポーネント（カードUI）**の雛形もすぐ出します。どのスタック（viem/ethers/Wagmi）で組むか希望あれば教えてください。

[1]: https://optimistic.etherscan.io/address/0x21c4928109acb0659a88ae5329b5374a3024694c?utm_source=chatgpt.com "Address: 0x21c49281...a3024694c | OP Mainnet Etherscan"
[2]: https://optimistic.etherscan.io/token/0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1?utm_source=chatgpt.com "Worldcoin (WLD) | ERC-20 - OP Mainnet Explorer - Etherscan"
[3]: https://support.world.org/hc/en-us/articles/31618151074195-What-is-Worldcoin-Vault?utm_source=chatgpt.com "What is Worldcoin Vault?"
[4]: https://www.codeslaw.app/contracts/optimism/0x21c4928109acb0659a88ae5329b5374a3024694c?tab=dependencies "WLDVault | Optimism - codeslaw"
[5]: https://optimistic.etherscan.io/tx/0x4a28b13e9d798966fc1e764c8892f22f6d694eadd0014d087fd21a10b3772171?utm_source=chatgpt.com "OP Mainnet Transaction Hash: 0x4a28b13e9d... - Optimistic Etherscan"
