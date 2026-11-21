import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

function parseAmount(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.floor(raw);
  }
  if (typeof raw === "string") {
    // Handle formatted strings like "Rp 10.000", "10,000", "10000.00"
    const cleaned = raw.trim().replace(/^rp\.?\s*/i, "").replace(/[^\d.,-]/g, "");
    if (!cleaned) return 0;
    // If format has dot as thousands separator (e.g. "10.000" or "1.000.000")
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      return Math.floor(Number(cleaned.replace(/\./g, "")) || 0);
    }
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      return Math.floor(Number(cleaned.replace(/,/g, "")) || 0);
    }
    return Math.floor(Number(cleaned.replace(/,/g, "")) || 0);
  }
  return 0;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Kalss Studio Saweria/Real Webhook",
    status: "ready",
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      form.forEach((v, k) => {
        body[k] = typeof v === "string" ? v : String(v);
      });
    } else {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === "object") {
            body = parsed as Record<string, unknown>;
          }
        } catch {
          return NextResponse.json(
            { ok: false, error: "Invalid JSON payload" },
            { status: 400 }
          );
        }
      }
    }

    const payload =
      body.data && typeof body.data === "object"
        ? { ...body, ...(body.data as Record<string, unknown>) }
        : body;

    const apiKey = (
      req.nextUrl.searchParams.get("key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      (typeof payload.key === "string" ? payload.key : "") ||
      ""
    ).trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing ?key= parameter in webhook URL" },
        { status: 400 }
      );
    }

    const keyRecord = await KalssStore.findKey(apiKey);
    if (!keyRecord) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    const amount = parseAmount(
      payload.amount_raw ?? payload.amount ?? payload.amountRaw ?? payload.nominal ?? payload.total ?? 0
    );

    const rawDonor = String(
      payload.donator_name ??
        payload.donor_name ??
        payload.supporter_name ??
        payload.sender_name ??
        payload.username ??
        payload.name ??
        ""
    ).trim();
    const donorName = rawDonor || "Anonymous";

    const message = String(
      payload.message ?? payload.notes ?? payload.comment ?? payload.pesan ?? payload.msg ?? ""
    ).trim();

    const targetName = String(
      payload.targetName ?? payload.target ?? payload.recipient ?? ""
    ).trim();

    // Handle Saweria / gateway verification ping with 0 amount gracefully
    if (amount <= 0) {
      if (payload.type === "test" || payload.event === "ping" || payload.version) {
        return NextResponse.json({
          ok: true,
          ping: true,
          message: "Webhook verified (Saweria/Real endpoint active)",
        });
      }
      return NextResponse.json(
        { ok: false, error: "Amount must be greater than 0" },
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
      platform: "real",
    });

    console.log(`[Real/Saweria Webhook] Added donation Rp ${amount} from ${donorName} for key ${apiKey}`);

    return NextResponse.json({
      ok: true,
      donationId: item.id,
      message: "Donation queued for Roblox processing",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "server_error";
    console.error("[Real/Saweria Webhook] Error:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
