import { NextResponse } from "next/server";
import { ProxyAgent } from "undici";

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
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url" },
      { status: 400 }
    );
  }

  try {

    const proxies = process.env.PROXY_LIST!.split(",");

    const proxy =
      proxies[Math.floor(Math.random() * proxies.length)].trim();

    console.log("Using proxy:", proxy);

    const dispatcher = new ProxyAgent(proxy);

    const ua =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const response = await fetch(targetUrl, {
      dispatcher,
      headers: {
        "User-Agent": ua,
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://www.tikwm.com/",
        "Origin": "https://www.tikwm.com"
      }
    });

    console.log("Status:", response.status);

    const text = await response.text();

    return NextResponse.json({
      status: response.status,
      html: text
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json({
      error: err.message
    }, { status: 500 });
  }
}
