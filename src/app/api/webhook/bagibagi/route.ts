import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const apiKey =
      req.nextUrl.searchParams.get("key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing ?key= parameter in webhook URL" },
        { status: 400 }
      );
    }

    const keyRecord = KalssStore.findKey(apiKey);
    if (!keyRecord) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // BagiBagi payload standard
    const amount = Number(body.amount || body.amount_raw || body.nominal || 0);
    const donorName = String(body.sender || body.name || body.donator_name || "Anonymous");
    const message = String(body.message || body.notes || "Terima kasih atas dukungannya!");
    const targetName = String(body.targetName || body.recipient || "");

    if (amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const item = KalssStore.addDonation({
      apiKey: apiKey,
      amount: amount,
      donorName: donorName,
      username: donorName,
      message: message,
      targetName: targetName,
      platform: "bagibagi",
    });

    console.log(`[BagiBagi Webhook] Added donation Rp ${amount} from ${donorName} for key ${apiKey}`);

    return NextResponse.json({
      ok: true,
      donationId: item.id,
      message: "Donation queued for Roblox processing",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    console.error("[BagiBagi Webhook] Error:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
