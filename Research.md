# Morpho Monitor: ブロックチェーン調査依頼書

## 📋 概要

World App内のMorpho Mini Appで表示されているLending/Borrowingポジション情報を、World Chain RPC経由でプログラマティックに取得しようとしていますが、コントラクトから正常にデータが取得できません。実際のコントラクトアドレスとデータ取得方法の特定が必要です。

---

## 🔴 発生事象

### 1. ポジション取得の失敗

World App内のMorpho Mini Appでは以下のポジションが表示されています：

- **Deposits (Supply)**: $2,626.82
  - USDC: $1,362.80
  - WLD: $1,264.02
  - WETH: (金額不明)

- **Borrows**: $360.37
  - WLD collateral → USDC loan

しかし、作成したMorpho Monitorアプリ（World Chain RPC経由）では**0件のポジション**となります。

### 2. エラーメッセージ

```
ERROR: The contract function "position" returned no data ("0x").
```

### 3. 環境情報

| 項目 | 値 |
|------|-----|
| **チェーン** | World Chain Mainnet |
| **Chain ID** | 480 |
| **RPC URL** | `https://worldchain-mainnet.g.alchemy.com/public` |
| **ユーザーウォレットアドレス** | `0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002` |
| **想定Morpho Blueアドレス** | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| **マーケットID（UNOアプリより）** | `0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9` |

---

## ⚠️ 問題点

### 1. コントラクトが存在しない

**検証方法:**
```bash
curl -X POST https://worldchain-mainnet.g.alchemy.com/public \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb","latest"],"id":1}'
```

**結果:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x"}
```

**解釈:** アドレス `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` にはコントラクトが存在しない（`0x`は空のコード）

### 2. Morpho Blue `position`関数呼び出しの失敗

**実装コード（TypeScript + viem）:**
```typescript
const position = await client.readContract({
  address: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
  abi: MORPHO_BLUE_ABI,
  functionName: 'position',
  args: [
    '0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9', // marketId
    '0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002' // userAddress
  ]
});
```

**エラー:**
```
The contract function "position" returned no data ("0x").
```

### 3. ウォレットタイプの特定

**WorldScan調査結果:**
- ウォレットアドレス `0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002` は**SafeProxyコントラクト**
- スマートコントラクトウォレットであり、EOA（Externally Owned Account）ではない

---

## 🔍 考えられる原因の仮説

### 仮説1: 異なるコントラクトアドレス

World App内のMorphoは、公開されている標準的なMorpho Blue アドレス（`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`）とは**異なるアドレス**を使用している可能性。

**根拠:**
- Morpho公式ドキュメントによると、`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`はEthereum、Base等の他チェーンでは使用されているが、World Chain上では確認できない

### 仮説2: オフチェーンインデックス/API

World App内のMorphoは、ブロックチェーンRPCではなく**独自のバックエンドAPI**またはインデックスサービスを使用してポジションデータを表示している可能性。

**根拠:**
- Morpho GraphQL API (`https://api.morpho.org/graphql`) もWorld Chainをサポートしていない
- World App専用の最適化されたAPIエンドポイントが存在する可能性

### 仮説3: SafeProxyによる間接管理

SafeProxyコントラクトウォレットを介してポジションが管理されているため、直接`position(marketId, userAddress)`を呼び出しても取得できない可能性。

**考えられるパターン:**
- SafeProxyが別のマスターコントラクトを経由してMorphoとinteractionしている
- SafeProxyの内部状態を読む必要がある
- delegatecallパターンで実装されている

### 仮説4: マーケットIDの誤り

提供されたマーケットID `0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9` が、World Chain上の実際のマーケットIDと異なる可能性。

**根拠:**
- WorldScanでこのマーケットIDをトランザクションハッシュとして検索すると"Transaction Hash not found"

---

## 🎯 具体的に調査してほしいこと

### 1. World Chain上の実際のMorphoコントラクトアドレスの特定

**方法例:**
- WorldScan (`https://worldscan.org`) でMorpho関連のコントラクトを検索
- World App内のMorpho Mini Appが実際にinteractionしているコントラクトアドレスを特定
- Morpho公式からWorld Chain専用のデプロイメントアドレスを確認

