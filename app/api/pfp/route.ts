import { NextResponse } from 'next/server';
import { getTavilyApiKey } from '@/lib/tavily';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=500`;
    const response = await fetch(wikiUrl);
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.statusText}`);
    }

    const data = await response.json();
    let imageUrl = null;

    if (data.query && data.query.pages) {
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pageId !== "-1" && pages[pageId].thumbnail) {
        imageUrl = pages[pageId].thumbnail.source;
      }
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error(`PFP fetch error for ${name}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
