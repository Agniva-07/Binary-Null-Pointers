/**
 * useMockChat — simulates a private chat between the victim and a volunteer.
 *
 * Uses local state only (no backend). Volunteer replies are simulated
 * with randomised delays (2–5s) and a pool of contextual messages.
 *
 * DEMO_MODE flag gates all simulation behaviour.
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ── Demo flag ────────────────────────────────────────────────────────────────
export const DEMO_MODE = true;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  senderId: string; // "user" or volunteer id
  senderName: string;
  text: string;
  timestamp: number;
  isUser: boolean;
}

export interface ChatSession {
  volunteerId: string;
  volunteerName: string;
  messages: ChatMessage[];
  isVolunteerTyping: boolean;
}

// ── Simulated volunteer reply pool ───────────────────────────────────────────

const VOLUNTEER_REPLIES: string[] = [
  "I am nearby, stay calm 🙏",
  "Sharing your location, reaching in 2 mins",
  "Are you safe right now?",
  "I can see the area, heading your way",
  "Don't move, I'm almost there! 🏃",
  "I've informed local security too",
  "Keep your phone close, I'm tracking the location",
  "Stay where you are, help is on the way",
  "Can you describe your exact spot?",
  "I'm bringing another person with me, hold on",
  "ETA less than 1 minute, hang tight!",
  "Are you injured? Do we need an ambulance?",
  "I can hear the siren, stay calm",
  "We're coordinating with other volunteers too 💪",
];

// Contextual auto-replies when user sends specific keywords
const CONTEXTUAL_REPLIES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ["hurt", "injured", "pain", "bleeding"],
    reply: "I'm calling an ambulance right now. Stay still and don't move! 🚑",
  },
  {
    keywords: ["scared", "afraid", "fear", "help"],
    reply: "You're not alone. I'm just a few meters away. Stay strong 💪",
  },
  {
    keywords: ["where", "location", "find"],
    reply: "I can see your live location on the map. Coming straight to you 📍",
  },
  {
    keywords: ["thank", "thanks"],
    reply: "No need to thank me! That's what community is for 🤝",
  },
  {
    keywords: ["safe", "okay", "fine"],
    reply:
      "Great to hear! I'll still come check on you just to be sure. Stay put 🙌",
  },
];

// ── Hook ────────────────────────────────────────────────────────────────────

export function useMockChat() {
  const [sessions, setSessions] = useState<Map<string, ChatSession>>(
    new Map()
  );
  const replyIndexRef = useRef<Map<string, number>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // ── Start / get a session ──────────────────────────────────────────────

  const getOrCreateSession = useCallback(
    (volunteerId: string, volunteerName: string): ChatSession => {
      const existing = sessions.get(volunteerId);
      if (existing) return existing;

      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}-init`,
        senderId: volunteerId,
        senderName: volunteerName,
        text: `Hey! I'm ${volunteerName} and I've accepted your SOS. I'm heading to your location now. Are you okay? 🏃`,
        timestamp: Date.now(),
        isUser: false,
      };

      const session: ChatSession = {
        volunteerId,
        volunteerName,
        messages: [welcomeMessage],
        isVolunteerTyping: false,
      };

      setSessions((prev) => {
        const next = new Map(prev);
        next.set(volunteerId, session);
        return next;
      });

      if (!replyIndexRef.current.has(volunteerId)) {
        replyIndexRef.current.set(volunteerId, 0);
      }

      return session;
    },
    [sessions]
  );

  // ── Pick a volunteer reply ─────────────────────────────────────────────

  const pickReply = useCallback(
    (volunteerId: string, userText: string): string => {
      // Check for contextual match first
      const lowerText = userText.toLowerCase();
      for (const ctx of CONTEXTUAL_REPLIES) {
        if (ctx.keywords.some((kw) => lowerText.includes(kw))) {
          return ctx.reply;
        }
      }

      // Fallback: sequential from pool
      const idx = replyIndexRef.current.get(volunteerId) ?? 0;
      const reply = VOLUNTEER_REPLIES[idx % VOLUNTEER_REPLIES.length];
      replyIndexRef.current.set(volunteerId, idx + 1);
      return reply;
    },
    []
  );

  // ── Send message from user ────────────────────────────────────────────

  const sendMessage = useCallback(
    (volunteerId: string, volunteerName: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user-${Math.random().toString(36).slice(2, 5)}`,
        senderId: "user",
        senderName: "You",
        text: trimmed,
        timestamp: Date.now(),
        isUser: true,
      };

      // Add user message
      setSessions((prev) => {
        const next = new Map(prev);
        const session = next.get(volunteerId);
        if (session) {
          next.set(volunteerId, {
            ...session,
            messages: [...session.messages, userMsg],
          });
        }
        return next;
      });

      // Simulate volunteer typing + reply (DEMO_MODE only)
      if (DEMO_MODE) {
        const typingDelay = 800 + Math.random() * 1200; // 0.8–2s before "typing"
        const replyDelay = typingDelay + 1500 + Math.random() * 2500; // 2–5s total

        // Show "typing..."
        const typingTimeout = setTimeout(() => {
          setSessions((prev) => {
            const next = new Map(prev);
            const session = next.get(volunteerId);
            if (session) {
              next.set(volunteerId, {
                ...session,
                isVolunteerTyping: true,
              });
            }
            return next;
          });
        }, typingDelay);

        // Send volunteer reply
        const replyTimeout = setTimeout(() => {
          const replyText = pickReply(volunteerId, trimmed);
          const volMsg: ChatMessage = {
            id: `msg-${Date.now()}-vol-${Math.random().toString(36).slice(2, 5)}`,
            senderId: volunteerId,
            senderName: volunteerName,
            text: replyText,
            timestamp: Date.now(),
            isUser: false,
          };

          setSessions((prev) => {
            const next = new Map(prev);
            const session = next.get(volunteerId);
            if (session) {
              next.set(volunteerId, {
                ...session,
                messages: [...session.messages, volMsg],
                isVolunteerTyping: false,
              });
            }
            return next;
          });
        }, replyDelay);

        // Store timeout refs for cleanup
        timeoutRefs.current.set(`typing-${volunteerId}`, typingTimeout);
        timeoutRefs.current.set(`reply-${volunteerId}`, replyTimeout);
      }
    },
    [pickReply]
  );

  // ── Get session for a volunteer ───────────────────────────────────────

  const getSession = useCallback(
    (volunteerId: string): ChatSession | undefined => {
      return sessions.get(volunteerId);
    },
    [sessions]
  );

  // ── Unread count (messages from volunteer since last user message) ───
  const getUnreadCount = useCallback(
    (volunteerId: string): number => {
      const session = sessions.get(volunteerId);
      if (!session) return 0;
      const msgs = session.messages;
      let count = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].isUser) break;
        count++;
      }
      return count;
    },
    [sessions]
  );

  return {
    sessions,
    getOrCreateSession,
    sendMessage,
    getSession,
    getUnreadCount,
  };
}
