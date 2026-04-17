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
  voteCount: number;
}

interface UserScores {
  [team: string]: {
    [criteriaId: string]: number;
  };
}

// メモリストレージ（開発用）
let memoryStorage: VoteData = {
  teams: {},
  voteCount: 0,
};

export async function getVotes(): Promise<VoteData> {
  // 本番環境でVercel KVを使う場合は以下のようにする
  // if (process.env.KV_REST_API_URL) {
  //   const kv = createClient({...});
  //   return await kv.get('votes') || { teams: {}, voteCount: 0 };
  // }

  return memoryStorage;
}

export async function addVote(scores: UserScores): Promise<void> {
  const votes = await getVotes();

  // 各チーム、各観点のスコアを集計
  Object.entries(scores).forEach(([team, teamScores]) => {
    if (!votes.teams[team]) {
      votes.teams[team] = {};
    }

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
  });

  votes.voteCount += 1;

  // 本番環境でVercel KVを使う場合
  // if (process.env.KV_REST_API_URL) {
  //   await kv.set('votes', votes);
  // }

  memoryStorage = votes;
}

export async function resetVotes(): Promise<void> {
  memoryStorage = {
    teams: {},
    voteCount: 0,
  };

  // 本番環境でVercel KVを使う場合
  // if (process.env.KV_REST_API_URL) {
  //   await kv.set('votes', { teams: {}, voteCount: 0 });
  // }
}
