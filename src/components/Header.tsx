import { MapPin } from 'lucide-react';
import type { AppTab, CityLocation, Language } from '../types/prayer';
import { T } from '../utils/i18n';

interface HeaderProps {
  language: Language;
  onSelectTab: (tab: AppTab) => void;
  city: CityLocation;
  onOpenCityPicker: () => void;
}

export function Header({ language, onSelectTab, city, onOpenCityPicker }: HeaderProps) {
  const t = T[language];
  const cityLabel = language === 'ar' ? city.nameAr : city.nameEn;

  return (
    <header className="sai-header sticky top-0 z-30 border-b border-[#E3E7E2] bg-[#F6F7F5]/92 backdrop-blur-md dark:border-[#1E2A24] dark:bg-[#0B100E]/92">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('prayers')}
          className="font-display text-2xl font-bold tracking-tight text-[#0F5132] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-md px-1 dark:text-[#6EE7B7]"
        >
          {t.brand}
        </button>

        {/* Primary Action: City / Location Switcher */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCityPicker}
            aria-label={t.changeLocationAria(cityLabel)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#0F5132] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0B3D25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:ring-offset-2 whitespace-nowrap shrink-0 dark:bg-[#196B45] dark:hover:bg-[#1E7E52] dark:focus-visible:ring-offset-[#0B100E]"
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="max-w-[150px] truncate">{cityLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
