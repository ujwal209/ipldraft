"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, MessageCircle, SwordsIcon } from "lucide-react";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "search">("friends");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Connections state
  const [connections, setConnections] = useState<any[]>([]);
  const pendingRequests = connections.filter(c => c.status === "pending" && c.recipient._id === currentUser?._id);
  const friends = connections.filter(c => c.status === "accepted");

  // Chat state
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load User & Connections
  const loadData = async () => {
    try {
      const [meRes, connRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/friends/request")
      ]);
      const meData = await meRes.json();
      const connData = await connRes.json();
      if (meData.user) setCurrentUser(meData.user);
      if (connData.connections) setConnections(connData.connections);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const prevPendingLength = useRef(0);
  useEffect(() => {
    if (pendingRequests.length > prevPendingLength.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) { /* ignore */ }
    }
    prevPendingLength.current = pendingRequests.length;
  }, [pendingRequests.length]);

  // Search Logic
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      const uniqueUsers = Array.from(new Map((data.users || []).map((u: any) => [u._id, u])).values());
      setSearchResults(uniqueUsers as any[]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSendRequest = async (targetId: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId, action: "send" })
      });
      if (res.ok) {
        toast.success("Request sent!");
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to send request");
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: requesterId, action: "accept" })
      });
      if (res.ok) {
        toast.success("Request accepted!");
        loadData();
      }
    } catch (e) {
      toast.error("Failed to accept request");
    }
  };

  const handleCancelRequest = async (targetId: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId, action: "cancel" })
      });
      if (res.ok) {
        toast.success("Request cancelled.");
        loadData();
      }
    } catch (e) {
      toast.error("Failed to cancel request");
    }
  };

  // Chat Logic
  const fetchMessages = async (friendId: string) => {
    try {
      const res = await fetch(`/api/chat/${friendId}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!activeFriend) return;
    fetchMessages(activeFriend._id);
    const interval = setInterval(() => fetchMessages(activeFriend._id), 2000);
    return () => clearInterval(interval);
  }, [activeFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const content = directMessage || newMessage;
    if (!content.trim() || !activeFriend) return;
    
    setNewMessage(""); // clear optimistically
    // Optimistic UI
    setMessages(prev => [...prev, { _id: Date.now(), sender: currentUser._id, content, createdAt: new Date().toISOString() }]);

    try {
      await fetch(`/api/chat/${activeFriend._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      fetchMessages(activeFriend._id);
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleChallenge = async () => {
    if (!activeFriend) return;
    toast.success("Generating Draft Room...");
    try {
      const res = await fetch("/api/drafts/live/create", { method: "POST" });
      const data = await res.json();
      if (data.roomId) {
        const joinLink = `${window.location.origin}/dashboard/live/${data.roomId}`;
        const challengeText = `🎮 I challenge you to a Draft! Click here to join: ${joinLink}`;
        handleSendMessage(undefined, challengeText);
        
        // Wait a sec then redirect host to room
        setTimeout(() => {
          window.location.href = `/dashboard/live/${data.roomId}`;
        }, 1500);
      }
    } catch (e) {
      toast.error("Failed to create challenge");
    }
  };

  if (!currentUser) return <div className="p-10 animate-pulse font-bold">Loading Network...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto gap-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black mb-1">Social Hub</h1>
        <p className="text-muted-foreground">Connect with friends, chat, and issue direct challenges.</p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0 h-full relative">
        
        {/* Left Sidebar: Network list (Hidden on mobile if chat is active) */}
        <Card className={`lg:col-span-4 flex flex-col h-full bg-card/50 border-border overflow-hidden ${activeFriend ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border flex gap-2">
            <Button variant={activeTab === "friends" ? "default" : "outline"} className="flex-1 font-bold" onClick={() => setActiveTab("friends")}>Friends</Button>
            <Button variant={activeTab === "search" ? "default" : "outline"} className="flex-1 font-bold" onClick={() => setActiveTab("search")}>Discover</Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {activeTab === "search" && (
              <div className="space-y-4">
                <Input placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-background" />
                
                {searchQuery.length > 0 && searchQuery.length < 3 && <div className="text-center text-sm text-muted-foreground py-4">Type at least 3 characters...</div>}
                {searchQuery.length >= 3 && searchResults.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">No users found.</div>}
                
                <div className="space-y-2">
                  {searchResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors rounded-xl border border-border shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=0284c7`} className="w-10 h-10 rounded-full object-cover border border-border" alt={u.name} />
                        <div>
                          <div className="font-bold text-sm leading-tight">{u.name}</div>
                          <div className="text-xs text-muted-foreground font-medium">{u.email}</div>
                        </div>
                      </div>
                      {(() => {
                        const conn = connections.find(c => (c.recipient._id === u._id || c.requester._id === u._id));
                        if (!conn) {
                          return <Button size="sm" onClick={() => handleSendRequest(u._id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-4 text-xs shadow-sm">Add</Button>;
                        }
                        if (conn.status === "accepted") {
                          return <Button size="sm" variant="secondary" disabled className="h-8 text-xs font-bold shadow-sm">Friends</Button>;
                        }
                        if (conn.requester._id === currentUser?._id) {
                          return <Button size="sm" onClick={() => handleCancelRequest(u._id)} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 font-bold h-8 px-3 text-xs border border-red-500/20 shadow-sm">Cancel</Button>;
                        }
                        return <Button size="sm" onClick={() => handleAcceptRequest(u._id)} className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 px-4 text-xs shadow-sm">Accept</Button>;
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="space-y-6">
                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Pending Requests</h3>
                    <div className="space-y-2">
                      {pendingRequests.map(req => (
                        <div key={req._id} className="flex items-center justify-between p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                          <div className="flex items-center gap-3">
                            <img src={req.requester.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.requester.name)}&backgroundColor=0284c7`} className="w-8 h-8 rounded-full" alt={req.requester.name} />
                            <div className="font-bold text-sm text-indigo-500">{req.requester.name}</div>
                          </div>
                          <Button size="sm" onClick={() => handleAcceptRequest(req.requester._id)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-3 text-xs font-bold">Accept</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                   <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Your Network</h3>
                   {friends.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">Your network is empty. Discover users to add them!</div>}
                   <div className="space-y-2">
                     {friends.map(f => {
                       const friendUser = f.requester._id === currentUser._id ? f.recipient : f.requester;
                       const isActive = activeFriend?._id === friendUser._id;
                       return (
                         <div 
                           key={f._id} 
                           onClick={() => setActiveFriend(friendUser)}
                           className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isActive ? 'bg-blue-500/10 border-blue-500 shadow-md' : 'bg-card hover:bg-muted border-border'}`}
                         >
                           <div className="relative">
                             <img src={friendUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friendUser.name)}&backgroundColor=0284c7`} className="w-10 h-10 rounded-full object-cover" alt={friendUser.name} />
                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                           </div>
                           <div>
                             <div className="font-bold text-sm leading-tight">{friendUser.name}</div>
                             <div className="text-xs text-muted-foreground">{friendUser.favoriteTeam}</div>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Sidebar: Chat & Challenge (Hidden on mobile if no active friend) */}
        <Card className={`lg:col-span-8 flex flex-col h-full bg-card/80 backdrop-blur-xl border-border overflow-hidden ${!activeFriend ? 'hidden lg:flex' : 'flex absolute inset-0 lg:relative z-10'}`}>
          {activeFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden mr-1" onClick={() => setActiveFriend(null)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </Button>
                  <img src={activeFriend.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeFriend.name)}&backgroundColor=0284c7`} className="w-12 h-12 rounded-full object-cover" alt={activeFriend.name} />
                  <div>
                    <h2 className="font-black text-lg">{activeFriend.name}</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{activeFriend.favoriteTeam}</p>
                  </div>
                </div>
                <Button onClick={handleChallenge} className="bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/20 px-6">
                  <Swords className="w-5 h-5 mr-2" />
                  Challenge
                </Button>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map(msg => {
                    const isMe = msg.sender === currentUser._id;
                    // Auto-link detector for join links
                    const hasLink = msg.content.includes("/join/");
                    
                    return (
                      <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                          {hasLink ? (
                            <div className="text-sm font-medium whitespace-pre-wrap">
                              {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => {
                                if (part.match(/https?:\/\/[^\s]+/)) {
                                  return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline font-black block mt-2 p-2 bg-black/20 rounded-lg text-center hover:bg-black/30 transition-colors">🔥 JOIN DRAFT ROOM</a>
                                }
                                return part;
                              })}
                            </div>
                          ) : (
                            <p className="text-sm font-medium">{msg.content}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold mt-1 opacity-50">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-border bg-muted/20 flex gap-3">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder={`Message ${activeFriend.name}...`} 
                  className="flex-1 bg-background"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white px-8 font-bold">Send</Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <MessageCircle className="w-20 h-20 mb-6 opacity-20" />
              <h2 className="text-xl font-black text-foreground mb-2">No Chat Selected</h2>
              <p>Select a friend from your network on the left to start chatting or issue a draft challenge.</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
