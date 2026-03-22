import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Box,
  BarChart3,
  Film,
  Folder,
  Globe,
  Map,
  Columns3,
  Type,
  Repeat,
  Activity,
  Clock,
  Table2,
  ToggleLeft,
  SlidersHorizontal,
  ImageIcon,
  Video,
  Play,
  Sparkles,
  Frame,
  Circle,
  Wind,
  LucideIcon,
  Search,
  Minus,
  CreditCard,
  ToggleRight,
  AppWindow,
  PieChart,
  Gauge,
  TrendingUp,
  LineChart,
  Hash,
  Square,
  MousePointerClick,
  Calendar,
  TextCursorInput,
  GaugeCircle,
  SquareMenu,
  Bell,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import {
  ensureRegistryLoaded,
  getRegistrySnapshot,
  subscribeRegistry,
} from '@/lib/registry/registry-store';
import type { RegistryListEntry } from '@/lib/registry/registryClient';
import { useTranslation } from 'react-i18next';

const ICON_MAP: Record<string, LucideIcon> = {
  Box,
  BarChart3,
  Film,
  Folder,
  Globe,
  Map,
  Columns3,
  Type,
  Repeat,
  Activity,
  Clock,
  Table2,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  ImageIcon,
  Image: ImageIcon,
  Video,
  Play,
  Sparkles,
  Frame,
  Circle,
  Wind,
  Minus,
  CreditCard,
  AppWindow,
  PieChart,
  Gauge,
  TrendingUp,
  LineChart,
  Hash,
  Square,
  MousePointerClick,
  Calendar,
  TextCursorInput,
  GaugeCircle,
  SquareMenu,
  Bell,
};

const CATEGORY_DEFS = [
  { key: 'basic', Icon: Box },
  { key: 'interaction', Icon: MousePointerClick },
  { key: 'charts', Icon: BarChart3 },
  { key: 'media', Icon: Film },
  { key: 'resources', Icon: Folder },
  { key: 'geo', Icon: Globe },
  { key: 'custom', Icon: Sparkles },
] as const;

type CategoryMap = Record<string, RegistryListEntry[]>;
const HIDDEN_COMPONENT_IDS = new Set(['geo/map-china']);

function resolveEntryDisplayName(entry: RegistryListEntry, language: string): string {
  const normalized = (language || '').toLowerCase();
  const baseLanguage = normalized.split('-')[0] ?? normalized;
  const i18nName =
    entry.i18n?.[normalized] ?? entry.i18n?.[baseLanguage] ?? entry.i18n?.zh ?? entry.i18n?.en;

  return i18nName ?? entry.displayName ?? entry.componentId ?? entry.remoteName;
}

export default function ComponentsList({
  onInsert: _onInsert,
}: {
  onInsert: (type: string) => void;
}) {
  const { t, i18n } = useTranslation('editor');
  const registrySnapshot = useSyncExternalStore(
    subscribeRegistry,
    getRegistrySnapshot,
    getRegistrySnapshot,
  );
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    ensureRegistryLoaded().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    });
  }, []);

  const entries = (registrySnapshot?.entries ?? []).filter(
    (entry) => !HIDDEN_COMPONENT_IDS.has(entry.componentId),
  );
  const isLoading = registrySnapshot == null && error == null;

  function handleDragStart(e: React.DragEvent, entry: RegistryListEntry) {
    const payload = JSON.stringify({
      type: entry.componentId,
      remoteName: entry.remoteName,
      remoteEntryUrl: entry.remoteEntryUrl,
      localEntryUrl: entry.localEntryUrl,
      staticEntryUrl: entry.staticEntryUrl,
      exposedModule: entry.exposedModule,
    });

    e.dataTransfer.setData('application/thingsvis-widget', payload);
    e.dataTransfer.effectAllowed = 'copy';
  }

  const entriesByCategory = useMemo(() => {
    const map: CategoryMap = {};
    const prefixMap: Record<string, string> = {
      basic: 'basic',
      interaction: 'interaction',
      chart: 'charts',
      charts: 'charts',
      media: 'media',
      resource: 'resources',
      resources: 'resources',
      custom: 'custom',
      geo: 'geo',
    };

    CATEGORY_DEFS.forEach((def) => {
      map[def.key] = [];
    });

    entries.forEach((entry) => {
      const parts = entry.componentId.split('/');
      const rawPrefix = (parts[0] || 'basic').toLowerCase();
      const category = prefixMap[rawPrefix] ?? 'basic';
      map[category] = map[category] ?? [];
      map[category].push(entry);
    });

    return map;
  }, [entries]);

  const filteredCategoriesMap = useMemo(() => {
    if (!searchQuery.trim()) {
      return entriesByCategory;
    }

    const query = searchQuery.toLowerCase();
    const filtered: CategoryMap = {};

    Object.entries(entriesByCategory).forEach(([category, items]) => {
      const matchedItems = items.filter((entry) => {
        const displayName = resolveEntryDisplayName(
          entry,
          i18n.resolvedLanguage ?? i18n.language,
        ).toLowerCase();
        return displayName.includes(query) || entry.componentId.toLowerCase().includes(query);
      });

      if (matchedItems.length > 0) {
        filtered[category] = matchedItems;
      }
    });

    return filtered;
  }, [entriesByCategory, i18n.language, searchQuery]);

  if (isLoading) {
    return <div className="p-2 text-sm text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="p-2 text-sm text-red-500">Failed to load registry</div>;
  }

  const hasResults = Object.keys(filteredCategoriesMap).length > 0;

  return (
    <div className="flex flex-col h-full" data-testid="components-list">
      <div className="p-2 pb-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('components.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
            data-testid="components-search"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!hasResults && searchQuery ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('components.noResults')}
          </div>
        ) : (
          <Accordion
            key={searchQuery ? 'search-results' : 'category-list'}
            type="multiple"
            defaultValue={searchQuery ? Object.keys(filteredCategoriesMap) : ['basic']}
            className="space-y-2"
          >
            {CATEGORY_DEFS.map((categoryDef) => {
              const items = filteredCategoriesMap[categoryDef.key] ?? [];
              if (items.length === 0 && searchQuery) {
                return null;
              }

              return (
                <AccordionItem key={categoryDef.key} value={categoryDef.key} className="border-0">
                  <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline text-left">
                    <span className="block w-full">
                      {t(`components.categories.${categoryDef.key}`)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-1 px-2">
                    {items.length === 0 ? (
                      <div className="text-sm text-muted-foreground px-2 py-1.5">
                        {t('components.noComponents')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {items.map((entry) => {
                            const iconName = entry.icon ?? '';
                            const IconComponent = (iconName && ICON_MAP[iconName]) || Box;
                            const displayName = resolveEntryDisplayName(
                              entry,
                              i18n.resolvedLanguage ?? i18n.language,
                            );

                            return (
                              <button
                                key={entry.componentId}
                                type="button"
                                draggable
                                onDragStart={(e) => handleDragStart(e, entry)}
                                className="h-16 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1 transition-colors p-1.5"
                                data-testid="component-card"
                                data-component-id={entry.componentId}
                                title={displayName}
                              >
                                <div className="h-5 w-5 text-foreground mb-0.5">
                                  {entry.iconUrl ? (
                                    <img
                                      src={entry.iconUrl}
                                      alt={displayName}
                                      className="w-6 h-6 object-contain"
                                    />
                                  ) : (
                                    <IconComponent className="h-5 w-5 text-foreground" />
                                  )}
                                </div>
                                <div className="leading-tight text-center">
                                  <div className="text-[11px] text-foreground font-medium truncate w-full px-0.5">
                                    {displayName}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
