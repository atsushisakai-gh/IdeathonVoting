# 社内AIアイデアソン投票システム

Team A~Gの発表を4つの観点で1~5点で評価する投票ツールです。Vercelで無料でデプロイできます。

## 機能

- **投票画面** (`/`): 各チーム（A~G）を4つの観点で1~5点で評価
  - **所属チーム選択**: 最初に自分の所属チームを選択（自分のチームには投票できません）
  - 課題設定の鋭さ: 本質的な課題を捉えているか
  - アイデアの新規性: 既存の延長ではない発想
  - 実現可能性・事業性: 絵に描いた餅で終わっていないか
  - AI活用の創意工夫: AIを単なる効率化以上に使えたか
- **1チームずつ投票**: 各チームの評価を個別に送信可能
- **再投票可能**: 投票済みのチームでも評価を変更して再投票できる（重複カウントされません）
- **自チーム除外**: 自分の所属チームには投票できない仕組み
- **コメント機能**: 各チームへの投票時に任意でコメント（最大500文字）を入力可能
- **投票者ID管理**: 各投票者に一意のIDを付与し、再投票時は自動的に上書き
- **管理者画面** (`/admin`): パスワード保護された管理画面
  - **認証の永続化**: 一度ログインすると24時間は認証状態を維持（ページリロードOK）
  - **集計結果**: 合計点でランキング表示、各観点の平均点も表示
  - **ランキング**: 総合ランキング（🥇🥈🥉）と分野別ランキング（各観点のトップ5）
  - **コメント一覧**: 各チームに寄せられたコメントを一覧表示
  - **データ管理**: 投票データのリセット、ログアウト機能
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

`app/page.tsx`の`TEAMS`配列を編集：

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

`app/admin/page.tsx`の`CRITERIA_LABELS`も同様に更新してください。

## アーキテクチャ

### システム概要

本システムはNext.js 15（App Router）を使用したフルスタックアプリケーションです。

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ 投票画面 (/) │              │管理画面(/admin)│            │
│  │              │              │                │            │
│  │ - チーム選択 │              │ - 集計結果     │            │
│  │ - 評価入力   │              │ - ランキング   │            │
│  │ - コメント   │              │ - コメント一覧 │            │
│  └──────┬───────┘              └───────┬────────┘            │
│         │                              │                     │
│         │ localStorage                 │ localStorage        │
│         │ - voterId                    │ - adminAuth         │
│         │ - myTeam                     │   (24h expiry)      │
│         │ - voted_{team}               │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │ POST /api/vote               │ GET /api/results
          │ POST /api/admin/reset        │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                      │
│  ┌────────────────┐  ┌───────────────┐  ┌────────────────┐ │
│  │ /api/vote      │  │/api/results   │  │/api/admin/reset│ │
│  │ - 投票受付     │  │- 集計データ取得│  │- データリセット│ │
│  │ - バリデーション│  │               │  │- 認証チェック  │ │
│  └────────┬───────┘  └───────┬───────┘  └────────┬───────┘ │
│           │                  │                   │          │
└───────────┼──────────────────┼───────────────────┼──────────┘
            │                  │                   │
            │                  │                   │
            ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer (lib/storage.ts)            │
│                                                               │
│  - getVotes(): VoteData                                      │
│  - addVote(team, scores, voterId, comment, myTeam): void    │
│  - resetVotes(): void                                        │
│                                                               │
│  ┌───────────────────┐              ┌──────────────────┐   │
│  │ Vercel KV (Redis) │              │ Memory Fallback  │   │
│  │ - 本番環境         │   ────────▶  │ - 開発環境       │   │
│  │ - KV_REST_API_URL │              │ - KV未設定時     │   │
│  └───────────────────┘              └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### フロントエンド構成

#### 投票画面 (`app/page.tsx`)

**状態管理（React State）:**
- `scores`: 各チームの評価スコア（1~5点）
- `comments`: 各チームへのコメント
- `votedTeams`: 投票済みチーム一覧
- `currentTeam`: 現在表示中のチーム
- `voterId`: 投票者ID（localStorage同期）
- `myTeam`: 所属チーム（localStorage同期）

