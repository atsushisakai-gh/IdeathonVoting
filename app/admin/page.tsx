"use client";

import { useState, useEffect } from "react";

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

interface VoterTeamData {
  scores: {
    [criteriaId: string]: number;
  };
  comment?: string;
}

interface VoteResults {
  teams: {
    [team: string]: TeamScores;
  };
  voterScores?: {
    [voterId: string]: {
      [team: string]: VoterTeamData;
    };
  };
}

type TabType = "results" | "ranking" | "comments" | "manage";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("results");

  // 結果表示用
  const [results, setResults] = useState<VoteResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // パスワードチェック（環境変数で設定可能）
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin2025";

    if (password === adminPassword) {
      setIsAuthenticated(true);
      setMessage("");
      fetchResults();
    } else {
      setMessage("パスワードが正しくありません");
    }
  };

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const response = await fetch("/api/results");
      const data = await response.json();
      setResults(data.results || { teams: {} });
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("本当にすべての投票データをクリアしますか？この操作は取り消せません。")) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setMessage("すべての投票データをクリアしました");
        fetchResults(); // 結果を再取得
      } else {
        const data = await response.json();
        setMessage(data.error || "エラーが発生しました");
      }
    } catch (error) {
      setMessage("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            管理者ページ
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="管理者パスワードを入力"
                required
              />
            </div>

            {message && (
              <p className="text-red-600 text-sm">{message}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ログイン
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-600 hover:text-blue-800 underline text-sm">
              投票画面に戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  const teamRankings = results ? Object.entries(results.teams).map(([team, scores]) => {
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s.total, 0);
    const averageScore = Object.values(scores).reduce((sum, s) => sum + s.average, 0);
    const voteCount = Object.values(scores)[0]?.count || 0;
    return { team, totalScore, averageScore, voteCount, scores };
  }).sort((a, b) => b.totalScore - a.totalScore) : [];

  const maxScore = teamRankings[0]?.totalScore || 1;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            管理者ページ
          </h1>

          {/* タブ */}
          <div className="flex gap-2 mb-6 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("results")}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === "results"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              集計結果
            </button>
            <button
              onClick={() => setActiveTab("ranking")}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === "ranking"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              ランキング
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === "comments"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              コメント一覧
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === "manage"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              データ管理
            </button>
          </div>

          {/* 集計結果タブ */}
          {activeTab === "results" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">投票結果</h2>
                <button
                  onClick={fetchResults}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  更新
                </button>
              </div>

              {resultsLoading ? (
                <div className="text-center py-12 text-gray-600">読み込み中...</div>
              ) : teamRankings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">まだ投票がありません</div>
              ) : (
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
              )}
            </div>
          )}

          {/* ランキングタブ */}
          {activeTab === "ranking" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">ランキング</h2>

              {/* 総合ランキング */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 総合ランキング</h3>
                <div className="space-y-2">
                  {teamRankings.map(({ team, totalScore, voteCount }, index) => (
                    <div
                      key={team}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0
                          ? "bg-yellow-200 font-bold"
                          : index === 1
                          ? "bg-gray-200"
                          : index === 2
                          ? "bg-orange-100"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-600 w-8">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                        </span>
                        <span className="text-lg font-semibold">Team {team}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">{totalScore.toFixed(1)}点</div>
                        <div className="text-xs text-gray-500">({voteCount}票)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分野別ランキング */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(CRITERIA_LABELS).map(([criteriaId, label]) => {
                  const criteriaRankings = teamRankings
                    .map(({ team, scores }) => ({
                      team,
                      score: scores[criteriaId]?.total || 0,
                      average: scores[criteriaId]?.average || 0,
                      count: scores[criteriaId]?.count || 0,
                    }))
                    .sort((a, b) => b.score - a.score);

                  return (
                    <div key={criteriaId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-3">{label}</h4>
                      <div className="space-y-2">
                        {criteriaRankings.slice(0, 5).map(({ team, score, average, count }, index) => (
                          <div
                            key={team}
                            className={`flex items-center justify-between p-2 rounded ${
                              index === 0 ? "bg-blue-200 font-semibold" : "bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-600 w-6">
                                {index + 1}.
                              </span>
                              <span className="text-sm">Team {team}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-blue-600">
                                {score.toFixed(1)}点
                              </div>
                              <div className="text-xs text-gray-500">
                                平均 {average.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* コメント一覧タブ */}
          {activeTab === "comments" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">コメント一覧</h2>

              {results && Object.keys(results.teams).length > 0 ? (
                <div className="space-y-6">
                  {teamRankings.map(({ team }) => {
                    // このチームへのコメントを収集
                    const teamComments: Array<{ voterId: string; comment: string }> = [];
                    if (results.voterScores) {
                      Object.entries(results.voterScores).forEach(([voterId, voterData]) => {
                        if (voterData[team]?.comment) {
                          teamComments.push({
                            voterId: voterId.substring(0, 20) + "...",
                            comment: voterData[team].comment,
                          });
                        }
                      });
                    }

                    return (
                      <div key={team} className="border-2 border-gray-200 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Team {team}</h3>
                        {teamComments.length === 0 ? (
                          <p className="text-gray-500 italic">コメントはありません</p>
                        ) : (
                          <div className="space-y-3">
                            {teamComments.map((item, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-800 whitespace-pre-wrap">{item.comment}</p>
                                <p className="text-xs text-gray-400 mt-2">投票者ID: {item.voterId}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500">まだコメントがありません</p>
              )}
            </div>
          )}

          {/* データ管理タブ */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
                <h2 className="text-xl font-bold text-yellow-800 mb-2">
                  ⚠️ 危険な操作
                </h2>
                <p className="text-yellow-700 mb-4">
                  すべての投票データをクリアします。この操作は取り消せません。
                </p>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? "クリア中..." : "すべての投票データをクリアする"}
                </button>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes("クリアしました")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}

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
