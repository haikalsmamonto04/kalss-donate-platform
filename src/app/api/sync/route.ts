import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("key") || "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
  }
  const keyRecord = KalssStore.findKey(apiKey);
  if (!keyRecord) {
    return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
  }
  const state = KalssStore.getSyncState(apiKey);
  return NextResponse.json({ ok: true, ...state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.key || body.apiKey || req.nextUrl.searchParams.get("key") || "";
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
    }
    const keyRecord = KalssStore.findKey(apiKey);
    if (!keyRecord) {
      return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
    }

    const action = String(body.action || "push_from_roblox");

    if (action === "save_config") {
      const saved = KalssStore.saveSyncConfig(apiKey, body.config || {}, true);
      const state = KalssStore.getSyncState(apiKey);
      return NextResponse.json({ ok: true, config: saved, donors: state.donors });
    }

    if (action === "push_from_roblox") {
      const current = KalssStore.getSyncState(apiKey);
      let nextConfig = current.config;
      if (body.config && !current.config.customizedByWeb) {
        nextConfig = KalssStore.saveSyncConfig(apiKey, body.config, false);
      }
      const nextDonors = Array.isArray(body.donors)
        ? KalssStore.upsertSyncedDonors(apiKey, body.donors)
        : current.donors;
      return NextResponse.json({ ok: true, config: nextConfig, donors: nextDonors });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
