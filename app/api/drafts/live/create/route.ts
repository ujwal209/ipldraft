import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import LiveDraft from '@/models/LiveDraft';
import { IPL_TEAMS } from '@/lib/constants';
import { getGroqApiKey } from '@/lib/groq';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function POST(request: Request) {
  try {
    const { template = 'standard' } = await request.json().catch(() => ({ template: 'standard' }));
    
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    // Generate Draft Pool
    const randomTeam = IPL_TEAMS[Math.floor(Math.random() * IPL_TEAMS.length)];
    const randomYear = randomTeam.activeYears[Math.floor(Math.random() * randomTeam.activeYears.length)];

    let ruleset = "List exactly 15 prominent players who played for the squad.";
    if (template === 'foreign') {
      ruleset = "List exactly 15 prominent OVERSEAS (non-Indian) players who played for the squad or in that era.";
    } else if (template === 'legends') {
      ruleset = "List exactly 15 Hall of Fame, legendary retired players associated with this franchise or era.";
    }

    const query = `You are a cricket historian. ${ruleset} Focus on the ${randomTeam.name} squad in the ${randomYear} IPL season. Return ONLY a strict JSON object with three keys: "top_order", "middle_order", and "lower_order". Each key must contain an array of exactly 5 objects. Each object must have "name" (string) and "isForeign" (boolean, true if they are NOT an Indian citizen). Do NOT include any other text or markdown formatting. Example: {"top_order": [{"name": "Chris Gayle", "isForeign": true}, {"name": "Virat Kohli", "isForeign": false}], "middle_order": [], "lower_order": []}`;

    const apiKey = getGroqApiKey();
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    if (!groqRes.ok) throw new Error("Groq API error");

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content || '';
    
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
      image: `https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png`
    }));

    const players = [
      ...mapPlayers(parsed.top_order, 'Top Order'),
      ...mapPlayers(parsed.middle_order, 'Middle Order'),
      ...mapPlayers(parsed.lower_order, 'Lower Order')
    ];

    await connectToDatabase();

    // Ensure unique room ID
    let roomId = generateRoomCode();
    while (await LiveDraft.findOne({ roomId })) {
      roomId = generateRoomCode();
    }

    const draft = new LiveDraft({
      roomId,
      host: decoded.userId,
      status: 'waiting',
      draftOptions: {
        team: randomTeam,
        year: randomYear,
        players,
      },
      currentTurn: 1,
      hostRoster: [],
      guestRoster: []
    });

    await draft.save();

    return NextResponse.json({ roomId }, { status: 200 });

  } catch (error: any) {
    console.error('Create Live Draft API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
