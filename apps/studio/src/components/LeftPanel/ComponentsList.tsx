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
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
  SlidersHorizontal,
  ImageIcon,
  Video,
  Play,
  Sparkles,
  Frame,
  Circle,
  Wind,
};

// Match v0code top-level accordion keys/labels exactly
const CATEGORY_DEFS = [
  { key: "basic", labelZh: "基础组件", labelEn: "Basic", Icon: Box },
  { key: "charts", labelZh: "图表组件", labelEn: "Charts", Icon: BarChart3 },
  { key: "media", labelZh: "媒体展示", labelEn: "Media", Icon: Film },
  { key: "resources", labelZh: "资源组件", labelEn: "Resources", Icon: Folder },
  { key: "geo", labelZh: "地理信息", labelEn: "Geo", Icon: Globe },
  { key: "custom", labelZh: "自定义", labelEn: "Custom", Icon: Sparkles },
] as const;

export default function ComponentsList({ onInsert, language }: { onInsert: (type: string) => void; language: string }) {
  const [entries, setEntries] = useState<ComponentRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_DEFS[0].key);

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
              displayName: key,
              iconUrl: (entry as any).iconUrl ?? "",
              icon: (entry as any).icon ?? ""
            } as ComponentRegistryEntry;
            
            arr.push(baseEntry);

            // 如果配置了本地地址，则额外增加一个“(Local)”条目方便对比调试
            if (entry.localEntryUrl) {
              arr.push({
                ...baseEntry,
                displayName: `${key} (Local)`,
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
        console.error("[ComponentsList] failed to load registry", e);
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
      type: (entry as any).displayName ?? entry.remoteName,
      remoteName: entry.remoteName,
      remoteEntryUrl: entry.remoteEntryUrl,
      localEntryUrl: entry.localEntryUrl,
      staticEntryUrl: entry.staticEntryUrl,
      exposedModule: entry.exposedModule,
    });
    e.dataTransfer.setData("application/thingsvis-plugin", payload);
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
      const sourceKey = ((entry as any).displayName as string) || (entry.remoteName as string) || "";
      const parts = sourceKey.split("/");
      const rawPrefix = (parts[0] || "basic").toLowerCase();
      const cat = prefixMap[rawPrefix] ?? "basic";
      if (!map[cat]) map[cat] = [];
      map[cat].push(entry);
    }
    return map;
  }, [entries]);

  if (loading) return <div className="p-2 text-sm text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-2 text-sm text-red-500">Failed to load registry</div>;

  return (
    <div>
      <Accordion type="multiple" defaultValue={CATEGORY_DEFS.map((c) => c.key)} className="space-y-2">
        {CATEGORY_DEFS.map((c) => {
          const label = language === "zh" ? c.labelZh : c.labelEn;
          const items = entriesByCategory[c.key] ?? [];
          const Icon = c.Icon;

          // Render items flat under the primary category while preserving the secondary styling (grid, spacing)
          return (
            <AccordionItem key={c.key} value={c.key} className="border-0">
              <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline text-left">
                <span className="block w-full">{label}</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-1 px-2">
                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-2 py-1.5">
                    {language === "zh" ? "暂无组件" : "No components"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((entry) => {
                        // 根据 icon 字段获取对应的 Lucide 图标组件，默认使用 Box
                        const iconName = (entry as any).icon as string;
                        const IconComponent = (iconName && ICON_MAP[iconName]) || Box;
                        return (
                          <button
                            key={entry.remoteName}
                            draggable
                            onDragStart={(e) => handleDragStart(e, entry)}
                            onClick={() => onInsert((entry as any).displayName ?? entry.remoteName)}
                            className="h-20 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1.5 transition-colors p-2"
                          >
                            <div className="h-6 w-6 text-foreground mb-1">
                              {(entry as any).iconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={(entry as any).iconUrl}
                                  alt={(entry as any).displayName ?? entry.remoteName}
                                  className="w-6 h-6 object-contain"
                                />
                              ) : (
                                <IconComponent className="h-6 w-6 text-foreground" />
                              )}
                            </div>
                            <span className="text-sm text-foreground font-medium">
                              {((entry as any).displayName ?? entry.remoteName).split("/").slice(-1)[0] || entry.remoteName}
                            </span>
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
    </div>
  );
}


