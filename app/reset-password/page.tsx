"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <CardContent className="text-center text-red-500 py-8">
        Invalid or missing reset token.
      </CardContent>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <CardContent className="text-center py-8">
        <div className="text-green-500 font-bold mb-4">Password reset successful!</div>
        <Link href="/login">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">Return to Login</Button>
        </Link>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm text-center">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
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
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"} 
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="bg-background border-border focus:border-blue-500 pr-10" 
            />
          </div>
        </div>
        <Button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </CardContent>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-5xl font-black leading-tight">Secure Authorization.</h1>
          <p className="text-lg text-blue-100 font-medium">Input your new cryptographic key to finalize the credential reset sequence and restore database access.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col items-center justify-center p-8 bg-background relative">
        <Link href="/" className="lg:hidden text-2xl font-black tracking-tight text-blue-500 absolute top-6 left-6">
          PDA
        </Link>
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border border-0 shadow-none sm:border sm:shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-blue-500">New Password</CardTitle>
            <CardDescription>Establish a new secure passphrase.</CardDescription>
          </CardHeader>
          <Suspense fallback={<CardContent className="text-center p-4 text-muted-foreground animate-pulse">Verifying Security Token...</CardContent>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
