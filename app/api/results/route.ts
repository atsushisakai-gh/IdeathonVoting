import { NextResponse } from "next/server";
import { getVotes } from "@/lib/storage";

export async function GET() {
  try {
    const results = await getVotes();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
