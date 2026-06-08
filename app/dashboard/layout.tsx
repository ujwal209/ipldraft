"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Swords, User, Users, History, LogOut, Gamepad2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/multiplayer", label: "Multiplayer Drafts", icon: Swords },
  { href: "/dashboard/single-player", label: "Single Player", icon: Gamepad2 },
  { href: "/dashboard/friends", label: "Social Hub", icon: Users },
  { href: "/dashboard/history", label: "Match History", icon: History },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-md sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-black text-blue-500 leading-tight tracking-tighter">PREMIER DRAFT<br/>ANALYTICS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border flex flex-col gap-4">
          <Button onClick={handleLogout} variant="outline" className="w-full flex items-center justify-start gap-3 border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
          <div className="flex items-center justify-between px-2">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Theme</span>
             <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <h1 className="text-lg font-black text-blue-500 tracking-tighter">PDA</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-red-500"><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pb-24 md:pb-0 relative overflow-y-auto min-h-[calc(100vh-4rem)] md:min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-xl border-t border-border z-50 flex justify-around p-2 pb-safe">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-blue-500' : 'text-muted-foreground'}`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
