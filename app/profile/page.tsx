"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push("/login");
        } else {
          setUser(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        if (data.url) {
          setUser((prev: any) => ({ ...prev, avatarUrl: data.url }));
        }
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 flex flex-col items-center gap-8">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-xl border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-blue-500">Player Profile</CardTitle>
          <CardDescription>Manage your account and avatar</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full border-4 border-blue-500 overflow-hidden relative group bg-muted">
              <img 
                src={user.avatarUrl || "/placeholder.svg"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-white font-bold text-sm">Change Avatar</span>
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            {uploading && <div className="text-sm text-blue-500 font-bold animate-pulse">Uploading...</div>}
          </div>
          
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-black">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="pt-4 space-x-4">
              <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white">Back to Draft</Button>
              <Button onClick={handleLogout} variant="destructive">Logout</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
