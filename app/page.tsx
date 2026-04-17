"use client";

import { useState, useEffect } from "react";

const TEAMS = ["A", "B", "C", "D", "E", "F", "G"];

const CRITERIA = [
  { id: "sharpness", label: "課題設定の鋭さ", description: "本質的な課題を捉えているか" },
  { id: "novelty", label: "アイデアの新規性", description: "既存の延長ではない発想" },
  { id: "feasibility", label: "実現可能性・事業性", description: "絵に描いた餅で終わっていないか" },
  { id: "ai_creativity", label: "AI活用の創意工夫", description: "AIを単なる効率化以上に使えたか" },
];

type TeamScore = {
  [criteriaId: string]: number;
};

type Scores = {
  [team: string]: TeamScore;
};

type Comments = {
  [team: string]: string;
};

type VotedTeams = {
  [team: string]: boolean;
};

// 投票者IDを生成または取得
const getVoterId = (): string => {
  let voterId = localStorage.getItem("voterId");
  if (!voterId) {
    // UUID風のランダムIDを生成
    voterId = `voter_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("voterId", voterId);
  }
  return voterId;
};

export default function VotingPage() {
  const [scores, setScores] = useState<Scores>({});
  const [comments, setComments] = useState<Comments>({});
  const [votedTeams, setVotedTeams] = useState<VotedTeams>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [currentTeam, setCurrentTeam] = useState(0);
  const [voterId, setVoterId] = useState("");
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [isSelectingTeam, setIsSelectingTeam] = useState(true);

  useEffect(() => {
    // 投票者IDを取得
    const id = getVoterId();
    setVoterId(id);

    // 所属チームをlocalStorageから取得
    const savedMyTeam = localStorage.getItem("myTeam");
    if (savedMyTeam) {
      setMyTeam(savedMyTeam);
      setIsSelectingTeam(false);
    }

    // 投票済みチームをlocalStorageから読み込み
    const voted: VotedTeams = {};
    TEAMS.forEach(team => {
      const hasVoted = localStorage.getItem(`voted_${team}`) === "true";
      voted[team] = hasVoted;
    });
    setVotedTeams(voted);

    // スコアとコメントの初期化
    const initialScores: Scores = {};
    const initialComments: Comments = {};
    TEAMS.forEach(team => {
      initialScores[team] = {};
      initialComments[team] = "";
      CRITERIA.forEach(criteria => {
        initialScores[team][criteria.id] = 0;
      });
    });
    setScores(initialScores);
    setComments(initialComments);

    // 未投票のチームを探して表示（自分のチーム以外）
    if (savedMyTeam) {
      const firstUnvotedIndex = TEAMS.findIndex(t => !voted[t] && t !== savedMyTeam);
      if (firstUnvotedIndex !== -1) {
        setCurrentTeam(firstUnvotedIndex);
      }
    }
  }, []);

  const handleScoreChange = (team: string, criteriaId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [criteriaId]: score,
      },
    }));
  };

  const handleCommentChange = (team: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [team]: comment,
    }));
  };

  const isTeamComplete = (team: string) => {
    return CRITERIA.every(criteria => scores[team]?.[criteria.id] > 0);
  };

  const handleSelectMyTeam = (team: string) => {
    setMyTeam(team);
    localStorage.setItem("myTeam", team);
    setIsSelectingTeam(false);

    // 自分のチーム以外の最初のチームに移動
    const firstOtherTeamIndex = TEAMS.findIndex(t => t !== team);
    if (firstOtherTeamIndex !== -1) {
      setCurrentTeam(firstOtherTeamIndex);
    }
  };

  const allTeamsVoted = () => {
    // 自分のチーム以外すべてに投票済みか
    return TEAMS.filter(t => t !== myTeam).every(team => votedTeams[team]);
  };

  const handleSubmitTeam = async (team: string) => {
    if (!isTeamComplete(team)) {
      setMessage("すべての観点を評価してください（1~5点で入力）");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          scores: scores[team],
          voterId,
          comment: comments[team] || undefined
        }),
      });

      if (response.ok) {
        // localStorageに保存
        localStorage.setItem(`voted_${team}`, "true");
        setVotedTeams(prev => ({ ...prev, [team]: true }));

        const isRevote = votedTeams[team];
        setMessage(isRevote
          ? `Team ${team} への再投票が完了しました！`
          : `Team ${team} への投票が完了しました！`
        );

        // 次の未投票チームに移動（初回投票の場合のみ、自分のチーム除外）
        if (!isRevote) {
          const nextUnvotedIndex = TEAMS.findIndex((t, i) =>
            i > currentTeam && !votedTeams[t] && t !== team && t !== myTeam
          );

          if (nextUnvotedIndex !== -1) {
            setTimeout(() => {
              setCurrentTeam(nextUnvotedIndex);
              setMessage("");
            }, 1500);
          }
        }
      } else {
        setMessage("エラーが発生しました。もう一度お試しください。");
      }
    } catch (error) {
      setMessage("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // チーム選択画面
  if (isSelectingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            社内AIアイデアソン投票
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            まず、あなたの所属チームを選択してください
          </p>

          <div className="space-y-3">
            {TEAMS.map((t) => (
              <button
                key={t}
                onClick={() => handleSelectMyTeam(t)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <span className="text-xl font-semibold text-gray-800">Team {t}</span>
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            ※自分のチームには投票できません
          </p>
        </div>
      </div>
    );
  }

  const team = TEAMS[currentTeam];
  const isMyTeam = team === myTeam;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">
            社内AIアイデアソン投票
          </h1>
          <p className="text-gray-600 mb-6 text-center text-sm md:text-base">
            各チームを4つの観点で1~5点で評価してください
          </p>

          {/* チーム選択タブ */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {TEAMS.map((t, index) => (
              <button
                key={t}
                onClick={() => setCurrentTeam(index)}
                className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                  currentTeam === index
                    ? "bg-blue-600 text-white"
                    : t === myTeam
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : votedTeams[t]
                    ? "bg-green-100 text-green-800 border-2 border-green-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Team {t}
                {t === myTeam && " (あなたのチーム)"}
                {votedTeams[t] && currentTeam !== index && " ✓"}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {isMyTeam ? (
              <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">
                  Team {team} (あなたのチーム)
                </h2>
                <p className="text-gray-600">
                  自分のチームには投票できません
                </p>
              </div>
            ) : (
              <>
                <div className={`rounded-lg p-6 ${votedTeams[team] ? "bg-green-50 border-2 border-green-500" : "bg-blue-50"}`}>
                  <div className="flex items-center justify-center gap-3 mb-6">
                    {votedTeams[team] && <span className="text-3xl">✓</span>}
                    <h2 className="text-2xl font-bold text-center" style={{ color: votedTeams[team] ? "#166534" : "#1e3a8a" }}>
                      Team {team}
                      {votedTeams[team] && <span className="text-base ml-2 font-normal">(投票済み)</span>}
                    </h2>
                  </div>

                  {votedTeams[team] && (
                    <p className="text-center text-green-700 mb-4 text-sm">
                      評価を変更して再投票できます
                    </p>
                  )}

              <div className="space-y-6">
                {CRITERIA.map((criteria) => (
                  <div key={criteria.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {criteria.label}
                      </h3>
                      <p className="text-sm text-gray-600">{criteria.description}</p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreChange(team, criteria.id, score)}
                          className={`w-12 h-12 rounded-lg font-bold text-lg transition ${
                            scores[team]?.[criteria.id] === score
                              ? "bg-blue-600 text-white shadow-lg scale-110"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* コメント入力欄 */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  コメント（任意）
                </label>
                <textarea
                  value={comments[team] || ""}
                  onChange={(e) => handleCommentChange(team, e.target.value)}
                  placeholder="このチームへのコメントや感想を入力できます"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {comments[team]?.length || 0} / 500文字
                </p>
              </div>
            </div>

                {/* このチームに投票ボタン */}
                <button
                  onClick={() => handleSubmitTeam(team)}
                  disabled={isSubmitting || !isTeamComplete(team)}
                  className={`w-full py-4 text-white text-lg rounded-lg font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed ${
                    votedTeams[team]
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSubmitting
                    ? "送信中..."
                    : votedTeams[team]
                      ? `Team ${team} に再投票する`
                      : `Team ${team} に投票する`
                  }
                </button>
              </>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex gap-4 justify-between">
              <button
                type="button"
                onClick={() => {
                  // 前のチームに移動（自分のチームはスキップ）
                  let prevIndex = currentTeam - 1;
                  while (prevIndex >= 0 && TEAMS[prevIndex] === myTeam) {
                    prevIndex--;
                  }
                  if (prevIndex >= 0) {
                    setCurrentTeam(prevIndex);
                  }
                }}
                disabled={currentTeam === 0 || (currentTeam === 1 && TEAMS[0] === myTeam)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← 前のチーム
              </button>

              <button
                type="button"
                onClick={() => {
                  // 次のチームに移動（自分のチームはスキップ）
                  let nextIndex = currentTeam + 1;
                  while (nextIndex < TEAMS.length && TEAMS[nextIndex] === myTeam) {
                    nextIndex++;
                  }
                  if (nextIndex < TEAMS.length) {
                    setCurrentTeam(nextIndex);
                  }
                }}
                disabled={currentTeam === TEAMS.length - 1 || (currentTeam === TEAMS.length - 2 && TEAMS[TEAMS.length - 1] === myTeam)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次のチーム →
              </button>
            </div>

            {message && (
              <p className={`text-center font-medium ${message.includes("エラー") || message.includes("すべて") ? "text-red-600" : "text-green-600"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
