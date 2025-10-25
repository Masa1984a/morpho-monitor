# CTS Developer Blog API 仕様書

CTS開発者ブログの記事を取得するためのREST API

## 基本情報

| 項目 | 値 |
|------|-----|
| **Base URL** | `https://cts-blog-three.vercel.app` |
| **プロトコル** | HTTPS |
| **データ形式** | JSON |
| **文字エンコーディング** | UTF-8 |
| **タイムゾーン** | UTC |
| **対応言語** | 日本語 (ja), English (en), Español (es), Português (pt), 한국어 (ko), 简体中文 (zh), 繁體中文 (tw), ไทย (th) |

## 認証

全てのエンドポイントは Bearer Token 認証が必要です。

### リクエストヘッダー

```
Authorization: Bearer CTS_BLOG_TOKEN_20251026
```

### 認証エラー

認証に失敗した場合、`401 Unauthorized` が返されます。

```json
{
  "error": "Unauthorized"
}
```

---

## エンドポイント一覧

### 1. 記事一覧取得

公開済みの記事一覧を取得します。

#### エンドポイント

```
GET /api/public/posts
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `limit` | Number | ❌ | `10` | 取得件数（最大100） |
| `offset` | Number | ❌ | `0` | オフセット（ページネーション用） |
| `lang` | String | ❌ | `ja` | 言語コード（現在は記録のみ、将来の拡張用） |

#### リクエスト例

```bash
# 最新10件を取得（デフォルト）
curl -X GET "https://cts-blog-three.vercel.app/api/public/posts" \
  -H "Authorization: Bearer CTS_BLOG_TOKEN_20251026"

# 最新20件を取得
curl -X GET "https://cts-blog-three.vercel.app/api/public/posts?limit=20" \
  -H "Authorization: Bearer CTS_BLOG_TOKEN_20251026"

# オフセット10から10件取得（2ページ目）
curl -X GET "https://cts-blog-three.vercel.app/api/public/posts?limit=10&offset=10" \
  -H "Authorization: Bearer CTS_BLOG_TOKEN_20251026"
```

#### レスポンス

**Status Code**: `200 OK`

```json
{
  "posts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Next.js 15の新機能まとめ",
      "excerpt": "Next.js 15がリリースされました。今回のアップデートでは、App Routerの改善、React 19のサポート、そして新しいキャッシュ戦略が導入されています。この記事では、主要な新機能について詳しく解説します...",
      "image_url": "https://example.blob.vercel-storage.com/image1.png",
      "published_at": "2025-10-25T10:30:00.000Z"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "title": "TypeScriptのベストプラクティス",
      "excerpt": "TypeScriptを使用する際に知っておくべきベストプラクティスをまとめました。型安全性を保ちながら、効率的に開発を進めるためのテクニックを紹介します...",
      "image_url": "https://example.blob.vercel-storage.com/image2.png",
      "published_at": "2025-10-24T15:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "count": 10
  },
  "filters": {
    "lang": "ja"
  }
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `posts` | Array | 記事の配列 |
| `posts[].id` | String (UUID) | 記事の一意識別子 |
| `posts[].title` | String | 記事タイトル（Markdownの最初の見出しから抽出） |
| `posts[].excerpt` | String | 記事の抜粋（最初の200文字） |
| `posts[].image_url` | String \| null | アイキャッチ画像のURL |
| `posts[].published_at` | String (ISO 8601) | 公開日時 |
| `meta` | Object | メタデータ |
| `meta.total` | Number | 総記事数 |
| `meta.limit` | Number | 取得件数制限 |
| `meta.offset` | Number | オフセット |
| `meta.count` | Number | 実際に返された記事数 |
| `filters` | Object | 適用されたフィルタ |

---

### 2. 記事詳細取得

特定の記事の詳細情報を取得します。多言語に対応しています。

#### エンドポイント

```
GET /api/public/posts/{id}
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `id` | String (UUID) | ✅ | 記事ID |

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `lang` | String | ❌ | `ja` | 言語コード（`ja`, `en`, `es`, `pt`, `ko`, `zh`, `tw`, `th`） |

#### リクエスト例

```bash
# 日本語で記事を取得（デフォルト）
curl -X GET "https://cts-blog-three.vercel.app/api/public/posts/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer CTS_BLOG_TOKEN_20251026"

# 英語で記事を取得
curl -X GET "https://cts-blog-three.vercel.app/api/public/posts/550e8400-e29b-41d4-a716-446655440000?lang=en" \
  -H "Authorization: Bearer CTS_BLOG_TOKEN_20251026"

