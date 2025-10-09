# デプロイメントガイド

## 暗号通貨ロゴの追加手順

### 1. 画像ファイルの準備

以下のファイルを準備してください：

- `WLD.png` - Worldcoin のロゴ
- `USDC.png` - USD Coin のロゴ
- `WBTC.png` - Wrapped Bitcoin のロゴ
- `WETH.png` - Wrapped Ethereum のロゴ

**推奨仕様:**
- フォーマット: PNG（透過背景推奨）
- サイズ: 32x32 px または 64x64 px（正方形）
- ファイルサイズ: 各ファイル 50KB 以下

### 2. ファイルの配置

準備した画像ファイルを `public/crypto-logos/` ディレクトリに配置します：

```
morpho-monitor/
├── public/
│   └── crypto-logos/
│       ├── WLD.png
│       ├── USDC.png
│       ├── WBTC.png
│       └── WETH.png
```

### 3. ローカルでの確認

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで以下のURLにアクセスして画像が表示されることを確認：
- http://localhost:3000/crypto-logos/WLD.png
- http://localhost:3000/crypto-logos/USDC.png
- http://localhost:3000/crypto-logos/WBTC.png
- http://localhost:3000/crypto-logos/WETH.png

### 4. Gitへのコミット

```bash
# ファイルをステージング
git add public/crypto-logos/*.png

# コミット
git commit -m "Add crypto logos for WLD, USDC, WBTC, WETH"
```

### 5. Vercelへのデプロイ

**方法1: 自動デプロイ（推奨）**

```bash
# メインブランチにプッシュ
git push origin main
```

Vercelは自動的に：
1. 新しいコミットを検知
2. ビルドを実行
3. `public/` フォルダのファイルを含めてデプロイ

**方法2: 手動デプロイ**

Vercelダッシュボードから手動でデプロイをトリガー

## 実装の詳細

### コード変更点

`app/page.tsx` の暗号通貨ボタン部分を以下のように変更しました：

```tsx
<div className="flex items-center justify-center mb-1">
  <img
    src={`/crypto-logos/${symbol}.png`}
    alt={`${symbol} logo`}
    className="w-5 h-5 mr-2"
    onError={(e) => {
      // 画像の読み込みに失敗した場合は非表示にする
      e.currentTarget.style.display = 'none';
    }}
  />
  <span className="font-semibold text-gray-900">{symbol}</span>
</div>
```

### 画像が表示されない場合の対処

画像ファイルが見つからない場合、`onError` ハンドラが動作してロゴを非表示にします。
この場合、暗号通貨のシンボル名のみが表示されます。

### デプロイ確認事項

✅ `public/crypto-logos/` ディレクトリが存在する
✅ 4つの画像ファイル（WLD.png, USDC.png, WBTC.png, WETH.png）が配置されている
✅ Gitにコミットされている
✅ メインブランチにプッシュされている

## Vercelでの確認

デプロイ後、本番環境のURLにアクセスして以下を確認：

1. 暗号通貨ボタンにロゴが表示されている
2. ロゴがクリプト名の左横に配置されている
3. すべてのロゴが正しく読み込まれている

## トラブルシューティング

### 画像が表示されない

1. ファイル名が正しいか確認（大文字小文字を含む）
2. ファイルが `public/crypto-logos/` に配置されているか確認
3. Gitにコミットされているか確認
4. ブラウザのキャッシュをクリア
5. Vercelのデプロイログを確認

### ファイルサイズが大きい場合

画像を最適化してください：
- オンラインツール: [TinyPNG](https://tinypng.com/)
- コマンドライン: ImageMagick, pngquant など
