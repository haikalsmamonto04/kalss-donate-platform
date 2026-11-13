import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = (body?.key || "").trim();

    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Token tidak boleh kosong" },
        { status: 400 }
      );
    }

    const keyRecord = KalssStore.findKey(key);
    if (!keyRecord) {
      return NextResponse.json(
        { ok: false, error: "Token tidak ditemukan. Pastikan token berawalan 'kalss_live_' atau buat token baru." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      keyRecord,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
