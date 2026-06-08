"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border text-center py-8 shadow-2xl">
          <CardContent className="text-center py-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"></path><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path><path d="m16 19 2 2 4-4"></path></svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-foreground">Verify Your Email</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              We've sent a 6-digit verification code to <span className="font-bold text-foreground">{email}</span>.
            </p>
            
            {error && <div className="p-3 mb-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold w-full">{error}</div>}

            <div className="mb-8">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-14 w-12 text-xl font-black" />
                  <InputOTPSlot index={1} className="h-14 w-12 text-xl font-black" />
                  <InputOTPSlot index={2} className="h-14 w-12 text-xl font-black" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-14 w-12 text-xl font-black" />
                  <InputOTPSlot index={4} className="h-14 w-12 text-xl font-black" />
                  <InputOTPSlot index={5} className="h-14 w-12 text-xl font-black" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={handleVerifyOtp} 
              disabled={verifying || otp.length !== 6} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              {verifying ? "Verifying Token..." : "Authenticate"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-5xl font-black leading-tight">Initialize Your Franchise.</h1>
          <p className="text-lg text-blue-100 font-medium">Join an elite tier of cricket strategists. Create your profile, connect to the cloud cluster, and start drafting.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col items-center justify-center p-8 bg-background relative">
        <Link href="/" className="lg:hidden text-2xl font-black tracking-tight text-blue-500 absolute top-6 left-6">
          PDA
        </Link>
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border border-0 shadow-none sm:border sm:shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-blue-500">Create Clearance</CardTitle>
            <CardDescription>Establish your identity on the secure database.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm text-center">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="bg-background border-border focus:border-blue-500" 
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="password">Secure Password</Label>
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
                {loading ? "Establishing Link..." : "Initialize Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-start">
            <p className="text-sm text-muted-foreground">
              Already initialized? <Link href="/login" className="text-blue-500 font-bold hover:underline">Log in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
