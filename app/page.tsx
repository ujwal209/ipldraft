import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LandingPage() {
  const token = (await cookies()).get('auth_token')?.value;
  const isLoggedIn = !!token;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 w-full p-4 px-6 flex justify-between items-center z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="text-2xl font-black tracking-tight text-blue-500">Premier Draft Analytics</div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="outline" className="font-bold border-blue-500/50 hover:bg-blue-500/10">Dashboard</Button>
            </Link>
          ) : (
            <div className="space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="font-bold">Log in</Button>
              </Link>
              <Link href="/register">
                <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] py-20 p-4 text-center overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="space-y-6 max-w-4xl animate-in slide-in-from-bottom-8 fade-in duration-1000 relative z-20">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 font-bold text-sm mb-4 tracking-widest uppercase">
            The Ultimate Cricket Draft Experience
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
            Build Your <span className="text-blue-500">Legendary Squad</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Scout, draft, and assemble the greatest team in history. Compete against an intelligent opponent and see how your ultimate 15-man squad scores.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/draft">
              <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95">
                Enter Draft Room
              </Button>
            </Link>
            {!isLoggedIn && (
              <Link href="/register">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-xl border-border hover:bg-muted transition-all">
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 bg-card/50 backdrop-blur-md rounded-3xl border border-border mb-20 shadow-xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Elite Drafting Tools</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to scout, pick, and finalize the perfect roster.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-background border border-border p-8 rounded-2xl transition-all hover:border-blue-500">
            <h3 className="text-xl font-bold mb-3 text-blue-500">Tactical Squad Analysis</h3>
            <p className="text-muted-foreground leading-relaxed">Upon completion, your team receives a detailed tactical grade assessing your top order, all-rounders, and bowling depth.</p>
          </div>
          <div className="bg-background border border-border p-8 rounded-2xl transition-all hover:border-indigo-500">
            <h3 className="text-xl font-bold mb-3 text-indigo-500">Save Your Legacy</h3>
            <p className="text-muted-foreground leading-relaxed">All your drafted squads are securely saved to your account. Log in from anywhere to view your past masterpieces.</p>
          </div>
          <div className="bg-background border border-border p-8 rounded-2xl transition-all hover:border-purple-500">
            <h3 className="text-xl font-bold mb-3 text-purple-500">Real Player Profiles</h3>
            <p className="text-muted-foreground leading-relaxed">Draft with real historical data and authentic player headshots dynamically fetched for thousands of domestic and foreign players.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 max-w-4xl mx-auto relative z-10 mb-20">
        <div className="space-y-12 text-center">
          <h2 className="text-4xl font-black">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-900/20">1</div>
              <h4 className="font-bold text-xl">The Draft Pool</h4>
              <p className="text-muted-foreground">Every draft session generates a unique pool of elite batters, bowlers, and all-rounders across multiple eras.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-900/20">2</div>
              <h4 className="font-bold text-xl">Make Your Picks</h4>
              <p className="text-muted-foreground">Go head-to-head. Pick the best available talent to build a perfectly balanced 15-man squad.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-900/20">3</div>
              <h4 className="font-bold text-xl">Get Scored</h4>
              <p className="text-muted-foreground">Set your final batting order and submit your squad. Receive an instant tactical breakdown and final grade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 text-center text-muted-foreground bg-card/30">
        <p className="font-medium">© 2026 Premier Draft Analytics. Built for elite statistical simulation.</p>
      </footer>
    </div>
  );
}
