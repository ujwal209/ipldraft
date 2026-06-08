"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

type Player = { id: string; name: string; image: string; role: string; isForeign: boolean };
type Team = { name: string; code: string; color: string; logo: string };
type DraftState = {
  roomId: string;
  status: 'waiting' | 'active' | 'completed';
  currentTurn: 1 | 2;
  host: { name: string; favoriteTeam: string };
  guest?: { name: string; favoriteTeam: string };
  draftOptions: { team: Team; year: number; players: Player[] };
  hostRoster: Player[];
  guestRoster: Player[];
};

function PlayerCard({ player, teamName, isDrafted, onPick, disabled }: { player: Player, teamName: string, isDrafted: boolean, onPick: (p: Player) => void, disabled: boolean }) {
  const [image, setImage] = useState(player.image);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPfp() {
      try {
        const res = await fetch(`/api/pfp?name=${encodeURIComponent(player.name)}&team=${encodeURIComponent(teamName)}`);
        const data = await res.json();
        if (data.imageUrl) setImage(data.imageUrl);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    fetchPfp();
  }, [player.name, teamName]);

  return (
    <Card 
      onClick={() => !isDrafted && !disabled && onPick({...player, image})}
      className={`bg-card/80 backdrop-blur-md border border-border transition-all duration-200 overflow-hidden flex flex-row items-center p-2 gap-3 rounded-lg
        ${isDrafted 
          ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' 
          : disabled ? 'opacity-70 cursor-not-allowed hover:border-border' : 'hover:border-blue-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg group'
        }
      `}
    >
      <div className={`w-12 h-12 bg-muted relative rounded-full overflow-hidden flex-shrink-0 border-2 border-transparent transition-colors ${!isDrafted && !disabled && 'group-hover:border-blue-500'}`}>
        {loading ? (
            <Skeleton className="w-full h-full" />
        ) : (
            <img src={image} alt={player.name} referrerPolicy="no-referrer" className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} />
        )}
      </div>
      <div className="flex flex-col flex-grow text-left overflow-hidden">
        <span className="font-bold text-sm truncate text-foreground group-hover:text-blue-500 transition-colors">
          {player.name} {player.isForeign && "✈️"}
        </span>
        <span className="text-xs text-muted-foreground font-medium truncate">{player.role}</span>
      </div>
    </Card>
  );
}

