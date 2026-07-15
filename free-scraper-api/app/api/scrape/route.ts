import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Rotate User-Agents to bypass basic bot protection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const extractJson = searchParams.get('extract'); 

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing "url" parameter.' }, { status: 400 });
  }

  try {
    const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Fetch the target page. We use an 8-second timeout to safely return 
    // before Vercel's free-tier 10-second serverless limit hits.
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000) 
    });

    if (!response.ok) {
      throw new Error(`Target responded with status: ${response.status}`);
    }

    const html = await response.text();
    
    // If no specific extraction rules are provided, return the raw HTML (Web Scraping mode)
    if (!extractJson) {
      return NextResponse.json({ url: targetUrl, html: html }, { status: 200 });
    }

    // Structured Extraction Mode (E-commerce, SEO, Job Boards, etc.)
    const $ = cheerio.load(html);
    let selectors;
    
    try {
      selectors = JSON.parse(decodeURIComponent(extractJson));
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in "extract" parameter.' }, { status: 400 });
    }

    const extractedData: Record<string, string | null> = {};

    for (const [key, selector] of Object.entries(selectors)) {
      // Extract text, or fallback to the 'content' attribute (crucial for SEO meta tags)
      extractedData[key] = $(selector as string).first().text().trim() || 
                           $(selector as string).first().attr('content') || 
                           null;
    }

    return NextResponse.json({ 
      url: targetUrl, 
      data: extractedData 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Scraping request failed.' }, { status: 500 });
  }
}