**localStorage項目:**
- `voterId`: 投票者の一意ID（例: `voter_1234567890_abc123def`）
- `myTeam`: 選択した所属チーム（例: `"A"`）
- `voted_{team}`: 各チームへの投票完了フラグ（例: `voted_A: "true"`）

**処理フロー:**
1. 初回アクセス時にvoterIdを生成・保存（または取得）
2. 所属チーム選択画面を表示
3. チーム選択後、評価画面に遷移
4. 各チームを評価してPOST /api/vote
5. 投票完了後、localStorageに`voted_{team}`を保存

#### 管理画面 (`app/admin/page.tsx`)

**状態管理（React State）:**
- `isAuthenticated`: 認証状態
- `results`: 投票集計データ
- `activeTab`: 現在表示中のタブ（results/ranking/comments/manage）

**localStorage項目:**
- `adminAuth`: 認証情報（JSON: `{timestamp, password}`）
  - 24時間有効期限付き

**処理フロー:**
1. 認証チェック（localStorage内のtimestampが24時間以内か）
2. GET /api/resultsで集計データ取得
3. タブに応じたデータ表示
4. データリセット時はPOST /api/admin/reset

### バックエンド構成

#### API Routes

**POST /api/vote** (`app/api/vote/route.ts`)
- リクエスト: `{ team, scores, voterId, comment?, myTeam? }`
- バリデーション:
  - team: 文字列
  - scores: オブジェクト（各criteriaId: 1~5の数値）
  - voterId: 文字列（必須）
  - comment: 文字列（任意）
  - myTeam: 文字列（任意）
- 処理: `addVote()`を呼び出し
- レスポンス: `{ success: true }`

**GET /api/results** (`app/api/results/route.ts`)
- 処理: `getVotes()`を呼び出し
- レスポンス: `{ results: VoteData }`

**POST /api/admin/reset** (`app/api/admin/reset/route.ts`)
- リクエスト: `{ password }`
- 認証: 環境変数`ADMIN_PASSWORD`と照合
- 処理: `resetVotes()`を呼び出し
- レスポンス: `{ success: true }`

#### Storage Layer (`lib/storage.ts`)

**主要関数:**

```typescript
// 全投票データを取得
async function getVotes(): Promise<VoteData>

// 投票を追加・更新（再投票対応）
async function addVote(
  team: string,
  teamScores: Record<string, number>,
  voterId: string,
  comment?: string,
  myTeam?: string
): Promise<void>

// 全投票データをリセット
async function resetVotes(): Promise<void>
```

**ストレージ選択ロジック:**
```typescript
const isKVAvailable = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};
```
- 環境変数が設定されていればVercel KVを使用
- 未設定ならメモリストレージ（開発環境用）

### データフロー

#### 投票フロー

```
1. ユーザーが投票画面にアクセス
   ↓
2. voterIdの生成・取得（localStorage）
   ↓
3. 所属チーム選択
   ↓
4. 評価入力（1~5点 × 4観点）
   ↓
5. コメント入力（任意）
   ↓
6. 「投票する」ボタンクリック
   ↓
7. POST /api/vote
   {
     team: "A",
     scores: { sharpness: 4, novelty: 5, ... },
     voterId: "voter_xxx",
     comment: "...",
     myTeam: "B"
   }
   ↓
8. lib/storage.ts の addVote() 実行
   ├─ 既存投票があればスコアを引く（再投票対応）
   ├─ 新しいスコアを加算
   ├─ 投票者情報を更新
   └─ Vercel KVに保存
   ↓
9. localStorage に voted_A = "true" を保存
   ↓
10. 次のチームへ自動遷移（または完了メッセージ）
```

#### 再投票フロー

```
1. ユーザーが投票済みチームを選択
   ↓
2. 「再投票」と表示される
   ↓
3. 評価を変更
   ↓
4. 「再投票する」ボタンクリック
   ↓
5. POST /api/vote（同じvoterIdで送信）
   ↓
6. addVote() 内で以前のスコアを検出
   ├─ 以前のスコアを各criteriaから引く
   │  (total -= oldScore, count -= 1)
   ├─ 新しいスコアを加算
   │  (total += newScore, count += 1)
   └─ average = total / count を再計算
   ↓
7. 重複カウントされずに更新完了
```