# スペイン語で記事を取得
curl -X GET "https://cts-blog-three.vercel.app/api/public/posts/550e8400-e29b-41d4-a716-446655440000?lang=es" \
  -H "Authorization: Bearer CTS_BLOG_TOKEN_20251026"
```

#### レスポンス

**Status Code**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Next.js 15の新機能まとめ",
  "content_md": "# Next.js 15の新機能まとめ\n\nNext.js 15がリリースされました。今回のアップデートでは、以下の新機能が追加されています。\n\n## App Routerの改善\n\nApp Routerがさらに使いやすくなりました...",
  "image_url": "https://example.blob.vercel-storage.com/image1.png",
  "language": "ja",
  "published_at": "2025-10-25T10:30:00.000Z",
  "created_at": "2025-10-25T09:00:00.000Z",
  "updated_at": "2025-10-25T10:30:00.000Z"
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | String (UUID) | 記事ID |
| `title` | String | 記事タイトル（指定言語） |
| `content_md` | String | 記事本文（Markdown形式、指定言語） |
| `image_url` | String \| null | アイキャッチ画像のURL |
| `language` | String | 返されたコンテンツの言語コード |
| `published_at` | String (ISO 8601) | 公開日時 |
| `created_at` | String (ISO 8601) | 作成日時 |
| `updated_at` | String (ISO 8601) | 最終更新日時 |

#### エラーレスポンス

**Status Code**: `404 Not Found`

```json
{
  "error": "Post not found"
}
```

または（翻訳が未完了の場合）

```json
{
  "error": "Content not available in requested language",
  "available_languages": ["ja", "en", "es", "pt"]
}
```

---

## 使用例

### JavaScript (fetch API)

```javascript
const BASE_URL = 'https://cts-blog-three.vercel.app';
const BEARER_TOKEN = 'CTS_BLOG_TOKEN_20251026';

// 記事一覧取得
async function getPosts(limit = 10, offset = 0) {
  const response = await fetch(`${BASE_URL}/api/public/posts?limit=${limit}&offset=${offset}`, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  });
  const data = await response.json();
  return data.posts;
}

// 記事詳細取得（日本語）
async function getPost(id) {
  const response = await fetch(`${BASE_URL}/api/public/posts/${id}`, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  });
  return await response.json();
}

// 記事詳細取得（英語）
async function getPostEn(id) {
  const response = await fetch(`${BASE_URL}/api/public/posts/${id}?lang=en`, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  });
  return await response.json();
}

// 使用例
getPosts().then(posts => {
  console.log('最新記事:', posts.map(p => p.title));
});

getPost('550e8400-e29b-41d4-a716-446655440000').then(post => {
  console.log('記事タイトル:', post.title);
  console.log('記事本文:', post.content_md);
});
```

### Python (requests)

```python
import requests

BASE_URL = 'https://cts-blog-three.vercel.app'
BEARER_TOKEN = 'CTS_BLOG_TOKEN_20251026'

headers = {
    'Authorization': f'Bearer {BEARER_TOKEN}'
}

# 記事一覧取得
def get_posts(limit=10, offset=0):
    response = requests.get(
        f'{BASE_URL}/api/public/posts?limit={limit}&offset={offset}',
        headers=headers
    )
    response.raise_for_status()
    return response.json()['posts']

