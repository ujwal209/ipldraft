import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import LiveDraft from '@/models/LiveDraft';
import { IPL_TEAMS } from '@/lib/constants';
import { getGroqApiKey } from '@/lib/groq';

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { roomId } = await params;
    const { player, rosterIndex } = await request.json();

    await connectToDatabase();
    
    const draft = await LiveDraft.findOne({ roomId });
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    if (draft.status !== 'active') return NextResponse.json({ error: 'Draft is not active' }, { status: 400 });

    const isHost = draft.host.toString() === decoded.userId;
    const isGuest = draft.guest && draft.guest.toString() === decoded.userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (rosterIndex === 1 && !isHost) return NextResponse.json({ error: 'Not your roster' }, { status: 403 });
    if (rosterIndex === 2 && !isGuest) return NextResponse.json({ error: 'Not your roster' }, { status: 403 });

    if (draft.currentTurn !== rosterIndex) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
    }

    // Check foreign count
    const targetRoster = rosterIndex === 1 ? draft.hostRoster : draft.guestRoster;
    if (player.isForeign && targetRoster.filter((p: any) => p.isForeign).length >= 4) {
      return NextResponse.json({ error: 'Maximum 4 overseas players allowed' }, { status: 400 });
    }

    // Add player
    if (rosterIndex === 1) {
      draft.hostRoster.push(player);
    } else {
      draft.guestRoster.push(player);
    }

    // Toggle turn
    draft.currentTurn = draft.currentTurn === 1 ? 2 : 1;

    // Check completion
    if (draft.hostRoster.length >= 11 && draft.guestRoster.length >= 11) {
      draft.status = 'completed';
    } else {
      // Generate NEW Draft Pool for the next turn
      const randomTeam = IPL_TEAMS[Math.floor(Math.random() * IPL_TEAMS.length)];
      const randomYear = randomTeam.activeYears[Math.floor(Math.random() * randomTeam.activeYears.length)];

      const ruleset = "List exactly 15 prominent players who played for the squad.";
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

      if (groqRes.ok) {
        const data = await groqRes.json();
        const answer = data.choices?.[0]?.message?.content || '';
        
        try {
          const match = answer.match(/\{.*\}/s);
          const parsed = match ? JSON.parse(match[0]) : JSON.parse(answer);
          
          if (parsed.top_order && parsed.middle_order && parsed.lower_order) {
            const mapPlayers = (playersArr: any[], role: string) => playersArr.slice(0, 5).map((p: any) => ({
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

            draft.draftOptions = {
              team: randomTeam,
              year: randomYear,
              players,
            };
            draft.markModified('draftOptions');
          }
        } catch (e) {
          console.error("Failed to parse new draft pool on pick", e);
        }
      }
    }

    // We must use markModified for mixed arrays in mongoose
    draft.markModified('hostRoster');
    draft.markModified('guestRoster');

    await draft.save();

    return NextResponse.json({ success: true, draft }, { status: 200 });

  } catch (error: any) {
    console.error('Pick Live Draft API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
