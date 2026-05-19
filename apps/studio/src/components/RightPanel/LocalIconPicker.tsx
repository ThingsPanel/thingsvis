import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loadLocalIconsManifest } from '@/lib/local-icons/loadManifest';
import {
  buildLocalIconAssetUrl,
  fetchLocalIconSvg,
  isLocalIconSvg,
} from '@/lib/local-icons/resolveUrl';
import {
  closeLocalIconPicker,
  subscribeLocalIconPicker,
  type LocalIconPickerRequest,
} from '@/lib/local-icons/pickerStore';
import type { LocalIconEntry, LocalIconsManifest } from '@/lib/local-icons/types';

const PAGE_SIZE = 12;

type CategoryTreeNode = {
  id: string;
  name: string;
  children: CategoryTreeNode[];
};

function IconSearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative p-3">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
}

function IconGrid({
  icons,
  selectedId,
  basePath,
  onSelect,
  emptyLabel,
  error,
}: {
  icons: LocalIconEntry[];
  selectedId: string;
  basePath?: string;
  onSelect: (id: string) => void;
  emptyLabel: string;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!icons.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid content-start grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-4 flex-1">
      {icons.map((icon) => {
        const url = buildLocalIconAssetUrl(icon, basePath);
        const selected = selectedId === icon.id;
        return (
          <button
            key={icon.id}
            type="button"
            className={`flex self-start flex-col overflow-hidden rounded-md border transition-colors ${
              selected
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onSelect(icon.id)}
          >
            <div className="flex h-24 items-center justify-center bg-muted/30 p-3">
              <img src={url} alt={icon.name} className="h-full w-full object-contain" />
            </div>
            <div className="flex h-8 shrink-0 items-center border-t px-2 min-w-0" title={icon.name}>
              <span className="w-full min-w-0 truncate text-center text-xs text-muted-foreground">
                {icon.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function buildCategoryTree(manifest: LocalIconsManifest | null): CategoryTreeNode[] {
  if (!manifest) return [];

  const categoryIds = new Set<string>();
  manifest.categories.forEach((category) => categoryIds.add(category.id));
  manifest.icons.forEach((icon) => {
    const segments = icon.categoryId.split('/').filter(Boolean);
    let currentPath = '';
    segments.forEach((segment) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      categoryIds.add(currentPath);
    });
  });

  const root: CategoryTreeNode[] = [];
  const nodes = new Map<string, CategoryTreeNode>();

  const sortedIds = Array.from(categoryIds).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  for (const id of sortedIds) {
    const segments = id.split('/');
    const name = segments[segments.length - 1] || id;
    nodes.set(id, { id, name, children: [] });
  }

  for (const id of sortedIds) {
    const node = nodes.get(id);
    if (!node) continue;
    const parentId = id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : '';
    if (!parentId) {
      root.push(node);
      continue;
    }
    const parent = nodes.get(parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      root.push(node);
    }
  }

  return root;
}

function filterCategoryTree(nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] {
  if (!query.trim()) return nodes;
  const keyword = query.trim().toLowerCase();

  const filterNode = (node: CategoryTreeNode): CategoryTreeNode | null => {
    const children = node.children
      .map((child) => filterNode(child))
      .filter((child): child is CategoryTreeNode => child != null);
    const matches =
      node.name.toLowerCase().includes(keyword) || node.id.toLowerCase().includes(keyword);
    if (!matches && children.length === 0) return null;
    return { ...node, children };
  };

  return nodes
    .map((node) => filterNode(node))
    .filter((node): node is CategoryTreeNode => node != null);
}

function collectExpandedIds(nodes: CategoryTreeNode[]): Set<string> {
  const expanded = new Set<string>();

  const visit = (node: CategoryTreeNode) => {
    if (node.children.length > 0) {
      expanded.add(node.id);
      node.children.forEach(visit);
    }
  };

  nodes.forEach(visit);
  return expanded;
}

function collectAncestorIds(categoryId: string): string[] {
  const segments = categoryId.split('/').filter(Boolean);
  const ancestors: string[] = [];
  let current = '';
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!segment) continue;
    current = current ? `${current}/${segment}` : segment;
    ancestors.push(current);
  }
  return ancestors;
}

function CategoryTree({
  nodes,
  activeCategoryId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  nodes: CategoryTreeNode[];
  activeCategoryId: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {nodes.map((node) => (
        <CategoryTreeRow
          key={node.id}
          node={node}
          depth={0}
          activeCategoryId={activeCategoryId}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function CategoryTreeRow({
  node,
  depth,
  activeCategoryId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: CategoryTreeNode;
  depth: number;
  activeCategoryId: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const expanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 text-sm transition-colors ${
          activeCategoryId === node.id
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted disabled:cursor-default disabled:opacity-40"
          onClick={() => hasChildren && onToggle(node.id)}
          disabled={!hasChildren}
          aria-label={expanded ? 'collapse' : 'expand'}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left"
          title={node.id}
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </button>
      </div>

      {hasChildren && expanded
        ? node.children.map((child) => (
            <CategoryTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              activeCategoryId={activeCategoryId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export function LocalIconPickerHost() {
  const { t } = useTranslation('editor');
  const [request, setRequest] = useState<LocalIconPickerRequest | null>(null);
  const [manifest, setManifest] = useState<LocalIconsManifest | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [loadingSvg, setLoadingSvg] = useState(false);

  useEffect(() => subscribeLocalIconPicker(setRequest), []);

  useEffect(() => {
    if (!request) return;
    setGroupSearch('');
    setIconSearch('');
    setPage(1);
    setSelectedId(request.value || '');
    setManifestError(null);

    loadLocalIconsManifest()
      .then((data) => {
        setManifest(data);
        const matched = data.icons.find((icon) => icon.id === request.value);
        const initialCategoryId = matched?.categoryId ?? data.categories[0]?.id ?? '';
        setActiveCategoryId(initialCategoryId);
        const nextExpanded = collectExpandedIds(buildCategoryTree(data));
        collectAncestorIds(initialCategoryId).forEach((id) => nextExpanded.add(id));
        setExpandedIds(nextExpanded);
      })
      .catch((error) => {
        setManifestError(error instanceof Error ? error.message : String(error));
      });
  }, [request]);

  const categoryTree = useMemo(() => buildCategoryTree(manifest), [manifest]);

  const filteredCategoryTree = useMemo(
    () => filterCategoryTree(categoryTree, groupSearch),
    [categoryTree, groupSearch],
  );

  const categoryIcons = useMemo(() => {
    if (!manifest || !activeCategoryId) return [];
    let list = manifest.icons.filter(
      (icon) =>
        icon.categoryId === activeCategoryId || icon.categoryId.startsWith(`${activeCategoryId}/`),
    );
    const key = iconSearch.trim().toLowerCase();
    if (key) {
      list = list.filter(
        (icon) => icon.name.toLowerCase().includes(key) || icon.id.toLowerCase().includes(key),
      );
    }
    return list;
  }, [activeCategoryId, iconSearch, manifest]);

  const totalPages = Math.max(1, Math.ceil(categoryIcons.length / PAGE_SIZE));

  const pageIcons = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return categoryIcons.slice(start, start + PAGE_SIZE);
  }, [categoryIcons, page]);

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId, iconSearch]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!activeCategoryId) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      collectAncestorIds(activeCategoryId).forEach((id) => next.add(id));
      return next;
    });
  }, [activeCategoryId]);

  const handleClose = useCallback(() => {
    request?.onCancel?.();
    closeLocalIconPicker();
  }, [request]);

  const handleConfirm = useCallback(async () => {
    if (!request || !manifest || !selectedId) {
      handleClose();
      return;
    }

    const icon = manifest.icons.find((item) => item.id === selectedId);
    if (!icon) {
      handleClose();
      return;
    }

    setLoadingSvg(true);
    try {
      const assetUrl = buildLocalIconAssetUrl(icon, manifest.basePath);
      const size = {
        ...(typeof icon.width === 'number' ? { width: icon.width } : {}),
        ...(typeof icon.height === 'number' ? { height: icon.height } : {}),
      };
      if (isLocalIconSvg(icon)) {
        const svgContent = await fetchLocalIconSvg(icon, manifest.basePath);
        request.onConfirm({ id: icon.id, kind: 'svg', assetUrl, svgContent, ...size });
      } else {
        request.onConfirm({ id: icon.id, kind: 'image', assetUrl, ...size });
      }
      closeLocalIconPicker();
    } catch {
      setManifestError(t('localIconPicker.loadFailed', '图标加载失败'));
    } finally {
      setLoadingSvg(false);
    }
  }, [handleClose, manifest, request, selectedId, t]);

  const handleToggleCategory = useCallback((id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectCategory = useCallback((id: string) => {
    setActiveCategoryId(id);
  }, []);

  return (
    <Dialog open={!!request} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="flex max-h-[85vh] w-[min(1080px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1080px]"
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>{t('localIconPicker.title', '本地图库')}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-[420px] flex-1 overflow-hidden">
          <aside className="flex w-64 shrink-0 flex-col border-r">
            <IconSearchInput
              placeholder={t('localIconPicker.searchGroup', '搜索分组')}
              value={groupSearch}
              onChange={setGroupSearch}
            />
            <CategoryTree
              nodes={filteredCategoryTree}
              activeCategoryId={activeCategoryId}
              expandedIds={expandedIds}
              onToggle={handleToggleCategory}
              onSelect={handleSelectCategory}
            />
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="border-b">
              <IconSearchInput
                placeholder={t('localIconPicker.searchIcon', '请输入图片名称')}
                value={iconSearch}
                onChange={setIconSearch}
              />
            </div>

            <IconGrid
              icons={pageIcons}
              selectedId={selectedId}
              basePath={manifest?.basePath}
              onSelect={setSelectedId}
              emptyLabel={t('localIconPicker.empty', '暂无数据')}
              error={manifestError}
            />

            <div className="flex items-center justify-center gap-1 border-t px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                &lt;
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => {
                  if (totalPages <= 7) return true;
                  return Math.abs(n - page) <= 2 || n === 1 || n === totalPages;
                })
                .map((n, index, pages) => {
                  const prev = pages[index - 1];
                  const showEllipsis = prev != null && n - prev > 1;
                  return (
                    <React.Fragment key={n}>
                      {showEllipsis ? (
                        <span className="px-1 text-xs text-muted-foreground">...</span>
                      ) : null}
                      <Button
                        type="button"
                        variant={page === n ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-8"
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </Button>
                    </React.Fragment>
                  );
                })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                &gt;
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter className="border-t px-4 py-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loadingSvg}>
            {t('common.cancel', '取消')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selectedId || loadingSvg}
          >
            {loadingSvg ? t('localIconPicker.loading', '加载中...') : t('common.confirm', '确定')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
