"use client";

import { useEffect, useState } from "react";

const CRITERIA_LABELS = {
  sharpness: "課題設定の鋭さ",
  novelty: "アイデアの新規性",
  feasibility: "実現可能性・事業性",
  ai_creativity: "AI活用の創意工夫",
};

interface TeamScores {
  [criteriaId: string]: {
    total: number;
    count: number;
    average: number;
  };
}

interface VoteResults {
  teams: {
    [team: string]: TeamScores;
  };
}

export default function ResultsPage() {
  const [results, setResults] = useState<VoteResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/results");
      const data = await response.json();
      setResults(data.results || { teams: {} });
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!results || Object.keys(results.teams).length === 0) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              投票結果
            </h1>
            <p className="text-center text-gray-500">まだ投票がありません</p>
            <div className="mt-8 text-center">
              <a
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                投票画面に戻る
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const teamRankings = Object.entries(results.teams).map(([team, scores]) => {
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s.total, 0);
    const averageScore = Object.values(scores).reduce((sum, s) => sum + s.average, 0);
    const voteCount = Object.values(scores)[0]?.count || 0;
    return { team, totalScore, averageScore, voteCount, scores };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const maxScore = teamRankings[0]?.totalScore || 1;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">
            投票結果
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            リアルタイム集計
          </p>

          <div className="space-y-4">
            {teamRankings.map(({ team, totalScore, averageScore, voteCount, scores }, index) => {
              const percentage = (totalScore / maxScore) * 100;
              const isWinner = index === 0;

              return (
                <div
                  key={team}
                  className={`border-2 rounded-lg p-4 md:p-6 ${
                    isWinner ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`text-3xl md:text-4xl font-bold ${
                        isWinner ? "text-yellow-600" : "text-gray-400"
                      }`}
                    >
                      {isWinner ? "🏆" : `#${index + 1}`}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        Team {team}
                      </h2>
                      <p className="text-sm text-gray-600">
                        平均: {averageScore.toFixed(2)}点 ({voteCount}票)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600">
                        {totalScore.toFixed(1)}点
                      </div>
                      <div className="text-xs text-gray-500">
                        合計スコア
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        isWinner ? "bg-yellow-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {Object.entries(scores).map(([criteriaId, data]) => (
                      <div
                        key={criteriaId}
                        className="bg-white rounded p-3 border border-gray-200"
                      >
                        <div className="text-sm font-semibold text-gray-700">
                          {CRITERIA_LABELS[criteriaId as keyof typeof CRITERIA_LABELS]}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-blue-600">
                            {data.average.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (合計: {data.total.toFixed(1)}点)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center space-x-4">
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              投票画面に戻る
            </a>
            <button
              onClick={fetchResults}
              className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              更新
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
