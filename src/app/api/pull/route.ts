import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.key || req.nextUrl.searchParams.get("key");
    const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 25);

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "missing_api_key" },
        { status: 400 }
      );
    }

    const keyRecord = await KalssStore.findKey(apiKey);
    if (!keyRecord) {
      return NextResponse.json(
        { ok: false, error: "invalid_api_key" },
        { status: 401 }
      );
    }

    const incomingUniverseId = body.universeId ? String(body.universeId).trim() : "";
    if (
      keyRecord.universeId &&
      incomingUniverseId &&
      incomingUniverseId !== "0" &&
      keyRecord.universeId !== incomingUniverseId
    ) {
      return NextResponse.json(
        { ok: false, error: "universe_mismatch" },
        { status: 403 }
      );
    }

    if (
      keyRecord.universeId &&
      !keyRecord.verified &&
      incomingUniverseId === keyRecord.universeId
    ) {
      await KalssStore.markKeyVerified(apiKey);
    }

    const items = await KalssStore.pullPendingDonations(apiKey, limit);

    return NextResponse.json({
      ok: true,
      serverId: body.serverId || "unknown",
      count: items.length,
      items: items.map((item) => ({
        id: item.id,
        leaseToken: item.leaseToken,
        amount: item.amount,
        username: item.username,
        donorName: item.donorName,
        message: item.message,
        targetName: item.targetName,
        platform: item.platform,
        createdAt: item.createdAt,
      })),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    console.error("[POST /api/pull] Error:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