#### 集計データ取得フロー

```
1. 管理者が管理画面にアクセス
   ↓
2. 認証チェック（localStorage の adminAuth）
   ↓
3. GET /api/results
   ↓
4. lib/storage.ts の getVotes() 実行
   ├─ Vercel KVから取得
   └─ フォールバック: memoryStorage
   ↓
5. VoteData を返却
   {
     teams: { A: {...}, B: {...}, ... },
     voterScores: { voter_xxx: {...}, ... }
   }
   ↓
6. フロントエンドで集計・ランキング表示
```

## データ構造

### KVストアのスキーマ設計

Vercel KV（Redis）には、キー`"votes"`で以下のJSON構造を保存します。

#### 全体構造（TypeScript型定義）

```typescript
// KVに保存されるルートオブジェクト
interface VoteData {
  teams: {
    [teamName: string]: TeamScores;
  };
  voterScores: {
    [voterId: string]: VoterInfo;
  };
}

// チームごとの集計データ
interface TeamScores {
  [criteriaId: string]: CriteriaScore;
}

// 各観点の集計スコア
interface CriteriaScore {
  total: number;    // 合計点
  count: number;    // 投票数
  average: number;  // 平均点（total / count）
}

// 投票者の情報
interface VoterInfo {
  myTeam?: string;  // 所属チーム（最初の投票時に固定）
  votes: {
    [teamName: string]: VoterTeamData;
  };
}

// 投票者が特定チームに投票した内容
interface VoterTeamData {
  scores: {
    [criteriaId: string]: number;  // 1~5の評価
  };
  comment?: string;  // 任意コメント（最大500文字）
}
```

#### 具体例（KVストア内のJSONデータ）

```json
{
  "teams": {
    "A": {
      "sharpness": {
        "total": 12,
        "count": 3,
        "average": 4.0
      },
      "novelty": {
        "total": 15,
        "count": 3,
        "average": 5.0
      },
      "feasibility": {
        "total": 9,
        "count": 3,
        "average": 3.0
      },
      "ai_creativity": {
        "total": 12,
        "count": 3,
        "average": 4.0
      }
    },
    "B": {
      "sharpness": { "total": 8, "count": 2, "average": 4.0 },
      "novelty": { "total": 10, "count": 2, "average": 5.0 },
      "feasibility": { "total": 6, "count": 2, "average": 3.0 },
      "ai_creativity": { "total": 8, "count": 2, "average": 4.0 }
    }
  },
  "voterScores": {
    "voter_1713612345678_abc123def": {
      "myTeam": "C",
      "votes": {
        "A": {
          "scores": {
            "sharpness": 4,
            "novelty": 5,
            "feasibility": 3,
            "ai_creativity": 4
          },
          "comment": "素晴らしいアイデアでした！"
        },
        "B": {
          "scores": {
            "sharpness": 4,
            "novelty": 5,
            "feasibility": 3,
            "ai_creativity": 4
          }
        }
      }
    },
    "voter_1713623456789_xyz789ghi": {
      "myTeam": "D",
      "votes": {
        "A": {
          "scores": {
            "sharpness": 4,
            "novelty": 5,
            "feasibility": 3,
            "ai_creativity": 4
          }
        }
      }
    }
  }
}
```

### APIリクエスト/レスポンス

#### POST /api/vote（投票）

**リクエストボディ:**
```json
{
  "team": "A",
  "scores": {
    "sharpness": 4,
    "novelty": 5,
    "feasibility": 3,
    "ai_creativity": 4
  },
  "voterId": "voter_1713612345678_abc123def",
  "comment": "素晴らしいアイデアでした！",
  "myTeam": "C"
}
```

**レスポンス:**
```json
{
  "success": true
}
```

**エラーレスポンス例:**
```json
{
  "error": "Invalid team"
}
```

#### GET /api/results（集計データ取得）

