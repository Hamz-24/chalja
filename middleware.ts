import { NextResponse } from "next/server";

export function middleware(request: Request) {
    const response = NextResponse.next();

    // ✅ CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    // ✅ Add *everything* Vapi might send
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, access-control-allow-origin, X-Requested-With, Accept"
    );

    // ✅ Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
        return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
}

// ✅ Apply only to API routes
export const config = {
    matcher: ["/api/:path*"],
};
