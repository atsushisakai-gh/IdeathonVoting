"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // パスワードチェック（環境変数で設定可能）
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin2025";

    if (password === adminPassword) {
      setIsAuthenticated(true);
      setMessage("");
    } else {
      setMessage("パスワードが正しくありません");
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

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            管理者ページ
          </h1>

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

            <div className="flex gap-4">
              <a
                href="/"
                className="flex-1 text-center bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                投票画面に戻る
              </a>
              <a
                href="/results"
                className="flex-1 text-center bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                集計結果を見る
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
