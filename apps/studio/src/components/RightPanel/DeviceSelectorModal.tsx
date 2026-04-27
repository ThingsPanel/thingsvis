import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { PlatformDevice, PlatformDeviceGroup } from '@/lib/stores/platformDeviceStore';

type DeviceSearchResultPayload = {
  reqId?: string;
  devices?: PlatformDevice[];
  total?: number;
  page?: number;
  pageSize?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: PlatformDeviceGroup[];
  selectedGroupId: string;
  selectedDeviceId?: string;
  onGroupChange: (groupId: string) => void;
  onDevicesLoaded: (groupId: string, devices: PlatformDevice[]) => void;
  onSelect: (device: PlatformDevice) => void;
};

const DEFAULT_PAGE_SIZE = 10;
const ALL_GROUP_ID = '__all__';

export function DeviceSelectorModal({
  open,
  onOpenChange,
  groups,
  selectedGroupId,
  selectedDeviceId,
  onGroupChange,
  onDevicesLoaded,
  onSelect,
}: Props) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [devices, setDevices] = useState<PlatformDevice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reqSeqRef = useRef(0);
  const activeReqRef = useRef('');

  const groupId = selectedGroupId || groups[0]?.groupId || ALL_GROUP_ID;
  const pageCount = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const canPrev = page > 1 && !loading;
  const canNext = page < pageCount && !loading;

  const visibleGroups = useMemo(() => {
    if (groups.some((group) => group.groupId === ALL_GROUP_ID)) return groups;
    return [{ groupId: ALL_GROUP_ID, groupName: '全部设备', parentId: null }, ...groups];
  }, [groups]);

  useEffect(() => {
    if (!open) return;
    if (selectedGroupId) return;
    onGroupChange(visibleGroups[0]?.groupId || ALL_GROUP_ID);
  }, [onGroupChange, open, selectedGroupId, visibleGroups]);

  useEffect(() => {
    if (!open) return;

    const reqId = `device-search-${Date.now()}-${++reqSeqRef.current}`;
    activeReqRef.current = reqId;
    setLoading(true);
    setError('');

    const timer = window.setTimeout(() => {
      window.parent.postMessage(
        {
          type: 'thingsvis:searchDevicesPaged',
          payload: {
            reqId,
            keyword: keyword.trim(),
            groupId,
            page,
            pageSize: DEFAULT_PAGE_SIZE,
          },
        },
        '*',
      );
    }, 300);

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: DeviceSearchResultPayload } | undefined;
      if (data?.type !== 'tv:search-devices-paged-result') return;

      const payload = data.payload;
      if (payload?.reqId !== activeReqRef.current) return;

      const nextDevices = Array.isArray(payload.devices) ? payload.devices : [];
      setDevices(nextDevices);
      setTotal(typeof payload.total === 'number' ? payload.total : 0);
      onDevicesLoaded(groupId, nextDevices);
      setLoading(false);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [groupId, keyword, onDevicesLoaded, open, page]);

  useEffect(() => {
    if (!open || !loading) return;
    const timer = window.setTimeout(() => {
      if (activeReqRef.current) {
        setLoading(false);
        setError('设备加载超时');
      }
    }, 10_000);

    return () => window.clearTimeout(timer);
  }, [loading, open]);

  const handleSelect = (device: PlatformDevice) => {
    onSelect(device);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-4">
        <DialogHeader>
          <DialogTitle>选择设备</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,220px)_1fr] gap-3">
          <select
            value={groupId}
            onChange={(event) => {
              onGroupChange(event.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {visibleGroups.map((group) => (
              <option key={group.groupId} value={group.groupId}>
                {group.groupName}
                {typeof group.deviceCount === 'number' ? ` (${group.deviceCount})` : ''}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="搜索设备名称或ID"
              className="pl-9"
            />
          </div>
        </div>

        <div className="min-h-[320px] overflow-hidden rounded-sm border border-input">
          <div className="grid grid-cols-[1fr_180px_120px] border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>设备名称</span>
            <span>设备ID</span>
            <span>分组</span>
          </div>

          {loading ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              正在加载设备...
            </div>
          ) : devices.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {error || '未找到匹配设备'}
            </div>
          ) : (
            <div className="max-h-[280px] overflow-auto">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  type="button"
                  onClick={() => handleSelect(device)}
                  className="grid w-full grid-cols-[1fr_180px_120px] items-center px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="truncate font-medium">
                    {device.deviceName || `Device ${device.deviceId}`}
                  </span>
                  <span className="truncate text-muted-foreground">{device.deviceId}</span>
                  <span className="truncate text-muted-foreground">
                    {device.groupName || device.groupId || '-'}
                  </span>
                  {selectedDeviceId === device.deviceId && <span className="sr-only">已选择</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground">
            共 {total} 条，第 {page} / {pageCount} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canPrev}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              title="上一页"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canNext}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              title="下一页"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeviceSelectorModal;
