import { kv } from "@vercel/kv";

interface CriteriaScore {
  total: number;
  count: number;
  average: number;
}

interface TeamScores {
  [criteriaId: string]: CriteriaScore;
}

interface VoterTeamData {
  scores: {
    [criteriaId: string]: number;
  };
  comment?: string;
}

interface VoteData {
  teams: {
    [team: string]: TeamScores;
  };
  // 投票者ごとの投票記録（voterId -> team -> { scores, comment }）
  voterScores: {
    [voterId: string]: {
      [team: string]: VoterTeamData;
    };
  };
}

// メモリストレージ（開発環境用のフォールバック）
let memoryStorage: VoteData = {
  teams: {},
  voterScores: {},
};

// Vercel KVが利用可能かチェック
const isKVAvailable = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};

export async function getVotes(): Promise<VoteData> {
  if (isKVAvailable()) {
    try {
      const votes = await kv.get<VoteData>("votes");
      return votes || { teams: {}, voterScores: {} };
    } catch (error) {
      console.error("Failed to get votes from KV:", error);
      return memoryStorage;
    }
  }

  return memoryStorage;
}

export async function addVote(
  team: string,
  teamScores: Record<string, number>,
  voterId: string,
  comment?: string
): Promise<void> {
  const votes = await getVotes();

  // チームのデータを初期化（まだない場合）
  if (!votes.teams[team]) {
    votes.teams[team] = {};
  }

  // 投票者のデータを初期化
  if (!votes.voterScores[voterId]) {
    votes.voterScores[voterId] = {};
  }

  // 以前の投票があれば、それを引く（再投票の場合）
  const previousVote = votes.voterScores[voterId][team];
  if (previousVote?.scores) {
    Object.entries(previousVote.scores).forEach(([criteriaId, oldScore]) => {
      if (votes.teams[team][criteriaId]) {
        const criteria = votes.teams[team][criteriaId];
        criteria.total -= oldScore;
        criteria.count -= 1;
        if (criteria.count > 0) {
          criteria.average = criteria.total / criteria.count;
        }
      }
    });
  }

  // 新しいスコアを加算
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

  // 投票者の記録を更新
  votes.voterScores[voterId][team] = {
    scores: teamScores,
    comment: comment || undefined,
  };

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
  const emptyVotes = { teams: {}, voterScores: {} };

  if (isKVAvailable()) {
    try {
      await kv.set("votes", emptyVotes);
    } catch (error) {
      console.error("Failed to reset votes in KV:", error);
    }
  }

  memoryStorage = emptyVotes;
}
