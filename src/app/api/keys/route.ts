import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || "Game Kalss Studio";
    const newKey = KalssStore.createKey(name);

    return NextResponse.json({
      ok: true,
      key: newKey,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