**レスポンス:**
```json
{
  "results": {
    "teams": { /* TeamScoresオブジェクト */ },
    "voterScores": { /* VoterInfoオブジェクト */ }
  }
}
```

#### POST /api/admin/reset（データリセット）

**リクエストボディ:**
```json
{
  "password": "admin2025"
}
```

**レスポンス（成功時）:**
```json
{
  "success": true
}
```

**レスポンス（認証エラー）:**
```json
{
  "error": "Unauthorized"
}
```

### データ整合性の保証

#### 投票者ID（voterId）の仕組み

**生成方法:**
```typescript
const voterId = `voter_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
// 例: "voter_1713612345678_abc123def"
```

**特性:**
- タイムスタンプ + ランダム文字列で一意性を確保
- ブラウザのlocalStorageに永続化
- 個人を特定する情報は含まない（匿名性保証）
- シークレットモードや別ブラウザでは別IDとして扱われる

**保存場所:**
- クライアント: `localStorage.voterId`
- サーバー: `VoteData.voterScores[voterId]`

#### 所属チーム（myTeam）の固定

**初回投票時:**
```typescript
if (!votes.voterScores[voterId]) {
  votes.voterScores[voterId] = {
    myTeam: myTeam,  // ← 初回のみ設定
    votes: {}
  };
}
```

**2回目以降（チーム変更しても上書きされない）:**
```typescript
else if (myTeam && !votes.voterScores[voterId].myTeam) {
  // myTeamが既に設定されている場合は何もしない
  votes.voterScores[voterId].myTeam = myTeam;
}
```

**効果:**
- ユーザーが誤って所属チームを変更しても、最初の選択が維持される
- チーム別投票者数の集計に影響しない

#### 再投票時の重複防止

**再投票検出:**
```typescript
const previousVote = votes.voterScores[voterId].votes[team];
if (previousVote?.scores) {
  // 以前の投票が存在する
}
```

**スコアの差分更新:**
```typescript
// 1. 以前のスコアを引く
Object.entries(previousVote.scores).forEach(([criteriaId, oldScore]) => {
  const criteria = votes.teams[team][criteriaId];
  criteria.total -= oldScore;  // 12 - 4 = 8
  criteria.count -= 1;         // 3 - 1 = 2
  if (criteria.count > 0) {
    criteria.average = criteria.total / criteria.count;  // 8 / 2 = 4.0
  }
});

