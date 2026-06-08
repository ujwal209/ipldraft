"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("unauthorized");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Redirect to onboarding or dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        {unauthorized && (
          <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-sm text-center font-bold">
            You must be logged in to enter the Draft Room.
          </div>
        )}
        {error && <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm text-center">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="bg-background border-border focus:border-blue-500" 
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="bg-background border-border focus:border-blue-500 pr-10" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
        </div>
        <Button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-center items-start p-16 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/30 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <Link href="/" className="text-2xl font-black tracking-tight mb-12 block hover:opacity-80 transition-opacity">
            Premier Draft Analytics
          </Link>
          <h1 className="text-5xl font-black leading-tight">Welcome Back to the War Room.</h1>
          <p className="text-lg text-blue-100 font-medium">Log in to securely access your cloud-saved drafts, edit your scouting profiles, and re-engage the simulation engine.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col items-center justify-center p-8 bg-background relative">
        <Link href="/" className="lg:hidden text-2xl font-black tracking-tight text-blue-500 absolute top-6 left-6">
          PDA
        </Link>
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border border-0 shadow-none sm:border sm:shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-blue-500">Secure Login</CardTitle>
            <CardDescription>Authenticate your session via MongoDB.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center p-4 text-muted-foreground animate-pulse">Initializing Security Protocol...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
          <CardFooter className="justify-start">
            <p className="text-sm text-muted-foreground">
              No clearance? <Link href="/register" className="text-blue-500 font-bold hover:underline">Request Access</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
