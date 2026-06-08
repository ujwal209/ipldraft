"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { History } from "lucide-react";

export default function HistoryPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/drafts/history")
      .then(res => res.json())
      .then(data => {
        if (data.drafts) setDrafts(data.drafts);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 animate-pulse font-bold text-muted-foreground">Loading History...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black mb-2">Match History</h1>
        <p className="text-muted-foreground text-lg">Review your previous drafts and AI analysis.</p>
      </div>

      {drafts.length === 0 ? (
        <Card className="bg-card/50 border-border p-12 text-center flex flex-col items-center justify-center">
           <History className="w-24 h-24 mb-6 opacity-20" />
           <h2 className="text-xl font-black text-foreground mb-2">No Matches Found</h2>
           <p className="text-muted-foreground">You haven't completed any multiplayer drafts yet. Head to the Lobby to start one!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map(draft => (
            <Card key={draft._id} className="bg-card/50 border-border hover:border-blue-500/50 transition-colors overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Draft Info */}
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                     <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold tracking-widest uppercase border border-blue-500/20 shadow-sm">AI Rated</span>
                     <span className="text-xs text-muted-foreground font-bold">{new Date(draft.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-1">{draft.franchise || 'Custom Franchise'}</h3>
                  <p className="text-muted-foreground font-bold tracking-widest text-sm uppercase">Class of {draft.year || new Date(draft.createdAt).getFullYear()}</p>
                  
                  <div className="mt-4 p-4 bg-black/20 rounded-lg border border-border">
                     <div className="flex justify-between items-center mb-2">
                       <span className="font-bold text-sm text-muted-foreground">AI Rating</span>
                       <span className="font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{draft.score}/10</span>
                     </div>
                     <p className="text-sm text-foreground/80 leading-relaxed">{draft.analysis}</p>
                  </div>
                </div>

                {/* Players */}
                <div className="p-6 bg-muted/20 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center w-full md:w-[350px]">
                   <h4 className="font-bold mb-3 text-center text-sm tracking-widest uppercase text-muted-foreground">Your Squad ({draft.players?.length || 0})</h4>
                   <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar w-full">
                     {draft.players?.map((p: any, i: number) => (
                       <div key={p.id || p.name} className="flex-shrink-0 w-48 flex items-center gap-2 p-2 bg-card border border-border rounded-md shadow-sm hover:border-blue-500 transition-colors">
                         <div className="text-muted-foreground w-3 text-center font-bold text-xs">{i + 1}</div>
                         <img src={p.image || "/placeholder.svg"} referrerPolicy="no-referrer" alt={p.name} className="w-6 h-6 rounded-full object-cover object-top" />
                         <span className="text-xs font-medium truncate">{p.name} {p.isForeign && "✈️"}</span>
                       </div>
                     ))}
                   </div>
                   
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button variant="outline" className="w-full mt-4 font-bold border-blue-500/50 text-blue-500 hover:bg-blue-500/10">View Squad Detail</Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-[95vw] sm:max-w-[95vw] md:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-background/98 backdrop-blur-3xl border-border shadow-2xl p-4 md:p-8 rounded-2xl">
                       <DialogHeader className="mb-4">
                         <DialogTitle className="text-2xl md:text-4xl font-black text-blue-500">{draft.franchise} <span className="text-foreground text-xl md:text-3xl">- Class of {draft.year}</span></DialogTitle>
                       </DialogHeader>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-6">
                         {draft.players?.map((p: any, i: number) => (
                           <div key={p.id || p.name} className="flex flex-col items-center gap-3 p-6 bg-card/60 backdrop-blur-md border border-border rounded-2xl shadow-xl hover:border-blue-500 transition-all hover:-translate-y-1">
                             <div className="text-blue-500 font-black text-2xl absolute top-3 left-4 opacity-50">{i + 1}</div>
                             <img src={p.image || "/placeholder.svg"} referrerPolicy="no-referrer" alt={p.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover object-top border-4 border-muted shadow-md" />
                             <div className="flex flex-col items-center text-center mt-2 w-full">
                               <span className="font-black text-lg md:text-xl text-foreground leading-tight">
                                 {p.name} {p.isForeign && "✈️"}
                               </span>
                               <span className="text-sm md:text-base text-muted-foreground font-bold tracking-wider uppercase mt-1 bg-muted px-3 py-1 rounded-full">{p.role}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </DialogContent>
                   </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
