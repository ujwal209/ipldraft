"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

type Player = { id: string; name: string; image: string; role: string; isForeign: boolean };
type Team = { name: string; code: string; color: string; logo: string };
type DraftOptions = { team: Team; year: number; players: Player[] };

// PlayerCard handles fetching its own PFP lazily
function PlayerCard({ player, teamName, isDrafted, onPick }: { player: Player, teamName: string, isDrafted: boolean, onPick: (p: Player) => void }) {
  const [image, setImage] = useState(player.image);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPfp() {
      try {
        const res = await fetch(`/api/pfp?name=${encodeURIComponent(player.name)}&team=${encodeURIComponent(teamName)}`);
        const data = await res.json();
        if (data.imageUrl) {
          setImage(data.imageUrl);
        }
      } catch (e) {
        console.error("Failed to load PFP for", player.name);
      } finally {
        setLoading(false);
      }
    }
    fetchPfp();
  }, [player.name]);

  return (
    <Card 
      onClick={() => !isDrafted && onPick({...player, image})}
      className={`bg-card/80 backdrop-blur-md border border-border transition-all duration-200 overflow-hidden flex flex-row items-center p-2 gap-3 rounded-lg
        ${isDrafted 
          ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' 
          : 'hover:border-blue-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg group'
        }
      `}
    >
      <div className={`w-12 h-12 bg-muted relative rounded-full overflow-hidden flex-shrink-0 border-2 border-transparent transition-colors ${!isDrafted && 'group-hover:border-blue-500'}`}>
        {loading ? (
            <Skeleton className="w-full h-full" />
        ) : (
            <img 
              src={image} 
              alt={player.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
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

export default function GameClient() {
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [p1Name, setP1Name] = useState("Player 1");

  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [p1Roster, setP1Roster] = useState<Player[]>([]);
  const [p2Roster, setP2Roster] = useState<Player[]>([]);

  const [draftOptions, setDraftOptions] = useState<DraftOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDraftOptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/draft");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setDraftOptions(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeDraft = async () => {
      try {
        const [meRes, draftRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/draft")
        ]);
        const meData = await meRes.json();
        const draftData = await draftRes.json();

        if (meData.user) {
          setP1Name(meData.user.name);
        }
        if (!draftRes.ok) throw new Error(draftData.error || "Failed to fetch draft options");
        
        setDraftOptions(draftData);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    initializeDraft();
  }, []);

  const handlePickPlayer = (player: Player) => {
    const currentRoster = currentTurn === 1 ? p1Roster : p2Roster;
    if (player.isForeign && currentRoster.filter(p => p.isForeign).length >= 4) {
      toast.error("You can only draft a maximum of 4 overseas players.");
      return;
    }

    if (currentTurn === 1) {
      setP1Roster([...p1Roster, player]);
    } else {
      setP2Roster([...p2Roster, player]);
    }
    
    // Check if adding this player brings the roster to 11
    if (p1Roster.length >= 10) {
        setGameState("finished");
        return;
    }
    fetchDraftOptions();
  };

  const handleDragStart = (e: React.DragEvent, index: number, rosterIndex: 1 | 2) => {
    e.dataTransfer.setData("index", index.toString());
    e.dataTransfer.setData("roster", rosterIndex.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, rosterIndex: 1 | 2) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("index"));
    const sourceRoster = parseInt(e.dataTransfer.getData("roster"));
    
    if (sourceRoster !== rosterIndex) return;

    if (rosterIndex === 1) {
      const newRoster = [...p1Roster];
      const [draggedItem] = newRoster.splice(sourceIndex, 1);
      newRoster.splice(targetIndex, 0, draggedItem);
      setP1Roster(newRoster);
    } else {
      const newRoster = [...p2Roster];
      const [draggedItem] = newRoster.splice(sourceIndex, 1);
      newRoster.splice(targetIndex, 0, draggedItem);
      setP2Roster(newRoster);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const [isRating, setIsRating] = useState(false);
  const [aiRating, setAiRating] = useState<{score: number, analysis: string} | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  const analyzeSquad = async () => {
    setIsRating(true);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roster: p1Roster, teamName: p1Name })
      });
      const data = await res.json();
      setAiRating(data);

      // Auto-save the draft to MongoDB
      try {
        const saveRes = await fetch("/api/drafts/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamName: p1Name,
            franchise: "IPL Custom",
            year: new Date().getFullYear(),
            players: p1Roster,
            score: data.score,
            analysis: data.analysis
          })
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          setSavedDraftId(saveData.draftId);
        }
      } catch(err) {
        console.error("Failed to save draft", err);
      }
      
    } catch (error) {
      toast.error("Failed to analyze squad");
    } finally {
      setIsRating(false);
    }
  };

  useEffect(() => {
    if (gameState === "finished" && !aiRating && !isRating) {
      analyzeSquad();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);



  return (
    <div className="min-h-[calc(100vh-4rem)] md:min-h-screen text-foreground p-2 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 pt-4">
        
        {/* Roster Left (Player 1) */}
        <div className="lg:col-span-3 space-y-4 order-1 lg:order-1 bg-background/95 pb-4 lg:pb-0 lg:bg-transparent sticky top-0 z-20 pt-2 lg:pt-0 border-b border-border lg:border-none">
          <h2 className={`text-xl font-bold p-3 rounded-lg border ${currentTurn === 1 ? 'bg-muted border-blue-500 text-blue-500' : 'bg-card border-border'}`}>
            {p1Name}'s Squad ({p1Roster.length}/11)
          </h2>
          <div className="text-xs text-muted-foreground mb-2 italic px-1 hidden lg:block">Drag and drop to reorder batting lineup</div>
          <div className="flex overflow-x-auto gap-2 lg:flex-col lg:space-y-2 pb-2 lg:pb-0 hide-scrollbar">
            {p1Roster.map((p, i) => (
              <div 
                key={p.id} 
                draggable 
                onDragStart={(e) => handleDragStart(e, i, 1)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i, 1)}
                className="flex-shrink-0 w-56 lg:w-full flex items-center gap-3 p-2 bg-card border border-border rounded-md shadow-sm cursor-move hover:border-blue-500 transition-colors"
              >
                <div className="text-muted-foreground w-4 text-center font-bold text-xs">{i + 1}</div>
                <img src={p.image || "/placeholder.svg"} referrerPolicy="no-referrer" alt={p.name} className="w-8 h-8 rounded-full object-cover object-top" />
                <span className="text-sm font-medium">{p.name} {p.isForeign && "✈️"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Draft Board Center */}
        <div className="lg:col-span-6 order-2 lg:order-2 flex flex-col items-center">
          {gameState === "playing" && (
            <>
              <div className="text-center mb-6 mt-4 lg:mt-0">
                <h3 className="text-muted-foreground font-bold tracking-widest text-sm mb-1">ON THE CLOCK</h3>
                <h1 className="text-3xl font-black text-blue-500">{p1Name}</h1>
              </div>

              {isLoading || !draftOptions ? (
                <div className="w-full space-y-8 flex flex-col items-center">
                  <Skeleton className="w-32 h-32 rounded-full" />
                  <Skeleton className="w-64 h-8" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                     {[...Array(11)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <div className="relative mb-6 p-1 rounded-full shadow-2xl" style={{ background: `linear-gradient(135deg, ${draftOptions.team.color}, transparent)` }}>
                    <div className="bg-background rounded-full p-4">
                       <img src={draftOptions.team.logo} alt={draftOptions.team.name} className="w-24 h-24 object-contain" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-black mb-1 text-center drop-shadow-lg">{draftOptions.team.name}</h2>
                  <p className="text-muted-foreground font-bold tracking-widest text-lg mb-8 uppercase">Class of {draftOptions.year}</p>

                  <div className="w-full space-y-6">
                    {/* Top Order */}
                    <div className="bg-card/20 border border-border p-4 rounded-xl">
                      <h3 className="text-sm font-bold mb-3 text-muted-foreground tracking-widest uppercase border-b border-border pb-2">Top Order</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {draftOptions.players.filter(p => p.role === 'Top Order').map((player) => {
                          const isDrafted = p1Roster.some(r => r.name === player.name) || p2Roster.some(r => r.name === player.name);
                          return <PlayerCard key={player.id} player={player} teamName={draftOptions.team.name} isDrafted={isDrafted} onPick={handlePickPlayer} />;
                        })}
                      </div>
                    </div>

                    {/* Middle Order */}
                    <div className="bg-card/20 border border-border p-4 rounded-xl">
                      <h3 className="text-sm font-bold mb-3 text-muted-foreground tracking-widest uppercase border-b border-border pb-2">Middle Order & All-Rounders</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {draftOptions.players.filter(p => p.role === 'Middle Order').map((player) => {
                          const isDrafted = p1Roster.some(r => r.name === player.name) || p2Roster.some(r => r.name === player.name);
                          return <PlayerCard key={player.id} player={player} teamName={draftOptions.team.name} isDrafted={isDrafted} onPick={handlePickPlayer} />;
                        })}
                      </div>
                    </div>

                    {/* Lower Order */}
                    <div className="bg-card/20 border border-border p-4 rounded-xl">
                      <h3 className="text-sm font-bold mb-3 text-muted-foreground tracking-widest uppercase border-b border-border pb-2">Lower Order & Bowlers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {draftOptions.players.filter(p => p.role === 'Lower Order').map((player) => {
                          const isDrafted = p1Roster.some(r => r.name === player.name) || p2Roster.some(r => r.name === player.name);
                          return <PlayerCard key={player.id} player={player} teamName={draftOptions.team.name} isDrafted={isDrafted} onPick={handlePickPlayer} />;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {gameState === "finished" && (
             <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-6 animate-in zoom-in fade-in duration-700 mt-12 bg-card/50 backdrop-blur-md p-8 rounded-2xl border border-border shadow-2xl">
                 <h1 className="text-4xl font-black text-blue-500 drop-shadow-md">Draft Complete!</h1>
                 <p className="text-lg text-muted-foreground mb-4">The ultimate squads have been formed.</p>
                 
                 {aiRating ? (
                    <div className="text-left bg-black/40 p-6 rounded-xl border border-white/10 w-full animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-foreground">AI Analysis for {p1Name}</h3>
                        <div className="text-2xl font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">{aiRating.score}/10</div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-sm">{aiRating.analysis}</p>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-4 py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                       <p className="text-muted-foreground font-bold animate-pulse">AI is analyzing your squad...</p>
                    </div>
                  )}

                 {savedDraftId && (
                   <div className="text-green-500 font-bold text-sm mt-2">
                     Draft permanently saved to your account!
                   </div>
                 )}

                 <Button onClick={() => window.location.reload()} variant="outline" size="lg" className="mt-4 h-12 px-8 rounded-xl w-full max-w-md border-blue-500/50 hover:bg-blue-500/10">Play Again</Button>
             </div>
          )}
        </div>



      </div>
    </div>
  );
}
