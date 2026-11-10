import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.key || req.nextUrl.searchParams.get("key");
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items || items.length === 0) {
      return NextResponse.json({ ok: true, acknowledged: 0 });
    }

    // If key not in body, try to find matching key from items
    let targetKey = apiKey;
    if (!targetKey && items[0]?.id) {
      const allDonations = KalssStore.getDonations(undefined, 200);
      const match = allDonations.find((d) => d.id === items[0].id);
      if (match) {
        targetKey = match.apiKey;
      }
    }

    if (!targetKey) {
      targetKey = KalssStore.getKeys()[0]?.key || "";
    }

    const count = KalssStore.acknowledgeDonations(targetKey, items);

    return NextResponse.json({
      ok: true,
      serverId: body.serverId || "unknown",
      acknowledged: count,
    });
  } catch (err: any) {
    console.error("[POST /api/ack] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
