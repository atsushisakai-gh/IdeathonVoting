import { NextRequest, NextResponse } from "next/server";
import { addVote } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team, scores } = body;

    if (!team || typeof team !== "string") {
      return NextResponse.json(
        { error: "Invalid team" },
        { status: 400 }
      );
    }

    if (!scores || typeof scores !== "object") {
      return NextResponse.json(
        { error: "Invalid scores" },
        { status: 400 }
      );
    }

    // スコアの検証
    for (const [criteriaId, score] of Object.entries(scores as Record<string, unknown>)) {
      if (typeof score !== "number" || score < 1 || score > 5) {
        return NextResponse.json(
          { error: `Invalid score for criteria ${criteriaId}` },
          { status: 400 }
        );
      }
    }

    await addVote(team, scores as Record<string, number>);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
