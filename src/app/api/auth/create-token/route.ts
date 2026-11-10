import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gameName = (body?.gameName || "").trim() || "Game Donasi Kalss";
    const robloxUsername = (body?.robloxUsername || "").trim();

    let avatarUrl = "";
    if (robloxUsername) {
      try {
        const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: [robloxUsername],
            excludeBannedUsers: false,
          }),
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.data && userData.data.length > 0) {
            const userId = userData.data[0].id;
            const thumbRes = await fetch(
              `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`
            );
            if (thumbRes.ok) {
              const thumbData = await thumbRes.json();
              if (thumbData.data && thumbData.data.length > 0) {
                avatarUrl = thumbData.data[0].imageUrl;
              }
            }
          }
        }
      } catch (thumbErr) {
        console.warn("[CreateToken] Roblox lookup warning:", thumbErr);
      }
    }

    const keyRecord = KalssStore.createKey(gameName, robloxUsername, avatarUrl);

    return NextResponse.json({
      ok: true,
      keyRecord,
      message: "Token berhasil dibuat!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
