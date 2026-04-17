"use client";

import { useState, useEffect } from "react";

const TEAMS = ["A", "B", "C", "D", "E", "F", "G"];

const CRITERIA = [
  { id: "sharpness", label: "課題設定の鋭さ", description: "本質的な課題を捉えているか" },
  { id: "novelty", label: "アイデアの新規性", description: "既存の延長ではない発想" },
  { id: "feasibility", label: "実現可能性・事業性", description: "絵に描いた餅で終わっていないか" },
  { id: "ai_creativity", label: "AI活用の創意工夫", description: "AIを単なる効率化以上に使えたか" },
];

type Scores = {
  [team: string]: {
    [criteriaId: string]: number;
  };
};

export default function VotingPage() {
  const [scores, setScores] = useState<Scores>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [currentTeam, setCurrentTeam] = useState(0);

  useEffect(() => {
    const voted = localStorage.getItem("hasVoted");
    if (voted === "true") {
      setHasVoted(true);
    }

    const initialScores: Scores = {};
    TEAMS.forEach(team => {
      initialScores[team] = {};
      CRITERIA.forEach(criteria => {
        initialScores[team][criteria.id] = 0;
      });
    });
    setScores(initialScores);
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

  const allTeamsComplete = () => {
    return TEAMS.every(team => isTeamComplete(team));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allTeamsComplete()) {
      setMessage("すべてのチームの評価を完了してください（1~5点で入力）");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });

      if (response.ok) {
        localStorage.setItem("hasVoted", "true");
        setHasVoted(true);
        setMessage("投票ありがとうございました！");
      } else {
        setMessage("エラーが発生しました。もう一度お試しください。");
      }
    } catch (error) {
      setMessage("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">投票完了</h1>
          <p className="text-gray-600 mb-6">投票ありがとうございました！</p>
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
                    : isTeamComplete(t)
                    ? "bg-green-100 text-green-800 border-2 border-green-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Team {t}
                {isTeamComplete(t) && currentTeam !== index && " ✓"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

              {currentTeam < TEAMS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentTeam(Math.min(TEAMS.length - 1, currentTeam + 1))}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  次のチーム →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !allTeamsComplete()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "送信中..." : "投票を完了する"}
                </button>
              )}
            </div>

            {message && (
              <p className={`text-center font-medium ${message.includes("エラー") || message.includes("すべて") ? "text-red-600" : "text-green-600"}`}>
                {message}
              </p>
            )}
          </form>

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
