import { kv } from "@vercel/kv";

interface CriteriaScore {
  total: number;
  count: number;
  average: number;
}

interface TeamScores {
  [criteriaId: string]: CriteriaScore;
}

interface VoteData {
  teams: {
    [team: string]: TeamScores;
  };
}

// メモリストレージ（開発環境用のフォールバック）
let memoryStorage: VoteData = {
  teams: {},
};

// Vercel KVが利用可能かチェック
const isKVAvailable = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};

export async function getVotes(): Promise<VoteData> {
  if (isKVAvailable()) {
    try {
      const votes = await kv.get<VoteData>("votes");
      return votes || { teams: {} };
    } catch (error) {
      console.error("Failed to get votes from KV:", error);
      return memoryStorage;
    }
  }

  return memoryStorage;
}

export async function addVote(team: string, teamScores: Record<string, number>): Promise<void> {
  const votes = await getVotes();

  // チームのデータを初期化（まだない場合）
  if (!votes.teams[team]) {
    votes.teams[team] = {};
  }

  // 各観点のスコアを集計
  Object.entries(teamScores).forEach(([criteriaId, score]) => {
    if (!votes.teams[team][criteriaId]) {
      votes.teams[team][criteriaId] = {
        total: 0,
        count: 0,
        average: 0,
      };
    }

    const criteria = votes.teams[team][criteriaId];
    criteria.total += score;
    criteria.count += 1;
    criteria.average = criteria.total / criteria.count;
  });

  if (isKVAvailable()) {
    try {
      await kv.set("votes", votes);
    } catch (error) {
      console.error("Failed to save votes to KV:", error);
      // フォールバックとしてメモリに保存
      memoryStorage = votes;
    }
  } else {
    memoryStorage = votes;
  }
}

export async function resetVotes(): Promise<void> {
  const emptyVotes = { teams: {} };

  if (isKVAvailable()) {
    try {
      await kv.set("votes", emptyVotes);
    } catch (error) {
      console.error("Failed to reset votes in KV:", error);
    }
  }

  memoryStorage = emptyVotes;
}
