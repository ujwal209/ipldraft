"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Swords, Gamepad2, Users, History, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardOverview() {
  const [stats, setStats] = useState({ network: 0, matches: 0 });

  useEffect(() => {
    // Quick fetch to get stats for the dashboard overview
    Promise.all([
      fetch("/api/friends/request").then(res => res.json()),
      fetch("/api/drafts/history").then(res => res.json())
    ]).then(([friendsData, historyData]) => {
      const activeFriends = friendsData.connections?.filter((c: any) => c.status === "accepted").length || 0;
      const totalMatches = historyData.drafts?.length || 0;
      setStats({ network: activeFriends, matches: totalMatches });
    }).catch(console.error);
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-lg">Welcome to your Command Center.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-card border border-border px-6 py-3 rounded-xl text-center">
             <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Network</div>
             <div className="text-2xl font-black text-blue-500 flex items-center justify-center gap-2">
               <Users className="w-5 h-5" /> {stats.network}
             </div>
           </div>
           <div className="bg-card border border-border px-6 py-3 rounded-xl text-center">
             <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Matches</div>
             <div className="text-2xl font-black text-indigo-500 flex items-center justify-center gap-2">
               <Activity className="w-5 h-5" /> {stats.matches}
             </div>
           </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Link href="/dashboard/multiplayer" className="group">
          <Card className="bg-card/50 border-border h-full transition-all group-hover:border-blue-500 group-hover:bg-blue-500/5 overflow-hidden relative">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-inner">
                <Swords className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black mb-1">Multiplayer Drafts</h2>
                <p className="text-muted-foreground text-sm">Host a room, challenge friends, or join an active lobby.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/single-player" className="group">
          <Card className="bg-card/50 border-border h-full transition-all group-hover:border-emerald-500 group-hover:bg-emerald-500/5 overflow-hidden relative">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black mb-1">Single Player</h2>
                <p className="text-muted-foreground text-sm">Practice drafting against AI or play locally with a friend.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/friends" className="group">
          <Card className="bg-card/50 border-border h-full transition-all group-hover:border-purple-500 group-hover:bg-purple-500/5 overflow-hidden relative">
            <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black mb-1">Social Hub</h2>
                <p className="text-muted-foreground text-sm">Manage connections, search for users, and chat in real-time.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/history" className="group">
          <Card className="bg-card/50 border-border h-full transition-all group-hover:border-orange-500 group-hover:bg-orange-500/5 overflow-hidden relative">
            <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shadow-inner">
                <History className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black mb-1">Match History</h2>
                <p className="text-muted-foreground text-sm">Review past draft boards, AI analysis, and historical match stats.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
