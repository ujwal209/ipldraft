"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinMatchPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoinDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setIsJoining(true);
    setError("");
    try {
      const res = await fetch("/api/drafts/live/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: joinCode.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/live/${data.roomId}`);
    } catch (err: any) {
      setError(err.message || "Failed to join match");
      setIsJoining(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black mb-2">Join Match</h1>
        <p className="text-muted-foreground text-lg">Connect to a live multiplayer lobby.</p>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg font-bold">{error}</div>}

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-indigo-500">Access Code</CardTitle>
          <CardDescription>Enter the 6-digit room code provided by the host.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinDraft} className="space-y-8">
            <div className="py-8">
              <Input 
                placeholder="000000" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0,6))}
                className="h-24 text-center text-5xl font-black tracking-[0.25em] bg-background border-border rounded-2xl placeholder:text-muted"
                maxLength={6}
              />
            </div>
            <Button type="submit" disabled={isJoining || joinCode.length !== 6} size="lg" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]">
              {isJoining ? "Connecting to Host..." : "Join Game"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
