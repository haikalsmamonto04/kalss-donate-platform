import { NextRequest, NextResponse } from "next/server";
import { KalssStore } from "@/lib/store";

const CLIENT_ID = process.env.ROBLOX_CLIENT_ID || "3859817395354715482";
const CLIENT_SECRET =
  process.env.ROBLOX_CLIENT_SECRET ||
  "RBX-97ddfq-TAUu61kjoSfLl_korzKNtWHtc7sX6Xt8LktPX0h-xLGKZBD6Pxq9mytiS";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/roblox/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=cancelled`);
  }

  try {
    const tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Roblox token exchange failed:", errText);
      return NextResponse.redirect(`${origin}/?auth_error=token_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile from Roblox OpenID userinfo
    const userRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/?auth_error=userinfo_failed`);
    }

    const userInfo = await userRes.json();
    const userId = String(userInfo.sub);
    const username = userInfo.preferred_username || userInfo.name || `Roblox_${userId}`;
    const avatarUrl = userInfo.picture || "";

    // Create or retrieve persistent Kalss Token
    const keyRecord = KalssStore.createOrGetRobloxKey(userId, username, avatarUrl);

    // Redirect to dashboard with token
    return NextResponse.redirect(`${origin}/?token=${encodeURIComponent(keyRecord.key)}`);
  } catch (err) {
    console.error("Roblox OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/?auth_error=server_error`);
  }
}
