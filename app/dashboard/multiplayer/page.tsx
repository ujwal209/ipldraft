"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";

export default function MultiplayerHub() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black mb-2">Multiplayer Drafts</h1>
        <p className="text-muted-foreground text-lg">Compete in real-time online drafts against your friends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <Link href="/dashboard/multiplayer/create" className="group">
          <Card className="bg-card/50 border-border h-full transition-all group-hover:border-blue-500 group-hover:bg-blue-500/5 group-hover:-translate-y-1">
            <CardContent className="p-10 flex flex-col items-center text-center gap-6">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">Host Match</h2>
                <p className="text-muted-foreground">Select a ruleset and generate a 6-digit access code for an opponent to join.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/multiplayer/join" className="group">
          <Card className="bg-card/50 border-border h-full transition-all group-hover:border-indigo-500 group-hover:bg-indigo-500/5 group-hover:-translate-y-1">
            <CardContent className="p-10 flex flex-col items-center text-center gap-6">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                <Search className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">Join Match</h2>
                <p className="text-muted-foreground">Enter an access code to connect directly to an active lobby.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
