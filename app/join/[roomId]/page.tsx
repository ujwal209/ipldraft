"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function JoinLinkRedirect() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  useEffect(() => {
    const attemptJoin = async () => {
      try {
        const res = await fetch("/api/drafts/live/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });

        // Even if it fails (e.g. they are the host), we just route them to the live room.
        // The live room API handles the auth checks.
        router.push(`/dashboard/live/${roomId}`);
      } catch (err) {
        toast.error("Failed to process join link");
        router.push("/dashboard");
      }
    };

    attemptJoin();
  }, [roomId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-pulse font-black tracking-widest text-blue-500">
      AUTHENTICATING CONNECTION...
    </div>
  );
}
