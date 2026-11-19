import { Bell, CalendarDays, Clock, Compass, SlidersHorizontal } from 'lucide-react';
import type { AppTab, Language } from '../types/prayer';
import { T } from '../utils/i18n';

interface MobileBottomNavProps {
  activeTab: AppTab;
  language: Language;
  onSelectTab: (tab: AppTab) => void;
}

export function MobileBottomNav({ activeTab, language, onSelectTab }: MobileBottomNavProps) {
  const t = T[language];
  const items: { id: AppTab; label: string; icon: typeof Clock }[] = [
    { id: 'prayers', label: t.tabs.prayers, icon: Clock },
    { id: 'qibla', label: t.tabs.qibla, icon: Compass },
    { id: 'calendar', label: t.tabs.calendar, icon: CalendarDays },
    { id: 'alarms', label: t.tabs.alarms, icon: Bell },
    { id: 'settings', label: t.tabs.settings, icon: SlidersHorizontal },
  ];

  return (
    <nav
      aria-label={t.navAria}
      className="sai-bottom-nav fixed bottom-0 inset-x-0 z-40 border-t border-[#E3E7E2] bg-white/95 backdrop-blur-md dark:border-[#1E2A24] dark:bg-[#101815]/95"
    >
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-5 items-center px-1 sm:px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                isActive
                  ? 'text-[#0F5132] font-semibold dark:text-[#6EE7B7]'
                  : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="sai-nav-indicator absolute top-0 inset-x-4 sm:inset-x-8 h-0.5 rounded-full bg-[#0F5132] dark:bg-[#6EE7B7]"
                />
              )}
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
              <span className="text-[11px] sm:text-xs leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
