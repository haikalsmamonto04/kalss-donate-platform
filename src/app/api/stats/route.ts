import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key") || undefined;
    const stats = KalssStore.getStats(key);
    const keys = KalssStore.getKeys();
    const recent = KalssStore.getDonations(key, 30);

    return NextResponse.json({
      ok: true,
      stats,
      keys,
      recent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
