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

    const keyRecord = KalssStore.findKey(key);
    if (!keyRecord) {
      return NextResponse.json(
        { ok: false, error: "Token tidak ditemukan atau tidak valid" },
        { status: 404 }
      );
    }

    const stats = KalssStore.getStats(key);
    const recent = KalssStore.getDonations(key, 50);

    return NextResponse.json({
      ok: true,
      keyRecord,
      stats,
      recent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
