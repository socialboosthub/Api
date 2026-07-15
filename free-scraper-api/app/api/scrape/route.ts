import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Keep a rotating list of highly-realistic headers to look like a real browser
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 1. Exact ScraperAPI compatibility
  const apiKey = searchParams.get('api_key');
  const targetUrl = searchParams.get('url');

  const EXPECTED_API_KEY = process.env.SCRAPER_API_KEY;

  // 2. Validate API Key
  if (!EXPECTED_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error: SCRAPER_API_KEY is not set in Vercel Environment Variables.' }, { status: 500 });
  }

  if (apiKey !== EXPECTED_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized: Invalid API Key.' }, { status: 401 });
  }

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing "url" parameter.' }, { status: 400 });
  }

  try {
    const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Prepare headers to fool Cloudflare
    const headers: Record<string, string> = {
      'User-Agent': randomUserAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };

    let fetchOptions: RequestInit = {
      headers,
      signal: AbortSignal.timeout(8000) // Keep under Vercel's 10-second timeout limit
    };

    // 3. Optional Proxy Integration for Bypassing Cloudflare
    // Set PROXY_LIST in Vercel as a comma-separated list: "http://user:pass@ip:port,http://user:pass@ip2:port2"
    if (process.env.PROXY_LIST) {
      const proxies = process.env.PROXY_LIST.split(',');
      const randomProxy = proxies[Math.floor(Math.random() * proxies.length)].trim();
      
      // Inject the proxy agent into our fetch call
      const agent = new HttpsProxyAgent(randomProxy);
      // @ts-ignore - Next.js fetch supports custom agents in standard Node runtime
      fetchOptions.agent = agent;
    }

    console.log("Fetching URL:", targetUrl);

const response = await fetch(targetUrl, fetchOptions);

console.log("Status:", response.status);
console.log("Content-Type:", response.headers.get("content-type"));

if (!response.ok) {
  const body = await response.text();
  console.log("Response body:", body);

  throw new Error(`Target responded with status ${response.status}`);
}

    // Return the response directly to your script (e.g., TikWM JSON data or TikTok HTML)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      return NextResponse.json(jsonData, { status: 200 });
    } else {
      const htmlData = await response.text();
      // Send raw HTML or plain text response
      return new Response(htmlData, {
        status: 200,
        headers: { 'Content-Type': contentType || 'text/html' }
      });
    }

  } catch (error: any) {
  console.error("ERROR:", error);

  return NextResponse.json(
    {
      error: error.message,
      stack: error.stack
    },
    { status: 500 }
  );
  }
