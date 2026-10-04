import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://alshareehasim-backend.onrender.com";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";

    // التحقق الدقيق من وجود customer_token فقط وليس مجرد كلمة token في أي كوكي أخرى
    const hasCustomerToken = /(?:^|;\s*)customer_token=([^;]+)/.test(cookie);
    if (!hasCustomerToken) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    const backendRes = await fetch(`${BACKEND}/api/customers/auth/me`, {
      headers: { cookie },
      signal: AbortSignal.timeout(4000),
    });

    if (!backendRes.ok) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const data = await backendRes.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
