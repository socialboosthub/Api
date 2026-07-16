import { NextResponse } from "next/server";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36"
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const apiKey = searchParams.get("api_key");
  const targetUrl = searchParams.get("url");

  if (apiKey !== process.env.SCRAPER_API_KEY) {
    return NextResponse.json(
      { error: "Invalid API Key" },
      { status: 401 }
    );
  }

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  const ua =
    USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    console.log("========== NEW REQUEST ==========");
    console.log("Target:", targetUrl);

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": ua,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.tikwm.com/",
        "Origin": "https://www.tikwm.com"
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log("Status:", response.status);

    const contentType =
      response.headers.get("content-type") || "";

    console.log("Content-Type:", contentType);

    const body = await response.text();

    console.log(
      "First 300 chars:",
      body.substring(0, 300)
    );

    if (
      body.includes("Just a moment") ||
      body.includes("cf-challenge") ||
      body.includes("challenge-platform")
    ) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          status: response.status,
          error: "Cloudflare challenge detected"
        },
        { status: 403 }
      );
    }

    if (contentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(body));
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON returned",
            preview: body.substring(0, 300)
          },
          { status: 500 }
        );
      }
    }

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "text/plain"
      }
    });

  } catch (err: any) {
    console.error("Fetch failed:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message
      },
      { status: 500 }
    );
  }
}
