/**
 * VolunteerList — "🚨 Active Volunteers" section shown on the SOS screen.
 *
 * Displays connected helpers with name, distance, status, and a "Chat" button.
 * Only 2–3 volunteers are "assigned"; others show as "Not Assigned".
 */

import { useState, useEffect } from "react";
import type { VolunteerInfo } from "@/lib/sosService";
import type { ChatSession } from "@/hooks/useMockChat";
import { DEMO_MODE } from "@/hooks/useMockChat";

interface VolunteerListProps {
  volunteers: VolunteerInfo[];
  nearbyCount: number;
  maxAssigned?: number;
  onOpenChat: (volunteerId: string, volunteerName: string) => void;
  getSession: (volunteerId: string) => ChatSession | undefined;
  getUnreadCount: (volunteerId: string) => number;
}

export default function VolunteerList({
  volunteers,
  nearbyCount,
  maxAssigned = 3,
  onOpenChat,
  getSession,
  getUnreadCount,
}: VolunteerListProps) {
  const [animatedCount, setAnimatedCount] = useState(0);
  const [showSection, setShowSection] = useState(false);

  // Animate notification count
  useEffect(() => {
    if (nearbyCount <= 0) return;
    setShowSection(true);
    let current = 0;
    const target = Math.min(nearbyCount, 100);
    const step = Math.max(1, Math.floor(target / 20));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedCount(current);
    }, 50);
    return () => clearInterval(interval);
  }, [nearbyCount]);

  if (!showSection && volunteers.length === 0) return null;

  // Split: assigned (first maxAssigned) vs unassigned
  const assigned = volunteers.slice(0, maxAssigned);
  const unassigned = volunteers.slice(maxAssigned);

  return (
    <div className="volunteer-list-section fade-in">
      {/* ── Notification Banner ─────────────────────────────────────────── */}
      {nearbyCount > 0 && (
        <div className="volunteer-notify-banner">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <div>
              <p className="text-sm font-bold text-blue-400">
                Community Alert Sent
              </p>
              <p className="text-xs text-blue-300/60">
                <span className="text-blue-300 font-bold font-mono">
                  {animatedCount}
                </span>{" "}
                users alerted nearby
              </p>
            </div>
          </div>
          {assigned.length > 0 && (
            <div className="volunteer-accepted-pill">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {assigned.length} volunteer{assigned.length > 1 ? "s" : ""}{" "}
                accepted
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Section Title ────────────────────────────────────────────────── */}
      {assigned.length > 0 && (
        <div className="volunteer-section-header">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <h3 className="text-sm font-bold text-white">
              Active Volunteers
            </h3>
          </div>
          <span className="volunteer-connected-badge">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected Helpers
          </span>
        </div>
      )}

      {/* ── Assigned Volunteer Cards ──────────────────────────────────── */}
      {assigned.length > 0 && (
        <div className="space-y-2 mb-3">
          {assigned.map((vol) => {
            const session = getSession(vol.helperId);
            const unread = getUnreadCount(vol.helperId);
            const statusText =
              vol.status === "on_the_way"
                ? "🏃 On the way"
                : vol.status === "arrived"
                ? "✅ Arrived"
                : "✓ Available";

            return (
              <div key={vol.helperId} className="volunteer-card fade-in">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {(vol.displayName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-gray-900 animate-pulse" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {vol.displayName || "Volunteer"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {statusText}
                    </span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ~{vol.distance}m
                    </span>
                  </div>
                </div>

                {/* Chat Button */}
                <button
                  onClick={() =>
                    onOpenChat(
                      vol.helperId,
                      vol.displayName || "Volunteer"
                    )
                  }
                  className="volunteer-chat-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-xs font-semibold">Chat</span>
                  {unread > 0 && (
                    <span className="volunteer-unread-badge">{unread}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Unassigned (if any extras) ──────────────────────────────────── */}
      {unassigned.length > 0 && (
        <div className="space-y-1.5">
          {unassigned.map((vol) => (
            <div
              key={vol.helperId}
              className="flex items-center gap-3 rounded-xl border border-gray-800/60 bg-gray-900/30 px-3 py-2 opacity-50"
            >
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                {(vol.displayName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-400 truncate">
                  {vol.displayName || "Volunteer"}
                </p>
                <p className="text-[10px] text-gray-600">~{vol.distance}m</p>
              </div>
              <span className="text-[9px] text-gray-600 font-medium px-2 py-0.5 rounded-full border border-gray-800">
                Not Assigned
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Waiting state ──────────────────────────────────────────────── */}
      {volunteers.length === 0 && nearbyCount > 0 && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-400 font-medium">
              Waiting for volunteers to respond...
            </span>
          </div>
          <p className="text-[10px] text-gray-600">
            {DEMO_MODE ? "Volunteers will appear in 2–6 seconds" : "Volunteers will appear here when they accept"}
          </p>
        </div>
      )}
    </div>
  );
}