export default function LiveDraftRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [myRole, setMyRole] = useState<1 | 2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);

  // Poll for updates every 1.5 seconds
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch(`/api/drafts/live/${roomId}`);
        const data = await res.json();
        if (res.ok) {
          setDraft(data.draft);
          setMyRole(data.myRole);
        } else {
          toast.error(data.error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDraft();
    const interval = setInterval(fetchDraft, 1500);
    return () => clearInterval(interval);
  }, [roomId]);

  const handlePickPlayer = async (player: Player) => {
    if (!draft || !myRole || draft.currentTurn !== myRole || draft.status !== 'active' || isPicking) return;
    
    setIsPicking(true);
    // Optimistic UI Update
    const optimisticDraft = { ...draft };
    if (myRole === 1) optimisticDraft.hostRoster.push(player);
    else optimisticDraft.guestRoster.push(player);
    optimisticDraft.currentTurn = myRole === 1 ? 2 : 1;
    setDraft(optimisticDraft);

    try {
      const res = await fetch(`/api/drafts/live/${roomId}/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, rosterIndex: myRole })
      });
      if (!res.ok) throw new Error("Pick failed");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPicking(false);
    }
  };

  const [aiRating, setAiRating] = useState<{score: number, analysis: string} | null>(null);
  const [isRating, setIsRating] = useState(false);

  const analyzeSquad = async () => {
    if (!draft || !myRole) return;
    setIsRating(true);
    const myRoster = myRole === 1 ? draft.hostRoster : draft.guestRoster;
    const myName = myRole === 1 ? draft.host.name : draft.guest?.name || "Player";
    
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roster: myRoster, teamName: myName })
      });
      const data = await res.json();
      setAiRating(data);

      await fetch("/api/drafts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: myName,
          franchise: draft.draftOptions.team.name,
          year: draft.draftOptions.year,
          players: myRoster,
          score: data.score,
          analysis: data.analysis
        })
      });
      toast.success("Draft saved to Dashboard!");
    } catch (error) {
      toast.error("Failed to analyze squad");
    } finally {
      setIsRating(false);
    }
  };

  if (isLoading || !draft) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-muted-foreground animate-pulse">Syncing Server State...</div>;
  }

  if (draft.status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <Card className="max-w-md w-full bg-card/80 backdrop-blur-xl border-border p-8">
           <h1 className="text-2xl font-black mb-2">Lobby Created</h1>
           <p className="text-muted-foreground mb-8">Share this 6-digit code with your opponent to start the draft.</p>
           <div className="text-6xl font-black tracking-[0.25em] text-blue-500 bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20 shadow-inner">
             {draft.roomId}
           </div>
           <p className="mt-8 font-bold text-sm text-indigo-500 animate-pulse">Waiting for Guest to connect...</p>
        </Card>
      </div>
    );
  }

  const p1Name = draft.host.name;
  const p2Name = draft.guest?.name || "Player 2";
  const p1Roster = draft.hostRoster;
  const p2Roster = draft.guestRoster;
  const isMyTurn = draft.currentTurn === myRole && draft.status === 'active';

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center">
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 pt-10">
        
        {/* Roster Left (Host) */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          <h2 className={`text-xl font-bold p-3 rounded-lg border ${draft.currentTurn === 1 ? 'bg-muted border-blue-500 text-blue-500' : 'bg-card border-border'} ${myRole === 1 ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}>
            {p1Name}'s Squad ({p1Roster.length}/15)
            {myRole === 1 && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">YOU</span>}
          </h2>
          <div className="space-y-2">
            {p1Roster.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-card border border-border rounded-md">
                <div className="text-muted-foreground w-4 text-center font-bold text-xs">{i + 1}</div>
                <img src={p.image || "/placeholder.svg"} referrerPolicy="no-referrer" alt={p.name} className="w-8 h-8 rounded-full object-cover object-top" />
                <span className="text-sm font-medium">{p.name} {p.isForeign && "✈️"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Draft Board Center */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center">
          {draft.status === "active" && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-muted-foreground font-bold tracking-widest text-sm mb-1">ON THE CLOCK</h3>
                <h1 className={`text-3xl font-black ${isMyTurn ? 'text-green-500' : draft.currentTurn === 1 ? 'text-blue-500' : 'text-indigo-500'}`}>
                  {isMyTurn ? "YOUR TURN" : (draft.currentTurn === 1 ? p1Name : p2Name)}
                </h1>
              </div>

              <div className={`w-full flex flex-col items-center transition-opacity duration-300 ${!isMyTurn ? 'opacity-70' : 'opacity-100'}`}>
                <div className="relative mb-6 p-1 rounded-full shadow-2xl" style={{ background: `linear-gradient(135deg, ${draft.draftOptions.team.color}, transparent)` }}>
                  <div className="bg-background rounded-full p-4">
                     <img src={draft.draftOptions.team.logo} alt={draft.draftOptions.team.name} className="w-24 h-24 object-contain" />
                  </div>
                </div>
                <h2 className="text-4xl font-black mb-1 text-center drop-shadow-lg">{draft.draftOptions.team.name}</h2>
                <p className="text-muted-foreground font-bold tracking-widest text-lg mb-8 uppercase">Class of {draft.draftOptions.year}</p>

                <div className="w-full space-y-6">
                  {/* Top Order */}
                  <div className="bg-card/20 border border-border p-4 rounded-xl">
                    <h3 className="text-sm font-bold mb-3 text-muted-foreground tracking-widest uppercase border-b border-border pb-2">Top Order</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {draft.draftOptions.players.filter((p: any) => p.role === 'Top Order').map((player: any) => {
                        const isDrafted = p1Roster.some(r => r.name === player.name) || p2Roster.some(r => r.name === player.name);
                        return <PlayerCard key={player.id} player={player} teamName={draft.draftOptions.team.name} isDrafted={isDrafted} onPick={handlePickPlayer} disabled={!isMyTurn} />;
                      })}
                    </div>
                  </div>

                  {/* Middle Order */}
                  <div className="bg-card/20 border border-border p-4 rounded-xl">
                    <h3 className="text-sm font-bold mb-3 text-muted-foreground tracking-widest uppercase border-b border-border pb-2">Middle Order & All-Rounders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {draft.draftOptions.players.filter((p: any) => p.role === 'Middle Order').map((player: any) => {
                        const isDrafted = p1Roster.some(r => r.name === player.name) || p2Roster.some(r => r.name === player.name);
                        return <PlayerCard key={player.id} player={player} teamName={draft.draftOptions.team.name} isDrafted={isDrafted} onPick={handlePickPlayer} disabled={!isMyTurn} />;
                      })}
                    </div>
                  </div>

                  {/* Lower Order */}
                  <div className="bg-card/20 border border-border p-4 rounded-xl">
                    <h3 className="text-sm font-bold mb-3 text-muted-foreground tracking-widest uppercase border-b border-border pb-2">Lower Order & Bowlers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {draft.draftOptions.players.filter((p: any) => p.role === 'Lower Order').map((player: any) => {
                        const isDrafted = p1Roster.some(r => r.name === player.name) || p2Roster.some(r => r.name === player.name);
                        return <PlayerCard key={player.id} player={player} teamName={draft.draftOptions.team.name} isDrafted={isDrafted} onPick={handlePickPlayer} disabled={!isMyTurn} />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {draft.status === "completed" && (
             <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-6 animate-in zoom-in fade-in duration-700 mt-12 bg-card/50 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl">
                 <h1 className="text-4xl font-black text-blue-500 drop-shadow-md">Draft Complete!</h1>
                 <p className="text-lg text-muted-foreground mb-4">The ultimate squads have been formed.</p>
                 
                 {aiRating ? (
                   <div className="text-left bg-black/40 p-6 rounded-xl border border-white/10 w-full animate-in slide-in-from-bottom-4 duration-500">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="text-xl font-bold text-foreground">AI Analysis for You</h3>
                       <div className="text-2xl font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">{aiRating.score}/10</div>
                     </div>
                     <p className="text-muted-foreground leading-relaxed text-sm">{aiRating.analysis}</p>
                   </div>
                 ) : (
                   <Button onClick={analyzeSquad} disabled={isRating} size="lg" className="h-12 px-8 rounded-xl w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-[1.02]">
                     {isRating ? "Analyzing Stats..." : "Analyze Squad with AI"}
                   </Button>
                 )}

                 <Button onClick={() => window.location.href = '/dashboard'} variant="outline" size="lg" className="mt-4 h-12 px-8 rounded-xl w-full max-w-md border-blue-500/50 hover:bg-blue-500/10">Return to Dashboard</Button>
             </div>
          )}
        </div>

        {/* Roster Right (Guest) */}
        <div className="lg:col-span-3 space-y-4 order-3 lg:order-3">
           <h2 className={`text-xl font-bold p-3 rounded-lg border ${draft.currentTurn === 2 ? 'bg-muted border-indigo-500 text-indigo-500' : 'bg-card border-border'} ${myRole === 2 ? 'shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''}`}>
            {p2Name}'s Squad ({p2Roster.length}/15)
            {myRole === 2 && <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">YOU</span>}
          </h2>
          <div className="space-y-2">
            {p2Roster.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-card border border-border rounded-md">
                <div className="text-muted-foreground w-4 text-center font-bold text-xs">{i + 1}</div>
                <img src={p.image || "/placeholder.svg"} referrerPolicy="no-referrer" alt={p.name} className="w-8 h-8 rounded-full object-cover object-top" />
                <span className="text-sm font-medium">{p.name} {p.isForeign && "✈️"}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
