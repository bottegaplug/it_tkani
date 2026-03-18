import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  console.log("[AUTH] env password length:", adminPassword.length, "input length:", password.length);
  console.log("[AUTH] match:", password === adminPassword);

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("admin_auth");
  if (cookie?.value === "authenticated") {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_auth", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
