// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api/rateLimiter';
import { cachedApiRequest } from '@/lib/api/cache';

// Allowed domains for proxying - strictly control which external APIs can be accessed
const ALLOWED_DOMAINS = [
  'skyscanner89.p.rapidapi.com',
  'router.hereapi.com'
];

/**
 * Validates that a URL is allowed to be proxied
 */
function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.some(domain => url.hostname === domain);
  } catch (e) {
    return false;
  }
}

/**
 * Determines which API service a URL belongs to for rate limiting
 */
function getServiceForUrl(urlString: string): string {
  const url = new URL(urlString);

  if (url.hostname.includes('skyscanner')) return 'skyscanner';
  if (url.hostname.includes('here')) return 'here';

  return 'default';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const skipCache = searchParams.get('skipCache') === 'true';

    // Validate URL parameter
    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 }
      );
    }

    // Check if URL is allowed
    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        { error: 'URL not allowed for proxying' },
        { status: 403 }
      );
    }

    // Get appropriate API key based on the service
    let headers: Record<string, string> = {};

    if (url.includes('skyscanner')) {
      const apiKey = process.env.SKYSCANNER_API_KEY || '';
      headers = {
        'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey
      };
    } else if (url.includes('hereapi')) {
      // HERE API uses query params for authentication, no headers needed
    } else {
      // Default headers
    }

    // Determine which API service this URL is for
    const service = getServiceForUrl(url);

    // Use cached request with rate limiting
    const fetchFn = async () => {
      return withRateLimit(service, async () => {
        console.log(`Proxying request to: ${url}`);

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
      });
    };

    // Either use cache or bypass it based on the skipCache parameter
    const data = skipCache
      ? await fetchFn()
      : await cachedApiRequest(
        { url, headers: JSON.stringify(headers) },
        fetchFn,
        1800 // 30 minute cache
      );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}