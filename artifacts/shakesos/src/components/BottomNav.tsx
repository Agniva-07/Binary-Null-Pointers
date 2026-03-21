import type { AppPage } from "@/App";

interface BottomNavProps {
    currentPage: AppPage;
    onNavigate: (page: AppPage) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
    const items: { page: AppPage; icon: string; label: string }[] = [
        { page: "home", icon: "🏠", label: "Home" },
        { page: "timer", icon: "⏱️", label: "Timer" },
        { page: "fakecall", icon: "📞", label: "Fake Call" },
        { page: "tools", icon: "🛡️", label: "Tools" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur-md">
            <div className="mx-auto max-w-sm">
                <div className="flex items-center justify-around py-2">
                    {items.map((item) => {
                        const active = currentPage === item.page;
                        return (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${active
                                        ? "text-red-400"
                                        : "text-gray-500 active:text-gray-300"
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className={`text-[10px] font-medium ${active ? "text-red-400" : "text-gray-500"}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <div className="h-0.5 w-4 rounded-full bg-red-500 mt-0.5" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Safe area spacer for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
