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

  const handleChangeMyTeam = () => {
    if (!confirm("所属チームを変更しますか？\n※投票済みのデータは保持されます")) {
      return;
    }

    setIsSelectingTeam(true);
    setMyTeam(null);
    localStorage.removeItem("myTeam");
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
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="max-w-2xl w-full animate-scale-in">
          <div className="card-neon p-10">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold mb-4 glow-text" style={{ color: 'var(--color-neon-cyan)' }}>
                社内AIアイデアソン投票
              </h1>
              <p className="text-[var(--color-text-secondary)] text-lg">
                まず、あなたの所属チームを選択してください
              </p>
            </div>

            <div className="space-y-3">
              {TEAMS.map((t, index) => (
                <button
                  key={t}
                  onClick={() => handleSelectMyTeam(t)}
                  className="w-full p-5 rounded-xl font-semibold text-xl transition-all group relative overflow-hidden"
                  style={{
                    background: 'var(--color-dark-surface)',
                    border: '2px solid rgba(0, 245, 255, 0.2)',
                    color: 'var(--color-text-primary)',
                    animationDelay: `${index * 0.1}s`,
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
                  <div className="flex items-center justify-between">
                    <span className="group-hover:translate-x-2 transition-transform">
                      Team {t}
                    </span>
                    <span className="text-[var(--color-neon-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[var(--color-text-muted)] text-sm">
                ※ 自分のチームには投票できません
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const team = TEAMS[currentTeam];
  const isMyTeam = team === myTeam;

  return (
    <div className="min-h-screen py-8 px-4 relative z-10">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="card-neon p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center glow-text" style={{ color: 'var(--color-neon-cyan)' }}>
                社内AIアイデアソン投票
              </h1>
              <p className="text-[var(--color-text-secondary)] mb-2 text-center text-sm md:text-base">
                各チームを4つの観点で1~5点で評価してください
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="px-5 py-3 rounded-xl border flex items-center gap-3" style={{
              background: 'var(--color-dark-surface)',
              borderColor: 'rgba(0, 245, 255, 0.3)',
            }}>
              <span className="text-sm text-[var(--color-text-secondary)]">
                あなたのチーム: <span className="font-bold glow-text" style={{ color: 'var(--color-neon-yellow)' }}>Team {myTeam}</span>
              </span>
              <button
                onClick={handleChangeMyTeam}
                className="text-xs px-3 py-1 rounded-lg border transition-all hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)]"
                style={{
                  background: 'var(--color-dark-base)',
                  borderColor: 'rgba(0, 245, 255, 0.2)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                変更
              </button>
            </div>
          </div>

          {/* チーム選択タブ */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {TEAMS.map((t, index) => (
              <button
                key={t}
                onClick={() => setCurrentTeam(index)}
                className={`team-tab whitespace-nowrap ${
                  currentTeam === index
                    ? "active"
                    : t === myTeam
                    ? "my-team"
                    : votedTeams[t]
                    ? "voted"
                    : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  Team {t}
                  {t === myTeam && <span className="text-xs">(あなたのチーム)</span>}
                  {votedTeams[t] && currentTeam !== index && <span className="text-[var(--color-neon-green)]">✓</span>}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {isMyTeam ? (
              <div className="rounded-2xl p-10 text-center border-2 animate-slide-up" style={{
                background: 'var(--color-dark-surface)',
                borderColor: 'rgba(255, 0, 110, 0.3)',
              }}>
                <div className="text-7xl mb-6" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 0, 110, 0.5))' }}>🚫</div>
                <h2 className="text-3xl font-bold mb-3 glow-text" style={{ color: 'var(--color-neon-magenta)' }}>
                  Team {team} (あなたのチーム)
                </h2>
                <p className="text-[var(--color-text-secondary)] text-lg">
                  自分のチームには投票できません
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl p-6 border-2 animate-slide-up" style={{
                  background: votedTeams[team] ? 'rgba(0, 255, 136, 0.05)' : 'var(--color-dark-surface)',
                  borderColor: votedTeams[team] ? 'var(--color-neon-green)' : 'rgba(0, 245, 255, 0.2)',
                }}>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {votedTeams[team] && (
                      <span className="text-4xl glow-text" style={{ color: 'var(--color-neon-green)' }}>✓</span>
                    )}
                    <h2 className="text-3xl font-bold text-center glow-text" style={{
                      color: votedTeams[team] ? 'var(--color-neon-green)' : 'var(--color-neon-cyan)'
                    }}>
                      Team {team}
                      {votedTeams[team] && <span className="text-base ml-3 font-normal text-[var(--color-text-secondary)]">(投票済み)</span>}
                    </h2>
                  </div>

                  {votedTeams[team] && (
                    <p className="text-center text-[var(--color-neon-green)] mb-6 text-sm">
                      評価を変更して再投票できます
                    </p>
                  )}

              <div className="space-y-5">
                {CRITERIA.map((criteria, idx) => (
                  <div key={criteria.id} className="rounded-xl p-5" style={{
                    background: 'var(--color-dark-base)',
                    border: '1px solid rgba(0, 245, 255, 0.1)',
                    animationDelay: `${idx * 0.1}s`
                  }}>
                    <div className="mb-4">
                      <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-1">
                        {criteria.label}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)]">{criteria.description}</p>
                    </div>

                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreChange(team, criteria.id, score)}
                          className={`score-button ${scores[team]?.[criteria.id] === score ? 'selected' : ''}`}
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
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  コメント（任意）
                </label>
                <textarea
                  value={comments[team] || ""}
                  onChange={(e) => handleCommentChange(team, e.target.value)}
                  placeholder="このチームへのコメントや感想を入力できます"
                  className="input-neon resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-2 text-right">
                  {comments[team]?.length || 0} / 500文字
                </p>
              </div>
            </div>

                {/* このチームに投票ボタン */}
                <button
                  onClick={() => handleSubmitTeam(team)}
                  disabled={isSubmitting || !isTeamComplete(team)}
                  className="btn-primary w-full py-4 text-xl"
                  style={{
                    background: votedTeams[team]
                      ? 'linear-gradient(135deg, var(--color-neon-yellow) 0%, var(--color-neon-magenta) 100%)'
                      : 'var(--gradient-primary)'
                  }}
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
            <div className="flex gap-4 justify-between mt-6">
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
                className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--color-dark-surface)',
                  color: 'var(--color-text-secondary)',
                  border: '2px solid rgba(0, 245, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.borderColor = 'var(--color-neon-cyan)';
                    e.currentTarget.style.color = 'var(--color-neon-cyan)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.2)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
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
                className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                }}
              >
                次のチーム →
              </button>
            </div>

            {message && (
              <div className={`text-center font-semibold p-4 rounded-xl mt-4 animate-slide-up`} style={{
                background: message.includes("エラー") || message.includes("すべて")
                  ? 'rgba(255, 0, 110, 0.1)'
                  : 'rgba(0, 255, 136, 0.1)',
                color: message.includes("エラー") || message.includes("すべて")
                  ? 'var(--color-neon-magenta)'
                  : 'var(--color-neon-green)',
                border: '2px solid',
                borderColor: message.includes("エラー") || message.includes("すべて")
                  ? 'var(--color-neon-magenta)'
                  : 'var(--color-neon-green)',
              }}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
