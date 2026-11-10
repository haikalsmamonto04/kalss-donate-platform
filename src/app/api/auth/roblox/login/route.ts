import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.ROBLOX_CLIENT_ID || "3859817395354715482";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/roblox/callback`;
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile",
    state: state,
    step: "accountConfirm",
  });

  return NextResponse.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
}
