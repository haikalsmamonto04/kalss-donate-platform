import { NextRequest, NextResponse } from "next/server";
import { ApiKeyRecord, KalssStore } from "@/lib/store";
import {
  resolveRobloxUserByUsername,
  verifyUserCanManagePlace,
} from "@/lib/roblox";

async function listAccessiblePlaces(
  keyRecord: ApiKeyRecord,
  actorUserId?: string
): Promise<ApiKeyRecord[]> {
  const uid = actorUserId || keyRecord.robloxUserId || "";
  if (!uid) return [keyRecord];
  const list = await KalssStore.getKeysForUser(uid);
  if (!list.some((k) => k.key === keyRecord.key)) {
    list.unshift(keyRecord);
  }
  return list;
}

export async function GET(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get("key") || "").trim();
  if (!key) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 400 });
  }
  const keyRecord = await KalssStore.findKey(key);
  if (!keyRecord) {
    return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
  }
  const places = await listAccessiblePlaces(keyRecord);
  return NextResponse.json({ ok: true, places });
}

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
      const actorUsername = String(
        body.actorUsername || keyRecord.robloxUsername || actorUserId
      ).trim();

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
        if (
          existingUniverseKey.robloxUserId === actorUserId ||
          (existingUniverseKey.members || []).some((m) => m.userId === actorUserId)
        ) {
          const places = await listAccessiblePlaces(existingUniverseKey, actorUserId);
          return NextResponse.json({
            ok: true,
            joinedExisting: true,
            keyRecord: existingUniverseKey,
            places,
            message: `Beralih ke Place "${check.placeInfo.placeName}"!`,
          });
        }

        if (check.placeInfo.creatorType === "Group") {
          const updated = await KalssStore.addMember(existingUniverseKey.key, {
            userId: actorUserId,
            username: actorUsername,
            avatarUrl: keyRecord.avatarUrl || "",
            role: "co-owner",
          });
          const active = updated || existingUniverseKey;
          const places = await listAccessiblePlaces(active, actorUserId);
          return NextResponse.json({
            ok: true,
            joinedExisting: true,
            keyRecord: active,
            places,
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

      // Multi-place: if current key already has a DIFFERENT universeId, add a new Place entry instead of overwriting
      if (
        keyRecord.universeId &&
        keyRecord.universeId !== check.placeInfo.universeId
      ) {
        const created = await KalssStore.createKeyForUserPlace(
          {
            userId: actorUserId,
            username: actorUsername,
            avatarUrl: keyRecord.avatarUrl || "",
          },
          check.placeInfo
        );
        const places = await listAccessiblePlaces(created, actorUserId);
        return NextResponse.json({
          ok: true,
          joinedExisting: true,
          keyRecord: created,
          places,
          message: `Place baru "${check.placeInfo.placeName}" berhasil ditambahkan ke daftar Place kamu!`,
        });
      }

      const updated = await KalssStore.bindPlace(apiKey, check.placeInfo);
      const active = updated || keyRecord;
      const places = await listAccessiblePlaces(active, actorUserId);
      return NextResponse.json({
        ok: true,
        joinedExisting: false,
        keyRecord: active,
        places,
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
      const active = updated || keyRecord;
      const places = await listAccessiblePlaces(active);
      return NextResponse.json({
        ok: true,
        keyRecord: active,
        places,
        message: `${user.username} ditambahkan sebagai Co-Owner!`,
      });
    }

    if (action === "remove_member") {
      const targetUserId = String(body.userId || "").trim();
      if (!targetUserId) {
        return NextResponse.json({ ok: false, error: "userId wajib diisi." }, { status: 400 });
      }
      const updated = await KalssStore.removeMember(apiKey, targetUserId);
      const active = updated || keyRecord;
      const places = await listAccessiblePlaces(active);
      return NextResponse.json({ ok: true, keyRecord: active, places });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
