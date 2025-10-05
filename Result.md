# Morpho Monitor: 調査結果報告書

## 📋 概要

調査依頼に基づき、World Chain上のMorpho関連情報を収集・分析しました。主な発見は、World Chain上のMorpho Blueコントラクトアドレスがクエリで想定されていたもの（`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`）とは異なり、`0xe741bc7c34758b4cae05062794e8ae24978af432`であることです。このアドレスはWorld Chain Explorer（WorldScan）で「Morpho」としてラベル付けされており、Morpho公式のデプロイメント情報と一致します。他チェーンでは確定性デプロイメント（同じアドレス）を使用していますが、World Chainでは異なるアドレスが使用されています。

ポジション取得失敗の主な原因は、このコントラクトアドレスの誤りだと考えられます。SafeProxyウォレットの特性（ユーザーオペレーション経由のインタラクション）と組み合わせ、標準RPC呼び出しでポジションが取得可能になるはずです。

以下に調査項目ごとの詳細をまとめます。

## 🔍 調査結果

### 1. World Chain上の実際のMorphoコントラクトアドレスの特定

- **Morpho Blue契約アドレス**: `0xe741bc7c34758b4cae05062794e8ae24978af432`  
  - WorldScanで確認（コントラクト名: Morpho）。  
  - Morpho公式ドキュメントおよびデプロイメントリポジトリ（GitHub: morpho-org/morpho-blue-deployment）で、World Chain（Chain ID: 480）へのデプロイが確認。   
  - 他のチェーン（Ethereum, Baseなど）では`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`が使用されるが、World Chainではこのアドレスにコードが存在しないため、専用デプロイメント。

- **Bundler契約アドレス**: `0x3d07bf2ffb23248034bf704f3a4786f1ffe2a448` (Bundler3としてラベル付け)。Morphoのユーザーインタラクションをバンドルするためのコントラクト。

- **Public Allocator契約アドレス**: `0xef9889b4e443ded35fa0bd060f2104cca94e6a43`。Morphoの公開リソース割り当てコントラクト。

追加の関連コントラクト（WorldScan検索結果より）:
- Adaptive Curve IRM: `0x34e99d604751a72cf8d0cfdf87069292d82de472`
- MetaMorpho Factory v1.1: `0x4dbb3a642a2146d5413750cca3647086d9ba5f12`
- Chainlink Oracle V2 Factory: `0xd706690ba1fe26b70c4ad89e60ff62ceb3a2ed02`
- Universal Rewards Distributor Factory: `0x02c895e99db5348284b743512cf32a016f76286b`

これらのアドレスはMorphoエコシステムの一部で、ポジション管理に間接的に関連する可能性があります。

### 2. ユーザーウォレットのトランザクション履歴調査

- **対象アドレス**: `0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002`
- **調査内容**:
  - WorldScanおよびAlchemy Blockscoutで確認したところ、標準トランザクション（legacy tx）は「No matching entries」（コントラクト作成のみ）。 
  - これはSafeProxyコントラクトの特性によるもの。SafeはERC-4337準拠のユーザーオペレーション（UserOps）を使用するため、標準Explorerでは表示されない場合が多い。 
  - Morpho関連のインタラクション（Supply, Borrow, SupplyCollateralなど）はUserOps経由で実行されている可能性が高い。ポジションがWorld Appで表示されているため、データはオンチェーンに存在。
  - interactionしているコントラクト: 特定できず（txなしのため）。ただし、Morpho Blue (`0xe741bc7c34758b4cae05062794e8ae24978af432`) への呼び出しが想定される。
  - 最近のトランザクションハッシュ: なし（UserOpsのため）。UserOpsを閲覧するには、Safe Transaction Service APIを使用（例: `https://safe-transaction-worldchain.safe.global/api/v1/safes/{safeAddress}/transactions/`）。

- **SafeProxyの確認**: はい、コントラクト名「SafeProxy」。 OwnerやモジュールはExplorerで未表示。Safe APIでクエリ可能。

### 3. マーケットIDの検証

- **提供されたマーケットID**: `0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9`
- **調査内容**:
  - World Chain上のMorpho BlueでこのIDが使用されている直接証拠なし。WorldScanでtxハッシュとして検索しても「Not found」（クエリと一致）。
  - ただし、Morpho BlueのマーケットIDは市場パラメータ（loanToken, collateralToken, oracle, irm, lltv）のkeccak256ハッシュで生成されるため、このIDは有効な形式。
  - UNOアプリ（World App内）から取得されたものなので、World Chain上のアクティブマーケットの可能性が高い。ポジションがWLD collateral → USDC loanなので、対応市場。
  - **World Chain上のアクティブなMorphoマーケットIDリスト**: 直接リスト取得不可（Morpho APIがWorld Chain未サポート）。 Morpho Blueコントラクトの`CreateMarket`イベントをWorldScanでフィルタリングして抽出可能（例: Morphoアドレスからのイベント）。アクティブ市場例（MorphoドキュメントおよびDuneクエリから類推）:
    - WLD/USDC関連: 特定なし、ですが提供IDが該当する可能性。
    - 一般例（他チェーン参考）: `0xa458018cf1a6e77ebbcc40ba5776ac7990e523b7cc5d0c1e740a4bbc13190d8f` (PT-USDS-14AUG2025/DAI)。
  - 正しいIDを確認するには、Morpho Blueコントラクトの`market(id)`関数をRPCで呼び出し、存在を確認（存在すれば非ゼロ値返却）。

