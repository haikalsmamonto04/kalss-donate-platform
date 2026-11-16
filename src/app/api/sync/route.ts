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
  const state = await KalssStore.getSyncState(apiKey);
  return NextResponse.json({ ok: true, ...state });
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

    const action = String(body.action || "push_from_roblox");

    if (action === "save_config") {
      const saved = await KalssStore.saveSyncConfig(apiKey, body.config || {}, true);
      const state = await KalssStore.getSyncState(apiKey);
      return NextResponse.json({ ok: true, config: saved, donors: state.donors });
    }

    if (action === "reset_config") {
      const reset = await KalssStore.resetSyncConfig(apiKey);
      const state = await KalssStore.getSyncState(apiKey);
      return NextResponse.json({ ok: true, config: reset, donors: state.donors });
    }

    if (action === "upsert_donor") {
      const donor = body.donor || {};
      const username = String(donor.username || "").trim();
      if (!username) {
        return NextResponse.json({ ok: false, error: "username_required" }, { status: 400 });
      }
      let resolvedId = String(donor.userId || "").trim();
      let resolvedName = username;
      let resolvedDisplay = String(donor.displayName || username).trim();
      if (!resolvedId) {
        try {
          const r = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
          });
          if (r.ok) {
            const j = await r.json();
            const first = Array.isArray(j?.data) ? j.data[0] : null;
            if (first?.id) {
              resolvedId = String(first.id);
              resolvedName = String(first.name || username);
              resolvedDisplay = String(first.displayName || resolvedName);
            }
          }
        } catch {
          // Fallback: Roblox server will resolve via resolveUserId(username)
        }
      }
      const donors = await KalssStore.queueManualDonor(apiKey, {
        userId: resolvedId,
        username: resolvedName,
        displayName: resolvedDisplay,
        total: Number(donor.total) || 0,
      });
      return NextResponse.json({ ok: true, donors });
    }

    if (action === "delete_donor") {
      const donor = body.donor || {};
      const userId = String(donor.userId || "").trim();
      const username = String(donor.username || "").trim();
      if (!userId && !username) {
        return NextResponse.json({ ok: false, error: "donor_required" }, { status: 400 });
      }
      const donors = await KalssStore.deleteManualDonor(apiKey, { userId, username });
      return NextResponse.json({ ok: true, donors });
    }

    if (action === "push_from_roblox") {
      const incomingUniverseId = body.universeId ? String(body.universeId).trim() : "";
      if (
        keyRecord.universeId &&
        incomingUniverseId &&
        incomingUniverseId !== "0" &&
        keyRecord.universeId !== incomingUniverseId
      ) {
        return NextResponse.json({ ok: false, error: "universe_mismatch" }, { status: 403 });
      }
      if (
        keyRecord.universeId &&
        !keyRecord.verified &&
        incomingUniverseId === keyRecord.universeId
      ) {
        await KalssStore.markKeyVerified(apiKey);
      }

      const current = await KalssStore.getSyncState(apiKey);
      let nextConfig = current.config;
      if (body.config && !current.config.customizedByWeb) {
        nextConfig = await KalssStore.saveSyncConfig(apiKey, body.config, false);
      }
      const pendingDonorUpdates = await KalssStore.consumePendingDonorSync(apiKey);
      const pendingIds = new Set(pendingDonorUpdates.map((p) => String(p.userId)));
      const pendingNames = new Set(
        pendingDonorUpdates.map((p) => String(p.username || "").toLowerCase())
      );
      const filteredIncomingDonors = Array.isArray(body.donors)
        ? body.donors.filter(
            (d: { userId?: string; username?: string }) =>
              !pendingIds.has(String(d.userId || "")) &&
              !pendingNames.has(String(d.username || "").toLowerCase())
          )
        : null;
      const nextDonors = filteredIncomingDonors
        ? await KalssStore.upsertSyncedDonors(apiKey, filteredIncomingDonors)
        : current.donors;
      return NextResponse.json({
        ok: true,
        config: nextConfig,
        donors: nextDonors,
        pendingDonorUpdates,
      });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
