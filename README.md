# 社内AIアイデアソン投票システム

Team A~Gの発表を4つの観点で1~5点で評価する投票ツールです。Vercelで無料でデプロイできます。

## 機能

- **投票画面** (`/`): 各チーム（A~G）を4つの観点で1~5点で評価
  - 課題設定の鋭さ: 本質的な課題を捉えているか
  - アイデアの新規性: 既存の延長ではない発想
  - 実現可能性・事業性: 絵に描いた餅で終わっていないか
  - AI活用の創意工夫: AIを単なる効率化以上に使えたか
- **集計画面** (`/results`): 合計点でランキング表示、各観点の平均点も表示
- **1人1回制限**: ブラウザのlocalStorageで重複投票を防止

## ローカル開発

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

http://localhost:3000 でアクセスできます。

## Vercelへのデプロイ

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)にログイン
3. "Import Project"でリポジトリを選択
4. デプロイ

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

## 本番環境での永続化

開発環境ではメモリにデータを保存しますが、本番環境では再起動時にデータが消えます。
永続化するには以下のオプションがあります：

### オプション1: Vercel KV (推奨)

```bash
npm install @vercel/kv
```

`lib/storage.ts`のコメント部分を有効化してVercel KVを設定してください。
Vercelダッシュボードから「Storage」→「Create Database」→「KV」で無料のデータベースを作成できます。

### オプション2: Supabase / Firebase

お好みのデータベースサービスを使用できます。

## データ構造

各投票者からのデータ：
```typescript
{
  "A": { "sharpness": 4, "novelty": 5, "feasibility": 3, "ai_creativity": 4 },
  "B": { ... },
  ...
}
```

集計結果：
```typescript
{
  teams: {
    "A": {
      "sharpness": { total: 12, count: 3, average: 4.0 },
      ...
    },
    ...
  },
  voteCount: 3
}
```

## ライセンス

MIT
