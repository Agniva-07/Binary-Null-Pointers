/**
 * JudgesDemo — Standalone demo page for pitch presentations.
 *
 * Shows the full Volunteer Response Chat System with dummy data
 * pre-loaded. No SOS trigger needed — everything is visible
 * and interactive from the start.
 *
 * Access via: /demo
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Demo flag ────────────────────────────────────────────────────────────────
const DEMO_MODE = true;

// ── Types ────────────────────────────────────────────────────────────────────

interface DemoVolunteer {
  id: string;
  name: string;
  distance: number;
  status: "On the way" | "Available" | "Arrived";
  avatar: string;
  phone: string;
  assigned: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "volunteer";
  timestamp: number;
  volunteerName?: string;
}

// ── Dummy Volunteers ─────────────────────────────────────────────────────────

const DEMO_VOLUNTEERS: DemoVolunteer[] = [
  { id: "v1", name: "Aarav Sharma",   distance: 34,  status: "On the way", avatar: "A", phone: "+91 98765 43210", assigned: true },
  { id: "v2", name: "Priya Menon",    distance: 72,  status: "Available",  avatar: "P", phone: "+91 98765 43211", assigned: true },
  { id: "v3", name: "Rohan Kapoor",   distance: 128, status: "On the way", avatar: "R", phone: "+91 98765 43212", assigned: true },
  { id: "v4", name: "Sneha Das",      distance: 195, status: "Available",  avatar: "S", phone: "+91 98765 43213", assigned: false },
  { id: "v5", name: "Vikram Patel",   distance: 210, status: "Available",  avatar: "V", phone: "+91 98765 43214", assigned: false },
];

// ── Volunteer Reply Pool ─────────────────────────────────────────────────────

const VOLUNTEER_REPLIES: Record<string, string[]> = {
  v1: [
    "I'm just around the corner, stay calm! 🏃",
    "I can see the area now. Don't move, I'm almost there!",
    "I've informed local security too",
    "ETA less than 30 seconds. Hang tight!",
    "I'm here in the area. Can you wave or signal?",
    "I can see you now! Coming straight to you 🙌",
  ],
  v2: [
    "Hey, I'm Priya. Are you safe right now?",
    "I'm tracking your live location on the map 📍",
    "I'm calling an ambulance just in case 🚑",
    "Keep your phone close. I'm coordinating with others",
    "Don't worry, you're not alone. We're all coming to help 💪",
    "Are you injured? Do we need medical help?",
  ],
  v3: [
    "I'm Rohan. I accepted your SOS. On my way! 🏃‍♂️",
    "Sharing your location with the volunteer group",
    "I'm bringing another person with me for backup",
    "We're coordinating with 2 other nearby volunteers",
    "ETA about 2 minutes. Stay where you are!",
    "Almost there! Can you describe your exact spot?",
  ],
};

const CONTEXTUAL_REPLIES: Array<{ keywords: string[]; reply: string }> = [
  { keywords: ["hurt", "injured", "pain", "bleeding"], reply: "I'm calling an ambulance right now. Stay still and don't move! 🚑" },
  { keywords: ["scared", "afraid", "fear", "alone"], reply: "You're not alone. I'm just meters away. Be strong, help is here 💪" },
  { keywords: ["where", "location", "find"], reply: "I can see your live location on the map. Coming straight to you 📍" },
  { keywords: ["thank", "thanks"], reply: "No need to thank me! That's what community is for 🤝" },
  { keywords: ["safe", "okay", "fine", "ok"], reply: "Great to hear! I'll still check on you just to be sure. Stay put 🙌" },
  { keywords: ["help"], reply: "I'm here to help. Tell me exactly what happened so I can assist better 🙏" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function JudgesDemo() {
  // ── State ──
  const [activeTab, setActiveTab] = useState<string | null>(null); // volunteer id for active chat
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [alertedCount, setAlertedCount] = useState(0);
  const [volunteersAccepted, setVolunteersAccepted] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showLiveHelp, setShowLiveHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyIndexRef = useRef<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animate entry counters ─────────────────────────────────────────────
  useEffect(() => {
    // Animate "112 users alerted"
    let count = 0;
    const alertInterval = setInterval(() => {
      count += 4;
      if (count >= 112) { count = 112; clearInterval(alertInterval); }
      setAlertedCount(count);
    }, 30);

    // After 1.5s, show volunteers accepted
    const volTimer = setTimeout(() => {
      let vc = 0;
      const vInterval = setInterval(() => {
        vc++;
        if (vc >= 3) { clearInterval(vInterval); setShowLiveHelp(true); }
        setVolunteersAccepted(vc);
      }, 600);
    }, 1500);

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Initialize welcome messages from assigned volunteers
    const initialMessages: Record<string, ChatMessage[]> = {};
    DEMO_VOLUNTEERS.filter(v => v.assigned).forEach((v, i) => {
      setTimeout(() => {
        setChatMessages(prev => ({
          ...prev,
          [v.id]: [{
            id: `init-${v.id}`,
            text: `Hey! I'm ${v.name.split(" ")[0]} and I've accepted your SOS. ${v.status === "On the way" ? "I'm heading to your location now!" : "I'm available to help."} Are you okay? 🏃`,
            sender: "volunteer",
            timestamp: Date.now(),
            volunteerName: v.name,
          }],
        }));
      }, 2000 + i * 800);
    });

    return () => {
      clearInterval(alertInterval);
      clearTimeout(volTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (activeTab) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [activeTab]);

  // ── Pick reply ─────────────────────────────────────────────────────────
  const pickReply = useCallback((volId: string, userText: string): string => {
    const lower = userText.toLowerCase();
    for (const ctx of CONTEXTUAL_REPLIES) {
      if (ctx.keywords.some(kw => lower.includes(kw))) return ctx.reply;
    }
    const pool = VOLUNTEER_REPLIES[volId] || VOLUNTEER_REPLIES.v1;
    const idx = replyIndexRef.current[volId] || 0;
    const reply = pool[idx % pool.length];
    replyIndexRef.current[volId] = idx + 1;
    return reply;
  }, []);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeTab) return;

    const volId = activeTab;
    const text = inputText.trim();
    setInputText("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text,
      sender: "user",
      timestamp: Date.now(),
    };

    setChatMessages(prev => ({
      ...prev,
      [volId]: [...(prev[volId] || []), userMsg],
    }));

    // Simulate typing + reply
    if (DEMO_MODE) {
      const typingDelay = 600 + Math.random() * 800;
      const replyDelay = typingDelay + 1200 + Math.random() * 2000;

      setTimeout(() => {
        setTyping(prev => ({ ...prev, [volId]: true }));
      }, typingDelay);

      setTimeout(() => {
        const volunteer = DEMO_VOLUNTEERS.find(v => v.id === volId);
        const replyText = pickReply(volId, text);
        const volMsg: ChatMessage = {
          id: `vol-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          text: replyText,
          sender: "volunteer",
          timestamp: Date.now(),
          volunteerName: volunteer?.name,
        };
        setChatMessages(prev => ({
          ...prev,
          [volId]: [...(prev[volId] || []), volMsg],
        }));
        setTyping(prev => ({ ...prev, [volId]: false }));
      }, replyDelay);
    }
  }, [inputText, activeTab, pickReply]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Active volunteer for chat
  const activeVolunteer = DEMO_VOLUNTEERS.find(v => v.id === activeTab);
  const activeMsgs = activeTab ? (chatMessages[activeTab] || []) : [];
  const isTyping = activeTab ? typing[activeTab] : false;

  // Get unread count
  const getUnread = (volId: string) => {
    const msgs = chatMessages[volId] || [];
    let count = 0;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender === "user") break;
      count++;
    }
    return count;
  };

  return (
    <div className="demo-page">
      {/* ── Chat Modal ─────────────────────────────────────────────── */}
      {activeTab && activeVolunteer && (
        <div className="demo-chat-overlay" onClick={() => setActiveTab(null)}>
          <div className="demo-chat-container slide-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="demo-chat-header">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="demo-chat-avatar-lg" style={{ background: `linear-gradient(135deg, ${activeVolunteer.id === "v1" ? "#10b981, #059669" : activeVolunteer.id === "v2" ? "#8b5cf6, #6d28d9" : "#f59e0b, #d97706"})` }}>
                    {activeVolunteer.avatar}
                  </div>
                  <div className="demo-online-dot-lg" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{activeVolunteer.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400">
                      {activeVolunteer.status === "On the way" ? "🏃 On the way" : activeVolunteer.status === "Arrived" ? "✅ Arrived" : "✓ Available"}
                    </span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400 font-mono">~{activeVolunteer.distance}m</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveTab(null)} className="demo-close-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Live badge */}
            <div className="demo-live-badge">
              <span className="demo-live-dot" />
              <span>Live Help Connected</span>
            </div>

            {/* Messages */}
            <div className="demo-messages">
              {activeMsgs.map(msg => (
                <div key={msg.id} className={`demo-msg-row ${msg.sender === "user" ? "demo-msg-right" : "demo-msg-left"}`}>
                  {msg.sender === "volunteer" && (
                    <div className="demo-msg-avatar">{activeVolunteer.avatar}</div>
                  )}
                  <div>
                    <div className={`demo-bubble ${msg.sender === "user" ? "demo-bubble-user" : "demo-bubble-vol"}`}>
                      {msg.text}
                    </div>
                    <p className={`demo-time ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="demo-msg-row demo-msg-left">
                  <div className="demo-msg-avatar">{activeVolunteer.avatar}</div>
                  <div className="demo-bubble demo-bubble-vol">
                    <div className="demo-typing-dots">
                      <span /><span /><span />
                    </div>
                    <span className="text-[10px] text-gray-400 ml-1.5">
                      {activeVolunteer.name.split(" ")[0]} is typing…
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="demo-input-bar">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="demo-input"
              />
              <button onClick={handleSend} disabled={!inputText.trim()} className="demo-send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────── */}
      <div className="demo-content">
        {/* Top Bar */}
        <div className="demo-topbar">
          <div className="flex items-center gap-2">
            <div className="demo-sos-icon-sm">SOS</div>
            <div>
              <h1 className="text-base font-black text-white">ShakeSOS</h1>
              <p className="text-[10px] text-gray-500">Judge's Demo Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="demo-rec-badge">
              <span className="demo-rec-dot" /> REC
            </span>
            <span className="demo-monitoring-badge">
              <span className="demo-monitoring-dot" /> Active
            </span>
          </div>
        </div>

        {/* SOS TRIGGERED Banner */}
        <div className="demo-sos-banner">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🆘</span>
            <div>
              <p className="font-bold text-red-400 text-sm">SOS TRIGGERED</p>
              <p className="text-[11px] text-red-300/70">Emergency message sent via WhatsApp</p>
              <p className="text-[11px] text-orange-400 mt-0.5">🎤 Audio evidence recording active</p>
            </div>
          </div>
          <div className="demo-elapsed">
            <span className="text-[10px] text-gray-500">Elapsed</span>
            <span className="text-sm font-mono font-bold text-red-400">{formatElapsed(elapsedTime)}</span>
          </div>
        </div>

        {/* ── Community Alert Section ──────────────────────────────── */}
        <div className="demo-alert-section">
          <div className="demo-alert-header">
            <div className="flex items-center gap-2">
              <span className="text-lg">📡</span>
              <div>
                <p className="text-sm font-bold text-blue-400">Community Alert Sent</p>
                <p className="text-[11px] text-blue-300/60">
                  <span className="text-blue-200 font-bold font-mono text-sm">{alertedCount}</span> users alerted in 200m radius
                </p>
              </div>
            </div>
            {volunteersAccepted > 0 && (
              <div className="demo-vol-pill fade-in">
                <span className="demo-pill-dot" />
                {volunteersAccepted} accepted
              </div>
            )}
          </div>

          {/* Emergency services */}
          <div className="demo-services-row">
            <div className="demo-service-badge">
              <span>🚔</span> Police notified
            </div>
            <div className="demo-service-badge">
              <span>🚑</span> Ambulance on standby
            </div>
            <div className="demo-service-badge demo-service-112">
              <span>📞</span> 112 alerted
            </div>
          </div>
        </div>

        {/* ── Active Volunteers Section ───────────────────────────── */}
        <div className="demo-volunteers-section">
          <div className="demo-vol-header">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <h3 className="text-sm font-bold text-white">Active Volunteers</h3>
            </div>
            {showLiveHelp && (
              <div className="demo-connected-label fade-in">
                <span className="demo-connected-dot" />
                Connected Helpers
              </div>
            )}
          </div>

          {/* Assigned Volunteer Cards */}
          <div className="demo-vol-cards">
            {DEMO_VOLUNTEERS.filter(v => v.assigned).map((vol, i) => {
              const unread = getUnread(vol.id);
              return (
                <div key={vol.id} className="demo-vol-card fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="relative flex-shrink-0">
                    <div className="demo-vol-avatar" style={{ background: `linear-gradient(135deg, ${vol.id === "v1" ? "#10b981, #059669" : vol.id === "v2" ? "#8b5cf6, #6d28d9" : "#f59e0b, #d97706"})` }}>
                      {vol.avatar}
                    </div>
                    <div className="demo-online-dot" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{vol.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {vol.status === "On the way" ? "🏃 On the way" : vol.status === "Arrived" ? "✅ Arrived" : "✓ Available"}
                      </span>
                      <span className="text-[10px] text-gray-600">•</span>
                      <span className="text-[10px] text-gray-400 font-mono">~{vol.distance}m</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab(vol.id)} className="demo-chat-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-xs font-semibold">Chat</span>
                    {unread > 0 && <span className="demo-unread">{unread}</span>}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Unassigned */}
          <div className="demo-unassigned">
            {DEMO_VOLUNTEERS.filter(v => !v.assigned).map(vol => (
              <div key={vol.id} className="demo-unassigned-card">
                <div className="demo-unassigned-avatar">{vol.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-400 truncate">{vol.name}</p>
                  <p className="text-[10px] text-gray-600">~{vol.distance}m</p>
                </div>
                <span className="demo-not-assigned">Not Assigned</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Location Card ───────────────────────────────────────── */}
        <div className="demo-location-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Location Active</p>
                <p className="text-xs text-white font-mono mt-0.5">22.99025, 88.45126</p>
                <p className="text-[10px] text-gray-500">±12m accuracy</p>
              </div>
            </div>
            <div className="demo-maps-btn">Maps →</div>
          </div>
        </div>

        {/* ── Live Help Indicator ─────────────────────────────────── */}
        {showLiveHelp && (
          <div className="demo-live-help fade-in">
            <div className="demo-pulse-ring-container">
              <div className="demo-live-ring" />
              <div className="demo-live-ring-2" />
              <span className="text-lg relative z-10">🤝</span>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-400">Live Help Connected</p>
              <p className="text-[10px] text-emerald-300/60">3 volunteers are actively assisting you</p>
            </div>
          </div>
        )}

        {/* Demo mode watermark */}
        <div className="demo-watermark">
          <span>🔬 DEMO MODE</span> — Simulated data for presentation
        </div>
      </div>
    </div>
  );
}
