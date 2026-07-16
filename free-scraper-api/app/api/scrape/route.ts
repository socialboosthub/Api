import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function launchBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-web-security"
    ]
  });
}
export async function GET(req: NextRequest) {
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

  const browser = await launchBrowser();

  try {
    console.log("========== NEW REQUEST ==========");
    console.log("Target:", targetUrl);

    const context = await browser.newContext({
      userAgent: randomUA(),
      viewport: {
        width: 1366,
        height: 768
      },
      locale: "en-US"
    });

    const page = await context.newPage();

    await page.setExtraHTTPHeaders({
      "Accept":
        "application/json,text/plain,*/*",
      "Accept-Language":
        "en-US,en;q=0.9",
      "Referer":
        "https://www.tikwm.com/",
      "Origin":
        "https://www.tikwm.com"
    });

    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const body = await page.content();

    const status = response?.status() || 200;

    console.log("Status:", status);

    console.log(
      "First 300 chars:",
      body.substring(0, 300)
    );
        if (
      body.includes("Just a moment") ||
      body.includes("cf-challenge") ||
      body.includes("challenge-platform")
    ) {
      await browser.close();

      return NextResponse.json(
        {
          success: false,
          blocked: true,
          status,
          error: "Cloudflare challenge detected"
        },
        { status: 403 }
      );
    }

    try {
      const text = await page.locator("body").innerText();

      try {
        const json = JSON.parse(text);

        await browser.close();

        return NextResponse.json(json);
      } catch {
        // Not JSON
      }
    } catch {
      // Ignore
    }

    await browser.close();

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "text/html"
      }
    });

  } catch (err: any) {
    console.error(err);

    await browser.close();

    return NextResponse.json(
      {
        success: false,
        error: err.message
      },
      {
        status: 500
      }
    );
  }
}
