import { NextRequest, NextResponse } from "next/server";
import { addVote } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scores } = body;

    if (!scores || typeof scores !== "object") {
      return NextResponse.json(
        { error: "Invalid scores" },
        { status: 400 }
      );
    }

    // スコアの検証
    for (const [team, teamScores] of Object.entries(scores)) {
      if (typeof teamScores !== "object") {
        return NextResponse.json(
          { error: `Invalid scores for team ${team}` },
          { status: 400 }
        );
      }

      for (const [criteriaId, score] of Object.entries(teamScores as Record<string, unknown>)) {
        if (typeof score !== "number" || score < 1 || score > 5) {
          return NextResponse.json(
            { error: `Invalid score for team ${team}, criteria ${criteriaId}` },
            { status: 400 }
          );
        }
      }
    }

    await addVote(scores as any);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
