import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GameClient from "@/components/game/GameClient";

export default async function DraftPage() {
  const token = (await cookies()).get("auth_token")?.value;
  
  if (!token) {
    redirect("/login?unauthorized=true");
  }

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <GameClient />
    </main>
  );
}
