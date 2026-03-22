import { useState, useEffect, useCallback } from "react";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: "essentials" | "digital" | "plan" | "safety";
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "1", text: "Charge phone to 100%", checked: false, category: "essentials" },
  { id: "2", text: "Pack essential documents (ID, passport)", checked: false, category: "essentials" },
  { id: "3", text: "Pack emergency cash", checked: false, category: "essentials" },
  { id: "4", text: "Pack medications & first-aid kit", checked: false, category: "essentials" },
  { id: "5", text: "Pack a change of clothes", checked: false, category: "essentials" },
  { id: "6", text: "Share location with trusted person", checked: false, category: "digital" },
  { id: "7", text: "Set emergency contact in ShakeSOS", checked: false, category: "digital" },
  { id: "8", text: "Enable fall detection", checked: false, category: "digital" },
  { id: "9", text: "Save emergency numbers offline", checked: false, category: "digital" },
  { id: "10", text: "Inform a trusted friend of your plan", checked: false, category: "plan" },
  { id: "11", text: "Identify a safe place to go", checked: false, category: "plan" },
  { id: "12", text: "Plan an escape route", checked: false, category: "plan" },
  { id: "13", text: "Set a safety timer for your journey", checked: false, category: "plan" },
  { id: "14", text: "Stay in well-lit, public areas", checked: false, category: "safety" },
  { id: "15", text: "Keep personal alarm or siren ready", checked: false, category: "safety" },
  { id: "16", text: "Turn on stealth/discreet mode if needed", checked: false, category: "safety" },
];

const STORAGE_KEY = "shakesos-checklist";

const CATEGORIES = {
  essentials: { label: "Essentials", emoji: "🎒", color: "text-blue-400" },
  digital: { label: "Digital Safety", emoji: "📱", color: "text-purple-400" },
  plan: { label: "Safety Plan", emoji: "📋", color: "text-green-400" },
  safety: { label: "Personal Safety", emoji: "🛡️", color: "text-orange-400" },
};

interface EmergencyChecklistProps {
  onBack: () => void;
}

export default function EmergencyChecklist({ onBack }: EmergencyChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_ITEMS;
    } catch {
      return DEFAULT_ITEMS;
    }
  });
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ChecklistItem["category"]>("essentials");

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const addItem = useCallback(() => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
      category: newItemCategory,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText("");
  }, [newItemText, newItemCategory]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setItems(DEFAULT_ITEMS);
  }, []);

  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  const groupedItems = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-8 pb-24">
      <div className="w-full max-w-sm mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">📋 Safety Checklist</h1>
          <p className="text-sm text-gray-400">
            Prepare yourself for emergencies. Check off items as you complete them.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-sm font-bold text-white">
              {checked}/{total}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background:
                  progress === 100
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : progress > 50
                    ? "linear-gradient(90deg, #eab308, #22c55e)"
                    : "linear-gradient(90deg, #ef4444, #eab308)",
              }}
            />
          </div>
          {progress === 100 && (
            <p className="mt-2 text-xs text-green-400 font-medium text-center">
              ✅ All items checked! You're well prepared.
            </p>
          )}
        </div>

        {/* Grouped Items */}
        <div className="space-y-4 mb-6">
          {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((cat) => {
            const catItems = groupedItems[cat];
            if (!catItems || catItems.length === 0) return null;
            const catInfo = CATEGORIES[cat];
            const catChecked = catItems.filter((i) => i.checked).length;

            return (
              <div key={cat} className="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span>{catInfo.emoji}</span>
                    <span className={`text-sm font-semibold ${catInfo.color}`}>{catInfo.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {catChecked}/{catItems.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3 transition-all"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                          item.checked
                            ? "border-green-500 bg-green-600 text-white"
                            : "border-gray-600 bg-gray-800"
                        }`}
                      >
                        {item.checked && (
                          <span className="text-xs">✓</span>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm transition-all ${
                          item.checked
                            ? "text-gray-500 line-through"
                            : "text-gray-300"
                        }`}
                      >
                        {item.text}
                      </span>
                      {item.id.startsWith("custom-") && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Item */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Add Custom Item
          </p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="e.g. Pack charger cable..."
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/60"
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <button
              onClick={addItem}
              disabled={!newItemText.trim()}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold text-white transition-all ${
                newItemText.trim() ? "bg-green-600 active:scale-95" : "bg-gray-700 text-gray-500"
              }`}
            >
              +
            </button>
          </div>
          <div className="flex gap-1.5">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewItemCategory(cat)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  newItemCategory === cat
                    ? "bg-gray-700 text-white"
                    : "bg-gray-800/40 text-gray-500"
                }`}
              >
                {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={resetAll}
          className="w-full rounded-xl border border-gray-700 py-3 text-sm text-gray-400 transition-all active:bg-gray-800"
        >
          ↺ Reset to Default
        </button>
      </div>
    </div>
  );
}