### 4. Morphoポジション情報の正しい取得方法

- **SafeProxyウォレットの場合**:
  - SafeProxyはdelegatecallパターンを使用するため、ポジションはProxyアドレス（ユーザーアドレス）で直接クエリ可能。内部状態はMorpho Blueに記録。
  - 直接`position(marketId, userAddress)`呼び出しで取得可能（パターン1）。Safe経由の追加ステップ不要。
  - 必要なコントラクト呼び出しの手順:
    1. 正しいMorpho Blueアドレスを使用（`0xe741bc7c34758b4cae05062794e8ae24978af432`）。
    2. ABIはクエリと同じ（mapping(Id => mapping(address => Position)) public position;）。
    3. Viewコントラクト（morphoReader）は存在しない。直接Morpho Blueから。

- **サンプルコード（TypeScript + viem）**:
```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains'; // World Chainはカスタムチェーン定義が必要

// World Chain定義 (viemでカスタムチェーン)
const worldChain = {
  id: 480,
  name: 'World Chain Mainnet',
  network: 'worldchain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] },
    public: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] },
  },
};

const client = createPublicClient({
  chain: worldChain,
  transport: http(),
});

const MORPHO_BLUE_ABI = [ // position関数のABI抜粋
  {
    "constant": true,
    "inputs": [
      { "name": "id", "type": "bytes32" },
      { "name": "user", "type": "address" }
    ],
    "name": "position",
    "outputs": [
      { "name": "supplyShares", "type": "uint256" },
      { "name": "borrowShares", "type": "uint128" },
      { "name": "collateral", "type": "uint128" }
    ],
    "type": "function"
  }
];

try {
  const position = await client.readContract({
    address: '0xe741bc7c34758b4cae05062794e8ae24978af432', // 正しいMorpho Blueアドレス
    abi: MORPHO_BLUE_ABI,
    functionName: 'position',
    args: [
      '0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9', // marketId
      '0xf16e5d002a10e27ec3d90efb8d2a5c893ab5a002' // userAddress
    ]
  });
  console.log('Position:', position); // { supplyShares, borrowShares, collateral }
} catch (error) {
  console.error('Error:', error);
}
```
  - エラーが発生する場合: Market ID確認 or ポジションゼロ（ただしAppで表示されるため非ゼロのはず）。
  - 追加: 複数の市場がある場合、すべてのアクティブMarket IDをループしてポジション確認。

### 5. World App Morpho Mini Appのアーキテクチャ

- **調査項目**:
  - **オンチェーンデータ vs オフチェーン**: 主にオンチェーン。Morpho Mini AppはMorpho Protocol（Morpho Blue）の上に構築され、スマートコントラクトと直接インタラクション。 ポジションはWorld Chain上で管理（permissionless markets）。
  - **使用RPCエンドポイント**: 標準World Chain RPC（`https://worldchain-mainnet.g.alchemy.com/public`）を使用。ただし、Mini AppはWorld Appの内部最適化（World ID検証統合）で高速化。
  - **データソース**: オンチェーン（Morphoコントラクト） + オフチェーンインデックス（Merkl for rewards: https://app.merkl.xyz/?protocol=Morpho&chain=480）。 Morpho API（GraphQL）はWorld Chain未サポートのため、Appはカスタムインデックス or 直接RPC使用。
  - ブリッジ不要でアクセス可能（World App内）。World ID検証で人間限定リワード付与。

## 🎁 期待する成果物

1. **World Chain上の正確なMorphoコントラクトアドレス**: `0xe741bc7c34758b4cae05062794e8ae24978af432` (Morpho Blue)。
2. **ユーザーのポジション情報を取得するための正しいコントラクト呼び出し方法**: 上記サンプルコード。直接`position`関数呼び出し（SafeProxyアドレス使用）。
3. **World Chain上のアクティブなMorphoマーケットIDリスト**: 直接リスト未取得。Morpho Blueのイベントから抽出推奨。提供IDは有効候補。
4. **World App Morphoとオンチェーンデータのマッピング方法**: オンチェーン（Morpho Blue position関数） + オフチェーン（Merkl rewards）。Appはコントラクト直接インタラクション。

## 📝 補足事項

- ポジション取得API実装時は、Market IDを動的に取得（例: Morpho Blueの`idToMarketParams(id)`で検証）。
- 追加質問があれば、Safe APIでUserOps確認 or Morpho Blueイベントログ解析を推奨。
- 調査日: 2025-10-05
