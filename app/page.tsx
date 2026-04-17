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

type VotedTeams = {
  [team: string]: boolean;
};

export default function VotingPage() {
  const [scores, setScores] = useState<Scores>({});
  const [votedTeams, setVotedTeams] = useState<VotedTeams>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [currentTeam, setCurrentTeam] = useState(0);

  useEffect(() => {
    // 投票済みチームをlocalStorageから読み込み
    const voted: VotedTeams = {};
    TEAMS.forEach(team => {
      const hasVoted = localStorage.getItem(`voted_${team}`) === "true";
      voted[team] = hasVoted;
    });
    setVotedTeams(voted);

    // スコアの初期化
    const initialScores: Scores = {};
    TEAMS.forEach(team => {
      initialScores[team] = {};
      CRITERIA.forEach(criteria => {
        initialScores[team][criteria.id] = 0;
      });
    });
    setScores(initialScores);

    // 未投票のチームを探して表示
    const firstUnvotedIndex = TEAMS.findIndex(t => !voted[t]);
    if (firstUnvotedIndex !== -1) {
      setCurrentTeam(firstUnvotedIndex);
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

  const isTeamComplete = (team: string) => {
    return CRITERIA.every(criteria => scores[team]?.[criteria.id] > 0);
  };

  const allTeamsVoted = () => {
    return TEAMS.every(team => votedTeams[team]);
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
          scores: scores[team]
        }),
      });

      if (response.ok) {
        // localStorageに保存
        localStorage.setItem(`voted_${team}`, "true");
        setVotedTeams(prev => ({ ...prev, [team]: true }));
        setMessage(`Team ${team} への投票が完了しました！`);

        // 次の未投票チームに移動
        const nextUnvotedIndex = TEAMS.findIndex((t, i) =>
          i > currentTeam && !votedTeams[t] && t !== team
        );

        if (nextUnvotedIndex !== -1) {
          setTimeout(() => {
            setCurrentTeam(nextUnvotedIndex);
            setMessage("");
          }, 1500);
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

  if (allTeamsVoted()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">すべての投票完了</h1>
          <p className="text-gray-600 mb-2">すべてのチームへの投票が完了しました！</p>
          <p className="text-gray-600 mb-6">ご協力ありがとうございました。</p>
          <a
            href="/results"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            集計結果を見る
          </a>
        </div>
      </div>
    );
  }

  const team = TEAMS[currentTeam];

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
                    : votedTeams[t]
                    ? "bg-green-100 text-green-800 border-2 border-green-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Team {t}
                {votedTeams[t] && currentTeam !== index && " ✓"}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {votedTeams[team] ? (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Team {team} への投票完了
                </h2>
                <p className="text-green-700">
                  このチームへの投票は完了しています
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
                    Team {team}
                  </h2>

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
                </div>

                {/* このチームに投票ボタン */}
                <button
                  onClick={() => handleSubmitTeam(team)}
                  disabled={isSubmitting || !isTeamComplete(team)}
                  className="w-full py-4 bg-green-600 text-white text-lg rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? "送信中..." : `Team ${team} に投票する`}
                </button>
              </>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex gap-4 justify-between">
              <button
                type="button"
                onClick={() => setCurrentTeam(Math.max(0, currentTeam - 1))}
                disabled={currentTeam === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← 前のチーム
              </button>

              <button
                type="button"
                onClick={() => setCurrentTeam(Math.min(TEAMS.length - 1, currentTeam + 1))}
                disabled={currentTeam === TEAMS.length - 1}
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

          <div className="mt-6 text-center">
            <a
              href="/results"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              集計結果を見る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