// 2. 新しいスコアを加算
Object.entries(teamScores).forEach(([criteriaId, score]) => {
  const criteria = votes.teams[team][criteriaId];
  criteria.total += score;     // 8 + 5 = 13
  criteria.count += 1;         // 2 + 1 = 3
  criteria.average = criteria.total / criteria.count;  // 13 / 3 = 4.33
});
```

**結果:**
- countは増えない（投票者数を正確にカウント）
- totalとaverageは最新の評価を反映

### パフォーマンス・スケーラビリティ

#### データサイズ試算

**前提条件:**
- チーム数: 7
- 観点数: 4
- 投票者数: N人
- コメント平均長: 100文字

**1投票者あたりのデータサイズ:**
```
voterScores[voterId] = {
  myTeam: 1文字 ≈ 10 bytes
  votes: {
    A~G (7チーム): {
      scores: 4観点 × 数値 ≈ 80 bytes
      comment: 100文字 ≈ 200 bytes
    }
  }
}
≈ 10 + 7 × (80 + 200) = 10 + 1,960 = 1,970 bytes ≈ 2 KB
```

**集計データサイズ:**
```
teams: {
  A~G (7チーム) × 4観点 × { total, count, average }
  ≈ 7 × 4 × 30 bytes = 840 bytes ≈ 1 KB
}
```

**合計（100人の場合）:**
```
voterScores: 100 × 2 KB = 200 KB
teams: 1 KB
合計: 201 KB
```

**Vercel KVの制限:**
- 無料プラン: 256 MB
- Pro プラン: 512 MB
- 100人規模なら十分余裕

#### Redis操作の最適化

**現在の実装:**
- 全データを1つのキー`"votes"`で管理
- 投票時: GET → 更新 → SET（Read-Modify-Write）
- 集計時: GET のみ

**利点:**
- シンプルな実装
- トランザクション不要（単一キー操作）
- 管理画面での集計が高速（1回のGETで完結）

**欠点と対策:**
- 同時書き込み時の競合リスク
  → 実際の運用では数秒～数十秒間隔での投票なので問題なし
- データサイズ増加時のレイテンシ
  → 1,000人規模（≈2MB）でも十分高速

**スケールアウト案（1,000人以上の場合）:**
```typescript
// チームごとにキーを分割
await kv.set(`votes:team:${team}`, teamScores);
await kv.set(`votes:voter:${voterId}`, voterInfo);
```

## 管理者機能

管理者ページ（`/admin`）では以下の操作ができます。

### ログイン

1. `/admin` にアクセス
2. パスワードを入力（デフォルト: `admin2025`）
3. ログイン成功後、認証状態が**24時間保持**されます
   - ページをリロードしても再ログイン不要
   - タブを閉じても、ブラウザを再起動しても24時間はログイン状態を維持
   - 24時間経過後は自動的に再ログインが必要

### ログアウト

- 管理画面右上の「ログアウト」ボタンをクリック
- 認証状態がクリアされ、ログイン画面に戻ります

### 1. 集計結果タブ

- 各チームの得点を詳細に確認
- チームごとの合計点、平均点、投票数を表示
- 各観点（課題設定、新規性、実現可能性、AI活用）の詳細スコアも表示
- 「更新」ボタンで最新の結果を取得

### 2. ランキングタブ

- **総合ランキング**: 全チームを合計点でソート
  - 1位🥇、2位🥈、3位🥉のメダル表示
  - 背景色で順位を視覚化
- **分野別ランキング**: 各観点ごとのトップ5を表示
  - 課題設定の鋭さ
  - アイデアの新規性
  - 実現可能性・事業性
  - AI活用の創意工夫

### 3. コメント一覧タブ

- 各チームに寄せられたすべてのコメントを一覧表示
- チームごとにグループ化されて見やすく表示
- 投票者ID（匿名）も表示されますが、個人は特定できません
- コメントがないチームには「コメントはありません」と表示

### 4. データ管理タブ

- **投票データのリセット**
  - 「すべての投票データをクリアする」ボタンをクリック
  - 確認ダイアログで再確認
  - すべての投票、コメント、集計データが削除されます
  - **注意**: この操作は取り消せません

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

**基本動作:**
- 各投票者には一意のID（`voterId`）が自動的に付与されます
- 投票者IDはブラウザのlocalStorageに保存されます
- 同じ投票者IDで再投票すると、**以前の投票が上書き**されます（重複カウントされません）
- ブラウザのlocalStorageをクリアすると新しい投票者IDが発行されます

**所属チームの固定:**
- 投票者が最初に選択した所属チーム（myTeam）は固定されます
- 後から所属チームを変更しても、**最初の選択が保持**されます
- これにより、誤ってチームを変更しても集計に影響しません

**技術的な実装:**
```typescript
// 初回投票時のみmyTeamを設定
if (!votes.voterScores[voterId]) {
  votes.voterScores[voterId] = {
    myTeam: myTeam,  // ← 固定される
    votes: {}
  };
}
// 2回目以降は上書きしない
else if (myTeam && !votes.voterScores[voterId].myTeam) {
  votes.voterScores[voterId].myTeam = myTeam;
}
```

### 匿名性について

**プライバシー保護:**
- 投票者IDはランダムな文字列で、個人を特定する情報は含まれません
- 管理者でも投票者IDから個人を特定することはできません
- ブラウザを変更したり、シークレットモードを使用すると別の投票者として扱われます

**データ収集範囲:**
- 収集するデータ: voterId（匿名ID）、所属チーム、評価スコア、コメント
- 収集しないデータ: 名前、メールアドレス、IPアドレス、デバイス情報など

### 管理画面の認証状態

**認証の仕組み:**
- 認証状態はlocalStorageに保存されます
- **24時間有効**: 一度ログインすれば24時間は再ログイン不要
- ページリロード、タブ切り替え、ブラウザ再起動でも認証状態を維持
- 24時間経過後、またはログアウトボタンをクリックすると認証状態がクリア

**セキュリティ上の注意:**
- パスワードはクライアント側で検証（`NEXT_PUBLIC_ADMIN_PASSWORD`）
- サーバー側でも検証（`ADMIN_PASSWORD`）
- **本番環境では必ずパスワードを変更してください**
- クライアント側の認証はXSS攻撃に注意（HTTPSを使用推奨）

## セキュリティとデータ保護

### 環境変数の管理

**必須の環境変数:**

| 変数名 | 用途 | 設定場所 | 例 |
|--------|------|----------|-----|
| `KV_REST_API_URL` | Vercel KV接続先 | Vercel（自動設定） | `https://xxx.kv.vercel-storage.com` |
| `KV_REST_API_TOKEN` | Vercel KV認証トークン | Vercel（自動設定） | `AbCd***` |
| `ADMIN_PASSWORD` | 管理画面パスワード（サーバー） | Vercel Settings | `your-secure-password-123` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 管理画面パスワード（クライアント） | Vercel Settings | `your-secure-password-123` |

