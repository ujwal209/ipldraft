"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) router.push("/login");
        else setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) return <div className="p-10 animate-pulse font-bold text-muted-foreground">Loading Profile...</div>;
  if (!user) return null;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your identity and franchise allegiance.</p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">Sign Out</Button>
      </div>

      <Card className="bg-card/80 backdrop-blur-md border-border overflow-hidden relative shadow-2xl">
        <div className="h-32 bg-blue-600 w-full absolute top-0 left-0" />
        <CardContent className="pt-16 flex flex-col items-center text-center relative z-10">
          <div className="w-40 h-40 rounded-full border-4 border-background bg-muted overflow-hidden relative group mb-6 shadow-2xl">
            <img src={user.avatarUrl || "/placeholder.svg"} alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-white font-bold text-sm">Upload Photo</span>
            </div>
          </div>
          <h2 className="text-3xl font-black mb-1">{user.name}</h2>
          <p className="text-muted-foreground mb-8 text-lg">{user.email}</p>
          
          <div className="w-full max-w-md bg-background/50 p-6 rounded-2xl border border-border shadow-inner">
            <div className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-2">Franchise Allegiance</div>
            <div className="font-black text-2xl text-blue-500">{user.favoriteTeam}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