**期待する情報:**
```
Morpho Blue契約アドレス: 0x...
Bundler契約アドレス: 0x... (もし存在すれば)
Public Allocator契約アドレス: 0x... (もし存在すれば)
```

### 2. ユーザーウォレットのトランザクション履歴調査

**対象アドレス:**
```
0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002
```

**調査内容:**
- このアドレスからMorpho関連コントラクトへのトランザクション（Supply、Borrow、SupplyCollateral、Withdrawなど）
- interactionしているコントラクトアドレスのリスト
- 最近のトランザクションハッシュ（特にMorpho関連）

**WorldScan URL:**
```
https://worldscan.org/address/0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002
```

### 3. マーケットIDの検証

**提供されたマーケットID:**
```
0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9
```

**調査内容:**
- このマーケットIDが実際にWorld Chain上のMorpho Blueで使用されているか
- もし異なる場合、正しいマーケットIDは何か
- World Chain上のアクティブなMorphoマーケットIDのリスト

**参考:**
- UNOアプリ（World App内の別のMini App）がこのマーケットIDを使用していると報告されている

### 4. Morphoポジション情報の正しい取得方法

**SafeProxyウォレットの場合:**
- SafeProxyコントラクトを介したポジション情報の取得方法
- 必要なコントラクト呼び出しの手順

**想定される実装パターン:**
```typescript
// パターン1: 直接呼び出し
position = morphoBlue.position(marketId, userAddress)

// パターン2: Safeを介した呼び出し
position = safe.getModuleData(morphoModule, marketId)

// パターン3: 別のViewコントラクト
position = morphoReader.getUserPosition(userAddress, marketId)
```

### 5. World App Morpho Mini Appのアーキテクチャ

**調査項目:**
- World App内のMorphoはオンチェーンデータを直接読んでいるか、それとも中間APIを使用しているか
- 使用しているRPCエンドポイント（標準のWorld Chain RPCか、専用RPCか）
- データソース（オンチェーン vs オフチェーンインデックス）

---

## 📊 参考情報

### Morpho Blue ABIの一部（position関数）

```solidity
mapping(Id => mapping(address => Position)) public position;

struct Position {
    uint256 supplyShares;
    uint128 borrowShares;
    uint128 collateral;
}
```

### 既知の情報

| 項目 | 情報 |
|------|------|
| **Morpho Blue（Ethereum）** | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| **Morpho Blue（Base）** | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| **World Chain Explorer** | https://worldscan.org |
| **World Chain RPC** | https://worldchain-mainnet.g.alchemy.com/public |
| **Morpho公式ドキュメント** | https://docs.morpho.org |

### 検証済みの事実

✅ World Chain RPC URLは正常に動作（`eth_getBlockNumber`等は成功）
✅ ユーザーのウォレットはWorld Chain上に存在（WorldScanで確認可能）
✅ ユーザーのウォレットはSafeProxyコントラクト
❌ `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`はWorld Chain上に存在しない
❌ Morpho GraphQL APIはWorld Chainをサポートしていない

---

## 🎁 期待する成果物

1. **World Chain上の正確なMorphoコントラクトアドレス**
2. **ユーザーのポジション情報を取得するための正しいコントラクト呼び出し方法**（サンプルコードまたは詳細な手順）
3. **World Chain上のアクティブなMorphoマーケットIDリスト**
4. **World App Morphoとオンチェーンデータのマッピング方法**

---

## 📝 補足事項

- World App内のMorphoでは実際にポジションが表示されているため、データは存在している
- 目的は「World App内のMorphoと同じポジション情報をプログラマティックに取得すること」
- 最終的にはTypeScript + viem でポジション取得APIを実装予定

---

## 📞 連絡先

調査結果や質問がある場合、以下の情報を共有してください：

- 特定したコントラクトアドレス
- 実際のトランザクションハッシュ（Morpho関連）
- 推奨される実装アプローチ

---

**作成日:** 2025-10-05
**バージョン:** 1.0
**優先度:** 高