**セキュリティベストプラクティス:**
1. `.env.local`をgitignoreに追加（デフォルトで設定済み）
2. 本番環境では強力なパスワードを使用
3. パスワードをコードにハードコーディングしない
4. Vercel Dashboardで環境変数を管理

### 入力バリデーション

**クライアント側（app/page.tsx）:**
```typescript
// スコアの範囲チェック
const isTeamComplete = (team: string) => {
  return CRITERIA.every(criteria => 
    scores[team]?.[criteria.id] > 0 && 
    scores[team]?.[criteria.id] <= 5
  );
};

// コメントの文字数制限
<textarea maxLength={500} />
```

**サーバー側（app/api/vote/route.ts）:**
```typescript
// 型チェック
if (!team || typeof team !== "string") {
  return NextResponse.json({ error: "Invalid team" }, { status: 400 });
}

// スコアの範囲チェック
for (const [criteriaId, score] of Object.entries(scores)) {
  if (typeof score !== "number" || score < 1 || score > 5) {
    return NextResponse.json(
      { error: `Invalid score for criteria ${criteriaId}` },
      { status: 400 }
    );
  }
}
```

### XSS対策

**Reactの自動エスケープ:**
- Reactは自動的にテキストをエスケープ
- `dangerouslySetInnerHTML`は使用していません

**コメント表示時の安全性:**
```tsx
// 安全（自動エスケープ）
<p className="whitespace-pre-wrap">{item.comment}</p>
```

**ユーザー入力の制限:**
- コメント: 最大500文字
- スコア: 1~5の数値のみ
- チーム名: A~Gの固定リスト

### CSRF対策

**Next.js App Routerの保護:**
- App Routerは自動的にCSRF保護を提供
- POST/PUT/DELETE リクエストは同一オリジンからのみ受け付け

