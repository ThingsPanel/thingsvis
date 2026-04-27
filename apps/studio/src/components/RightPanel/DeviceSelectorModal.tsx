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

type DeviceFilterOption = {
  value: string;
  label: string;
};

type DeviceFilterOptionsPayload = {
  reqId?: string;
  deviceConfigs?: DeviceFilterOption[];
  serviceOptions?: DeviceFilterOption[];
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
const ALL_GROUP_LABEL = '不限设备分组';

function normalizeGroupLabel(group: PlatformDeviceGroup): string {
  if (group.groupId === ALL_GROUP_ID) return ALL_GROUP_LABEL;
  return group.groupName || group.groupId || '未命名分组';
}

function buildGroupOptions(
  groups: PlatformDeviceGroup[],
): Array<PlatformDeviceGroup & { depth: number }> {
  const allGroup = groups.find((group) => group.groupId === ALL_GROUP_ID);
  const realGroups = groups.filter((group) => group.groupId !== ALL_GROUP_ID);
  const childrenByParent = new Map<string, PlatformDeviceGroup[]>();
  const groupIds = new Set(realGroups.map((group) => group.groupId));
  const roots: PlatformDeviceGroup[] = [];

  realGroups.forEach((group) => {
    const parentId = group.parentId ? String(group.parentId) : '';
    if (parentId && parentId !== '0' && groupIds.has(parentId)) {
      const children = childrenByParent.get(parentId) || [];
      children.push(group);
      childrenByParent.set(parentId, children);
      return;
    }
    roots.push(group);
  });

  const sortByName = (items: PlatformDeviceGroup[]) =>
    [...items].sort((a, b) =>
      normalizeGroupLabel(a).localeCompare(normalizeGroupLabel(b), 'zh-Hans-CN'),
    );

  const flattened: Array<PlatformDeviceGroup & { depth: number }> = [];
  const visit = (group: PlatformDeviceGroup, depth: number) => {
    flattened.push({ ...group, depth });
    sortByName(childrenByParent.get(group.groupId) || []).forEach((child) =>
      visit(child, depth + 1),
    );
  };

  sortByName(roots).forEach((group) => visit(group, 0));
  return [
    {
      ...(allGroup || { groupId: ALL_GROUP_ID, groupName: ALL_GROUP_LABEL, parentId: null }),
      depth: 0,
    },
    ...flattened,
  ];
}

function formatOnlineStatus(device: PlatformDevice): string {
  return Number(device.isOnline) === 1 || device.isOnline === true ? '在线' : '离线';
}

function formatWarnStatus(device: PlatformDevice): string {
  return device.warnStatus === 'Y' ? '已告警' : '未告警';
}

function formatDeviceType(device: PlatformDevice): string {
  if (device.deviceType === '1') return '直连设备';
  if (device.deviceType === '2') return '网关';
  if (device.deviceType === '3') return '网关子设备';
  return '-';
}

function formatAccessService(device: PlatformDevice): string {
  if (!device.accessWay) return '-';
  const protocolType = device.protocolType || '-';
  return device.accessWay === 'A' ? `协议接入(${protocolType})` : `服务接入(${protocolType})`;
}

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
  const [deviceConfigId, setDeviceConfigId] = useState('');
  const [isOnline, setIsOnline] = useState('');
  const [warnStatus, setWarnStatus] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [serviceIdentifier, setServiceIdentifier] = useState('');
  const [labelKeyword, setLabelKeyword] = useState('');
  const [searchTick, setSearchTick] = useState(0);
  const [deviceConfigOptions, setDeviceConfigOptions] = useState<DeviceFilterOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<DeviceFilterOption[]>([]);
  const reqSeqRef = useRef(0);
  const filterReqSeqRef = useRef(0);
  const activeReqRef = useRef('');
  const activeFilterReqRef = useRef('');

  const visibleGroups = useMemo(() => {
    const normalized = groups.map((group) => ({
      ...group,
      groupName: normalizeGroupLabel(group),
    }));
    return buildGroupOptions(normalized);
  }, [groups]);
  const visibleGroupIds = useMemo(
    () => new Set(visibleGroups.map((group) => group.groupId)),
    [visibleGroups],
  );
  const groupId =
    selectedGroupId && visibleGroupIds.has(selectedGroupId)
      ? selectedGroupId
      : visibleGroups[0]?.groupId || ALL_GROUP_ID;
  const pageCount = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const canPrev = page > 1 && !loading;
  const canNext = page < pageCount && !loading;

  useEffect(() => {
    if (!open) return;
    if (selectedGroupId && visibleGroupIds.has(selectedGroupId)) return;
    onGroupChange(visibleGroups[0]?.groupId || ALL_GROUP_ID);
  }, [onGroupChange, open, selectedGroupId, visibleGroupIds, visibleGroups]);

  useEffect(() => {
    if (!open) return;

    const reqId = `device-filter-options-${Date.now()}-${++filterReqSeqRef.current}`;
    activeFilterReqRef.current = reqId;
    window.parent.postMessage(
      {
        type: 'thingsvis:requestDeviceFilterOptions',
        payload: { reqId },
      },
      '*',
    );

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; payload?: DeviceFilterOptionsPayload }
        | undefined;
      if (data?.type !== 'tv:device-filter-options') return;

      const payload = data.payload;
      if (payload?.reqId !== activeFilterReqRef.current) return;

      setDeviceConfigOptions(Array.isArray(payload.deviceConfigs) ? payload.deviceConfigs : []);
      setServiceOptions(Array.isArray(payload.serviceOptions) ? payload.serviceOptions : []);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open]);

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
            deviceConfigId,
            isOnline,
            warnStatus,
            deviceType,
            serviceIdentifier,
            label: labelKeyword.trim(),
            searchTick,
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
  }, [
    deviceConfigId,
    deviceType,
    groupId,
    isOnline,
    keyword,
    labelKeyword,
    onDevicesLoaded,
    open,
    page,
    searchTick,
    serviceIdentifier,
    warnStatus,
  ]);

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

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    setSearchTick((value) => value + 1);
  };

  const handleReset = () => {
    onGroupChange(ALL_GROUP_ID);
    setKeyword('');
    setDeviceConfigId('');
    setIsOnline('');
    setWarnStatus('');
    setDeviceType('');
    setServiceIdentifier('');
    setLabelKeyword('');
    setPage(1);
    setSearchTick((value) => value + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1120px] gap-4">
        <DialogHeader>
          <DialogTitle>选择设备</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-6 gap-3">
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
                {`${'　'.repeat(group.depth)}${group.groupName}`}
                {typeof group.deviceCount === 'number' ? ` (${group.deviceCount})` : ''}
              </option>
            ))}
          </select>

          <select
            value={deviceConfigId}
            onChange={(event) => updateFilter(setDeviceConfigId, event.target.value)}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">不使用设备模板</option>
            {deviceConfigOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={isOnline}
            onChange={(event) => updateFilter(setIsOnline, event.target.value)}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">不限在线状态</option>
            <option value="1">在线</option>
            <option value="0">离线</option>
          </select>

          <select
            value={warnStatus}
            onChange={(event) => updateFilter(setWarnStatus, event.target.value)}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">不报告警状态</option>
            <option value="Y">告警</option>
            <option value="N">无告警</option>
          </select>

          <select
            value={deviceType}
            onChange={(event) => updateFilter(setDeviceType, event.target.value)}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">不限接入类型</option>
            <option value="1">直连设备</option>
            <option value="2">网关</option>
            <option value="3">网关子设备</option>
          </select>

          <select
            value={serviceIdentifier}
            onChange={(event) => updateFilter(setServiceIdentifier, event.target.value)}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">不限协议/服务</option>
            {serviceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[minmax(0,312px)_minmax(0,312px)_auto_auto] gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="设备名称或编号"
              className="pl-9"
            />
          </div>

          <Input
            value={labelKeyword}
            onChange={(event) => updateFilter(setLabelKeyword, event.target.value)}
            placeholder="标签"
          />

          <Button type="button" onClick={handleSearch} disabled={loading}>
            查询
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            重置
          </Button>
        </div>

        <div className="min-h-[320px] overflow-hidden rounded-sm border border-input">
          <div className="grid min-w-[1080px] grid-cols-[1.2fr_100px_100px_110px_160px_170px_160px] border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>设备名称</span>
            <span>在线状态</span>
            <span>告警状态</span>
            <span>设备类型</span>
            <span>设备配置</span>
            <span>接入服务/协议</span>
            <span>最后推送时间</span>
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
                  className="grid min-w-[1080px] grid-cols-[1.2fr_100px_100px_110px_160px_170px_160px] items-center px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="truncate font-medium text-primary">
                    {device.deviceName || `Device ${device.deviceId}`}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {formatOnlineStatus(device)}
                  </span>
                  <span className="truncate text-muted-foreground">{formatWarnStatus(device)}</span>
                  <span className="truncate text-muted-foreground">{formatDeviceType(device)}</span>
                  <span className="truncate text-muted-foreground">
                    {device.deviceConfigName || '-'}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {formatAccessService(device)}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {device.lastPushTime || '-'}
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
