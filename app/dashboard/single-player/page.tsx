"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function SinglePlayerHub() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black mb-2">Single Player</h1>
        <p className="text-muted-foreground text-lg">Practice your drafting skills offline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <Link href="/dashboard/draft" className="group">
          <Card className="bg-card/50 border-border h-full transition-all hover:border-orange-500 hover:bg-orange-500/5 hover:-translate-y-1 relative overflow-hidden">
            <CardContent className="p-10 flex flex-col items-center text-center gap-6">
              <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">Solo Draft</h2>
                <p className="text-muted-foreground">Jump straight into a solitary practice draft session.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
