import React, { useEffect, useMemo, useState } from "react";
import type { ComponentRegistryEntry } from "@thingsvis/schema";
import { getRegistryEntries } from "@thingsvis/ui";
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
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

// Lucide 图标名称到组件的映射
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
};

// Match v0code top-level accordion keys/labels exactly
const CATEGORY_DEFS = [
  { key: "basic", Icon: Box },
  { key: "charts", Icon: BarChart3 },
  { key: "media", Icon: Film },
  { key: "resources", Icon: Folder },
  { key: "geo", Icon: Globe },
  { key: "custom", Icon: Sparkles },
] as const;

import { useTranslation } from "react-i18next";

export default function ComponentsList({ onInsert: _onInsert }: { onInsert: (type: string) => void }) {
  const { t, i18n } = useTranslation('editor');
  const [entries, setEntries] = useState<ComponentRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    // Load registry via the UI loader (fetches preview registry when available).
    getRegistryEntries()
      .then((res) => {
        if (!mounted) return;
        // If we got a raw registry object (from previewRegistry), map to array format expected by the UI
        if (res && (res as any).components && !Array.isArray(res)) {
          const arr: ComponentRegistryEntry[] = [];
          Object.keys((res as any).components).forEach((key) => {
            const entry = (res as any).components[key];
            const baseEntry = {
              remoteName: entry.remoteName ?? key,
              remoteEntryUrl: entry.remoteEntryUrl,
              localEntryUrl: entry.localEntryUrl,
              staticEntryUrl: entry.staticEntryUrl,
              debugSource: entry.debugSource,
              exposedModule: entry.exposedModule,
              version: entry.version,
              displayName: entry.name ?? key, // Use entry.name (中文名称) if available, fallback to key
              iconUrl: (entry as any).iconUrl ?? "",
              icon: (entry as any).icon ?? "",
              i18n: entry.i18n
            } as ComponentRegistryEntry;

            (baseEntry as any).componentId = key;

            arr.push(baseEntry);

            // 如果配置了本地地址，则额外增加一个“(Local)”条目方便对比调试
            if (entry.localEntryUrl) {
              arr.push({
                ...baseEntry,
                displayName: `${entry.name ?? key} (Local)`,
              } as any);
            }
          });
          setEntries(arr);
        } else {
          setEntries(res as ComponentRegistryEntry[]);
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console

        setError(String(e));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function handleDragStart(e: React.DragEvent, entry: ComponentRegistryEntry) {
    const payload = JSON.stringify({
      // Use stable componentId for insertion/loading; label is for UI only
      type: (entry as any).componentId ?? entry.remoteName,
      remoteName: entry.remoteName,
      remoteEntryUrl: entry.remoteEntryUrl,
      localEntryUrl: entry.localEntryUrl,
      staticEntryUrl: entry.staticEntryUrl,
      exposedModule: entry.exposedModule,
    });
    e.dataTransfer.setData("application/thingsvis-widget", payload);
    e.dataTransfer.effectAllowed = "copy";
  }

  const entriesByCategory = useMemo(() => {
    const map: Record<string, ComponentRegistryEntry[]> = {};
    for (const def of CATEGORY_DEFS) map[def.key] = [];

    const prefixMap: Record<string, string> = {
      basic: "basic",
      chart: "charts",
      charts: "charts",
      media: "media",
      resource: "resources",
      resources: "resources",
      custom: "custom",
      geo: "geo"
    };

    for (const entry of entries) {
      // Grouping should be based on componentId (e.g. "basic/text"), not the display label.
      const sourceKey = ((entry as any).componentId as string) || (entry.remoteName as string) || "";
      const parts = sourceKey.split("/");
      const rawPrefix = (parts[0] || "basic").toLowerCase();
      const cat = prefixMap[rawPrefix] ?? "basic";
      if (!map[cat]) map[cat] = [];
      map[cat].push(entry);
    }
    return map;
  }, [entries]);

  // Filter entries based on search query
  const filteredCategoriesMap = useMemo(() => {
    if (!searchQuery.trim()) return entriesByCategory;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, ComponentRegistryEntry[]> = {};

    for (const [cat, items] of Object.entries(entriesByCategory)) {
      const matchedItems = items.filter((entry) => {
        const i18nData = (entry as any).i18n;
        const fallbackName = (entry as any).displayName ?? entry.remoteName;
        const displayName = (i18nData?.[i18n.language] ?? fallbackName).toLowerCase();
        const componentId = ((entry as any).componentId ?? entry.remoteName).toLowerCase();
        return displayName.includes(query) || componentId.includes(query);
      });

      if (matchedItems.length > 0) {
        filtered[cat] = matchedItems;
      }
    }

    return filtered;
  }, [entriesByCategory, searchQuery]);

  if (loading) return <div className="p-2 text-sm text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-2 text-sm text-red-500">Failed to load registry</div>;

  // Get categories that have matching items
  const hasResults = Object.keys(filteredCategoriesMap).length > 0;
  // const defaultExpandedCategories = searchQuery ? Object.keys(filteredCategoriesMap) : CATEGORY_DEFS.map((c) => c.key);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-2 pb-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('components.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!hasResults && searchQuery ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('components.noResults')}
          </div>
        ) : (
          <Accordion
            key={searchQuery ? 'search-results' : 'category-list'}
            type="multiple"
            defaultValue={searchQuery ? Object.keys(filteredCategoriesMap) : ["basic"]}
            className="space-y-2"
          >
            {CATEGORY_DEFS.map((c) => {
              const label = t(`components.categories.${c.key}`);
              const items = filteredCategoriesMap[c.key] ?? [];
              const Icon = c.Icon;

              // Skip empty categories when searching
              if (items.length === 0 && searchQuery) return null;

              return (
                <AccordionItem key={c.key} value={c.key} className="border-0">
                  <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline text-left">
                    <span className="block w-full">{label}</span>
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
                            // 根据 icon 字段获取对应的 Lucide 图标组件，默认使用 Box
                            const iconName = (entry as any).icon as string;
                            const IconComponent = (iconName && ICON_MAP[iconName]) || Box;
                            return (
                              <button
                                key={entry.remoteName}
                                type="button"
                                draggable
                                onDragStart={(e) => handleDragStart(e, entry)}
                                className="h-16 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1 transition-colors p-1.5"
                              >
                                <div className="h-5 w-5 text-foreground mb-0.5">
                                  {(entry as any).iconUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={(entry as any).iconUrl}
                                      alt={(entry as any).i18n?.[i18n.language] ?? (entry as any).displayName ?? entry.remoteName}
                                      className="w-6 h-6 object-contain"
                                    />
                                  ) : (
                                    <IconComponent className="h-5 w-5 text-foreground" />
                                  )}
                                </div>
                                <div className="leading-tight text-center">
                                  <div className="text-xs text-foreground font-medium truncate w-full px-0.5">
                                    {(entry as any).i18n?.[i18n.language] ?? (entry as any).displayName ?? (entry as any).componentId ?? entry.remoteName}
                                  </div>
                                  {/* <div className="text-xs text-muted-foreground">
                                {(((entry as any).componentId ?? entry.remoteName) as string).split("/").slice(-1)[0] || entry.remoteName}
                              </div> */}
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


