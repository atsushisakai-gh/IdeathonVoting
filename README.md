# 社内AIアイデアソン投票システム

Team A~Gの発表を4つの観点で1~5点で評価する投票ツールです。Vercelで無料でデプロイできます。

## 機能

- **投票画面** (`/`): 各チーム（A~G）を4つの観点で1~5点で評価
  - 課題設定の鋭さ: 本質的な課題を捉えているか
  - アイデアの新規性: 既存の延長ではない発想
  - 実現可能性・事業性: 絵に描いた餅で終わっていないか
  - AI活用の創意工夫: AIを単なる効率化以上に使えたか
- **1チームずつ投票**: 各チームの評価を個別に送信可能
- **再投票可能**: 投票済みのチームでも評価を変更して再投票できる（重複カウントされません）
- **コメント機能**: 各チームへの投票時に任意でコメント（最大500文字）を入力可能
- **投票者ID管理**: 各投票者に一意のIDを付与し、再投票時は自動的に上書き
- **投票リセット**: すべてのチームへの投票完了後、新しい投票者として最初から投票可能
- **管理者画面** (`/admin`): パスワード保護された管理画面
  - **集計結果**: 合計点でランキング表示、各観点の平均点も表示
  - **ランキング**: 総合ランキング（🥇🥈🥉）と分野別ランキング
  - **コメント一覧**: 各チームに寄せられたコメントを一覧表示
  - **データ管理**: 投票データのリセット
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
  },
  "voterId": "voter_1234567890_abc123def",
  "comment": "素晴らしいアイデアでした！" // 任意
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
  },
  "voterScores": {
    "voter_1234567890_abc123def": {
      "A": {
        "scores": { "sharpness": 4, "novelty": 5, ... },
        "comment": "素晴らしいアイデアでした！"
      },
      "B": { ... }
    },
    "voter_9876543210_xyz789ghi": { ... }
  }
}
```

**投票者ID**: ブラウザのlocalStorageに保存され、再投票時に同じIDで投票すると自動的に上書きされます。

## 管理者機能

管理者ページ（`/admin`）では以下の操作ができます：

### 1. 集計結果を見る

- 「集計結果」タブで各チームの得点を確認
- チームごとの合計点、平均点、投票数を表示
- 各観点（課題設定、新規性、実現可能性、AI活用）の詳細も表示

### 2. ランキングを見る

- 「ランキング」タブを開く
- **総合ランキング**: 全チームを合計点でソート（1位🥇、2位🥈、3位🥉）
- **分野別ランキング**: 各観点ごとのトップ5を表示

### 3. コメント一覧を見る

- 「コメント一覧」タブを開く
- 各チームに寄せられたコメントを一覧表示
- 投票者IDも表示されますが、個人は特定できません

### 4. 投票データをクリアする

1. 「データ管理」タブを開く
2. 「すべての投票データをクリアする」ボタンをクリック

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

## 重要な仕様

### 再投票の仕組み

- 各投票者には一意のID（`voterId`）が自動的に付与されます
- 投票者IDはブラウザのlocalStorageに保存されます
- 同じ投票者IDで再投票すると、**以前の投票が上書き**されます（重複カウントされません）
- 「すべての投票をリセット」を実行すると、新しい投票者IDが発行されます

### 匿名性について

- 投票者IDはランダムな文字列で、個人を特定する情報は含まれません
- 管理者でも投票者IDから個人を特定することはできません
- ブラウザを変更したり、シークレットモードを使用すると別の投票者として扱われます

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

### 再投票しても結果が変わらない

- ブラウザのキャッシュをクリアして再度投票してください
- 管理画面で「更新」ボタンをクリックして最新の結果を取得してください

## ライセンス

MIT
