export interface PlaceOwnershipInfo {
  placeId: string;
  universeId: string;
  placeName: string;
  creatorType: "User" | "Group";
  creatorId: string;
  creatorName: string;
}

export interface PlaceAccessVerification {
  allowed: boolean;
  reason?: string;
  placeInfo?: PlaceOwnershipInfo;
  userRoleName?: string;
  userRoleRank?: number;
}

export async function getPlaceOwnershipInfo(
  rawPlaceId: string
): Promise<PlaceOwnershipInfo | null> {
  const placeId = String(rawPlaceId || "").replace(/\D/g, "");
  if (!placeId) return null;

  const uniRes = await fetch(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
    { cache: "no-store" }
  );
  if (!uniRes.ok) return null;
  const uniData = await uniRes.json();
  const universeId = uniData?.universeId ? String(uniData.universeId) : "";
  if (!universeId || universeId === "0") return null;

  const gameRes = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`,
    { cache: "no-store" }
  );
  if (!gameRes.ok) return null;
  const gameData = await gameRes.json();
  const game = Array.isArray(gameData?.data) ? gameData.data[0] : null;
  if (!game) return null;

  const creatorType: "User" | "Group" =
    game.creator?.type === "Group" ? "Group" : "User";

  return {
    placeId,
    universeId,
    placeName: String(game.name || `Place ${placeId}`),
    creatorType,
    creatorId: String(game.creator?.id || ""),
    creatorName: String(game.creator?.name || ""),
  };
}

export async function verifyUserCanManagePlace(
  robloxUserId: string,
  rawPlaceId: string
): Promise<PlaceAccessVerification> {
  const userId = String(robloxUserId || "").trim();
  if (!userId) {
    return { allowed: false, reason: "Akun Roblox belum terautentikasi." };
  }

  const placeInfo = await getPlaceOwnershipInfo(rawPlaceId);
  if (!placeInfo) {
    return {
      allowed: false,
      reason: "Place ID tidak ditemukan di Roblox atau Place belum dipublish.",
    };
  }

  if (placeInfo.creatorType === "User") {
    if (placeInfo.creatorId === userId) {
      return {
        allowed: true,
        placeInfo,
        userRoleName: "Owner",
        userRoleRank: 255,
      };
    }
    return {
      allowed: false,
      placeInfo,
      reason: `Place ini milik user ${placeInfo.creatorName || placeInfo.creatorId}, bukan akun Roblox kamu.`,
    };
  }

  // Group / Community Place: check user's role in that group
  const rolesRes = await fetch(
    `https://groups.roblox.com/v1/users/${encodeURIComponent(userId)}/groups/roles`,
    { cache: "no-store" }
  );
  if (!rolesRes.ok) {
    return {
      allowed: false,
      placeInfo,
      reason: "Gagal memeriksa role komunitas di Roblox API.",
    };
  }

  const rolesJson = await rolesRes.json();
  const groups = Array.isArray(rolesJson?.data) ? rolesJson.data : [];
  const membership = groups.find(
    (g: { group?: { id?: number | string }; role?: { name?: string; rank?: number } }) =>
      String(g.group?.id || "") === placeInfo.creatorId
  );

  if (!membership) {
    return {
      allowed: false,
      placeInfo,
      reason: `Kamu bukan anggota komunitas "${placeInfo.creatorName || placeInfo.creatorId}" pemilik Place ini.`,
    };
  }

  const roleName = String(membership.role?.name || "");
  const roleRank = Number(membership.role?.rank || 0);
  const isOwnerOrHighRole =
    roleRank >= 250 ||
    /\b(owner|co-?owner|founder|pemilik|head\s*dev|lead\s*dev|admin)\b/i.test(
      roleName
    );

  if (!isOwnerOrHighRole) {
    return {
      allowed: false,
      placeInfo,
      userRoleName: roleName,
      userRoleRank: roleRank,
      reason: `Role kamu di komunitas "${placeInfo.creatorName}" adalah "${roleName}" (rank ${roleRank}). Hanya Owner / Co-Owner (rank >= 250) yang dapat menghubungkan Place ini.`,
    };
  }

  return {
    allowed: true,
    placeInfo,
    userRoleName: roleName,
    userRoleRank: roleRank,
  };
}

export async function resolveRobloxUserByUsername(username: string): Promise<{
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
} | null> {
  const clean = String(username || "").trim();
  if (!clean) return null;

  const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [clean], excludeBannedUsers: false }),
    cache: "no-store",
  });
  if (!userRes.ok) return null;
  const userData = await userRes.json();
  const match = Array.isArray(userData?.data) ? userData.data[0] : null;
  if (!match?.id) return null;

  const userId = String(match.id);
  let avatarUrl = "";
  try {
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`,
      { cache: "no-store" }
    );
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json();
      avatarUrl = thumbData?.data?.[0]?.imageUrl || "";
    }
  } catch {
    // ignore thumbnail error
  }

  return {
    userId,
    username: String(match.name || clean),
    displayName: String(match.displayName || match.name || clean),
    avatarUrl,
  };
}
