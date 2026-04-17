// シンプルなストレージインターフェース
// 開発環境ではメモリストレージ、本番環境ではVercel KVを使用

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

// メモリストレージ（開発用）
let memoryStorage: VoteData = {
  teams: {},
};

export async function getVotes(): Promise<VoteData> {
  // 本番環境でVercel KVを使う場合は以下のようにする
  // if (process.env.KV_REST_API_URL) {
  //   const kv = createClient({...});
  //   return await kv.get('votes') || { teams: {} };
  // }

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

  // 本番環境でVercel KVを使う場合
  // if (process.env.KV_REST_API_URL) {
  //   await kv.set('votes', votes);
  // }

  memoryStorage = votes;
}

export async function resetVotes(): Promise<void> {
  memoryStorage = {
    teams: {},
  };

  // 本番環境でVercel KVを使う場合
  // if (process.env.KV_REST_API_URL) {
  //   await kv.set('votes', { teams: {} });
  // }
}
