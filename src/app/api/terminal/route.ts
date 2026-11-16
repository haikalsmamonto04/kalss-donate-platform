import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("key") || "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
  }
  const keyRecord = await KalssStore.findKey(apiKey);
  if (!keyRecord) {
    return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
  }

  const term = await KalssStore.getTerminalState(apiKey);
  return NextResponse.json({
    ok: true,
    verified: Boolean(keyRecord.verified && keyRecord.universeId),
    universeId: keyRecord.universeId || "",
    placeId: keyRecord.placeId || "",
    placeName: keyRecord.placeName || "",
    servers: term.servers,
    logs: term.logs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.key || body.apiKey || req.nextUrl.searchParams.get("key") || "";
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
    }
    const keyRecord = await KalssStore.findKey(apiKey);
    if (!keyRecord) {
      return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
    }

    const incomingUniverseId = body.universeId ? String(body.universeId).trim() : "";
    const serverId = String(body.serverId || "unknown").trim();
    const isStudio = Boolean(body.isStudio);

    if (
      keyRecord.universeId &&
      incomingUniverseId &&
      incomingUniverseId !== "0" &&
      keyRecord.universeId !== incomingUniverseId
    ) {
      await KalssStore.pushTerminalEvent(apiKey, {
        serverId,
        isStudio,
        playerCount: Number(body.playerCount) || 0,
        uptimeSec: Number(body.uptimeSec) || 0,
        status: "offline",
        logs: [
          {
            level: "error",
            message: `UniverseId mismatch: expected ${keyRecord.universeId}, got ${incomingUniverseId}`,
          },
        ],
      });
      return NextResponse.json({ ok: false, error: "universe_mismatch" }, { status: 403 });
    }

    if (
      keyRecord.universeId &&
      !keyRecord.verified &&
      incomingUniverseId === keyRecord.universeId
    ) {
      await KalssStore.markKeyVerified(apiKey);
    }

    const status =
      body.status === "restarting" || body.status === "offline"
        ? body.status
        : "online";

    await KalssStore.pushTerminalEvent(apiKey, {
      serverId,
      isStudio,
      playerCount: Number(body.playerCount) || 0,
      uptimeSec: Number(body.uptimeSec) || 0,
      status,
      logs: Array.isArray(body.logs) ? body.logs : [],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("key") || "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
  }
  const keyRecord = await KalssStore.findKey(apiKey);
  if (!keyRecord) {
    return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
  }
  await KalssStore.clearTerminalLogs(apiKey);
  return NextResponse.json({ ok: true });
}
