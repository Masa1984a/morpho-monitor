# World App Vault Integration

## Overview

World App Vaultの残高がEarnタブに統合されました。このVaultはOP Mainnet上に存在し、WLDトークンを預けることで利息を獲得できます。

## 実装内容

### 1. Vault情報の取得

- **契約アドレス（OP Mainnet）**: `0x21c4928109acB0659A88AE5329b5374A3024694C`
- **WLDトークン（OP Mainnet）**: `0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1`
- **RPC**: パブリックOP Mainnet RPC (`https://mainnet.optimism.io`)

### 2. 取得データ

`getDeposit(address)` 関数から以下の情報を取得：

- **amount**: 現在の残高（利息込み）
- **depositedAmount**: 預けた元本
- **accruedInterest**: 累積利息（amount - depositedAmount）
- **lastInterestCalculation**: 最終利息計算日時
- **endTime**: 終了時刻

### 3. 表示内容

Earnタブに表示される情報：

```
┌─────────────────────────────────────┐
│ World App Vault                     │
│ WLD Savings on OP Mainnet           │
│ [Earning] [OP Mainnet]             │
├─────────────────────────────────────┤
│ Current Balance                     │
│ XXX.XXXXXX WLD                     │
│ $XXX.XX                            │
├─────────────────────────────────────┤
│ Principal                           │
│ XXX.XXXXXX WLD                     │
│ $XXX.XX                            │
├─────────────────────────────────────┤
│ Accrued Interest                    │
│ +XX.XXXXXX WLD                     │
│ +$XX.XX                            │
├─────────────────────────────────────┤
│ Last Interest Calculation           │
│ Oct 11, 2025, 09:00 AM             │
└─────────────────────────────────────┘
```

## デバッグ情報

Earnタブで以下の情報を確認できます：

1. **Settings → Show Debug Info を有効化**
2. **Earnタブ** を開く
3. 画面下部に **Debug Info** が表示されます

デバッグ情報には以下が含まれます：

- World App Vault接続状態
- `getDeposit()` の戻り値（raw値）
- フォーマット後の値
- エラーメッセージ（発生した場合）

### トラブルシューティング

#### Vaultが表示されない場合

1. **Debug Infoを確認**
   - `No Vault deposit found` → Vaultに預金がない
   - `ERROR: ...` → OP Mainnetへの接続エラーまたはコントラクトエラー

2. **ウォレットアドレスの確認**
   - World ChainとOP Mainnetで同じアドレスを使用していることを確認

3. **ネットワーク接続**
   - OP MainnetのパブリックRPCに接続できることを確認

## ファイル構成

- `lib/worldapp-vault.ts` - World App Vault クライアント
- `lib/worldchain-rpc.ts` - Vault統合ロジック（`getWorldAppVaultPosition`）
- `components/LendPosition/LendPositionCard.tsx` - Vault表示UI
- `components/LendPosition/LendPositionView.tsx` - Debug Info表示

## 参照

- [Vault.md](./Vault.md) - Vault実装の技術仕様
- [World App Vault Support](https://support.world.org/hc/en-us/articles/31618151074195-What-is-Worldcoin-Vault)
- [OP Mainnet Explorer](https://optimistic.etherscan.io/address/0x21c4928109acb0659a88ae5329b5374a3024694c)
