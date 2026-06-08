"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const IPL_TEAMS = [
  { name: "Chennai Super Kings", color: "bg-yellow-500", logo: "/logos/Chennai_Super_Kings.png" },
  { name: "Mumbai Indians", color: "bg-blue-600", logo: "/logos/Mumbai_Indians.png" },
  { name: "Royal Challengers Bangalore", color: "bg-red-600", logo: "/logos/Royal_Challengers_Bangalore.png" },
  { name: "Kolkata Knight Riders", color: "bg-purple-800", logo: "/logos/Kolkata_Knight_Riders.png" },
  { name: "Sunrisers Hyderabad", color: "bg-orange-500", logo: "/logos/Sunrisers_Hyderabad.png" },
  { name: "Delhi Capitals", color: "bg-blue-400", logo: "/logos/Delhi_Capitals.png" },
  { name: "Rajasthan Royals", color: "bg-pink-500", logo: "/logos/Rajasthan_Royals.png" },
  { name: "Punjab Kings", color: "bg-red-500", logo: "/logos/Punjab_Kings.png" },
  { name: "Gujarat Titans", color: "bg-teal-600", logo: "/logos/Gujarat_Titans.png" },
  { name: "Lucknow Super Giants", color: "bg-cyan-800", logo: "/logos/Lucknow_Super_Giants.png" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push("/login");
        } else if (data.user.isOnboarded) {
          router.push("/dashboard");
        }
      });
  }, [router]);

  const handleOnboard = async () => {
    if (!selectedTeam) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteTeam: selectedTeam }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        throw new Error("Failed to onboard");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-4xl bg-card/80 backdrop-blur-xl border-border shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 font-bold text-sm mb-4 tracking-widest uppercase mx-auto">
            Account Initialization
          </div>
          <CardTitle className="text-4xl font-black text-blue-500">Choose Your Franchise</CardTitle>
          <CardDescription className="text-lg">Select your primary allegiance before entering the drafting dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {IPL_TEAMS.map((team) => (
              <button
                key={team.name}
                onClick={() => setSelectedTeam(team.name)}
                className={`relative overflow-hidden rounded-xl h-32 flex items-center justify-center p-4 border-2 transition-all ${selectedTeam === team.name ? 'border-blue-500 scale-105 shadow-xl shadow-blue-500/20' : 'border-border hover:border-muted-foreground bg-muted/50'}`}
              >
                <div className={`absolute top-0 w-full h-2 ${team.color}`} />
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="w-14 h-14 bg-background rounded-full p-2 shadow-sm border border-border">
                    <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-xs text-center leading-tight line-clamp-2">{team.name}</span>
                </div>
                {selectedTeam === team.name && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full text-white font-black flex items-center justify-center text-xs shadow-lg animate-in zoom-in duration-200">✓</div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-8 border-t border-border">
            <Button 
              onClick={handleOnboard} 
              disabled={!selectedTeam || loading} 
              size="lg" 
              className="h-14 px-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
            >
              {loading ? "Initializing..." : "Confirm & Enter Dashboard"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
