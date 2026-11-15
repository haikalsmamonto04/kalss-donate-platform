import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fallbackKeys = body.apiKey ? [] : await KalssStore.getKeys();
    const apiKey = body.apiKey || fallbackKeys[0]?.key;
    const amount = Number(body.amount) || 100000;
    const donorName = body.donorName || "TestDonor";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const targetName = body.targetName || "";

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "No API Key found" },
        { status: 400 }
      );
    }

    const item = await KalssStore.addDonation({
      apiKey,
      amount,
      donorName,
      username: donorName,
      message,
      targetName,
      platform: "simulation",
    });

    return NextResponse.json({
      ok: true,
      donation: item,
      message: `Donasi Rp ${amount.toLocaleString()} berhasil disimulasikan. Roblox worker akan menjemput dalam ~3 detik!`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
