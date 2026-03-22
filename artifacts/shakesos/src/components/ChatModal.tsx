/**
 * ChatModal — Private chat screen between the victim and a volunteer.
 *
 * Features:
 * - Chat bubbles (left = volunteer, right = user)
 * - Auto-scroll to newest message
 * - "Volunteer is typing…" animation
 * - Timestamp for each message
 * - Input field + send button
 * - Glassmorphism overlay design
 */

import { useState, useRef, useEffect } from "react";
import type { ChatSession } from "@/hooks/useMockChat";

interface ChatModalProps {
  session: ChatSession;
  volunteerDistance: number;
  volunteerStatus: string;
  onSend: (volunteerId: string, volunteerName: string, text: string) => void;
  onClose: () => void;
}

export default function ChatModal({
  session,
  volunteerDistance,
  volunteerStatus,
  onSend,
  onClose,
}: ChatModalProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages or typing status change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, session.isVolunteerTyping]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(session.volunteerId, session.volunteerName, text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusText =
    volunteerStatus === "on_the_way"
      ? "🏃 On the way"
      : volunteerStatus === "arrived"
      ? "✅ Arrived"
      : "✓ Available";

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div
        className="chat-modal-container slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="chat-modal-header">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                {session.volunteerName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-gray-900 animate-pulse" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {session.volunteerName}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-medium">
                  {statusText}
                </span>
                <span className="text-[10px] text-gray-600">•</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  ~{volunteerDistance}m away
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-gray-800 border border-gray-700 text-gray-400 transition-all active:scale-90 hover:bg-gray-700"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Live Help Connected Badge ──────────────────────────────────── */}
        <div className="chat-live-badge">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Help Connected</span>
        </div>

        {/* ── Messages ───────────────────────────────────────────────────── */}
        <div className="chat-messages-area">
          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-wrapper ${
                msg.isUser ? "chat-bubble-right" : "chat-bubble-left"
              }`}
            >
              {!msg.isUser && (
                <div className="chat-bubble-avatar">
                  {session.volunteerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div
                  className={`chat-bubble ${
                    msg.isUser ? "chat-bubble-user" : "chat-bubble-volunteer"
                  }`}
                >
                  {msg.text}
                </div>
                <p
                  className={`chat-bubble-time ${
                    msg.isUser ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {session.isVolunteerTyping && (
            <div className="chat-bubble-wrapper chat-bubble-left">
              <div className="chat-bubble-avatar">
                {session.volunteerName.charAt(0).toUpperCase()}
              </div>
              <div className="chat-bubble chat-bubble-volunteer">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="text-[10px] text-gray-400 ml-1.5">
                  {session.volunteerName.split(" ")[0]} is typing…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ──────────────────────────────────────────────────────── */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="chat-send-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
