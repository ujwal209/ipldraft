import { NextResponse } from 'next/server';
import { getGroqApiKey } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { roster, teamName } = await request.json();

    if (!roster || roster.length === 0) {
      return NextResponse.json({ error: 'Roster is required' }, { status: 400 });
    }

    const playerNames = roster.map((p: any, i: number) => `${i + 1}. ${p.name} (${p.isForeign ? 'Overseas' : 'Indian'}, ${p.role})`).join('\n');

    const query = `You are a legendary IPL cricket coach and tactical analyst. 
I have just drafted the following 11-man playing XI for my franchise "${teamName}":

${playerNames}

Analyze this Playing XI's strengths, weaknesses, batting depth, and bowling options based on these players' real historical IPL stats. 
CRITICAL: You MUST include specific, real historical stats for at least 2-3 of the marquee players (e.g., career strike rates, economy rates, total runs/wickets) to make the analysis feel highly authentic and "proper".
Keep the analysis engaging, tactical, and under 150 words. 
Return ONLY a strict JSON object with two keys:
1. "score": A number out of 10 representing the overall team rating (e.g. 8.5).
2. "analysis": Your punchy tactical breakdown featuring real player stats.

Example: {"score": 8.5, "analysis": "This squad is built for power. MS Dhoni's career SR of 135+ anchors the lower order..."}`;

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
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';
    
    let parsed;
    try {
      const match = answer.match(/\{.*\}/s);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(answer);
    } catch (e) {
      throw new Error("Failed to parse Groq response: " + answer);
    }

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Rate API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
