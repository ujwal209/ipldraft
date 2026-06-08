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
  hostAnalysis?: { score: number; analysis: string };
  guestAnalysis?: { score: number; analysis: string };
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
        <span className="font-bold text-sm text-foreground group-hover:text-blue-500 transition-colors">
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
        const res = await fetch(`/api/drafts/live/${roomId}?t=${Date.now()}`, { cache: 'no-store' });
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
    
    const myRoster = myRole === 1 ? draft.hostRoster : draft.guestRoster;
    if (player.isForeign && myRoster.filter(p => p.isForeign).length >= 4) {
      toast.error("Maximum 4 overseas players allowed.");
      return;
    }
    
    setIsPicking(true);
    // Optimistic UI Update (only add to roster, do not flip turn to prevent polling race condition)
    const optimisticDraft = { ...draft };
    if (myRole === 1) optimisticDraft.hostRoster.push(player);
    else optimisticDraft.guestRoster.push(player);
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

      await fetch(`/api/drafts/live/${roomId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: data.score, analysis: data.analysis, rosterIndex: myRole })
      });

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

  useEffect(() => {
    if (draft?.status === "completed" && !aiRating && !isRating) {
      analyzeSquad();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.status]);

  if (isLoading || !draft) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-muted-foreground animate-pulse">Syncing Server State...</div>;
  }

  if (draft.status === 'waiting') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
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
    <div className="min-h-[calc(100vh-4rem)] md:min-h-screen text-foreground flex flex-col items-center">
      
      {/* Mobile Scoreboard (Sticky) */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border p-3 px-4 flex justify-between items-center shadow-lg">
         <div className={`flex flex-col ${draft.currentTurn === 1 ? 'text-blue-500' : 'text-muted-foreground'}`}>
           <span className="text-[11px] font-bold uppercase tracking-wider">{p1Name}</span>
           <span className="text-base font-black">{p1Roster.length}/11</span>
         </div>
         <div className="text-center px-4">
           <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">On The Clock</span>
           <div className={`text-sm font-black ${isMyTurn ? 'text-green-500 animate-pulse' : 'text-foreground'}`}>
             {isMyTurn ? "YOUR TURN" : (draft.currentTurn === 1 ? p1Name : p2Name)}
           </div>
         </div>
         <div className={`flex flex-col text-right ${draft.currentTurn === 2 ? 'text-indigo-500' : 'text-muted-foreground'}`}>
           <span className="text-[11px] font-bold uppercase tracking-wider">{p2Name}</span>
           <span className="text-base font-black">{p2Roster.length}/11</span>
         </div>
      </div>

      <div className="w-full max-w-[1600px] p-2 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 pt-4">
        
        {/* Roster Left (Host) */}
        <div className={`lg:col-span-3 space-y-4 ${myRole === 1 ? 'order-2 lg:order-1 lg:sticky lg:top-4 z-20 bg-background/95 pb-4 lg:pb-0 lg:bg-transparent pt-2 lg:pt-0 border-b border-border lg:border-none' : 'order-3 lg:order-1'}`}>
          <h2 className={`text-xl font-bold p-3 rounded-lg border ${draft.currentTurn === 1 ? 'bg-muted border-blue-500 text-blue-500' : 'bg-card border-border'} ${myRole === 1 ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}>
            {p1Name}'s Squad ({p1Roster.length}/11)
            {myRole === 1 && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">YOU</span>}
          </h2>
          <div className="flex overflow-x-auto gap-2 lg:flex-col lg:space-y-2 pb-2 lg:pb-0 hide-scrollbar">
            {p1Roster.map((p, i) => (
              <div key={p.id} className="flex-shrink-0 w-56 lg:w-full flex items-center gap-3 p-2 bg-card border border-border rounded-md">
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
              <div className="hidden lg:block text-center mb-6 mt-4 lg:mt-0">
                <h3 className="text-muted-foreground font-bold tracking-widest text-sm mb-1">ON THE CLOCK</h3>
                <h1 className={`text-3xl font-black ${isMyTurn ? 'text-green-500 animate-pulse' : draft.currentTurn === 1 ? 'text-blue-500' : 'text-indigo-500'}`}>
                  {isPicking ? "GENERATING NEXT DRAFT BOARD..." : isMyTurn ? "YOUR TURN" : (draft.currentTurn === 1 ? p1Name : p2Name)}
                </h1>
              </div>

              <div className={`w-full flex flex-col items-center transition-opacity duration-300 ${!isMyTurn || isPicking ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
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
                 
                 {(!draft.hostAnalysis || !draft.guestAnalysis) ? (
                    <div className="w-full flex flex-col items-center gap-4 py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                       <p className="text-muted-foreground font-bold animate-pulse">Waiting for AI to score both squads...</p>
                    </div>
                 ) : (
                    <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
                      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 shadow-lg">
                        <h2 className="text-3xl font-black mb-6 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Match Results</h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                          <div className={`flex flex-col items-center p-4 rounded-xl ${draft.hostAnalysis.score > draft.guestAnalysis.score ? 'bg-green-500/10 border border-green-500/30' : 'bg-card/50'}`}>
                            <span className="text-xl font-bold">{p1Name}</span>
                            <span className="text-5xl font-black text-blue-500 mt-2">{draft.hostAnalysis.score}</span>
                            <span className="text-xs text-muted-foreground mt-1">/ 10</span>
                          </div>
                          <div className="text-3xl font-black text-muted-foreground italic">VS</div>
                          <div className={`flex flex-col items-center p-4 rounded-xl ${draft.guestAnalysis.score > draft.hostAnalysis.score ? 'bg-green-500/10 border border-green-500/30' : 'bg-card/50'}`}>
                            <span className="text-xl font-bold">{p2Name}</span>
                            <span className="text-5xl font-black text-indigo-500 mt-2">{draft.guestAnalysis.score}</span>
                            <span className="text-xs text-muted-foreground mt-1">/ 10</span>
                          </div>
                        </div>
                        <h3 className="text-2xl font-black mt-8 text-green-400">
                          {draft.hostAnalysis.score === draft.guestAnalysis.score ? "IT'S A TIE!" : 
                           draft.hostAnalysis.score > draft.guestAnalysis.score ? `${p1Name.toUpperCase()} WINS!` : 
                           `${p2Name.toUpperCase()} WINS!`}
                        </h3>
                      </div>

                      <div className="text-left bg-black/40 p-6 rounded-xl border border-white/10 w-full mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-foreground">Your Analysis</h3>
                          <div className="text-2xl font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">{myRole === 1 ? draft.hostAnalysis.score : draft.guestAnalysis.score}/10</div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm">{myRole === 1 ? draft.hostAnalysis.analysis : draft.guestAnalysis.analysis}</p>
                      </div>
                    </div>
                 )}

                 <Button onClick={() => window.location.href = '/dashboard'} variant="outline" size="lg" className="mt-4 h-12 px-8 rounded-xl w-full max-w-md border-blue-500/50 hover:bg-blue-500/10" disabled={!draft.hostAnalysis || !draft.guestAnalysis}>Return to Dashboard</Button>
             </div>
          )}
        </div>

        {/* Roster Right (Guest) */}
        <div className={`lg:col-span-3 space-y-4 ${myRole === 2 ? 'order-2 lg:order-3 lg:sticky lg:top-4 z-20 bg-background/95 pb-4 lg:pb-0 lg:bg-transparent pt-2 lg:pt-0 border-b border-border lg:border-none' : 'order-4 lg:order-3'}`}>
           <h2 className={`text-xl font-bold p-3 rounded-lg border ${draft.currentTurn === 2 ? 'bg-muted border-indigo-500 text-indigo-500' : 'bg-card border-border'} ${myRole === 2 ? 'shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''}`}>
            {p2Name}'s Squad ({p2Roster.length}/11)
            {myRole === 2 && <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">YOU</span>}
          </h2>
          <div className="flex overflow-x-auto gap-2 lg:flex-col lg:space-y-2 pb-2 lg:pb-0 hide-scrollbar">
            {p2Roster.map((p, i) => (
              <div key={p.id} className="flex-shrink-0 w-56 lg:w-full flex items-center gap-3 p-2 bg-card border border-border rounded-md">
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
