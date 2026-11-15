import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";
import {
  resolveRobloxUserByUsername,
  verifyUserCanManagePlace,
} from "@/lib/roblox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = String(body.key || body.apiKey || "").trim();
    const action = String(body.action || "bind_place");

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
    }

    const keyRecord = await KalssStore.findKey(apiKey);
    if (!keyRecord) {
      return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
    }

    if (action === "bind_place") {
      const placeId = String(body.placeId || "").trim();
      const actorUserId = String(body.actorUserId || keyRecord.robloxUserId || "").trim();

      if (!placeId) {
        return NextResponse.json(
          { ok: false, error: "Place ID wajib diisi." },
          { status: 400 }
        );
      }
      if (!actorUserId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Silakan login dengan Roblox OAuth agar sistem dapat memverifikasi kepemilikan Place.",
          },
          { status: 403 }
        );
      }

      const check = await verifyUserCanManagePlace(actorUserId, placeId);
      if (!check.allowed || !check.placeInfo) {
        return NextResponse.json(
          {
            ok: false,
            error: check.reason || "Kamu tidak memiliki akses Owner untuk Place ini.",
          },
          { status: 403 }
        );
      }

      const existingUniverseKey = await KalssStore.findKeyByUniverseId(
        check.placeInfo.universeId
      );

      // If another key already owns this UniverseId:
      if (existingUniverseKey && existingUniverseKey.key !== keyRecord.key) {
        if (check.placeInfo.creatorType === "Group") {
          // Fellow Group Owner/High-Rank joins the shared community game dashboard!
          const updated = await KalssStore.addMember(existingUniverseKey.key, {
            userId: actorUserId,
            username: String(body.actorUsername || keyRecord.robloxUsername || actorUserId),
            avatarUrl: keyRecord.avatarUrl || "",
            role: "co-owner",
          });
          return NextResponse.json({
            ok: true,
            joinedExisting: true,
            keyRecord: updated || existingUniverseKey,
            message: `Terhubung ke game komunitas "${check.placeInfo.placeName}" sebagai ${check.userRoleName || "Co-Owner"}!`,
          });
        }

        return NextResponse.json(
          {
            ok: false,
            error:
              "Place/Universe ini sudah terdaftar pada akun lain. Minta pemilik utama mengundang kamu di menu Tim.",
          },
          { status: 409 }
        );
      }

      const updated = await KalssStore.bindPlace(apiKey, check.placeInfo);
      return NextResponse.json({
        ok: true,
        joinedExisting: false,
        keyRecord: updated,
        message: `Place "${check.placeInfo.placeName}" (Universe ${check.placeInfo.universeId}) berhasil ditautkan!`,
      });
    }

    if (action === "add_member") {
      const username = String(body.username || "").trim();
      if (!username) {
        return NextResponse.json(
          { ok: false, error: "Username Roblox wajib diisi." },
          { status: 400 }
        );
      }
      const user = await resolveRobloxUserByUsername(username);
      if (!user) {
        return NextResponse.json(
          { ok: false, error: `Username "${username}" tidak ditemukan di Roblox.` },
          { status: 404 }
        );
      }
      const updated = await KalssStore.addMember(apiKey, {
        userId: user.userId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: "co-owner",
      });
      return NextResponse.json({
        ok: true,
        keyRecord: updated,
        message: `${user.username} ditambahkan sebagai Co-Owner!`,
      });
    }

    if (action === "remove_member") {
      const targetUserId = String(body.userId || "").trim();
      if (!targetUserId) {
        return NextResponse.json({ ok: false, error: "userId wajib diisi." }, { status: 400 });
      }
      const updated = await KalssStore.removeMember(apiKey, targetUserId);
      return NextResponse.json({ ok: true, keyRecord: updated });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
