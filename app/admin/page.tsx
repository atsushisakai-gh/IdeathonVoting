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

interface VoterInfo {
  myTeam?: string;
  votes: {
    [team: string]: VoterTeamData;
  };
}

interface VoteResults {
  teams: {
    [team: string]: TeamScores;
  };
  voterScores?: {
    [voterId: string]: VoterInfo;
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

  // 認証状態の復元
  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth");
    if (adminAuth) {
      try {
        const { timestamp, password: savedPassword } = JSON.parse(adminAuth);
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin2025";

        // 24時間以内かつパスワードが一致する場合のみ認証を維持
        const hoursSinceAuth = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSinceAuth < 24 && savedPassword === adminPassword) {
          setIsAuthenticated(true);
          fetchResults();
        } else {
          localStorage.removeItem("adminAuth");
        }
      } catch (error) {
        localStorage.removeItem("adminAuth");
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // パスワードチェック（環境変数で設定可能）
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin2025";

    if (password === adminPassword) {
      setIsAuthenticated(true);
      setMessage("");

      // 認証状態を保存（24時間有効）
      localStorage.setItem("adminAuth", JSON.stringify({
        timestamp: Date.now(),
        password: adminPassword
      }));

      fetchResults();
    } else {
      setMessage("パスワードが正しくありません");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("adminAuth");
    setPassword("");
    setResults(null);
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
      // localStorageから保存されているパスワードを取得
      let adminPassword = password;
      if (!adminPassword) {
        const adminAuth = localStorage.getItem("adminAuth");
        if (adminAuth) {
          const { password: savedPassword } = JSON.parse(adminAuth);
          adminPassword = savedPassword;
        }
      }

      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
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
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="max-w-md w-full animate-scale-in">
          <div className="card-neon p-10">
            <h1 className="text-4xl font-bold mb-8 text-center glow-text" style={{ color: 'var(--color-neon-magenta)' }}>
              管理者ページ
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-neon"
                  placeholder="管理者パスワードを入力"
                  required
                />
              </div>

              {message && (
                <p className="text-[var(--color-neon-magenta)] text-sm p-3 rounded-lg" style={{
                  background: 'rgba(255, 0, 110, 0.1)',
                  border: '1px solid var(--color-neon-magenta)',
                }}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 text-lg"
              >
                ログイン
              </button>
            </form>

            <div className="mt-8 text-center">
              <a href="/" className="text-[var(--color-neon-cyan)] hover:glow-text transition text-sm">
                投票画面に戻る →
              </a>
            </div>
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
    <div className="min-h-screen py-8 px-4 relative z-10">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="card-neon p-6 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold glow-text" style={{ color: 'var(--color-neon-magenta)' }}>
              管理者ページ
            </h1>
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255, 0, 110, 0.1)',
                border: '2px solid var(--color-neon-magenta)',
                color: 'var(--color-neon-magenta)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-neon-magenta)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 110, 0.1)';
                e.currentTarget.style.color = 'var(--color-neon-magenta)';
              }}
            >
              ログアウト
            </button>
          </div>

          {/* タブ */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2" style={{ borderBottom: '2px solid rgba(0, 245, 255, 0.1)' }}>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                activeTab === "results" ? "glow-text" : ""
              }`}
              style={{
                color: activeTab === "results" ? 'var(--color-neon-cyan)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === "results" ? '3px solid var(--color-neon-cyan)' : 'none',
              }}
            >
              集計結果
            </button>
            <button
              onClick={() => setActiveTab("ranking")}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                activeTab === "ranking" ? "glow-text" : ""
              }`}
              style={{
                color: activeTab === "ranking" ? 'var(--color-neon-cyan)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === "ranking" ? '3px solid var(--color-neon-cyan)' : 'none',
              }}
            >
              ランキング
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                activeTab === "comments" ? "glow-text" : ""
              }`}
              style={{
                color: activeTab === "comments" ? 'var(--color-neon-cyan)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === "comments" ? '3px solid var(--color-neon-cyan)' : 'none',
              }}
            >
              コメント一覧
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                activeTab === "manage" ? "glow-text" : ""
              }`}
              style={{
                color: activeTab === "manage" ? 'var(--color-neon-cyan)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === "manage" ? '3px solid var(--color-neon-cyan)' : 'none',
              }}
            >
              データ管理
            </button>
          </div>

          {/* 集計結果タブ */}
          {activeTab === "results" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold glow-text" style={{ color: 'var(--color-neon-cyan)' }}>投票結果</h2>
                  {results?.voterScores && (() => {
                    const totalVoters = Object.keys(results.voterScores).length;
                    const TEAMS = ["A", "B", "C", "D", "E", "F", "G"];
                    const votersByTeam: { [team: string]: number } = {};
                    TEAMS.forEach(team => votersByTeam[team] = 0);
                    let unknownCount = 0;

                    Object.values(results.voterScores).forEach(voterInfo => {
                      if (voterInfo.myTeam && TEAMS.includes(voterInfo.myTeam)) {
                        votersByTeam[voterInfo.myTeam]++;
                      } else {
                        unknownCount++;
                      }
                    });

                    return (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          合計投票者数: <span className="font-bold glow-text" style={{ color: 'var(--color-neon-yellow)' }}>
                            {totalVoters}人
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {TEAMS.map(team => (
                            votersByTeam[team] > 0 && (
                              <span key={team} className="text-xs px-2 py-1 rounded" style={{
                                background: 'rgba(0, 245, 255, 0.1)',
                                border: '1px solid rgba(0, 245, 255, 0.3)',
                                color: 'var(--color-neon-cyan)'
                              }}>
                                Team {team}: {votersByTeam[team]}人
                              </span>
                            )
                          ))}
                          {unknownCount > 0 && (
                            <span className="text-xs px-2 py-1 rounded" style={{
                              background: 'rgba(160, 168, 201, 0.1)',
                              border: '1px solid rgba(160, 168, 201, 0.3)',
                              color: 'var(--color-text-secondary)'
                            }}>
                              所属不明: {unknownCount}人
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={fetchResults}
                  className="px-5 py-2 rounded-xl font-semibold transition-all"
                  style={{
                    background: 'var(--color-dark-surface)',
                    border: '2px solid rgba(0, 245, 255, 0.2)',
                    color: 'var(--color-neon-cyan)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-neon-cyan)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow-cyan)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  更新
                </button>
              </div>

              {resultsLoading ? (
                <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>読み込み中...</div>
              ) : teamRankings.length === 0 ? (
                <div className="text-center py-12 rounded-xl" style={{
                  background: 'var(--color-dark-surface)',
                  color: 'var(--color-text-secondary)',
                  border: '2px solid rgba(0, 245, 255, 0.1)'
                }}>
                  まだ投票がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {teamRankings.map(({ team, totalScore, averageScore, voteCount, scores }, index) => {
                    const percentage = (totalScore / maxScore) * 100;
                    const isWinner = index === 0;

                    return (
                      <div
                        key={team}
                        className="rounded-xl p-4 md:p-6 border-2 animate-slide-up"
                        style={{
                          background: isWinner ? 'rgba(255, 190, 11, 0.05)' : 'var(--color-dark-surface)',
                          borderColor: isWinner ? 'var(--color-neon-yellow)' : 'rgba(0, 245, 255, 0.1)',
                          animationDelay: `${index * 0.1}s`
                        }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-3xl md:text-4xl font-bold glow-text" style={{
                            color: isWinner ? 'var(--color-neon-yellow)' : 'var(--color-text-muted)'
                          }}>
                            {isWinner ? "🏆" : `#${index + 1}`}
                          </span>
                          <div className="flex-1">
                            <h2 className="text-xl md:text-2xl font-bold glow-text" style={{
                              color: isWinner ? 'var(--color-neon-yellow)' : 'var(--color-neon-cyan)'
                            }}>
                              Team {team}
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              平均: {averageScore.toFixed(2)}点 ({voteCount}票)
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl md:text-3xl font-bold glow-text" style={{
                              color: isWinner ? 'var(--color-neon-yellow)' : 'var(--color-neon-cyan)'
                            }}>
                              {totalScore.toFixed(1)}点
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              合計スコア
                            </div>
                          </div>
                        </div>

                        <div className="w-full rounded-full h-4 mb-4" style={{
                          background: 'var(--color-dark-base)'
                        }}>
                          <div
                            className="h-4 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              background: isWinner ? 'var(--color-neon-yellow)' : 'var(--gradient-primary)',
                              boxShadow: isWinner ? '0 0 10px var(--color-neon-yellow)' : 'var(--shadow-glow-cyan)'
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {Object.entries(scores).map(([criteriaId, data]) => (
                            <div
                              key={criteriaId}
                              className="rounded p-3 border"
                              style={{
                                background: 'var(--color-dark-base)',
                                borderColor: 'rgba(0, 245, 255, 0.1)'
                              }}
                            >
                              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {CRITERIA_LABELS[criteriaId as keyof typeof CRITERIA_LABELS]}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold glow-text" style={{ color: 'var(--color-neon-cyan)' }}>
                                  {data.average.toFixed(2)}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
              <h2 className="text-xl font-bold glow-text" style={{ color: 'var(--color-neon-cyan)' }}>ランキング</h2>

              {/* 総合ランキング */}
              <div className="rounded-xl p-6 border-2 animate-slide-up" style={{
                background: 'rgba(255, 190, 11, 0.05)',
                borderColor: 'var(--color-neon-yellow)',
              }}>
                <h3 className="text-lg font-bold glow-text mb-4" style={{ color: 'var(--color-neon-yellow)' }}>
                  🏆 総合ランキング
                </h3>
                <div className="space-y-2">
                  {teamRankings.map(({ team, totalScore, voteCount }, index) => (
                    <div
                      key={team}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        background: index === 0
                          ? 'rgba(255, 190, 11, 0.2)'
                          : index === 1
                          ? 'rgba(192, 192, 192, 0.1)'
                          : index === 2
                          ? 'rgba(205, 127, 50, 0.1)'
                          : 'var(--color-dark-base)',
                        border: index < 3 ? '1px solid rgba(255, 190, 11, 0.3)' : '1px solid rgba(0, 245, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold w-8" style={{
                          color: index < 3 ? 'var(--color-neon-yellow)' : 'var(--color-text-muted)'
                        }}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                        </span>
                        <span className="text-lg font-semibold glow-text" style={{
                          color: index === 0 ? 'var(--color-neon-yellow)' : 'var(--color-neon-cyan)'
                        }}>
                          Team {team}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold glow-text" style={{
                          color: index === 0 ? 'var(--color-neon-yellow)' : 'var(--color-neon-cyan)'
                        }}>
                          {totalScore.toFixed(1)}点
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          ({voteCount}票)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分野別ランキング */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(CRITERIA_LABELS).map(([criteriaId, label], idx) => {
                  const criteriaRankings = teamRankings
                    .map(({ team, scores }) => ({
                      team,
                      score: scores[criteriaId]?.total || 0,
                      average: scores[criteriaId]?.average || 0,
                      count: scores[criteriaId]?.count || 0,
                    }))
                    .sort((a, b) => b.score - a.score);

                  return (
                    <div key={criteriaId} className="rounded-xl p-4 border-2 animate-slide-up" style={{
                      background: 'var(--color-dark-surface)',
                      borderColor: 'rgba(0, 245, 255, 0.2)',
                      animationDelay: `${idx * 0.1}s`
                    }}>
                      <h4 className="font-bold glow-text mb-3" style={{ color: 'var(--color-neon-cyan)' }}>
                        {label}
                      </h4>
                      <div className="space-y-2">
                        {criteriaRankings.slice(0, 5).map(({ team, score, average, count }, index) => (
                          <div
                            key={team}
                            className="flex items-center justify-between p-2 rounded"
                            style={{
                              background: index === 0 ? 'rgba(0, 245, 255, 0.1)' : 'var(--color-dark-base)',
                              border: index === 0 ? '1px solid rgba(0, 245, 255, 0.3)' : '1px solid rgba(0, 245, 255, 0.05)',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold w-6" style={{
                                color: index === 0 ? 'var(--color-neon-cyan)' : 'var(--color-text-muted)'
                              }}>
                                {index + 1}.
                              </span>
                              <span className="text-sm" style={{
                                color: index === 0 ? 'var(--color-neon-cyan)' : 'var(--color-text-primary)',
                                fontWeight: index === 0 ? 600 : 400
                              }}>
                                Team {team}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold" style={{
                                color: index === 0 ? 'var(--color-neon-cyan)' : 'var(--color-text-primary)'
                              }}>
                                {score.toFixed(1)}点
                              </div>
                              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
              <h2 className="text-xl font-bold glow-text" style={{ color: 'var(--color-neon-cyan)' }}>コメント一覧</h2>

              {results && Object.keys(results.teams).length > 0 ? (
                <div className="space-y-6">
                  {teamRankings.map(({ team }, index) => {
                    // このチームへのコメントを収集
                    const teamComments: Array<{ voterId: string; comment: string }> = [];
                    if (results.voterScores) {
                      Object.entries(results.voterScores).forEach(([voterId, voterInfo]) => {
                        if (voterInfo.votes[team]?.comment) {
                          teamComments.push({
                            voterId: voterId.substring(0, 20) + "...",
                            comment: voterInfo.votes[team].comment,
                          });
                        }
                      });
                    }

                    return (
                      <div key={team} className="rounded-xl p-6 border-2 animate-slide-up" style={{
                        background: 'var(--color-dark-surface)',
                        borderColor: 'rgba(0, 245, 255, 0.2)',
                        animationDelay: `${index * 0.1}s`
                      }}>
                        <h3 className="text-xl font-bold glow-text mb-4" style={{ color: 'var(--color-neon-cyan)' }}>
                          Team {team}
                        </h3>
                        {teamComments.length === 0 ? (
                          <p className="italic" style={{ color: 'var(--color-text-muted)' }}>コメントはありません</p>
                        ) : (
                          <div className="space-y-3">
                            {teamComments.map((item, idx) => (
                              <div key={idx} className="rounded-lg p-4" style={{
                                background: 'var(--color-dark-base)',
                                border: '1px solid rgba(0, 245, 255, 0.1)'
                              }}>
                                <p className="whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                                  {item.comment}
                                </p>
                                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                  投票者ID: {item.voterId}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl" style={{
                  background: 'var(--color-dark-surface)',
                  color: 'var(--color-text-secondary)',
                  border: '2px solid rgba(0, 245, 255, 0.1)'
                }}>
                  まだコメントがありません
                </div>
              )}
            </div>
          )}

          {/* データ管理タブ */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              <div className="rounded-xl p-6 border-2 animate-slide-up" style={{
                background: 'rgba(255, 190, 11, 0.05)',
                borderColor: 'var(--color-neon-yellow)',
              }}>
                <h2 className="text-xl font-bold glow-text mb-2" style={{ color: 'var(--color-neon-yellow)' }}>
                  ⚠️ 危険な操作
                </h2>
                <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  すべての投票データをクリアします。この操作は取り消せません。
                </p>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-neon-magenta) 0%, #c2185b 100%)',
                    color: 'white',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.boxShadow = 'var(--shadow-glow-magenta)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? "クリア中..." : "すべての投票データをクリアする"}
                </button>
              </div>

              {message && (
                <div className="p-4 rounded-xl border-2 animate-slide-up" style={{
                  background: message.includes("クリアしました")
                    ? 'rgba(0, 255, 136, 0.1)'
                    : 'rgba(255, 0, 110, 0.1)',
                  borderColor: message.includes("クリアしました")
                    ? 'var(--color-neon-green)'
                    : 'var(--color-neon-magenta)',
                  color: message.includes("クリアしました")
                    ? 'var(--color-neon-green)'
                    : 'var(--color-neon-magenta)',
                }}>
                  {message}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/"
              className="btn-primary inline-block"
            >
              投票画面に戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
