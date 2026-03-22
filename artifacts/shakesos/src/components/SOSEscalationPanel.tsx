/**
 * SOSEscalationPanel — Visual status panel for the 3-stage SOS escalation system.
 *
 * Renders:
 *  • Stage indicator (1 / 2 / 3) with colour coding
 *  • Animated countdown ring
 *  • "Waiting for response…" / escalation messages
 *  • "Help is on the way" screen after acknowledgement
 *  • Flash overlay on the page body during stage 2 / 3
 */

import { useEffect } from "react";
import type { EscalationState, EscalationActions, EscalationStage } from "@/hooks/useSOSEscalation";
import type { NearbyUser } from "@/lib/sosService";

interface SOSEscalationPanelProps {
  escalation: EscalationState & EscalationActions;
  /** Called when user taps "Force escalate" (debug / demo) */
  onForceEscalate?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAGE_META: Record<
  EscalationStage,
  { label: string; color: string; bg: string; border: string; emoji: string; desc: string }
> = {
  0: {
    label: "Idle",
    color: "text-gray-400",
    bg: "bg-gray-900/40",
    border: "border-gray-800",
    emoji: "",
    desc: "",
  },
  1: {
    label: "Alerting",
    color: "text-yellow-400",
    bg: "bg-yellow-950/20",
    border: "border-yellow-700/40",
    emoji: "🟡",
    desc: "Emergency alert sent — waiting for response…",
  },
  2: {
    label: "Escalated",
    color: "text-orange-400",
    bg: "bg-orange-950/25",
    border: "border-orange-600/40",
    emoji: "🟠",
    desc: "No response — radius expanded, siren active",
  },
  3: {
    label: "EXTREME",
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-500/50",
    emoji: "🔴",
    desc: "Emergency services alerted — repeated broadcasts",
  },
};

/** Render a circular countdown ring using SVG */
function CountdownRing({
  seconds,
  total,
  stage,
}: {
  seconds: number;
  total: number;
  stage: EscalationStage;
}) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, seconds / total));
  const dash = circumference * progress;

  const strokeColor =
    stage === 3
      ? "#ef4444"
      : stage === 2
      ? "#f97316"
      : "#eab308";

  return (
    <svg width="96" height="96" className="countdown-ring">
      {/* Track */}
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="6"
      />
      {/* Progress arc */}
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset="0"
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      {/* Centre text */}
      <text
        x="48"
        y="48"
        textAnchor="middle"
        dominantBaseline="central"
        fill={strokeColor}
        fontSize="18"
        fontWeight="800"
        fontFamily="monospace"
      >
        {seconds}s
      </text>
    </svg>
  );
}

/** Pill badge for each stage */
function StagePill({
  n,
  active,
  done,
}: {
  n: number;
  active: boolean;
  done: boolean;
}) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-500";
  const cls = done
    ? `${base} bg-green-700/60 text-green-300`
    : active
    ? `${base} bg-red-600 text-white scale-110 escalation-pulse`
    : `${base} bg-gray-800 text-gray-600`;
  return <div className={cls}>{done ? "✓" : n}</div>;
}

/** Alerted users mini-list */
function AlertedUsersList({ users, radius }: { users: NearbyUser[]; radius: number }) {
  if (users.length === 0) return null;
  return (
    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto pr-1">
      {users.slice(0, 5).map((u) => (
        <div
          key={u.userId}
          className="flex items-center justify-between rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px]"
        >
          <span className="text-gray-300 font-medium truncate max-w-[120px]">
            {u.displayName ?? u.phone}
          </span>
          <span className="text-gray-500 shrink-0 ml-2">{u.distance}m away</span>
        </div>
      ))}
      {users.length > 5 && (
        <p className="text-center text-[10px] text-gray-600">
          +{users.length - 5} more
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SOSEscalationPanel({
  escalation,
}: SOSEscalationPanelProps) {
  const { stage, countdown, elapsed, responded, alertedUsers, currentRadiusM, repeatCount, flashActive } =
    escalation;

  // ── Body flash effect ─────────────────────────────────────────────────────
  useEffect(() => {
    const body = document.body;
    if (flashActive) {
      body.classList.add("sos-flash-overlay");
    } else {
      body.classList.remove("sos-flash-overlay");
    }
    return () => {
      body.classList.remove("sos-flash-overlay");
    };
  }, [flashActive]);

  // ── Responded state ───────────────────────────────────────────────────────
  if (responded) {
    return (
      <div className="mb-4 rounded-2xl border border-green-500/40 bg-green-950/30 p-4 fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700/40">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <p className="font-bold text-green-400">Help is on the way!</p>
            <p className="text-xs text-green-300/70 mt-0.5">
              A responder acknowledged your SOS. Stay safe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (stage === 0) return null;

  const meta = STAGE_META[stage];

  return (
    <div
      className={`mb-4 rounded-2xl border ${meta.border} ${meta.bg} p-4 fade-in escalation-card`}
      style={{
        boxShadow:
          stage === 3
            ? "0 0 30px rgba(220,38,38,0.35)"
            : stage === 2
            ? "0 0 20px rgba(249,115,22,0.25)"
            : "0 0 14px rgba(234,179,8,0.15)",
      }}
    >
      {/* ── Stage row ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Stage pills */}
          <StagePill n={1} active={stage === 1} done={stage > 1} />
          <div className="h-px w-4 bg-gray-700" />
          <StagePill n={2} active={stage === 2} done={stage > 2} />
          <div className="h-px w-4 bg-gray-700" />
          <StagePill n={3} active={stage === 3} done={false} />
        </div>
        <span className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>
          {meta.emoji} {meta.label}
        </span>
      </div>

      {/* ── Countdown + description ── */}
      <div className="flex items-center gap-4">
        {/* Ring */}
        {countdown !== null ? (
          <div className="shrink-0">
            <CountdownRing
              seconds={countdown}
              total={stage === 1 ? 5 : 10}
              stage={stage}
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-950/30">
            <span className="text-3xl">🆘</span>
          </div>
        )}

        <div className="flex-1">
          <p className={`text-sm font-semibold ${meta.color} mb-1`}>{meta.desc}</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {stage === 1 && `Elapsed: ${elapsed}s • Radius: ${(currentRadiusM / 1000).toFixed(1)}km`}
            {stage === 2 && `Radius expanded to ${(currentRadiusM / 1000).toFixed(1)}km • Tracking ON`}
            {stage === 3 && `Extreme mode • Repeat alerts: ${repeatCount} • Elapsed: ${elapsed}s`}
          </p>

          {/* Stage-specific callouts */}
          {stage === 2 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[11px] text-orange-400 font-medium">Siren &amp; flash active</span>
            </div>
          )}
          {stage === 3 && (
            <div className="mt-2 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] text-red-400 font-medium">Emergency services alerted (112)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] text-red-400 font-medium">
                  Repeating every 15s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Alerted users ── */}
      {alertedUsers.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            📡 Alerted nearby ({alertedUsers.length}) · {(currentRadiusM / 1000).toFixed(1)}km radius
          </p>
          <AlertedUsersList users={alertedUsers} radius={currentRadiusM} />
        </div>
      )}

      {/* ── Next escalation hint ── */}
      {stage < 3 && countdown !== null && countdown <= 10 && (
        <div className="mt-3 rounded-xl bg-black/30 px-3 py-2 border border-yellow-900/30">
          <p className="text-[11px] text-yellow-500 font-medium">
            ⚡ Auto-escalating to Stage {stage + 1} in {countdown}s if no response
          </p>
        </div>
      )}
    </div>
  );
}
