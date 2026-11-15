import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const key = (req.nextUrl.searchParams.get("key") || "").trim();

    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Parameter 'key' wajib disertakan" },
        { status: 400 }
      );
    }

    const keyRecord = await KalssStore.findKey(key);
    if (!keyRecord) {
      return NextResponse.json(
        { ok: false, error: "Token tidak ditemukan atau tidak valid" },
        { status: 404 }
      );
    }

    const stats = await KalssStore.getStats(key);
    const recent = await KalssStore.getDonations(key, 50);

    return NextResponse.json({
      ok: true,
      keyRecord,
      stats,
      recent,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
