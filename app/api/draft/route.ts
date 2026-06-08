import { NextResponse } from 'next/server';
import { IPL_TEAMS, IPL_YEARS } from '@/lib/constants';
import { getGroqApiKey } from '@/lib/groq';

export async function GET() {
  try {
    const randomTeam = IPL_TEAMS[Math.floor(Math.random() * IPL_TEAMS.length)];
    const randomYear = randomTeam.activeYears[Math.floor(Math.random() * randomTeam.activeYears.length)];

    const query = `You are a cricket historian. List exactly 15 prominent players who played for the ${randomTeam.name} squad in the ${randomYear} IPL season. Return ONLY a strict JSON object with three keys: "top_order", "middle_order", and "lower_order". Each key must contain an array of exactly 5 objects. Each object must have "name" (string) and "isForeign" (boolean, true if they are NOT an Indian citizen). Do NOT include any other text or markdown formatting. Example: {"top_order": [{"name": "Chris Gayle", "isForeign": true}, {"name": "Virat Kohli", "isForeign": false}], "middle_order": [], "lower_order": []}`;

    const apiKey = getGroqApiKey();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: query }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON object
    let parsed: any;
    try {
      const match = answer.match(/\{.*\}/s);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(answer);
    } catch (e) {
      throw new Error("Failed to parse Groq response: " + answer);
    }
    
    if (!parsed.top_order || !parsed.middle_order || !parsed.lower_order) {
       throw new Error("Groq failed to return the proper structure.");
    }

    const mapPlayers = (playersArr: any[], role: string) => playersArr.slice(0, 5).map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      role,
      isForeign: p.isForeign || false,
      // Default to silhouette, async fetch will replace it
      image: `https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png`
    }));

    const players = [
      ...mapPlayers(parsed.top_order, 'Top Order'),
      ...mapPlayers(parsed.middle_order, 'Middle Order'),
      ...mapPlayers(parsed.lower_order, 'Lower Order')
    ];

    return NextResponse.json({
      team: randomTeam,
      year: randomYear,
      players,
    });

  } catch (error: any) {
    console.error('Draft API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
