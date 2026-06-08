"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords, Users, Trophy } from "lucide-react";

const TEMPLATES = [
  { id: "standard", name: "Standard Draft", desc: "All eras, unrestricted.", icon: Swords },
  { id: "foreign", name: "Foreign Imports", desc: "Only overseas players.", icon: Users },
  { id: "legends", name: "All-Time Legends", desc: "Focus on retired Hall of Famers.", icon: Trophy },
];

export default function CreateMatchPage() {
  const router = useRouter();
  const [isHosting, setIsHosting] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("standard");

  const handleHostDraft = async () => {
    setIsHosting(true);
    setError("");
    try {
      const res = await fetch("/api/drafts/live/create", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selectedTemplate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/live/${data.roomId}`);
    } catch (err: any) {
      setError(err.message || "Failed to host match");
      setIsHosting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black mb-2">Create Match</h1>
        <p className="text-muted-foreground text-lg">Generate a new multiplayer room.</p>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg font-bold">{error}</div>}

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-blue-500">Select Ruleset</CardTitle>
          <CardDescription>Choose the drafting conditions for the AI generator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {TEMPLATES.map(t => {
              const Icon = t.icon;
              return (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-border hover:border-muted-foreground'}`}
                >
                  <div className={`p-3 rounded-full ${selectedTemplate === t.id ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <Button onClick={handleHostDraft} disabled={isHosting} size="lg" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] mt-6">
            {isHosting ? "Generating AI Draft Pool..." : "Create Room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
