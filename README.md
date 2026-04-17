# 社内AIアイデアソン投票システム

Team A~Gの発表を4つの観点で1~5点で評価する投票ツールです。Vercelで無料でデプロイできます。

## 機能

- **投票画面** (`/`): 各チーム（A~G）を4つの観点で1~5点で評価
  - 課題設定の鋭さ: 本質的な課題を捉えているか
  - アイデアの新規性: 既存の延長ではない発想
  - 実現可能性・事業性: 絵に描いた餅で終わっていないか
  - AI活用の創意工夫: AIを単なる効率化以上に使えたか
- **1チームずつ投票**: 各チームの評価を個別に送信可能
- **集計画面** (`/results`): 合計点でランキング表示、各観点の平均点も表示
- **データ永続化**: Vercel KV（Redis）で投票データを保存

## ローカル開発

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

http://localhost:3000 でアクセスできます。

ローカル開発では、環境変数が設定されていない場合、自動的にメモリストレージを使用します。

## Vercelへのデプロイ

### 1. GitHubにプッシュ（完了済み）

リポジトリ: https://github.com/atsushisakai-gh/IdeathonVoting

### 2. Vercelでプロジェクトをインポート

1. [Vercel](https://vercel.com)にログイン
2. "Add New" → "Project"
3. GitHubリポジトリ `IdeathonVoting` を選択
4. "Deploy" をクリック

### 3. Vercel KVデータベースを作成

デプロイ後、以下の手順でデータベースを作成：

1. Vercelダッシュボードでプロジェクトを開く
2. "Storage" タブをクリック
3. "Create Database" をクリック
4. "KV" を選択（または "Browse Storage" から Upstash Redis を選択）
5. データベース名を入力（例: `ideathon-voting-kv`）
6. "Create" をクリック

### 4. 環境変数を接続

1. 作成したKVデータベースの詳細画面で "Connect to Project" をクリック
2. プロジェクト `IdeathonVoting` を選択
3. 環境変数が自動的に設定されます：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

これで永続化が有効になります！

## ローカル開発でVercel KVを使う（オプション）

本番環境のデータベースに接続する場合：

1. Vercelダッシュボードの "Settings" → "Environment Variables" を開く
2. `KV_REST_API_URL` と `KV_REST_API_TOKEN` をコピー
3. プロジェクトルートに `.env.local` を作成：

```bash
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
```

4. 開発サーバーを再起動

または、Vercel CLIを使う：

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
npm run dev
```

## カスタマイズ

### チーム数の変更

`app/page.tsx`と`app/results/page.tsx`の`TEAMS`配列を編集：

```typescript
const TEAMS = ["A", "B", "C", "D", "E", "F", "G"]; // チーム名を変更
```

### 評価観点の変更

`app/page.tsx`の`CRITERIA`配列を編集：

```typescript
const CRITERIA = [
  { id: "sharpness", label: "課題設定の鋭さ", description: "本質的な課題を捉えているか" },
  // ...観点を追加・編集
];
```

`app/results/page.tsx`の`CRITERIA_LABELS`も同様に更新してください。

## データ構造

### 1チームへの投票データ（APIリクエスト）

```typescript
{
  "team": "A",
  "scores": {
    "sharpness": 4,
    "novelty": 5,
    "feasibility": 3,
    "ai_creativity": 4
  }
}
```

### 集計結果（KVに保存）

```typescript
{
  "teams": {
    "A": {
      "sharpness": { total: 12, count: 3, average: 4.0 },
      "novelty": { total: 15, count: 3, average: 5.0 },
      "feasibility": { total: 9, count: 3, average: 3.0 },
      "ai_creativity": { total: 12, count: 3, average: 4.0 }
    },
    "B": { ... }
  }
}
```

## 管理者機能

### 投票データをクリアする

管理者ページでデータをリセットできます：

1. `/admin` にアクセス
2. パスワードを入力してログイン（デフォルト: `admin2025`）
3. 「すべての投票データをクリアする」ボタンをクリック

### 管理者パスワードの変更

**重要**: 本番環境では必ずパスワードを変更してください。

#### Vercelでの設定

1. Vercelダッシュボードで "Settings" → "Environment Variables"
2. 以下の環境変数を追加：
   - `ADMIN_PASSWORD`: サーバー側の認証用（例: `your-secure-password-123`）
   - `NEXT_PUBLIC_ADMIN_PASSWORD`: クライアント側の認証用（同じ値）
3. プロジェクトを再デプロイ

#### ローカル開発での設定

`.env.local` に追加：

```bash
ADMIN_PASSWORD=your-secure-password
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

## トラブルシューティング

### データが保存されない

- Vercel KVデータベースが作成されているか確認
- 環境変数 `KV_REST_API_URL` と `KV_REST_API_TOKEN` が設定されているか確認
- Vercelでプロジェクトを再デプロイ

### ローカルで環境変数が読み込まれない

- `.env.local` ファイルが正しく作成されているか確認
- 開発サーバーを再起動

### 管理者ページにアクセスできない

- パスワードが正しいか確認
- 本番環境で環境変数が設定されているか確認（Vercel Settings → Environment Variables）

## ライセンス

MIT
