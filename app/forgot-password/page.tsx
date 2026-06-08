"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");

      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-5xl font-black leading-tight">Recover Credentials.</h1>
          <p className="text-lg text-blue-100 font-medium">Re-establish a secure connection to the database. We will send cryptographic recovery instructions directly to your comms.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col items-center justify-center p-8 bg-background relative">
        <Link href="/" className="lg:hidden text-2xl font-black tracking-tight text-blue-500 absolute top-6 left-6">
          PDA
        </Link>
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border border-0 shadow-none sm:border sm:shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-blue-500">Reset Password</CardTitle>
            <CardDescription>Transmit a secure recovery request.</CardDescription>
          </CardHeader>
          <CardContent>
            {message ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-center font-medium">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm text-center">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-background border-border focus:border-blue-500" 
                  />
                </div>
                <Button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                  {loading ? "Transmitting..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-start">
            <Link href="/login" className="text-sm text-blue-500 hover:underline">Abort and return to Login</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
