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

    // Saweria payload standard
    const amount = Number(body.amount_raw || body.amount || 0);
    const donorName = String(body.donator_name || body.donor_name || body.username || "Anonymous");
    const message = String(body.message || "Terima kasih atas dukungannya!");
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
      platform: "saweria",
    });

    console.log(`[Saweria Webhook] Added donation Rp ${amount} from ${donorName} for key ${apiKey}`);

    return NextResponse.json({
      ok: true,
      donationId: item.id,
      message: "Donation queued for Roblox processing",
    });
  } catch (err: any) {
    console.error("[Saweria Webhook] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