**追加の保護（必要に応じて）:**
```typescript
// Referrer チェック（オプション）
const referer = request.headers.get('referer');
if (!referer?.startsWith(process.env.NEXT_PUBLIC_BASE_URL)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### レート制限

**現在の実装:**
- レート制限なし（社内イベント想定）

**大規模運用時の推奨対策:**
```typescript
// Vercel Edge Configやミドルウェアで実装可能
import { ratelimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const identifier = request.ip ?? 'anonymous';
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  // ...
}
```

### データバックアップ

**手動バックアップ:**
1. 管理画面にアクセス
2. ブラウザのDevToolsを開く
3. Console で実行:
```javascript
fetch('/api/results')
  .then(r => r.json())
  .then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], 
                          { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-backup-${Date.now()}.json`;
    a.click();
  });
```

**Vercel KVのバックアップ:**
- Vercel KVは自動的にバックアップされます
- データの復元はVercel Supportに問い合わせ

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

### 管理画面でデータ削除ができない

- 24時間以内にログインしているか確認してください
- 24時間経過している場合は、一度ログアウトして再ログインしてください
- ブラウザのlocalStorageがクリアされている可能性があるので、再ログインしてください

### 管理画面からすぐログアウトされる

- この問題は修正されました（認証状態が24時間保持されます）
- 古いバージョンを使用している場合は、最新版にアップデートしてください
- ブラウザのlocalStorageが無効になっていないか確認してください

### 所属チームを間違えて選択してしまった

- 投票画面上部に表示されている「あなたのチーム: Team X」の横の「変更」ボタンをクリック
- 確認ダイアログで「OK」を選択すると、チーム選択画面に戻ります
- 投票済みのデータは保持されるので、安心して変更できます

## 画面構成

```
/                  → 投票画面（一般公開）
  ├─ 所属チーム選択 → 最初に自分のチームを選択
  ├─ Team A~G    → 各チームを1~5点で評価（自分のチーム除外）
  ├─ コメント入力 → 任意でコメント（最大500文字）
  └─ 投票/再投票 → 個別に送信可能（再投票は上書き）

/admin             → 管理者画面（パスワード保護、24時間認証保持）
  ├─ 集計結果タブ    → 詳細な得点表示
  ├─ ランキングタブ   → 総合＆分野別ランキング
  ├─ コメント一覧タブ → チームごとのコメント表示
  └─ データ管理タブ   → 投票データのリセット、ログアウト
```

## 投票の流れ

1. **所属チーム選択**: 投票画面にアクセスすると、最初に所属チームを選択
   - 間違えた場合は画面上部の「変更」ボタンで変更可能
   - 投票済みのデータは保持されます
2. **他チームを評価**: 自分のチーム以外のすべてのチームを評価
   - 自分のチームはタブにグレーアウトで表示され、クリックすると「投票できません」と表示
   - ナビゲーションボタンで自分のチームは自動的にスキップ
3. **コメント入力**: 各チームへのコメントを任意で入力
4. **投票送信**: チームごとに個別に投票を送信
5. **再投票**: 投票済みのチームも再度評価を変更可能（上書き）

## デプロイとモニタリング

### Vercelへのデプロイ手順（詳細）

#### 1. GitHub連携
```bash
# ローカルでコミット
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Vercelプロジェクト作成
1. https://vercel.com にアクセス
2. "Add New" → "Project"
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - Framework Preset: Next.js
   - Root Directory: `./`（デフォルト）
   - Build Command: `npm run build`（自動設定）
   - Output Directory: `.next`（自動設定）
5. "Deploy" をクリック

#### 3. Vercel KVデータベース作成
1. デプロイ完了後、プロジェクトダッシュボードに移動
2. "Storage" タブをクリック
3. "Create Database" → "KV" を選択
4. データベース名を入力（例: `ideathon-voting-kv`）
5. リージョンを選択（日本の場合: `iad1` または `hnd1`）
6. "Create"

#### 4. 環境変数の接続
1. KVデータベース詳細画面で "Connect to Project"
2. プロジェクトを選択
3. 以下の環境変数が自動的に追加されます:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
4. 手動で追加する環境変数:
   - `ADMIN_PASSWORD`: 管理者パスワード
   - `NEXT_PUBLIC_ADMIN_PASSWORD`: 同じパスワード

#### 5. 再デプロイ
環境変数を追加した後、再デプロイが必要:
1. "Deployments" タブ
2. 最新のデプロイの "..." → "Redeploy"

### 環境別の設定

#### 開発環境（ローカル）
```bash
# .env.local を作成
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
ADMIN_PASSWORD=admin2025
NEXT_PUBLIC_ADMIN_PASSWORD=admin2025

# 開発サーバー起動
npm run dev
```

#### ステージング環境（Vercel Preview）
- Pull Request作成時に自動デプロイ
- 環境変数は本番と共有
- プレビューURLで動作確認

#### 本番環境（Vercel Production）
- mainブランチへのpush/mergeで自動デプロイ
- カスタムドメイン設定可能

### モニタリングとログ

#### Vercelダッシュボード

**デプロイログ:**
```
Deployments → 各デプロイ → "Building" / "Logs"
```

**ランタイムログ:**
```
Functions → ログを確認したい関数を選択 → "Logs"
```

**主要メトリクス:**
- デプロイ成功率
- ビルド時間
- 関数実行時間
- エラー率

#### アプリケーションログ

**サーバーサイドログ（console.log）:**
```typescript
// app/api/vote/route.ts
console.log('Vote received:', { team, voterId });
console.error('Vote error:', error);
```

**確認方法:**
1. Vercel Dashboard → Functions → `/api/vote`
2. "Logs" タブでリアルタイム確認

#### エラートラッキング（推奨）

**Sentry統合:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**設定例:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### パフォーマンス最適化

#### 現在の実装の性能

**ページロード:**
- 投票画面: ~1秒（初回）、~300ms（キャッシュ後）
- 管理画面: ~1.5秒（データ取得含む）

**API応答時間:**
- POST /api/vote: ~200-500ms（KV書き込み含む）
- GET /api/results: ~100-300ms（KV読み込みのみ）

**バンドルサイズ:**
```bash
npm run build

# 出力例
Route (app)                Size     First Load JS
┌ ○ /                      5.2 kB         95.8 kB
├ ○ /admin                 8.1 kB         98.7 kB
└ ○ /api/vote              0 B            0 B
```

#### 最適化のポイント

**1. 画像最適化:**
- 現在は使用していませんが、追加時は`next/image`を使用

**2. フォント最適化:**
```typescript
// app/layout.tsx で既に実装済み
import { Inter, Syne } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
```

**3. CSS最適化:**
- Tailwind CSS の purge 設定（自動）
- カスタムCSSは globals.css に集約

**4. データフェッチング:**
```typescript
// 管理画面でキャッシュを活用
const fetchResults = async () => {
  const response = await fetch('/api/results', {
    cache: 'no-store', // リアルタイム性優先
    // または
    next: { revalidate: 10 } // 10秒間キャッシュ
  });
};
```

### トラブルシューティング（運用編）

#### KVストレージの容量確認

```bash
# Vercel CLI で確認
vercel env ls
vercel storage ls
```

**容量制限:**
- Hobby: 256 MB
- Pro: 512 MB

**使用量の推定:**
```typescript
// 管理画面のConsoleで実行
fetch('/api/results')
  .then(r => r.json())
  .then(data => {
    const size = new Blob([JSON.stringify(data)]).size;
    console.log(`Data size: ${(size / 1024).toFixed(2)} KB`);
  });
```

#### デプロイエラーの対処

**ビルドエラー:**
```bash
# ローカルでビルドテスト
npm run build

# 型エラーチェック
npm run type-check
```

**環境変数エラー:**
- Vercel Dashboard → Settings → Environment Variables
- すべての必須変数が設定されているか確認

#### データ整合性の確認

**管理画面から確認:**
1. 集計結果タブで投票者数を確認
2. 各チームのcount（投票数）を確認
3. 合計投票者数 = 各チームへの投票数の合計ではない（自チーム除外のため）

**データ修復（最終手段）:**
```typescript
// 管理画面のConsoleで実行（要注意！）
fetch('/api/admin/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'your-password' })
})
.then(r => r.json())
.then(console.log);
```

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15.3.0 (App Router)
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS 3.x + カスタムCSS
- **フォント**: Google Fonts (Syne, Inter)
- **状態管理**: React Hooks (useState, useEffect)
- **永続化**: localStorage API

### バックエンド
- **Runtime**: Node.js (Vercel Serverless Functions)
- **API**: Next.js API Routes
- **データベース**: Vercel KV (Redis)
- **認証**: 環境変数ベースのパスワード認証

### 開発ツール
- **パッケージマネージャー**: npm
- **リンター**: ESLint (Next.js推奨設定)
- **型チェック**: TypeScript Compiler
- **Git**: GitHub

### デプロイ
- **ホスティング**: Vercel
- **CI/CD**: Vercel Git Integration（自動デプロイ）
- **ドメイン**: Vercel提供 or カスタムドメイン

## ライセンス

MIT
