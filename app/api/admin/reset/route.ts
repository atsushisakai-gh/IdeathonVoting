import { NextRequest, NextResponse } from "next/server";
import { resetVotes } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // パスワードチェック
    const adminPassword = process.env.ADMIN_PASSWORD || "admin2025";

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "認証に失敗しました" },
        { status: 401 }
      );
    }

    // すべての投票データをクリア
    await resetVotes();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset votes" },
      { status: 500 }
    );
  }
}