# 記事詳細取得
def get_post(post_id, lang='ja'):
    response = requests.get(
        f'{BASE_URL}/api/public/posts/{post_id}?lang={lang}',
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# 使用例
posts = get_posts(limit=5)
for post in posts:
    print(f"タイトル: {post['title']}")
    print(f"公開日: {post['published_at']}")
    print()

# 詳細取得
post = get_post('550e8400-e29b-41d4-a716-446655440000', lang='en')
print(f"Title: {post['title']}")
print(f"Content: {post['content_md'][:100]}...")
```

### PowerShell

```powershell
$BaseUrl = 'https://cts-blog-three.vercel.app'
$Headers = @{
    'Authorization' = 'Bearer CTS_BLOG_TOKEN_20251026'
}

# 記事一覧取得
$posts = Invoke-RestMethod -Uri "$BaseUrl/api/public/posts?limit=10" -Headers $Headers
$posts.posts | Format-Table title, published_at

# 記事詳細取得
$postId = '550e8400-e29b-41d4-a716-446655440000'
$post = Invoke-RestMethod -Uri "$BaseUrl/api/public/posts/$postId?lang=ja" -Headers $Headers
Write-Host $post.content_md
```

### cURL

```bash
# 環境変数設定
export API_URL="https://cts-blog-three.vercel.app"
export TOKEN="CTS_BLOG_TOKEN_20251026"

# 記事一覧
curl -X GET "$API_URL/api/public/posts" \
  -H "Authorization: Bearer $TOKEN"

# 記事詳細（日本語）
curl -X GET "$API_URL/api/public/posts/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"

# 記事詳細（英語）
curl -X GET "$API_URL/api/public/posts/550e8400-e29b-41d4-a716-446655440000?lang=en" \
  -H "Authorization: Bearer $TOKEN"
```

---

## エラーコード

| HTTPステータス | 説明 |
|---------------|------|
| `200 OK` | 成功 |
| `400 Bad Request` | リクエストパラメータが不正 |
| `401 Unauthorized` | 認証失敗（トークンが無効または未指定） |
| `404 Not Found` | リソースが見つからない |
| `500 Internal Server Error` | サーバーエラー |

---

## レート制限

現在、レート制限は設定されていませんが、過度なリクエストは控えてください。

---

## 多言語サポート

### 対応言語

このAPIは8つの言語に対応しています：

| 言語コード | 言語名 | 説明 |
|-----------|--------|------|
| `ja` | 日本語 | Japanese（デフォルト） |
| `en` | English | 英語 |
| `es` | Español | スペイン語 |
| `pt` | Português | ポルトガル語 |
| `ko` | 한국어 | 韓国語 |
| `zh` | 简体中文 | 簡体字中国語 |
| `tw` | 繁體中文 | 繁体字中国語 |
| `th` | ไทย | タイ語 |

### 翻訳の仕組み

1. **日本語での記事作成**: 管理者が日本語で記事を作成します
2. **AI翻訳**: 記事公開時にOpenAI GPT-5-nanoで各言語に自動翻訳されます
3. **並列処理**: 7つの言語への翻訳を並列実行します（約1-3分）
4. **同一ソース**: 全ての言語版は同じ日本語記事から翻訳されるため、内容の一貫性が保証されます

### 使用方法

記事詳細取得エンドポイントに `?lang={言語コード}` クエリパラメータを追加してください：

```bash
# 日本語（デフォルト）
GET /api/public/posts/{id}

# 英語
GET /api/public/posts/{id}?lang=en

# スペイン語
GET /api/public/posts/{id}?lang=es

# 韓国語
GET /api/public/posts/{id}?lang=ko
```

### 注意事項

- 言語を指定しない場合、デフォルトで日本語 (`ja`) が返されます
- 無効な言語コードを指定した場合、`400 Bad Request` エラーが返されます
- 翻訳が完了していない言語をリクエストした場合、`404 Not Found` と利用可能な言語リストが返されます
- 全ての言語版は記事公開時に同時に生成されます

---

## 注意事項

1. **タイムゾーン**: 全ての日時はUTCです
2. **Markdown形式**: 記事本文は Markdown 形式で返されます
3. **画像URL**: 画像URLは Vercel Blob Storage の公開URLです
4. **null値**: `image_url` フィールドは null になる場合があります
5. **公開済み記事のみ**: 下書き状態の記事は取得できません
6. **論理削除**: 削除された記事は取得できません

---

## データ更新

| データ | 更新方法 | 説明 |
|--------|---------|------|
| 記事 | 管理者が手動で作成・公開 | 管理画面から記事を作成し、公開ボタンで翻訳・公開 |
| 翻訳 | 公開時に自動生成 | OpenAI GPT-5-nanoで7言語に自動翻訳（1-3分） |

---

## セキュリティ

- **Bearer Token認証**: 全てのエンドポイントで必須
- **公開済み記事のみ**: 下書きや削除済み記事はアクセス不可
- **HTTPS必須**: 本番環境では必ずHTTPSを使用してください
- **トークン管理**: Bearer Tokenは環境変数で安全に管理してください

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------| |
| 2025-10-26 | 1.0.0 | 初版リリース - 記事一覧・詳細取得API、8言語対応 |

---

## サポート

API に関する質問や問題がある場合は、プロジェクトのGitHubリポジトリでIssueを作成してください。

---

**Base URL**: https://cts-blog-three.vercel.app

**認証**: `Authorization: Bearer CTS_BLOG_TOKEN_20251026`

**多言語対応**: 日本語、英語、スペイン語、ポルトガル語、韓国語、簡体字中国語、繁体字中国語、タイ語
