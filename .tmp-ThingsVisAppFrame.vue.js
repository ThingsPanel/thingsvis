import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/thingsvis/ThingsVisAppFrame.vue");import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false, "VITE_APP_DESC": "ThingsPanel", "VITE_APP_TITLE": "ThingsPanel", "VITE_AUTH_ROUTE_MODE": "dynamic", "VITE_BASE_URL": "/", "VITE_ENCRYPT_PASSWORD": "0", "VITE_HTTP_PROXY": "Y", "VITE_ICON_LOCAL_PREFIX": "icon-local", "VITE_ICON_PREFIX": "icon", "VITE_MENU_ICON": "mdi:menu", "VITE_ROUTE_HOME": "home", "VITE_SERVICE_ENV": "dev", "VITE_THINGSVIS_API_URL": "http://localhost:8000", "VITE_THINGSVIS_STUDIO_URL": "http://localhost:3000/main"};/* unplugin-vue-components disabled */import { defineComponent as _defineComponent } from "/node_modules/.vite/deps/vue.js?v=97372f4f";
import { ref, onMounted, onBeforeUnmount } from "/node_modules/.vite/deps/vue.js?v=97372f4f";
import { useRouter } from "/node_modules/.vite/deps/vue-router.js?v=97372f4f";
import { clearThingsVisToken, getThingsVisToken } from "/src/utils/thingsvis/index.ts";
import {
  deviceList,
  getDeviceConfigList,
  telemetryDataCurrent,
  getAttributeDataSet,
  telemetryDataHistoryList,
  telemetryDataPub
} from "/src/service/api/device.ts?t=1773742004387";
import {
  attributesApi,
  getAlarmCount,
  getOnlineDeviceTrend,
  getSystemMetricsCurrent,
  getSystemMetricsHistory,
  telemetryApi,
  tenant
} from "/src/service/api/index.ts?t=1773742004387";
import { getThingsVisDashboard, updateThingsVisDashboard } from "/src/service/api/thingsvis.ts";
import { extractPlatformFields } from "/src/utils/thingsvis/platform-fields.ts";
import { getGlobalPlatformFields, resolveGlobalPlatformFieldScope } from "/src/utils/thingsvis/global-platform-fields.ts";
import { localStg } from "/src/utils/storage.ts";
import { getWebsocketServerUrl } from "/src/utils/common/tool.ts?t=1773742004387";
const EDITOR_TEMPLATE_FIELD_PAGE_SIZE = 1e3;
const DEFAULT_PLATFORM_BUFFER_SIZE = 100;
const PING_INTERVAL_MS = 8e3;
const WS_RECONNECT_DELAY_MS = 3e3;
const _sfc_main = /* @__PURE__ */ _defineComponent({
  __name: "ThingsVisAppFrame",
  props: {
    id: { type: String, required: true },
    mode: { type: String, required: false },
    schema: { type: [Object, null], required: false }
  },
  setup(__props, { expose: __expose }) {
    __expose();
    const props = __props;
    const router = useRouter();
    const deviceWsMap = /* @__PURE__ */ new Map();
    const activePlatformDevices = /* @__PURE__ */ new Map();
    const templateEntryCache = /* @__PURE__ */ new Map();
    let platformDevicesCache = null;
    let platformDevicesCachePromise = null;
    const SILENT_REQUEST_CONFIG = { silentError: true };
    function isIgnorablePlatformRequestError(error) {
      if (!error || typeof error !== "object") return false;
      const err = error;
      const message = String(err.response?.data?.message || err.message || "").toLowerCase();
      const status = Number(err.response?.status ?? NaN);
      return status === 404 || message.includes("record not found");
    }
    function resolvePlatformBufferSize(dataSources) {
      if (!Array.isArray(dataSources)) return 0;
      return Math.max(
        0,
        ...dataSources.map((dataSource) => {
          const normalizedType = typeof dataSource?.type === "string" ? dataSource.type.toUpperCase() : "";
          if (normalizedType !== "PLATFORM_FIELD" && normalizedType !== "PLATFORM") return 0;
          const bufferSize = dataSource?.config?.bufferSize;
          return typeof bufferSize === "number" && Number.isFinite(bufferSize) ? Math.max(0, Math.trunc(bufferSize)) : 0;
        })
      );
    }
    function extractWsFields(payload) {
      if (!payload || typeof payload !== "object") return {};
      const obj = payload;
      if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
        return extractWsFields(obj.fields);
      }
      if (obj.data !== void 0) return extractWsFields(obj.data);
      if (obj.payload !== void 0) return extractWsFields(obj.payload);
      if (Array.isArray(payload)) {
        const fields2 = {};
        payload.forEach((item) => {
          if (!item) return;
          const k = item.key ?? item.label;
          if (!k || k === "systime") return;
          if (item.value !== void 0) fields2[k] = item.value;
        });
        return fields2;
      }
      const fields = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k !== "systime") fields[k] = v;
      }
      return fields;
    }
    function mapFieldIds(rawFields, deviceFields) {
      if (deviceFields.length === 0) return rawFields;
      const mapped = {};
      for (const field of deviceFields) {
        if (!field.id) continue;
        const byId = rawFields[field.id];
        const byName = field.name !== void 0 ? rawFields[field.name] : void 0;
        if (byId !== void 0) mapped[field.id] = byId;
        else if (byName !== void 0) mapped[field.id] = byName;
      }
      return Object.keys(mapped).length > 0 ? mapped : rawFields;
    }
    function connectDeviceWs(device) {
      const { deviceId } = device;
      const prev = deviceWsMap.get(deviceId);
      if (prev) {
        prev.destroyed = true;
        if (prev.pingTimer) clearInterval(prev.pingTimer);
        if (prev.reconnectTimer) clearTimeout(prev.reconnectTimer);
        prev.ws?.close();
      }
      const entry = {
        ws: null,
        pingTimer: null,
        reconnectTimer: null,
        destroyed: false,
        device
      };
      deviceWsMap.set(deviceId, entry);
      function openWs() {
        if (entry.destroyed) return;
        const token2 = localStg.get("token");
        if (!token2) {
          entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS);
          return;
        }
        try {
          const wsUrl = `${getWebsocketServerUrl()}/telemetry/datas/current/ws`;
          entry.ws = new WebSocket(wsUrl);
        } catch (err) {
          console.warn("[AppFrame] WS init failed for device", deviceId, err);
          entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS);
          return;
        }
        entry.ws.onopen = () => {
          if (!entry.ws) return;
          entry.ws.send(JSON.stringify({ device_id: deviceId, token: token2 }));
          entry.pingTimer = setInterval(() => {
            if (entry.ws?.readyState === WebSocket.OPEN) entry.ws.send("ping");
          }, PING_INTERVAL_MS);
        };
        entry.ws.onmessage = (evt) => {
          if (typeof evt.data !== "string" || evt.data === "pong") return;
          try {
            const msg = JSON.parse(evt.data);
            const rawFields = extractWsFields(msg);
            if (Object.keys(rawFields).length === 0) return;
            const fields = mapFieldIds(rawFields, device.fields);
            postPlatformData(fields, deviceId);
          } catch {
          }
        };
        entry.ws.onerror = () => {
        };
        entry.ws.onclose = () => {
          if (entry.destroyed) return;
          if (entry.pingTimer) {
            clearInterval(entry.pingTimer);
            entry.pingTimer = null;
          }
          console.warn("[AppFrame] WS closed for device", deviceId, "— scheduling reconnect");
          entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS);
        };
      }
      openWs();
    }
    function ensureDeviceWs(deviceId) {
      if (!deviceId) return;
      const device = activePlatformDevices.get(deviceId);
      if (!device) return;
      const existing = deviceWsMap.get(deviceId);
      if (existing && !existing.destroyed) return;
      connectDeviceWs(device);
    }
    function disconnectAllDeviceWs() {
      for (const entry of deviceWsMap.values()) {
        entry.destroyed = true;
        if (entry.pingTimer) clearInterval(entry.pingTimer);
        if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer);
        entry.ws?.close();
      }
      deviceWsMap.clear();
    }
    let initInProgress = false;
    let initSucceeded = false;
    let pendingInitDebounceTimer = null;
    const token = ref("");
    const url = ref("");
    const iframeRef = ref();
    let viewerHydrationTimers = [];
    let viewerHydrationInFlight = false;
    let viewerHydrationCompleted = false;
    let initRetryTimers = [];
    let viewerDashboardConfigCache = null;
    let viewerDashboardConfigPromise = null;
    let viewerDashboardConfigCacheId = null;
    function getCurrentUserInfo() {
      return localStg.get("userInfo");
    }
    function getCurrentPlatformFieldScope() {
      return resolveGlobalPlatformFieldScope(getCurrentUserInfo());
    }
    function getCurrentGlobalPlatformFields() {
      return getGlobalPlatformFields(getCurrentPlatformFieldScope());
    }
    function normalizeCanvasBackground(background) {
      if (background && typeof background === "object" && !Array.isArray(background)) {
        return background;
      }
      const color = typeof background === "string" && background.trim().length > 0 ? background : "transparent";
      return { color };
    }
    function clearViewerHydrationTimers() {
      viewerHydrationTimers.forEach((timer) => clearTimeout(timer));
      viewerHydrationTimers = [];
    }
    function clearInitRetryTimers() {
      initRetryTimers.forEach((timer) => clearTimeout(timer));
      initRetryTimers = [];
    }
    function getThingsVisTargetOrigin() {
      try {
        return new URL(getStudioBase()).origin;
      } catch {
        return window.location.origin;
      }
    }
    function postToThingsVis(type, payload) {
      const win = iframeRef.value?.contentWindow;
      if (!win) return;
      win.postMessage({ type, payload }, getThingsVisTargetOrigin());
    }
    function postPlatformData(fields, deviceId) {
      if (Object.keys(fields).length === 0) return;
      postToThingsVis("tv:platform-data", {
        deviceId,
        fields
      });
      if (deviceId) {
        postToThingsVis("tv:platform-data", { fields });
      }
    }
    function postPlatformHistory(fieldId, history, deviceId) {
      if (history.length === 0) return;
      postToThingsVis("tv:platform-history", {
        deviceId,
        fieldId,
        history
      });
    }
    const FIELD_BINDING_EXPR_RE = /\{\{\s*ds\.([^.\s}]+)\.(?:data\.)?([^}]+?)\s*\}\}/g;
    function getRequestedFieldRoot(fieldPath) {
      if (!fieldPath) return null;
      const [root] = fieldPath.split(/[.[\]]/).filter(Boolean);
      return root?.trim() ? root.trim() : null;
    }
    function collectRequestedFieldsFromValue(value, requests) {
      if (typeof value === "string") {
        let match = null;
        FIELD_BINDING_EXPR_RE.lastIndex = 0;
        while ((match = FIELD_BINDING_EXPR_RE.exec(value)) !== null) {
          const dataSourceId = match[1];
          const fieldPath = match[2]?.trim();
          if (!dataSourceId || !fieldPath) continue;
          const fieldId = getRequestedFieldRoot(fieldPath);
          if (!fieldId) continue;
          const fields = requests.get(dataSourceId) ?? /* @__PURE__ */ new Set();
          fields.add(fieldId);
          requests.set(dataSourceId, fields);
        }
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => collectRequestedFieldsFromValue(item, requests));
        return;
      }
      if (!value || typeof value !== "object") return;
      Object.values(value).forEach((item) => {
        collectRequestedFieldsFromValue(item, requests);
      });
    }
    function collectPlatformSourceDescriptors(config) {
      const requests = /* @__PURE__ */ new Map();
      collectRequestedFieldsFromValue(config?.nodes, requests);
      const dataSources = Array.isArray(config?.dataSources) ? config.dataSources : [];
      return dataSources.filter((dataSource) => {
        const typeStr = typeof dataSource?.type === "string" ? dataSource.type.toUpperCase() : "";
        return typeStr === "PLATFORM_FIELD" || typeStr === "PLATFORM";
      }).map((dataSource) => {
        const requestedFields = new Set(
          Array.isArray(dataSource?.config?.requestedFields) ? dataSource.config.requestedFields.filter(
            (fieldId) => typeof fieldId === "string"
          ) : []
        );
        const bindingFields = requests.get(String(dataSource.id));
        if (bindingFields) {
          bindingFields.forEach((fieldId) => requestedFields.add(fieldId));
        }
        return {
          id: String(dataSource.id),
          deviceId: typeof dataSource?.config?.deviceId === "string" ? dataSource.config.deviceId : void 0,
          requestedFields: Array.from(requestedFields)
        };
      });
    }
    async function loadViewerDashboardConfig() {
      if (props.mode !== "viewer") return null;
      if (props.schema) {
        return {
          id: props.schema.id || props.id,
          name: props.schema.name,
          canvas: props.schema.canvasConfig,
          nodes: Array.isArray(props.schema.nodes) ? props.schema.nodes : [],
          dataSources: Array.isArray(props.schema.dataSources) ? props.schema.dataSources : []
        };
      }
      if (viewerDashboardConfigCache && viewerDashboardConfigCacheId === props.id) return viewerDashboardConfigCache;
      if (viewerDashboardConfigPromise) return viewerDashboardConfigPromise;
      viewerDashboardConfigPromise = (async () => {
        try {
          const { data, error } = await getThingsVisDashboard(props.id);
          if (error || !data) return null;
          viewerDashboardConfigCacheId = props.id;
          viewerDashboardConfigCache = {
            id: data.id,
            name: data.name,
            canvas: data.canvasConfig,
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            dataSources: Array.isArray(data.dataSources) ? data.dataSources : []
          };
          return viewerDashboardConfigCache;
        } catch (error) {
          console.warn("[AppFrame] Failed to load viewer dashboard config for hydration:", props.id, error);
          return null;
        } finally {
          viewerDashboardConfigPromise = null;
        }
      })();
      return viewerDashboardConfigPromise;
    }
    function getStudioBase() {
      const raw = import.meta.env.VITE_THINGSVIS_STUDIO_URL || "http://localhost:3000/main";
      const hashIdx = raw.indexOf("#");
      return hashIdx !== -1 ? raw.substring(0, hashIdx) : raw;
    }
    function buildThingsVisFrameUrl(thingsVisToken) {
      const apiBaseUrl = encodeURIComponent(window.location.origin + "/thingsvis-api");
      const platformFieldScope = encodeURIComponent(getCurrentPlatformFieldScope());
      const platformFields = encodeURIComponent(JSON.stringify(getCurrentGlobalPlatformFields()));
      const saveTarget = "host";
      const dashboardId = encodeURIComponent(props.id);
      if (props.mode === "viewer") {
        return `${getStudioBase()}#/embed?mode=embedded&saveTarget=${saveTarget}&id=${dashboardId}&token=${thingsVisToken}&apiBaseUrl=${apiBaseUrl}&platformFieldScope=${platformFieldScope}&platformFields=${platformFields}`;
      }
      return `${getStudioBase()}#/editor?mode=embedded&saveTarget=${saveTarget}&token=${thingsVisToken}&apiBaseUrl=${apiBaseUrl}&platformFieldScope=${platformFieldScope}&platformFields=${platformFields}`;
    }
    function normalizeHistory(records, valueKey) {
      return records.map((item) => ({
        value: item?.[valueKey] ?? item?.value ?? item?.avg ?? item?.y ?? 0,
        ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
      })).filter((point) => !Number.isNaN(point.ts));
    }
    function normalizeDerivedHistory(records, resolver) {
      return records.map((item) => ({
        value: normalizeMetricValue(resolver(item)),
        ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
      })).filter((point) => !Number.isNaN(point.ts));
    }
    function buildFlatHistory(value, timestamps) {
      const normalizedValue = normalizeMetricValue(value);
      const uniqueTimestamps = Array.from(new Set(timestamps.filter((ts) => Number.isFinite(ts))));
      if (uniqueTimestamps.length > 0) {
        return uniqueTimestamps.map((ts) => ({ value: normalizedValue, ts }));
      }
      const now = Date.now();
      return [
        { value: normalizedValue, ts: now - 60 * 60 * 1e3 },
        { value: normalizedValue, ts: now }
      ];
    }
    function normalizeMetricValue(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    }
    function normalizeTenantGrowthHistory(records) {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const points = [];
      records.forEach((item) => {
        const month = Number(item?.mon);
        if (!Number.isFinite(month) || month < 1 || month > 12) return;
        const ts = new Date(currentYear, month - 1, 1).getTime();
        if (Number.isNaN(ts)) return;
        points.push({
          value: normalizeMetricValue(item?.num),
          ts
        });
      });
      return points;
    }
    function normalizeSystemMetricHistory(records, metricKey) {
      return records.map((item) => ({
        value: normalizeMetricValue(item?.[`${metricKey}_usage`] ?? item?.[metricKey]),
        ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
      })).filter((point) => !Number.isNaN(point.ts));
    }
    function unwrapList(payload) {
      if (Array.isArray(payload?.list)) return payload.list;
      if (Array.isArray(payload)) return payload;
      return [];
    }
    async function loadTemplateEntry(templateId) {
      const cacheKey = String(templateId);
      const cached = templateEntryCache.get(cacheKey);
      if (cached) return cached;
      const [telemetryResult, attributesResult] = await Promise.allSettled([
        telemetryApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId }),
        attributesApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId })
      ]);
      const telemetryRes = telemetryResult.status === "fulfilled" ? telemetryResult.value : null;
      const attributesRes = attributesResult.status === "fulfilled" ? attributesResult.value : null;
      const platformSource = {
        telemetry: unwrapList(telemetryRes?.data),
        attributes: unwrapList(attributesRes?.data)
      };
      const extractedFields = extractPlatformFields(platformSource);
      const entry = {
        fields: extractedFields
      };
      templateEntryCache.set(cacheKey, entry);
      return entry;
    }
    async function buildRequestedFieldData(fieldIds, deviceId) {
      const requestedFields = Array.isArray(fieldIds) ? fieldIds.filter((fieldId) => typeof fieldId === "string") : [];
      if (requestedFields.length === 0) {
        return { fields: {}, histories: [] };
      }
      const currentFieldIds = requestedFields.filter((fieldId) => !fieldId.endsWith("__history"));
      const historyFieldIds = requestedFields.filter((fieldId) => fieldId.endsWith("__history")).map((fieldId) => fieldId.replace(/__history$/, ""));
      if (deviceId) {
        const result2 = { fields: {}, histories: [] };
        if (currentFieldIds.length > 0) {
          const [telemetryResult, attributeResult] = await Promise.allSettled([
            telemetryDataCurrent(deviceId, SILENT_REQUEST_CONFIG),
            getAttributeDataSet({ device_id: deviceId }, SILENT_REQUEST_CONFIG)
          ]);
          const telemetryRes = telemetryResult.status === "fulfilled" ? telemetryResult.value : null;
          const attributeRes = attributeResult.status === "fulfilled" ? attributeResult.value : null;
          const kvMap = {};
          const collect = (item) => {
            if (item?.key !== void 0) kvMap[item.key] = item.value;
            if (item?.label) kvMap[item.label] = item.value;
          };
          if (Array.isArray(telemetryRes?.data)) telemetryRes.data.forEach(collect);
          if (Array.isArray(attributeRes?.data)) attributeRes.data.forEach(collect);
          currentFieldIds.forEach((fieldId) => {
            if (kvMap[fieldId] !== void 0) result2.fields[fieldId] = kvMap[fieldId];
          });
        }
        if (historyFieldIds.length > 0) {
          const historyResults = await Promise.allSettled(
            historyFieldIds.map(async (fieldId) => {
              const historyRes = await telemetryDataHistoryList(
                {
                  device_id: deviceId,
                  key: fieldId,
                  time_range: "custom",
                  start_time: Date.now() - 3600 * 1e3,
                  end_time: Date.now(),
                  aggregate_window: "1m",
                  aggregate_function: "avg"
                },
                SILENT_REQUEST_CONFIG
              );
              const list = Array.isArray(historyRes?.data?.list) ? historyRes.data.list : [];
              const history = normalizeHistory(list, "value");
              if (history.length > 0) {
                result2.histories.push({ fieldId, history, deviceId });
              }
            })
          );
          historyResults.forEach((item) => {
            if (item.status === "rejected" && !isIgnorablePlatformRequestError(item.reason)) {
              console.warn("[AppFrame] Device history fetch failed:", item.reason);
            }
          });
        }
        return result2;
      }
      const result = { fields: {}, histories: [] };
      const requestedCurrentFieldSet = new Set(currentFieldIds);
      const requestedHistoryFieldSet = new Set(historyFieldIds);
      const requiresDeviceSummary = ["device_total", "device_online", "device_offline", "device_activity"].some(
        (fieldId) => requestedCurrentFieldSet.has(fieldId) || requestedHistoryFieldSet.has(fieldId)
      );
      const requiresAlarmSummary = requestedCurrentFieldSet.has("alarm_device_total") || requestedHistoryFieldSet.has("alarm_device_total");
      const requiresTenantSummary = getCurrentPlatformFieldScope() === "super-admin" && ["tenant_added_yesterday", "tenant_added_month", "tenant_total"].some(
        (fieldId) => requestedCurrentFieldSet.has(fieldId)
      );
      const requiresTenantHistory = getCurrentPlatformFieldScope() === "super-admin" && requestedHistoryFieldSet.has("tenant_growth");
      const requiresMetricSummary = getCurrentPlatformFieldScope() === "super-admin" && ["cpu_usage", "memory_usage", "disk_usage"].some((fieldId) => requestedCurrentFieldSet.has(fieldId));
      const requiresMetricHistory = getCurrentPlatformFieldScope() === "super-admin" && ["cpu_usage", "memory_usage", "disk_usage"].some((fieldId) => requestedHistoryFieldSet.has(fieldId));
      const requiresDeviceTrend = ["device_total", "device_online", "device_offline", "device_activity"].some(
        (fieldId) => requestedHistoryFieldSet.has(fieldId)
      );
      const [
        deviceListResult,
        alarmCountResult,
        tenantResult,
        systemMetricsCurrentResult,
        systemMetricsHistoryResult,
        deviceTrendResult
      ] = await Promise.allSettled([
        requiresDeviceSummary ? deviceList({ page: 1, page_size: 1e3 }) : Promise.resolve(null),
        requiresAlarmSummary ? getAlarmCount() : Promise.resolve(null),
        requiresTenantSummary || requiresTenantHistory ? tenant() : Promise.resolve(null),
        requiresMetricSummary ? getSystemMetricsCurrent() : Promise.resolve(null),
        requiresMetricHistory ? getSystemMetricsHistory({}) : Promise.resolve(null),
        requiresDeviceTrend ? getOnlineDeviceTrend() : Promise.resolve(null)
      ]);
      const devices = deviceListResult.status === "fulfilled" ? deviceListResult.value?.data?.list || deviceListResult.value?.data || [] : [];
      const deviceTotal = Array.isArray(devices) ? devices.length : 0;
      const deviceOnline = Array.isArray(devices) ? devices.filter((device) => Number(device?.is_online || 0) !== 0).length : 0;
      const aggregateValues = {
        device_total: deviceTotal,
        device_online: deviceOnline,
        device_offline: Math.max(0, deviceTotal - deviceOnline),
        device_activity: deviceOnline
      };
      if (alarmCountResult.status === "fulfilled") {
        aggregateValues.alarm_device_total = normalizeMetricValue(alarmCountResult.value?.data?.alarm_device_total);
      }
      if (tenantResult.status === "fulfilled") {
        aggregateValues.tenant_total = normalizeMetricValue(tenantResult.value?.data?.user_total);
        aggregateValues.tenant_added_yesterday = normalizeMetricValue(tenantResult.value?.data?.user_added_yesterday);
        aggregateValues.tenant_added_month = normalizeMetricValue(tenantResult.value?.data?.user_added_month);
      }
      if (systemMetricsCurrentResult.status === "fulfilled") {
        aggregateValues.cpu_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.cpu_usage);
        aggregateValues.memory_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.memory_usage);
        aggregateValues.disk_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.disk_usage);
      }
      currentFieldIds.forEach((fieldId) => {
        if (aggregateValues[fieldId] !== void 0) result.fields[fieldId] = aggregateValues[fieldId];
      });
      if (requiresDeviceTrend) {
        const points = deviceTrendResult.status === "fulfilled" && Array.isArray(deviceTrendResult.value?.data?.points) ? deviceTrendResult.value.data.points : [];
        const trendTimestamps = points.map((item) => new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()).filter((ts) => !Number.isNaN(ts));
        if (historyFieldIds.includes("device_online")) {
          const history = normalizeHistory(points, "device_online");
          if (history.length > 0) result.histories.push({ fieldId: "device_online", history });
        }
        if (historyFieldIds.includes("device_offline")) {
          const history = normalizeHistory(points, "device_offline");
          if (history.length > 0) result.histories.push({ fieldId: "device_offline", history });
        }
        if (historyFieldIds.includes("device_total")) {
          const history = normalizeDerivedHistory(
            points,
            (item) => normalizeMetricValue(item?.device_online) + normalizeMetricValue(item?.device_offline)
          );
          if (history.length > 0) result.histories.push({ fieldId: "device_total", history });
        }
        if (historyFieldIds.includes("device_activity")) {
          const history = normalizeDerivedHistory(points, (item) => item?.device_online);
          if (history.length > 0) result.histories.push({ fieldId: "device_activity", history });
        }
        if (historyFieldIds.includes("alarm_device_total")) {
          const history = buildFlatHistory(aggregateValues.alarm_device_total, trendTimestamps);
          if (history.length > 0) result.histories.push({ fieldId: "alarm_device_total", history });
        }
      }
      if (!requiresDeviceTrend && historyFieldIds.includes("alarm_device_total") && aggregateValues.alarm_device_total !== void 0) {
        const history = buildFlatHistory(aggregateValues.alarm_device_total, []);
        if (history.length > 0) result.histories.push({ fieldId: "alarm_device_total", history });
      }
      if (requiresTenantHistory && tenantResult.status === "fulfilled") {
        const growthHistory = normalizeTenantGrowthHistory(tenantResult.value?.data?.user_list_month || []);
        if (growthHistory.length > 0) {
          result.histories.push({ fieldId: "tenant_growth", history: growthHistory });
        }
      }
      if (requiresMetricHistory && systemMetricsHistoryResult.status === "fulfilled") {
        const records = Array.isArray(systemMetricsHistoryResult.value?.data) ? systemMetricsHistoryResult.value.data : [];
        const metricFieldMap = [
          { fieldId: "cpu_usage", source: "cpu" },
          { fieldId: "memory_usage", source: "memory" },
          { fieldId: "disk_usage", source: "disk" }
        ];
        metricFieldMap.forEach(({ fieldId, source }) => {
          if (!historyFieldIds.includes(fieldId)) return;
          const history = normalizeSystemMetricHistory(records, source);
          if (history.length > 0) {
            result.histories.push({ fieldId, history });
          }
        });
      }
      return result;
    }
    async function hydrateConfiguredPlatformSources() {
      const config = await loadViewerDashboardConfig();
      if (!config) return;
      const descriptors = collectPlatformSourceDescriptors(config);
      if (descriptors.length === 0) return;
      const handledDeviceIds = /* @__PURE__ */ new Set();
      let globalHydrated = false;
      for (const descriptor of descriptors) {
        const requestedFields = descriptor.requestedFields;
        if (descriptor.deviceId) {
          if (requestedFields.length === 0) continue;
          if (handledDeviceIds.has(descriptor.deviceId)) continue;
          handledDeviceIds.add(descriptor.deviceId);
          ensureDeviceWs(descriptor.deviceId);
          const result2 = await buildRequestedFieldData(requestedFields, descriptor.deviceId);
          postPlatformData(result2.fields, descriptor.deviceId);
          result2.histories.forEach((item) => {
            postPlatformHistory(item.fieldId, item.history, item.deviceId);
          });
          continue;
        }
        if (globalHydrated) continue;
        globalHydrated = true;
        const fallbackGlobalFields = requestedFields.length > 0 ? requestedFields : getCurrentGlobalPlatformFields().map((field) => field.id).filter((fieldId) => typeof fieldId === "string" && fieldId.length > 0);
        const result = await buildRequestedFieldData(fallbackGlobalFields);
        postPlatformData(result.fields);
        result.histories.forEach((item) => {
          postPlatformHistory(item.fieldId, item.history);
        });
      }
    }
    function scheduleViewerHydration() {
      if (props.mode !== "viewer") return;
      clearViewerHydrationTimers();
      if (viewerHydrationCompleted || viewerHydrationInFlight) return;
      const timer = setTimeout(async () => {
        if (viewerHydrationCompleted || viewerHydrationInFlight) return;
        viewerHydrationInFlight = true;
        try {
          await hydrateConfiguredPlatformSources();
          viewerHydrationCompleted = true;
        } finally {
          viewerHydrationInFlight = false;
        }
      }, 0);
      viewerHydrationTimers.push(timer);
    }
    function resolveWriteDeviceId(payload) {
      if (typeof payload.deviceId === "string" && payload.deviceId) {
        return payload.deviceId;
      }
      const dataSourceId = typeof payload.dataSourceId === "string" ? payload.dataSourceId : "";
      const match = dataSourceId.match(/^__platform_(.+)__$/);
      if (match?.[1]) {
        return match[1];
      }
      return void 0;
    }
    async function handlePlatformWrite(payload) {
      const deviceId = resolveWriteDeviceId(payload);
      const data = payload.data;
      if (!deviceId || data === void 0) return;
      try {
        const value = typeof data === "string" ? data : JSON.stringify(data);
        await telemetryDataPub({ device_id: deviceId, value });
      } catch (error) {
        console.error("[AppFrame] Failed to publish platform write:", error);
      }
    }
    async function handleHostSave(payload) {
      const config = payload.config && typeof payload.config === "object" ? payload.config : payload;
      const meta = config.meta || {};
      const canvas = config.canvas;
      const updatePayload = {};
      if (typeof meta.name === "string") {
        updatePayload.name = meta.name;
      }
      if (canvas && typeof canvas === "object") {
        const normalizedCanvas = { ...canvas };
        normalizedCanvas.background = normalizeCanvasBackground(normalizedCanvas.background);
        updatePayload.canvasConfig = normalizedCanvas;
      }
      if (Array.isArray(config.nodes)) {
        updatePayload.nodes = config.nodes;
      }
      if (Array.isArray(config.dataSources)) {
        updatePayload.dataSources = config.dataSources;
      }
      if (config.variables !== void 0) {
        updatePayload.variables = config.variables;
      }
      const thumbnail = typeof meta.thumbnail === "string" ? meta.thumbnail : typeof payload.thumbnail === "string" ? payload.thumbnail : void 0;
      if (thumbnail !== void 0) {
        updatePayload.thumbnail = thumbnail;
      }
      let result = await updateThingsVisDashboard(props.id, updatePayload);
      if (result.error?.status === 401 || result.error?.status === 404) {
        clearThingsVisToken();
        result = await updateThingsVisDashboard(props.id, updatePayload);
      }
      if (result.error) {
        console.error("[AppFrame] Failed to save dashboard via host bridge:", result.error);
        if (window.$message) {
          ;
          window.$message.error("保存失败");
        }
        return;
      }
      if (window.$message) {
        ;
        window.$message.success("保存成功");
      }
    }
    async function buildPlatformDevices() {
      if (platformDevicesCache) {
        return { devices: platformDevicesCache, debug: { cached: true, assembledCount: platformDevicesCache.length } };
      }
      if (platformDevicesCachePromise) {
        const devices2 = await platformDevicesCachePromise;
        return { devices: devices2, debug: { cached: true, assembledCount: devices2.length } };
      }
      platformDevicesCachePromise = (async () => {
        try {
          const [devRes, confRes] = await Promise.all([
            deviceList({ page: 1, page_size: 1e3 }),
            getDeviceConfigList({ page: 1, page_size: 1e3 })
          ]);
          const devices2 = unwrapList(devRes?.data);
          const configs = unwrapList(confRes?.data);
          const configTemplateMap = /* @__PURE__ */ new Map();
          for (const config of configs) {
            if (config.id && config.device_template_id) {
              configTemplateMap.set(String(config.id), String(config.device_template_id));
            }
          }
          const templateIdSet = /* @__PURE__ */ new Set();
          for (const config of configs) {
            if (config.device_template_id) templateIdSet.add(String(config.device_template_id));
          }
          for (const device of devices2) {
            const tid = device?.device_config?.device_template_id;
            if (tid) templateIdSet.add(String(tid));
          }
          const templateIds = Array.from(templateIdSet);
          if (templateIds.length === 0) {
            platformDevicesCache = [];
            return [];
          }
          const platformDevices = devices2.map((device) => {
            const templateId = (device?.device_config?.device_template_id ? String(device.device_config.device_template_id) : null) || (device?.device_config_id ? configTemplateMap.get(String(device.device_config_id)) : null);
            if (!templateId || !device?.id) return null;
            const groupName = String(device?.device_config?.name || device?.device_config_name || "").trim() || "设备字段";
            return {
              deviceId: String(device.id),
              deviceName: String(device.name || device.device_number || device.id),
              groupName,
              templateId,
              fields: [],
              presets: []
            };
          }).filter((item) => Boolean(item));
          platformDevicesCache = platformDevices;
          return platformDevices;
        } catch (err) {
          console.error("[AppFrame] Failed to assemble platformDevices", err);
          platformDevicesCache = [];
          return [];
        } finally {
          platformDevicesCachePromise = null;
        }
      })();
      const devices = await platformDevicesCachePromise;
      return { devices, debug: { assembledCount: devices.length } };
    }
    async function doInit() {
      if (!iframeRef.value?.contentWindow || !token.value) return;
      const apiBaseUrl = window.location.origin + "/thingsvis-api";
      let dashboardPayload = { meta: { id: props.id } };
      try {
        const dashboardData = props.schema ? {
          id: props.schema.id || props.id,
          name: props.schema.name,
          thumbnail: props.schema.thumbnail ?? null,
          canvasConfig: props.schema.canvasConfig,
          nodes: props.schema.nodes,
          dataSources: props.schema.dataSources
        } : null;
        const fetched = dashboardData ? { data: dashboardData, error: null } : await getThingsVisDashboard(props.id);
        const { data, error } = fetched;
        if (!error && data) {
          dashboardPayload = {
            meta: {
              id: data.id,
              name: data.name,
              thumbnail: data.thumbnail
            },
            canvas: data.canvasConfig,
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            dataSources: Array.isArray(data.dataSources) ? data.dataSources : []
          };
        }
      } catch (error) {
        console.warn("[AppFrame] Failed to preload dashboard schema for embed init:", props.id, error);
      }
      const viewerDeviceDescriptors = props.mode === "viewer" ? collectPlatformSourceDescriptors(dashboardPayload).filter(
        (descriptor) => descriptor.deviceId && descriptor.requestedFields.length > 0
      ) : [];
      const requiredViewerDeviceIds = new Set(
        viewerDeviceDescriptors.map((descriptor) => descriptor.deviceId).filter((deviceId) => typeof deviceId === "string" && deviceId.length > 0)
      );
      const shouldBuildPlatformDevices = props.mode !== "viewer" || requiredViewerDeviceIds.size > 0;
      const { devices: loadedPlatformDevices } = shouldBuildPlatformDevices ? await buildPlatformDevices() : { devices: [] };
      const platformDevices = loadedPlatformDevices;
      const platformBufferSize = Math.max(
        DEFAULT_PLATFORM_BUFFER_SIZE,
        resolvePlatformBufferSize(dashboardPayload.dataSources)
      );
      if (props.mode === "viewer") {
        viewerHydrationCompleted = false;
        viewerHydrationInFlight = false;
        clearViewerHydrationTimers();
        disconnectAllDeviceWs();
      }
      activePlatformDevices.clear();
      for (const device of platformDevices) {
        if (device?.deviceId) {
          activePlatformDevices.set(device.deviceId, {
            deviceId: device.deviceId,
            fields: Array.isArray(device.fields) ? device.fields : []
          });
        }
      }
      const initMessage = JSON.parse(
        JSON.stringify({
          type: "tv:init",
          payload: {
            platformFields: getCurrentGlobalPlatformFields(),
            platformBufferSize,
            platformFieldScope: getCurrentPlatformFieldScope(),
            platformDevices,
            data: dashboardPayload,
            config: {
              mode: "app",
              saveTarget: "host",
              token: token.value,
              apiBaseUrl
            }
          }
        })
      );
      iframeRef.value.contentWindow.postMessage(initMessage, getThingsVisTargetOrigin());
      initSucceeded = true;
      clearInitRetryTimers();
      if (pendingInitDebounceTimer) {
        clearTimeout(pendingInitDebounceTimer);
        pendingInitDebounceTimer = null;
      }
      if (props.mode !== "viewer") {
        disconnectAllDeviceWs();
      }
    }
    function scheduleInit() {
      if (!iframeRef.value?.contentWindow || !token.value) return;
      initSucceeded = false;
      if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer);
      clearInitRetryTimers();
      const runInit = async () => {
        if (initInProgress || initSucceeded) return;
        initInProgress = true;
        try {
          await doInit();
        } finally {
          initInProgress = false;
        }
      };
      pendingInitDebounceTimer = setTimeout(() => {
        pendingInitDebounceTimer = null;
        void runInit();
      }, 150);
      [600, 1500, 3e3].forEach((delay) => {
        const timer = setTimeout(() => {
          void runInit();
        }, delay);
        initRetryTimers.push(timer);
      });
    }
    function handleIframeLoad() {
      scheduleInit();
    }
    const handleMessage = async (event) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.origin !== getThingsVisTargetOrigin()) return;
      const { type, projectId } = event.data;
      const payload = event.data?.payload && typeof event.data.payload === "object" ? event.data.payload : {};
      if (type === "tv:save") {
        await handleHostSave(payload);
        return;
      }
      if (type === "tv:platform-write") {
        await handlePlatformWrite(payload);
        return;
      }
      if (type === "thingsvis:requestFieldData") {
        if (!iframeRef.value?.contentWindow) return;
        try {
          ensureDeviceWs(payload.deviceId);
          const result = await buildRequestedFieldData(payload.fieldIds, payload.deviceId);
          postPlatformData(result.fields, payload.deviceId);
          result.histories.forEach((item) => {
            postPlatformHistory(item.fieldId, item.history, item.deviceId);
          });
        } catch {
        }
        return;
      }
      if (type === "LOADED") {
        if (props.mode === "viewer") {
          scheduleViewerHydration();
        }
        return;
      }
      if (type === "thingsvis:requestDeviceFields") {
        const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : void 0;
        const templateId = typeof payload.templateId === "string" ? payload.templateId : void 0;
        if (!iframeRef.value?.contentWindow || !deviceId || !templateId) return;
        try {
          const entry = await loadTemplateEntry(templateId);
          postToThingsVis("tv:device-fields", {
            deviceId,
            templateId,
            fields: Array.isArray(entry.fields) ? entry.fields : []
          });
        } catch (error) {
          console.warn("[AppFrame] Failed to load requested device fields:", deviceId, templateId, error);
        }
        return;
      }
      if (type === "tv:ready" || type === "READY") {
        if (!initSucceeded) {
          scheduleInit();
        }
        return;
      }
      if (type === "tv:preview") {
        const target = router.resolve({
          path: "/visualization/thingsvis-preview",
          query: { id: projectId || props.id }
        });
        window.open(target.href, "_blank");
        return;
      }
      if (type === "tv:publish") {
        try {
          const { publishThingsVisDashboard } = await import("/src/service/api/thingsvis.ts");
          const res = await publishThingsVisDashboard(projectId || props.id);
          if (res.data) {
            if (window.$message) {
              ;
              window.$message.success("发布成功");
            } else {
              alert("发布成功");
            }
          } else {
            console.error("[AppFrame] Publish failed:", res.error);
            if (window.$message) {
              ;
              window.$message.error(`发布失败: ${res.error?.message || "未知错误"}`);
            }
          }
        } catch (e) {
          console.error("[AppFrame] Publish exception:", e);
        }
      }
    };
    onMounted(async () => {
      window.addEventListener("message", handleMessage);
      try {
        clearThingsVisToken();
        const tokenStr = await getThingsVisToken();
        if (tokenStr) {
          token.value = tokenStr;
          url.value = buildThingsVisFrameUrl(tokenStr);
        } else {
          console.warn("[AppFrame] Token acquisition returned null");
        }
      } catch (error) {
        console.error("[AppFrame] Failed to acquire ThingsVis token:", error);
      }
    });
    onBeforeUnmount(() => {
      window.removeEventListener("message", handleMessage);
      if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer);
      clearInitRetryTimers();
      clearViewerHydrationTimers();
      viewerHydrationCompleted = false;
      viewerHydrationInFlight = false;
      initSucceeded = false;
      activePlatformDevices.clear();
      platformDevicesCache = null;
      platformDevicesCachePromise = null;
      viewerDashboardConfigCache = null;
      viewerDashboardConfigCacheId = null;
      viewerDashboardConfigPromise = null;
      templateEntryCache.clear();
      disconnectAllDeviceWs();
    });
    const __returned__ = { EDITOR_TEMPLATE_FIELD_PAGE_SIZE, DEFAULT_PLATFORM_BUFFER_SIZE, props, router, PING_INTERVAL_MS, WS_RECONNECT_DELAY_MS, deviceWsMap, activePlatformDevices, templateEntryCache, get platformDevicesCache() {
      return platformDevicesCache;
    }, set platformDevicesCache(v) {
      platformDevicesCache = v;
    }, get platformDevicesCachePromise() {
      return platformDevicesCachePromise;
    }, set platformDevicesCachePromise(v) {
      platformDevicesCachePromise = v;
    }, SILENT_REQUEST_CONFIG, isIgnorablePlatformRequestError, resolvePlatformBufferSize, extractWsFields, mapFieldIds, connectDeviceWs, ensureDeviceWs, disconnectAllDeviceWs, get initInProgress() {
      return initInProgress;
    }, set initInProgress(v) {
      initInProgress = v;
    }, get initSucceeded() {
      return initSucceeded;
    }, set initSucceeded(v) {
      initSucceeded = v;
    }, get pendingInitDebounceTimer() {
      return pendingInitDebounceTimer;
    }, set pendingInitDebounceTimer(v) {
      pendingInitDebounceTimer = v;
    }, token, url, iframeRef, get viewerHydrationTimers() {
      return viewerHydrationTimers;
    }, set viewerHydrationTimers(v) {
      viewerHydrationTimers = v;
    }, get viewerHydrationInFlight() {
      return viewerHydrationInFlight;
    }, set viewerHydrationInFlight(v) {
      viewerHydrationInFlight = v;
    }, get viewerHydrationCompleted() {
      return viewerHydrationCompleted;
    }, set viewerHydrationCompleted(v) {
      viewerHydrationCompleted = v;
    }, get initRetryTimers() {
      return initRetryTimers;
    }, set initRetryTimers(v) {
      initRetryTimers = v;
    }, get viewerDashboardConfigCache() {
      return viewerDashboardConfigCache;
    }, set viewerDashboardConfigCache(v) {
      viewerDashboardConfigCache = v;
    }, get viewerDashboardConfigPromise() {
      return viewerDashboardConfigPromise;
    }, set viewerDashboardConfigPromise(v) {
      viewerDashboardConfigPromise = v;
    }, get viewerDashboardConfigCacheId() {
      return viewerDashboardConfigCacheId;
    }, set viewerDashboardConfigCacheId(v) {
      viewerDashboardConfigCacheId = v;
    }, getCurrentUserInfo, getCurrentPlatformFieldScope, getCurrentGlobalPlatformFields, normalizeCanvasBackground, clearViewerHydrationTimers, clearInitRetryTimers, getThingsVisTargetOrigin, postToThingsVis, postPlatformData, postPlatformHistory, FIELD_BINDING_EXPR_RE, getRequestedFieldRoot, collectRequestedFieldsFromValue, collectPlatformSourceDescriptors, loadViewerDashboardConfig, getStudioBase, buildThingsVisFrameUrl, normalizeHistory, normalizeDerivedHistory, buildFlatHistory, normalizeMetricValue, normalizeTenantGrowthHistory, normalizeSystemMetricHistory, unwrapList, loadTemplateEntry, buildRequestedFieldData, hydrateConfiguredPlatformSources, scheduleViewerHydration, resolveWriteDeviceId, handlePlatformWrite, handleHostSave, buildPlatformDevices, doInit, scheduleInit, handleIframeLoad, handleMessage };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  }
});
import { openBlock as _openBlock, createElementBlock as _createElementBlock } from "/node_modules/.vite/deps/vue.js?v=97372f4f";
const _hoisted_1 = { class: "thingsvis-frame-container" };
const _hoisted_2 = ["src"];
const _hoisted_3 = {
  key: 1,
  class: "loading-placeholder"
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return _openBlock(), _createElementBlock("div", _hoisted_1, [
    $setup.url && $setup.token ? (_openBlock(), _createElementBlock("iframe", {
      key: 0,
      ref: "iframeRef",
      src: $setup.url,
      class: "thingsvis-frame",
      frameborder: "0",
      allowfullscreen: "",
      onLoad: $setup.handleIframeLoad
    }, null, 40, _hoisted_2)) : (_openBlock(), _createElementBlock("div", _hoisted_3, "正在连接可视化引擎..."))
  ]);
}
import "/src/components/thingsvis/ThingsVisAppFrame.vue?vue&type=style&index=0&scoped=8a2daa28&lang.css";
_sfc_main.__hmrId = "8a2daa28";
typeof __VUE_HMR_RUNTIME__ !== "undefined" && __VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main);
import.meta.hot.on("file-changed", ({ file }) => {
  __VUE_HMR_RUNTIME__.CHANGED_FILE = file;
});
import.meta.hot.accept((mod) => {
  if (!mod) return;
  const { default: updated, _rerender_only } = mod;
  if (_rerender_only) {
    __VUE_HMR_RUNTIME__.rerender(updated.__hmrId, updated.render);
  } else {
    __VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated);
  }
});
import _export_sfc from "/@id/__x00__plugin-vue:export-helper";
export default /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-8a2daa28"], ["__file", "F:/coding/thingspanel-frontend-community/src/components/thingsvis/ThingsVisAppFrame.vue"]]);

//# sourceMappingURL=data:application/json;base64,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LG9CQVdNLE9BWE4sWUFXTTtBQUFBLElBVEksY0FBTyw4QkFEZixvQkFRVTtBQUFBO01BTlIsS0FBSTtBQUFBLE1BQ0gsS0FBSztBQUFBLE1BQ04sT0FBTTtBQUFBLE1BQ04sYUFBWTtBQUFBLE1BQ1o7QUFBQSxNQUNDLFFBQU07QUFBQSwrQ0FFVCxvQkFBMEQsT0FBMUQsWUFBd0MsY0FBWTtBQUFBIiwibmFtZXMiOlsiZmllbGRzIiwidG9rZW4iLCJyZXN1bHQiLCJkZXZpY2VzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlRoaW5nc1Zpc0FwcEZyYW1lLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJ0aGluZ3N2aXMtZnJhbWUtY29udGFpbmVyXCI+XG4gICAgPGlmcmFtZVxuICAgICAgdi1pZj1cInVybCAmJiB0b2tlblwiXG4gICAgICByZWY9XCJpZnJhbWVSZWZcIlxuICAgICAgOnNyYz1cInVybFwiXG4gICAgICBjbGFzcz1cInRoaW5nc3Zpcy1mcmFtZVwiXG4gICAgICBmcmFtZWJvcmRlcj1cIjBcIlxuICAgICAgYWxsb3dmdWxsc2NyZWVuXG4gICAgICBAbG9hZD1cImhhbmRsZUlmcmFtZUxvYWRcIlxuICAgID48L2lmcmFtZT5cbiAgICA8ZGl2IHYtZWxzZSBjbGFzcz1cImxvYWRpbmctcGxhY2Vob2xkZXJcIj7mraPlnKjov57mjqXlj6/op4bljJblvJXmk44uLi48L2Rpdj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IHNldHVwIGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgcmVmLCBvbk1vdW50ZWQsIG9uQmVmb3JlVW5tb3VudCB9IGZyb20gJ3Z1ZSdcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ3Z1ZS1yb3V0ZXInXG5pbXBvcnQgeyBjbGVhclRoaW5nc1Zpc1Rva2VuLCBnZXRUaGluZ3NWaXNUb2tlbiB9IGZyb20gJ0AvdXRpbHMvdGhpbmdzdmlzJ1xuaW1wb3J0IHtcbiAgZGV2aWNlTGlzdCxcbiAgZ2V0RGV2aWNlQ29uZmlnTGlzdCxcbiAgdGVsZW1ldHJ5RGF0YUN1cnJlbnQsXG4gIGdldEF0dHJpYnV0ZURhdGFTZXQsXG4gIHRlbGVtZXRyeURhdGFIaXN0b3J5TGlzdCxcbiAgdGVsZW1ldHJ5RGF0YVB1YlxufSBmcm9tICdAL3NlcnZpY2UvYXBpL2RldmljZSdcbmltcG9ydCB7XG4gIGF0dHJpYnV0ZXNBcGksXG4gIGdldEFsYXJtQ291bnQsXG4gIGdldE9ubGluZURldmljZVRyZW5kLFxuICBnZXRTeXN0ZW1NZXRyaWNzQ3VycmVudCxcbiAgZ2V0U3lzdGVtTWV0cmljc0hpc3RvcnksXG4gIHRlbGVtZXRyeUFwaSxcbiAgdGVuYW50XG59IGZyb20gJ0Avc2VydmljZS9hcGknXG5pbXBvcnQgeyBnZXRUaGluZ3NWaXNEYXNoYm9hcmQsIHVwZGF0ZVRoaW5nc1Zpc0Rhc2hib2FyZCwgdHlwZSBVcGRhdGVEYXNoYm9hcmREYXRhIH0gZnJvbSAnQC9zZXJ2aWNlL2FwaS90aGluZ3N2aXMnXG5pbXBvcnQgeyBleHRyYWN0UGxhdGZvcm1GaWVsZHMgfSBmcm9tICdAL3V0aWxzL3RoaW5nc3Zpcy9wbGF0Zm9ybS1maWVsZHMnXG5pbXBvcnQgeyBnZXRHbG9iYWxQbGF0Zm9ybUZpZWxkcywgcmVzb2x2ZUdsb2JhbFBsYXRmb3JtRmllbGRTY29wZSB9IGZyb20gJ0AvdXRpbHMvdGhpbmdzdmlzL2dsb2JhbC1wbGF0Zm9ybS1maWVsZHMnXG5pbXBvcnQgeyBsb2NhbFN0ZyB9IGZyb20gJ0AvdXRpbHMvc3RvcmFnZSdcbmltcG9ydCB7IGdldFdlYnNvY2tldFNlcnZlclVybCB9IGZyb20gJ0AvdXRpbHMvY29tbW9uL3Rvb2wnXG5cbmNvbnN0IEVESVRPUl9URU1QTEFURV9GSUVMRF9QQUdFX1NJWkUgPSAxMDAwXG5jb25zdCBERUZBVUxUX1BMQVRGT1JNX0JVRkZFUl9TSVpFID0gMTAwXG5cbmNvbnN0IHByb3BzID0gZGVmaW5lUHJvcHM8e1xuICBpZDogc3RyaW5nXG4gIG1vZGU/OiBzdHJpbmdcbiAgc2NoZW1hPzoge1xuICAgIGlkPzogc3RyaW5nXG4gICAgbmFtZT86IHN0cmluZ1xuICAgIHRodW1ibmFpbD86IHN0cmluZyB8IG51bGxcbiAgICBjYW52YXNDb25maWc/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgIG5vZGVzPzogdW5rbm93bltdXG4gICAgZGF0YVNvdXJjZXM/OiB1bmtub3duW11cbiAgfSB8IG51bGxcbn0+KClcblxuY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKClcblxuLy8g4pSA4pSA4pSAIERldmljZSBXZWJTb2NrZXQgbWFuYWdlbWVudCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuY29uc3QgUElOR19JTlRFUlZBTF9NUyA9IDhfMDAwXG5jb25zdCBXU19SRUNPTk5FQ1RfREVMQVlfTVMgPSAzXzAwMFxuXG5pbnRlcmZhY2UgRGV2aWNlV3NFbnRyeSB7XG4gIHdzOiBXZWJTb2NrZXQgfCBudWxsXG4gIHBpbmdUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+IHwgbnVsbFxuICByZWNvbm5lY3RUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsXG4gIGRlc3Ryb3llZDogYm9vbGVhblxuICBkZXZpY2U6IHsgZGV2aWNlSWQ6IHN0cmluZzsgZmllbGRzOiBBcnJheTx7IGlkPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nIH0+IH1cbn1cblxudHlwZSBQbGF0Zm9ybURldmljZUVudHJ5ID0ge1xuICBkZXZpY2VJZDogc3RyaW5nXG4gIGRldmljZU5hbWU6IHN0cmluZ1xuICBncm91cE5hbWU6IHN0cmluZ1xuICB0ZW1wbGF0ZUlkPzogc3RyaW5nXG4gIGZpZWxkczogQXJyYXk8eyBpZD86IHN0cmluZzsgbmFtZT86IHN0cmluZyB9PlxuICBwcmVzZXRzOiBhbnlbXVxufVxuXG50eXBlIFRlbXBsYXRlRW50cnkgPSB7XG4gIGZpZWxkczogQXJyYXk8eyBpZD86IHN0cmluZzsgbmFtZT86IHN0cmluZyB9PlxufVxuXG5jb25zdCBkZXZpY2VXc01hcCA9IG5ldyBNYXA8c3RyaW5nLCBEZXZpY2VXc0VudHJ5PigpXG5jb25zdCBhY3RpdmVQbGF0Zm9ybURldmljZXMgPSBuZXcgTWFwPHN0cmluZywgeyBkZXZpY2VJZDogc3RyaW5nOyBmaWVsZHM6IEFycmF5PHsgaWQ/OiBzdHJpbmc7IG5hbWU/OiBzdHJpbmcgfT4gfT4oKVxuY29uc3QgdGVtcGxhdGVFbnRyeUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFRlbXBsYXRlRW50cnk+KClcbmxldCBwbGF0Zm9ybURldmljZXNDYWNoZTogUGxhdGZvcm1EZXZpY2VFbnRyeVtdIHwgbnVsbCA9IG51bGxcbmxldCBwbGF0Zm9ybURldmljZXNDYWNoZVByb21pc2U6IFByb21pc2U8UGxhdGZvcm1EZXZpY2VFbnRyeVtdPiB8IG51bGwgPSBudWxsXG5jb25zdCBTSUxFTlRfUkVRVUVTVF9DT05GSUcgPSB7IHNpbGVudEVycm9yOiB0cnVlIH0gYXMgY29uc3RcblxuZnVuY3Rpb24gaXNJZ25vcmFibGVQbGF0Zm9ybVJlcXVlc3RFcnJvcihlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICBpZiAoIWVycm9yIHx8IHR5cGVvZiBlcnJvciAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZVxuICBjb25zdCBlcnIgPSBlcnJvciBhcyB7XG4gICAgbWVzc2FnZT86IHVua25vd25cbiAgICByZXNwb25zZT86IHsgc3RhdHVzPzogdW5rbm93bjsgZGF0YT86IHsgbWVzc2FnZT86IHVua25vd24gfSB9XG4gIH1cbiAgY29uc3QgbWVzc2FnZSA9IFN0cmluZyhlcnIucmVzcG9uc2U/LmRhdGE/Lm1lc3NhZ2UgfHwgZXJyLm1lc3NhZ2UgfHwgJycpLnRvTG93ZXJDYXNlKClcbiAgY29uc3Qgc3RhdHVzID0gTnVtYmVyKGVyci5yZXNwb25zZT8uc3RhdHVzID8/IE5hTilcbiAgcmV0dXJuIHN0YXR1cyA9PT0gNDA0IHx8IG1lc3NhZ2UuaW5jbHVkZXMoJ3JlY29yZCBub3QgZm91bmQnKVxufVxuXG5mdW5jdGlvbiByZXNvbHZlUGxhdGZvcm1CdWZmZXJTaXplKGRhdGFTb3VyY2VzOiB1bmtub3duKTogbnVtYmVyIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFTb3VyY2VzKSkgcmV0dXJuIDBcbiAgcmV0dXJuIE1hdGgubWF4KFxuICAgIDAsXG4gICAgLi4uZGF0YVNvdXJjZXMubWFwKChkYXRhU291cmNlOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRUeXBlID0gdHlwZW9mIGRhdGFTb3VyY2U/LnR5cGUgPT09ICdzdHJpbmcnID8gZGF0YVNvdXJjZS50eXBlLnRvVXBwZXJDYXNlKCkgOiAnJ1xuICAgICAgaWYgKG5vcm1hbGl6ZWRUeXBlICE9PSAnUExBVEZPUk1fRklFTEQnICYmIG5vcm1hbGl6ZWRUeXBlICE9PSAnUExBVEZPUk0nKSByZXR1cm4gMFxuICAgICAgY29uc3QgYnVmZmVyU2l6ZSA9IGRhdGFTb3VyY2U/LmNvbmZpZz8uYnVmZmVyU2l6ZVxuICAgICAgcmV0dXJuIHR5cGVvZiBidWZmZXJTaXplID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNGaW5pdGUoYnVmZmVyU2l6ZSkgPyBNYXRoLm1heCgwLCBNYXRoLnRydW5jKGJ1ZmZlclNpemUpKSA6IDBcbiAgICB9KVxuICApXG59XG5cbi8qKiBFeHRyYWN0IGZsYXQga2V54oaSdmFsdWUgbWFwIGZyb20gdmFyaW91cyBXUyByZXNwb25zZSBzaGFwZXMuICovXG5mdW5jdGlvbiBleHRyYWN0V3NGaWVsZHMocGF5bG9hZDogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgaWYgKCFwYXlsb2FkIHx8IHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JykgcmV0dXJuIHt9XG4gIGNvbnN0IG9iaiA9IHBheWxvYWQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICAvLyBVbndyYXAgZW52ZWxvcGUgZm9ybWF0c1xuICBpZiAob2JqLmZpZWxkcyAmJiB0eXBlb2Ygb2JqLmZpZWxkcyA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkob2JqLmZpZWxkcykpIHtcbiAgICByZXR1cm4gZXh0cmFjdFdzRmllbGRzKG9iai5maWVsZHMpXG4gIH1cbiAgaWYgKG9iai5kYXRhICE9PSB1bmRlZmluZWQpIHJldHVybiBleHRyYWN0V3NGaWVsZHMob2JqLmRhdGEpXG4gIGlmIChvYmoucGF5bG9hZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZXh0cmFjdFdzRmllbGRzKG9iai5wYXlsb2FkKVxuXG4gIC8vIEFycmF5IG9mIHsga2V5LCB2YWx1ZSB9IGl0ZW1zXG4gIGlmIChBcnJheS5pc0FycmF5KHBheWxvYWQpKSB7XG4gICAgY29uc3QgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9XG4gICAgOyhwYXlsb2FkIGFzIEFycmF5PHsga2V5Pzogc3RyaW5nOyBsYWJlbD86IHN0cmluZzsgdmFsdWU/OiB1bmtub3duIH0+KS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgaWYgKCFpdGVtKSByZXR1cm5cbiAgICAgIGNvbnN0IGsgPSBpdGVtLmtleSA/PyBpdGVtLmxhYmVsXG4gICAgICBpZiAoIWsgfHwgayA9PT0gJ3N5c3RpbWUnKSByZXR1cm5cbiAgICAgIGlmIChpdGVtLnZhbHVlICE9PSB1bmRlZmluZWQpIGZpZWxkc1trXSA9IGl0ZW0udmFsdWVcbiAgICB9KVxuICAgIHJldHVybiBmaWVsZHNcbiAgfVxuXG4gIC8vIEZsYXQgb2JqZWN0XG4gIGNvbnN0IGZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fVxuICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhvYmopKSB7XG4gICAgaWYgKGsgIT09ICdzeXN0aW1lJykgZmllbGRzW2tdID0gdlxuICB9XG4gIHJldHVybiBmaWVsZHNcbn1cblxuLyoqXG4gKiBNYXAgcmF3IFdTIGZpZWxkIGtleXMgdG8gY2Fub25pY2FsIHBsYXRmb3JtIGZpZWxkIElEcy5cbiAqIFRyaWVzIGZpZWxkLmlkIGZpcnN0LCB0aGVuIGZpZWxkLm5hbWUgYXMgZmFsbGJhY2suXG4gKiBGYWxscyBiYWNrIHRvIHRoZSByYXcgcGF5bG9hZCB3aGVuIG5vdGhpbmcgbWFwcy5cbiAqL1xuZnVuY3Rpb24gbWFwRmllbGRJZHMoXG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGRldmljZUZpZWxkczogQXJyYXk8eyBpZD86IHN0cmluZzsgbmFtZT86IHN0cmluZyB9PlxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBpZiAoZGV2aWNlRmllbGRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJhd0ZpZWxkc1xuICBjb25zdCBtYXBwZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge31cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBkZXZpY2VGaWVsZHMpIHtcbiAgICBpZiAoIWZpZWxkLmlkKSBjb250aW51ZVxuICAgIGNvbnN0IGJ5SWQgPSByYXdGaWVsZHNbZmllbGQuaWRdXG4gICAgY29uc3QgYnlOYW1lID0gZmllbGQubmFtZSAhPT0gdW5kZWZpbmVkID8gcmF3RmllbGRzW2ZpZWxkLm5hbWVdIDogdW5kZWZpbmVkXG4gICAgaWYgKGJ5SWQgIT09IHVuZGVmaW5lZCkgbWFwcGVkW2ZpZWxkLmlkXSA9IGJ5SWRcbiAgICBlbHNlIGlmIChieU5hbWUgIT09IHVuZGVmaW5lZCkgbWFwcGVkW2ZpZWxkLmlkXSA9IGJ5TmFtZVxuICB9XG4gIHJldHVybiBPYmplY3Qua2V5cyhtYXBwZWQpLmxlbmd0aCA+IDAgPyBtYXBwZWQgOiByYXdGaWVsZHNcbn1cblxuLyoqIE9wZW4gKG9yIHJlLW9wZW4pIGEgdGVsZW1ldHJ5IFdlYlNvY2tldCBmb3Igb25lIGRldmljZS4gKi9cbmZ1bmN0aW9uIGNvbm5lY3REZXZpY2VXcyhkZXZpY2U6IHsgZGV2aWNlSWQ6IHN0cmluZzsgZmllbGRzOiBBcnJheTx7IGlkPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nIH0+IH0pIHtcbiAgY29uc3QgeyBkZXZpY2VJZCB9ID0gZGV2aWNlXG5cbiAgLy8gVGVhciBkb3duIGFueSBleGlzdGluZyBjb25uZWN0aW9uIGZvciB0aGlzIGRldmljZVxuICBjb25zdCBwcmV2ID0gZGV2aWNlV3NNYXAuZ2V0KGRldmljZUlkKVxuICBpZiAocHJldikge1xuICAgIHByZXYuZGVzdHJveWVkID0gdHJ1ZVxuICAgIGlmIChwcmV2LnBpbmdUaW1lcikgY2xlYXJJbnRlcnZhbChwcmV2LnBpbmdUaW1lcilcbiAgICBpZiAocHJldi5yZWNvbm5lY3RUaW1lcikgY2xlYXJUaW1lb3V0KHByZXYucmVjb25uZWN0VGltZXIpXG4gICAgcHJldi53cz8uY2xvc2UoKVxuICB9XG5cbiAgY29uc3QgZW50cnk6IERldmljZVdzRW50cnkgPSB7XG4gICAgd3M6IG51bGwsXG4gICAgcGluZ1RpbWVyOiBudWxsLFxuICAgIHJlY29ubmVjdFRpbWVyOiBudWxsLFxuICAgIGRlc3Ryb3llZDogZmFsc2UsXG4gICAgZGV2aWNlXG4gIH1cbiAgZGV2aWNlV3NNYXAuc2V0KGRldmljZUlkLCBlbnRyeSlcblxuICBmdW5jdGlvbiBvcGVuV3MoKSB7XG4gICAgaWYgKGVudHJ5LmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICBjb25zdCB0b2tlbiA9IGxvY2FsU3RnLmdldCgndG9rZW4nKSBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICBlbnRyeS5yZWNvbm5lY3RUaW1lciA9IHNldFRpbWVvdXQob3BlbldzLCBXU19SRUNPTk5FQ1RfREVMQVlfTVMpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgd3NVcmwgPSBgJHtnZXRXZWJzb2NrZXRTZXJ2ZXJVcmwoKX0vdGVsZW1ldHJ5L2RhdGFzL2N1cnJlbnQvd3NgXG4gICAgICBlbnRyeS53cyA9IG5ldyBXZWJTb2NrZXQod3NVcmwpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tBcHBGcmFtZV0gV1MgaW5pdCBmYWlsZWQgZm9yIGRldmljZScsIGRldmljZUlkLCBlcnIpXG4gICAgICBlbnRyeS5yZWNvbm5lY3RUaW1lciA9IHNldFRpbWVvdXQob3BlbldzLCBXU19SRUNPTk5FQ1RfREVMQVlfTVMpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBlbnRyeS53cy5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICBpZiAoIWVudHJ5LndzKSByZXR1cm5cbiAgICAgIGVudHJ5LndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkZXZpY2VfaWQ6IGRldmljZUlkLCB0b2tlbiB9KSlcbiAgICAgIGVudHJ5LnBpbmdUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgaWYgKGVudHJ5LndzPy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikgZW50cnkud3Muc2VuZCgncGluZycpXG4gICAgICB9LCBQSU5HX0lOVEVSVkFMX01TKVxuICAgIH1cblxuICAgIGVudHJ5LndzLm9ubWVzc2FnZSA9IGV2dCA9PiB7XG4gICAgICBpZiAodHlwZW9mIGV2dC5kYXRhICE9PSAnc3RyaW5nJyB8fCBldnQuZGF0YSA9PT0gJ3BvbmcnKSByZXR1cm5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IEpTT04ucGFyc2UoZXZ0LmRhdGEpXG4gICAgICAgIGNvbnN0IHJhd0ZpZWxkcyA9IGV4dHJhY3RXc0ZpZWxkcyhtc2cpXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhyYXdGaWVsZHMpLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IG1hcEZpZWxkSWRzKHJhd0ZpZWxkcywgZGV2aWNlLmZpZWxkcylcbiAgICAgICAgcG9zdFBsYXRmb3JtRGF0YShmaWVsZHMsIGRldmljZUlkKVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIGlnbm9yZSBub24tSlNPTiBmcmFtZXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyeS53cy5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgLyogcmVjb25uZWN0IGhhbmRsZWQgYnkgb25jbG9zZSAqL1xuICAgIH1cblxuICAgIGVudHJ5LndzLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICBpZiAoZW50cnkuZGVzdHJveWVkKSByZXR1cm5cbiAgICAgIGlmIChlbnRyeS5waW5nVGltZXIpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChlbnRyeS5waW5nVGltZXIpXG4gICAgICAgIGVudHJ5LnBpbmdUaW1lciA9IG51bGxcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybignW0FwcEZyYW1lXSBXUyBjbG9zZWQgZm9yIGRldmljZScsIGRldmljZUlkLCAn4oCUIHNjaGVkdWxpbmcgcmVjb25uZWN0JylcbiAgICAgIGVudHJ5LnJlY29ubmVjdFRpbWVyID0gc2V0VGltZW91dChvcGVuV3MsIFdTX1JFQ09OTkVDVF9ERUxBWV9NUylcbiAgICB9XG4gIH1cblxuICBvcGVuV3MoKVxufVxuXG5mdW5jdGlvbiBlbnN1cmVEZXZpY2VXcyhkZXZpY2VJZD86IHN0cmluZykge1xuICBpZiAoIWRldmljZUlkKSByZXR1cm5cbiAgY29uc3QgZGV2aWNlID0gYWN0aXZlUGxhdGZvcm1EZXZpY2VzLmdldChkZXZpY2VJZClcbiAgaWYgKCFkZXZpY2UpIHJldHVyblxuICBjb25zdCBleGlzdGluZyA9IGRldmljZVdzTWFwLmdldChkZXZpY2VJZClcbiAgaWYgKGV4aXN0aW5nICYmICFleGlzdGluZy5kZXN0cm95ZWQpIHJldHVyblxuICBjb25uZWN0RGV2aWNlV3MoZGV2aWNlKVxufVxuXG4vKiogRGlzY29ubmVjdCBhbmQgY2xlYW4gdXAgYWxsIGRldmljZSBXZWJTb2NrZXQgY29ubmVjdGlvbnMuICovXG5mdW5jdGlvbiBkaXNjb25uZWN0QWxsRGV2aWNlV3MoKSB7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZGV2aWNlV3NNYXAudmFsdWVzKCkpIHtcbiAgICBlbnRyeS5kZXN0cm95ZWQgPSB0cnVlXG4gICAgaWYgKGVudHJ5LnBpbmdUaW1lcikgY2xlYXJJbnRlcnZhbChlbnRyeS5waW5nVGltZXIpXG4gICAgaWYgKGVudHJ5LnJlY29ubmVjdFRpbWVyKSBjbGVhclRpbWVvdXQoZW50cnkucmVjb25uZWN0VGltZXIpXG4gICAgZW50cnkud3M/LmNsb3NlKClcbiAgfVxuICBkZXZpY2VXc01hcC5jbGVhcigpXG59XG5cbi8vIOKUgOKUgOKUgCBFbmQgV1MgbWFuYWdlbWVudCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBHdWFyZCBhZ2FpbnN0IGNvbmN1cnJlbnQgdHY6cmVhZHkgcmUtaW5pdHMuXG4gKiBTdHVkaW8gc2VuZHMgdHY6cmVhZHkgdHdpY2UgKG9uY2Ugb24gbG9hZCwgb25jZSBhZnRlciBib290c3RyYXAgY29tcGxldGVzKS5cbiAqIEJvdGggdHJpZ2dlciBidWlsZFBsYXRmb3JtRGV2aWNlcygpIHdoaWNoIHRha2VzIH4xcy4gV2l0aG91dCBhIGd1YXJkLFxuICogdGhlIHNlY29uZCBjYWxsIHRlYXJzIGRvd24gV1Mgd2hpbGUgdGhlIGZpcnN0IGlzIHN0aWxsIGNvbXBsZXRpbmcuXG4gKi9cbmxldCBpbml0SW5Qcm9ncmVzcyA9IGZhbHNlXG5sZXQgaW5pdFN1Y2NlZWRlZCA9IGZhbHNlXG5sZXQgcGVuZGluZ0luaXREZWJvdW5jZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsXG5cbnR5cGUgSGlzdG9yeVBvaW50ID0geyB2YWx1ZTogdW5rbm93bjsgdHM6IG51bWJlciB9XG50eXBlIFJlcXVlc3RlZEZpZWxkUmVzdWx0ID0ge1xuICBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gIGhpc3RvcmllczogQXJyYXk8eyBmaWVsZElkOiBzdHJpbmc7IGhpc3Rvcnk6IEhpc3RvcnlQb2ludFtdOyBkZXZpY2VJZD86IHN0cmluZyB9PlxufVxudHlwZSBQbGF0Zm9ybVNvdXJjZURlc2NyaXB0b3IgPSB7XG4gIGlkOiBzdHJpbmdcbiAgZGV2aWNlSWQ/OiBzdHJpbmdcbiAgcmVxdWVzdGVkRmllbGRzOiBzdHJpbmdbXVxufVxuXG5jb25zdCB0b2tlbiA9IHJlZignJylcbmNvbnN0IHVybCA9IHJlZignJylcbmNvbnN0IGlmcmFtZVJlZiA9IHJlZjxIVE1MSUZyYW1lRWxlbWVudD4oKVxubGV0IHZpZXdlckh5ZHJhdGlvblRpbWVyczogQXJyYXk8UmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4+ID0gW11cbmxldCB2aWV3ZXJIeWRyYXRpb25JbkZsaWdodCA9IGZhbHNlXG5sZXQgdmlld2VySHlkcmF0aW9uQ29tcGxldGVkID0gZmFsc2VcbmxldCBpbml0UmV0cnlUaW1lcnM6IEFycmF5PFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+PiA9IFtdXG5cbmxldCB2aWV3ZXJEYXNoYm9hcmRDb25maWdDYWNoZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsID0gbnVsbFxubGV0IHZpZXdlckRhc2hib2FyZENvbmZpZ1Byb21pc2U6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsPiB8IG51bGwgPSBudWxsXG5sZXQgdmlld2VyRGFzaGJvYXJkQ29uZmlnQ2FjaGVJZDogc3RyaW5nIHwgbnVsbCA9IG51bGxcblxuZnVuY3Rpb24gZ2V0Q3VycmVudFVzZXJJbmZvKCkge1xuICByZXR1cm4gbG9jYWxTdGcuZ2V0KCd1c2VySW5mbycpIGFzIEFwaS5BdXRoLlVzZXJJbmZvIHwgbnVsbFxufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50UGxhdGZvcm1GaWVsZFNjb3BlKCkge1xuICByZXR1cm4gcmVzb2x2ZUdsb2JhbFBsYXRmb3JtRmllbGRTY29wZShnZXRDdXJyZW50VXNlckluZm8oKSlcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudEdsb2JhbFBsYXRmb3JtRmllbGRzKCkge1xuICByZXR1cm4gZ2V0R2xvYmFsUGxhdGZvcm1GaWVsZHMoZ2V0Q3VycmVudFBsYXRmb3JtRmllbGRTY29wZSgpKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDYW52YXNCYWNrZ3JvdW5kKGJhY2tncm91bmQ6IHVua25vd24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGlmIChiYWNrZ3JvdW5kICYmIHR5cGVvZiBiYWNrZ3JvdW5kID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShiYWNrZ3JvdW5kKSkge1xuICAgIHJldHVybiBiYWNrZ3JvdW5kIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gIH1cblxuICBjb25zdCBjb2xvciA9XG4gICAgdHlwZW9mIGJhY2tncm91bmQgPT09ICdzdHJpbmcnICYmIGJhY2tncm91bmQudHJpbSgpLmxlbmd0aCA+IDBcbiAgICAgID8gYmFja2dyb3VuZFxuICAgICAgOiAndHJhbnNwYXJlbnQnXG5cbiAgcmV0dXJuIHsgY29sb3IgfVxufVxuXG5mdW5jdGlvbiBjbGVhclZpZXdlckh5ZHJhdGlvblRpbWVycygpIHtcbiAgdmlld2VySHlkcmF0aW9uVGltZXJzLmZvckVhY2godGltZXIgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKSlcbiAgdmlld2VySHlkcmF0aW9uVGltZXJzID0gW11cbn1cblxuZnVuY3Rpb24gY2xlYXJJbml0UmV0cnlUaW1lcnMoKSB7XG4gIGluaXRSZXRyeVRpbWVycy5mb3JFYWNoKHRpbWVyID0+IGNsZWFyVGltZW91dCh0aW1lcikpXG4gIGluaXRSZXRyeVRpbWVycyA9IFtdXG59XG5cbmZ1bmN0aW9uIGdldFRoaW5nc1Zpc1RhcmdldE9yaWdpbigpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgVVJMKGdldFN0dWRpb0Jhc2UoKSkub3JpZ2luXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ub3JpZ2luXG4gIH1cbn1cblxuZnVuY3Rpb24gcG9zdFRvVGhpbmdzVmlzKHR5cGU6IHN0cmluZywgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgY29uc3Qgd2luID0gaWZyYW1lUmVmLnZhbHVlPy5jb250ZW50V2luZG93XG4gIGlmICghd2luKSByZXR1cm5cbiAgd2luLnBvc3RNZXNzYWdlKHsgdHlwZSwgcGF5bG9hZCB9LCBnZXRUaGluZ3NWaXNUYXJnZXRPcmlnaW4oKSlcbn1cblxuZnVuY3Rpb24gcG9zdFBsYXRmb3JtRGF0YShmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBkZXZpY2VJZD86IHN0cmluZykge1xuICBpZiAoT2JqZWN0LmtleXMoZmllbGRzKS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIHBvc3RUb1RoaW5nc1ZpcygndHY6cGxhdGZvcm0tZGF0YScsIHtcbiAgICBkZXZpY2VJZCxcbiAgICBmaWVsZHNcbiAgfSlcblxuICBpZiAoZGV2aWNlSWQpIHtcbiAgICBwb3N0VG9UaGluZ3NWaXMoJ3R2OnBsYXRmb3JtLWRhdGEnLCB7IGZpZWxkcyB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIHBvc3RQbGF0Zm9ybUhpc3RvcnkoZmllbGRJZDogc3RyaW5nLCBoaXN0b3J5OiBIaXN0b3J5UG9pbnRbXSwgZGV2aWNlSWQ/OiBzdHJpbmcpIHtcbiAgaWYgKGhpc3RvcnkubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBwb3N0VG9UaGluZ3NWaXMoJ3R2OnBsYXRmb3JtLWhpc3RvcnknLCB7XG4gICAgZGV2aWNlSWQsXG4gICAgZmllbGRJZCxcbiAgICBoaXN0b3J5XG4gIH0pXG59XG5cbmNvbnN0IEZJRUxEX0JJTkRJTkdfRVhQUl9SRSA9IC9cXHtcXHtcXHMqZHNcXC4oW14uXFxzfV0rKVxcLig/OmRhdGFcXC4pPyhbXn1dKz8pXFxzKlxcfVxcfS9nXG5cbmZ1bmN0aW9uIGdldFJlcXVlc3RlZEZpZWxkUm9vdChmaWVsZFBhdGg/OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFmaWVsZFBhdGgpIHJldHVybiBudWxsXG4gIGNvbnN0IFtyb290XSA9IGZpZWxkUGF0aC5zcGxpdCgvWy5bXFxdXS8pLmZpbHRlcihCb29sZWFuKVxuICByZXR1cm4gcm9vdD8udHJpbSgpID8gcm9vdC50cmltKCkgOiBudWxsXG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RSZXF1ZXN0ZWRGaWVsZHNGcm9tVmFsdWUodmFsdWU6IHVua25vd24sIHJlcXVlc3RzOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4pIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBudWxsXG4gICAgRklFTERfQklORElOR19FWFBSX1JFLmxhc3RJbmRleCA9IDBcbiAgICB3aGlsZSAoKG1hdGNoID0gRklFTERfQklORElOR19FWFBSX1JFLmV4ZWModmFsdWUpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgZGF0YVNvdXJjZUlkID0gbWF0Y2hbMV1cbiAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IG1hdGNoWzJdPy50cmltKClcbiAgICAgIGlmICghZGF0YVNvdXJjZUlkIHx8ICFmaWVsZFBhdGgpIGNvbnRpbnVlXG4gICAgICBjb25zdCBmaWVsZElkID0gZ2V0UmVxdWVzdGVkRmllbGRSb290KGZpZWxkUGF0aClcbiAgICAgIGlmICghZmllbGRJZCkgY29udGludWVcbiAgICAgIGNvbnN0IGZpZWxkcyA9IHJlcXVlc3RzLmdldChkYXRhU291cmNlSWQpID8/IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgICBmaWVsZHMuYWRkKGZpZWxkSWQpXG4gICAgICByZXF1ZXN0cy5zZXQoZGF0YVNvdXJjZUlkLCBmaWVsZHMpXG4gICAgfVxuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdmFsdWUuZm9yRWFjaChpdGVtID0+IGNvbGxlY3RSZXF1ZXN0ZWRGaWVsZHNGcm9tVmFsdWUoaXRlbSwgcmVxdWVzdHMpKVxuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSByZXR1cm5cblxuICBPYmplY3QudmFsdWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgIGNvbGxlY3RSZXF1ZXN0ZWRGaWVsZHNGcm9tVmFsdWUoaXRlbSwgcmVxdWVzdHMpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RQbGF0Zm9ybVNvdXJjZURlc2NyaXB0b3JzKGNvbmZpZzogYW55KTogUGxhdGZvcm1Tb3VyY2VEZXNjcmlwdG9yW10ge1xuICBjb25zdCByZXF1ZXN0cyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKVxuICBjb2xsZWN0UmVxdWVzdGVkRmllbGRzRnJvbVZhbHVlKGNvbmZpZz8ubm9kZXMsIHJlcXVlc3RzKVxuXG4gIGNvbnN0IGRhdGFTb3VyY2VzID0gQXJyYXkuaXNBcnJheShjb25maWc/LmRhdGFTb3VyY2VzKSA/IGNvbmZpZy5kYXRhU291cmNlcyA6IFtdXG5cbiAgcmV0dXJuIGRhdGFTb3VyY2VzXG4gICAgLmZpbHRlcigoZGF0YVNvdXJjZTogYW55KSA9PiB7XG4gICAgICBjb25zdCB0eXBlU3RyID0gdHlwZW9mIGRhdGFTb3VyY2U/LnR5cGUgPT09ICdzdHJpbmcnID8gZGF0YVNvdXJjZS50eXBlLnRvVXBwZXJDYXNlKCkgOiAnJ1xuICAgICAgcmV0dXJuIHR5cGVTdHIgPT09ICdQTEFURk9STV9GSUVMRCcgfHwgdHlwZVN0ciA9PT0gJ1BMQVRGT1JNJ1xuICAgIH0pXG4gICAgLm1hcCgoZGF0YVNvdXJjZTogYW55KSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ZWRGaWVsZHMgPSBuZXcgU2V0PHN0cmluZz4oXG4gICAgICAgIEFycmF5LmlzQXJyYXkoZGF0YVNvdXJjZT8uY29uZmlnPy5yZXF1ZXN0ZWRGaWVsZHMpXG4gICAgICAgICAgPyBkYXRhU291cmNlLmNvbmZpZy5yZXF1ZXN0ZWRGaWVsZHMuZmlsdGVyKFxuICAgICAgICAgICAgICAoZmllbGRJZDogdW5rbm93bik6IGZpZWxkSWQgaXMgc3RyaW5nID0+IHR5cGVvZiBmaWVsZElkID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgKVxuICAgICAgICAgIDogW11cbiAgICAgIClcbiAgICAgIGNvbnN0IGJpbmRpbmdGaWVsZHMgPSByZXF1ZXN0cy5nZXQoU3RyaW5nKGRhdGFTb3VyY2UuaWQpKVxuICAgICAgaWYgKGJpbmRpbmdGaWVsZHMpIHtcbiAgICAgICAgYmluZGluZ0ZpZWxkcy5mb3JFYWNoKGZpZWxkSWQgPT4gcmVxdWVzdGVkRmllbGRzLmFkZChmaWVsZElkKSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IFN0cmluZyhkYXRhU291cmNlLmlkKSxcbiAgICAgICAgZGV2aWNlSWQ6IHR5cGVvZiBkYXRhU291cmNlPy5jb25maWc/LmRldmljZUlkID09PSAnc3RyaW5nJyA/IGRhdGFTb3VyY2UuY29uZmlnLmRldmljZUlkIDogdW5kZWZpbmVkLFxuICAgICAgICByZXF1ZXN0ZWRGaWVsZHM6IEFycmF5LmZyb20ocmVxdWVzdGVkRmllbGRzKVxuICAgICAgfVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRWaWV3ZXJEYXNoYm9hcmRDb25maWcoKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGw+IHtcbiAgaWYgKHByb3BzLm1vZGUgIT09ICd2aWV3ZXInKSByZXR1cm4gbnVsbFxuICBpZiAocHJvcHMuc2NoZW1hKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBwcm9wcy5zY2hlbWEuaWQgfHwgcHJvcHMuaWQsXG4gICAgICBuYW1lOiBwcm9wcy5zY2hlbWEubmFtZSxcbiAgICAgIGNhbnZhczogcHJvcHMuc2NoZW1hLmNhbnZhc0NvbmZpZyxcbiAgICAgIG5vZGVzOiBBcnJheS5pc0FycmF5KHByb3BzLnNjaGVtYS5ub2RlcykgPyBwcm9wcy5zY2hlbWEubm9kZXMgOiBbXSxcbiAgICAgIGRhdGFTb3VyY2VzOiBBcnJheS5pc0FycmF5KHByb3BzLnNjaGVtYS5kYXRhU291cmNlcykgPyBwcm9wcy5zY2hlbWEuZGF0YVNvdXJjZXMgOiBbXVxuICAgIH1cbiAgfVxuICBpZiAodmlld2VyRGFzaGJvYXJkQ29uZmlnQ2FjaGUgJiYgdmlld2VyRGFzaGJvYXJkQ29uZmlnQ2FjaGVJZCA9PT0gcHJvcHMuaWQpIHJldHVybiB2aWV3ZXJEYXNoYm9hcmRDb25maWdDYWNoZVxuICBpZiAodmlld2VyRGFzaGJvYXJkQ29uZmlnUHJvbWlzZSkgcmV0dXJuIHZpZXdlckRhc2hib2FyZENvbmZpZ1Byb21pc2VcblxuICB2aWV3ZXJEYXNoYm9hcmRDb25maWdQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgZ2V0VGhpbmdzVmlzRGFzaGJvYXJkKHByb3BzLmlkKVxuICAgICAgaWYgKGVycm9yIHx8ICFkYXRhKSByZXR1cm4gbnVsbFxuXG4gICAgICB2aWV3ZXJEYXNoYm9hcmRDb25maWdDYWNoZUlkID0gcHJvcHMuaWRcbiAgICAgIHZpZXdlckRhc2hib2FyZENvbmZpZ0NhY2hlID0ge1xuICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICBjYW52YXM6IGRhdGEuY2FudmFzQ29uZmlnLFxuICAgICAgICBub2RlczogQXJyYXkuaXNBcnJheShkYXRhLm5vZGVzKSA/IGRhdGEubm9kZXMgOiBbXSxcbiAgICAgICAgZGF0YVNvdXJjZXM6IEFycmF5LmlzQXJyYXkoZGF0YS5kYXRhU291cmNlcykgPyBkYXRhLmRhdGFTb3VyY2VzIDogW11cbiAgICAgIH1cbiAgICAgIHJldHVybiB2aWV3ZXJEYXNoYm9hcmRDb25maWdDYWNoZVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tBcHBGcmFtZV0gRmFpbGVkIHRvIGxvYWQgdmlld2VyIGRhc2hib2FyZCBjb25maWcgZm9yIGh5ZHJhdGlvbjonLCBwcm9wcy5pZCwgZXJyb3IpXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH0gZmluYWxseSB7XG4gICAgICB2aWV3ZXJEYXNoYm9hcmRDb25maWdQcm9taXNlID0gbnVsbFxuICAgIH1cbiAgfSkoKVxuXG4gIHJldHVybiB2aWV3ZXJEYXNoYm9hcmRDb25maWdQcm9taXNlXG59XG5cbi8qKiBTdHJpcCBhbnkgaGFzaCBmcmFnbWVudCBhbmQgcmV0dXJuIHRoZSBiYXJlIFN0dWRpbyBIVE1MIGJhc2UgVVJMLiAqL1xuZnVuY3Rpb24gZ2V0U3R1ZGlvQmFzZSgpOiBzdHJpbmcge1xuICBjb25zdCByYXcgPSAoaW1wb3J0Lm1ldGEuZW52LlZJVEVfVEhJTkdTVklTX1NUVURJT19VUkwgYXMgc3RyaW5nKSB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwL21haW4nXG4gIGNvbnN0IGhhc2hJZHggPSByYXcuaW5kZXhPZignIycpXG4gIHJldHVybiBoYXNoSWR4ICE9PSAtMSA/IHJhdy5zdWJzdHJpbmcoMCwgaGFzaElkeCkgOiByYXdcbn1cblxuZnVuY3Rpb24gYnVpbGRUaGluZ3NWaXNGcmFtZVVybCh0aGluZ3NWaXNUb2tlbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgYXBpQmFzZVVybCA9IGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgJy90aGluZ3N2aXMtYXBpJylcbiAgY29uc3QgcGxhdGZvcm1GaWVsZFNjb3BlID0gZW5jb2RlVVJJQ29tcG9uZW50KGdldEN1cnJlbnRQbGF0Zm9ybUZpZWxkU2NvcGUoKSlcbiAgY29uc3QgcGxhdGZvcm1GaWVsZHMgPSBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoZ2V0Q3VycmVudEdsb2JhbFBsYXRmb3JtRmllbGRzKCkpKVxuICBjb25zdCBzYXZlVGFyZ2V0ID0gJ2hvc3QnXG4gIGNvbnN0IGRhc2hib2FyZElkID0gZW5jb2RlVVJJQ29tcG9uZW50KHByb3BzLmlkKVxuXG4gIGlmIChwcm9wcy5tb2RlID09PSAndmlld2VyJykge1xuICAgIHJldHVybiBgJHtnZXRTdHVkaW9CYXNlKCl9Iy9lbWJlZD9tb2RlPWVtYmVkZGVkJnNhdmVUYXJnZXQ9JHtzYXZlVGFyZ2V0fSZpZD0ke2Rhc2hib2FyZElkfSZ0b2tlbj0ke3RoaW5nc1Zpc1Rva2VufSZhcGlCYXNlVXJsPSR7YXBpQmFzZVVybH0mcGxhdGZvcm1GaWVsZFNjb3BlPSR7cGxhdGZvcm1GaWVsZFNjb3BlfSZwbGF0Zm9ybUZpZWxkcz0ke3BsYXRmb3JtRmllbGRzfWBcbiAgfVxuXG4gIHJldHVybiBgJHtnZXRTdHVkaW9CYXNlKCl9Iy9lZGl0b3I/bW9kZT1lbWJlZGRlZCZzYXZlVGFyZ2V0PSR7c2F2ZVRhcmdldH0mdG9rZW49JHt0aGluZ3NWaXNUb2tlbn0mYXBpQmFzZVVybD0ke2FwaUJhc2VVcmx9JnBsYXRmb3JtRmllbGRTY29wZT0ke3BsYXRmb3JtRmllbGRTY29wZX0mcGxhdGZvcm1GaWVsZHM9JHtwbGF0Zm9ybUZpZWxkc31gXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUhpc3RvcnkocmVjb3JkczogYW55W10sIHZhbHVlS2V5OiBzdHJpbmcpOiBIaXN0b3J5UG9pbnRbXSB7XG4gIHJldHVybiByZWNvcmRzXG4gICAgLm1hcCgoaXRlbTogYW55KSA9PiAoe1xuICAgICAgdmFsdWU6IGl0ZW0/Llt2YWx1ZUtleV0gPz8gaXRlbT8udmFsdWUgPz8gaXRlbT8uYXZnID8/IGl0ZW0/LnkgPz8gMCxcbiAgICAgIHRzOiBuZXcgRGF0ZShpdGVtPy50aW1lc3RhbXAgfHwgaXRlbT8udGltZSB8fCBpdGVtPy54IHx8IGl0ZW0/LnRzIHx8IERhdGUubm93KCkpLmdldFRpbWUoKVxuICAgIH0pKVxuICAgIC5maWx0ZXIocG9pbnQgPT4gIU51bWJlci5pc05hTihwb2ludC50cykpXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURlcml2ZWRIaXN0b3J5KHJlY29yZHM6IGFueVtdLCByZXNvbHZlcjogKGl0ZW06IGFueSkgPT4gdW5rbm93bik6IEhpc3RvcnlQb2ludFtdIHtcbiAgcmV0dXJuIHJlY29yZHNcbiAgICAubWFwKChpdGVtOiBhbnkpID0+ICh7XG4gICAgICB2YWx1ZTogbm9ybWFsaXplTWV0cmljVmFsdWUocmVzb2x2ZXIoaXRlbSkpLFxuICAgICAgdHM6IG5ldyBEYXRlKGl0ZW0/LnRpbWVzdGFtcCB8fCBpdGVtPy50aW1lIHx8IGl0ZW0/LnggfHwgaXRlbT8udHMgfHwgRGF0ZS5ub3coKSkuZ2V0VGltZSgpXG4gICAgfSkpXG4gICAgLmZpbHRlcihwb2ludCA9PiAhTnVtYmVyLmlzTmFOKHBvaW50LnRzKSlcbn1cblxuZnVuY3Rpb24gYnVpbGRGbGF0SGlzdG9yeSh2YWx1ZTogdW5rbm93biwgdGltZXN0YW1wczogbnVtYmVyW10pOiBIaXN0b3J5UG9pbnRbXSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRWYWx1ZSA9IG5vcm1hbGl6ZU1ldHJpY1ZhbHVlKHZhbHVlKVxuICBjb25zdCB1bmlxdWVUaW1lc3RhbXBzID0gQXJyYXkuZnJvbShuZXcgU2V0KHRpbWVzdGFtcHMuZmlsdGVyKHRzID0+IE51bWJlci5pc0Zpbml0ZSh0cykpKSlcbiAgaWYgKHVuaXF1ZVRpbWVzdGFtcHMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB1bmlxdWVUaW1lc3RhbXBzLm1hcCh0cyA9PiAoeyB2YWx1ZTogbm9ybWFsaXplZFZhbHVlLCB0cyB9KSlcbiAgfVxuXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KClcbiAgcmV0dXJuIFtcbiAgICB7IHZhbHVlOiBub3JtYWxpemVkVmFsdWUsIHRzOiBub3cgLSA2MCAqIDYwICogMTAwMCB9LFxuICAgIHsgdmFsdWU6IG5vcm1hbGl6ZWRWYWx1ZSwgdHM6IG5vdyB9XG4gIF1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWV0cmljVmFsdWUodmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCBudW0gPSBOdW1iZXIodmFsdWUpXG4gIHJldHVybiBOdW1iZXIuaXNGaW5pdGUobnVtKSA/IG51bSA6IDBcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGVuYW50R3Jvd3RoSGlzdG9yeShyZWNvcmRzOiBhbnlbXSk6IEhpc3RvcnlQb2ludFtdIHtcbiAgY29uc3QgY3VycmVudFllYXIgPSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKClcblxuICBjb25zdCBwb2ludHM6IEhpc3RvcnlQb2ludFtdID0gW11cblxuICByZWNvcmRzLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgIGNvbnN0IG1vbnRoID0gTnVtYmVyKGl0ZW0/Lm1vbilcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShtb250aCkgfHwgbW9udGggPCAxIHx8IG1vbnRoID4gMTIpIHJldHVyblxuXG4gICAgY29uc3QgdHMgPSBuZXcgRGF0ZShjdXJyZW50WWVhciwgbW9udGggLSAxLCAxKS5nZXRUaW1lKClcbiAgICBpZiAoTnVtYmVyLmlzTmFOKHRzKSkgcmV0dXJuXG5cbiAgICBwb2ludHMucHVzaCh7XG4gICAgICB2YWx1ZTogbm9ybWFsaXplTWV0cmljVmFsdWUoaXRlbT8ubnVtKSxcbiAgICAgIHRzXG4gICAgfSlcbiAgfSlcbiAgcmV0dXJuIHBvaW50c1xufVxuZnVuY3Rpb24gbm9ybWFsaXplU3lzdGVtTWV0cmljSGlzdG9yeShyZWNvcmRzOiBhbnlbXSwgbWV0cmljS2V5OiAnY3B1JyB8ICdtZW1vcnknIHwgJ2Rpc2snKTogSGlzdG9yeVBvaW50W10ge1xuICByZXR1cm4gcmVjb3Jkc1xuICAgIC5tYXAoKGl0ZW06IGFueSkgPT4gKHtcbiAgICAgIHZhbHVlOiBub3JtYWxpemVNZXRyaWNWYWx1ZShpdGVtPy5bYCR7bWV0cmljS2V5fV91c2FnZWBdID8/IGl0ZW0/LlttZXRyaWNLZXldKSxcbiAgICAgIHRzOiBuZXcgRGF0ZShpdGVtPy50aW1lc3RhbXAgfHwgaXRlbT8udGltZSB8fCBpdGVtPy54IHx8IGl0ZW0/LnRzIHx8IERhdGUubm93KCkpLmdldFRpbWUoKVxuICAgIH0pKVxuICAgIC5maWx0ZXIocG9pbnQgPT4gIU51bWJlci5pc05hTihwb2ludC50cykpXG59XG5cbmZ1bmN0aW9uIHVud3JhcExpc3QocGF5bG9hZDogYW55KTogYW55W10ge1xuICBpZiAoQXJyYXkuaXNBcnJheShwYXlsb2FkPy5saXN0KSkgcmV0dXJuIHBheWxvYWQubGlzdFxuICBpZiAoQXJyYXkuaXNBcnJheShwYXlsb2FkKSkgcmV0dXJuIHBheWxvYWRcbiAgcmV0dXJuIFtdXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRUZW1wbGF0ZUVudHJ5KHRlbXBsYXRlSWQ6IHN0cmluZyB8IG51bWJlcikge1xuICBjb25zdCBjYWNoZUtleSA9IFN0cmluZyh0ZW1wbGF0ZUlkKVxuICBjb25zdCBjYWNoZWQgPSB0ZW1wbGF0ZUVudHJ5Q2FjaGUuZ2V0KGNhY2hlS2V5KVxuICBpZiAoY2FjaGVkKSByZXR1cm4gY2FjaGVkXG5cbiAgY29uc3QgW3RlbGVtZXRyeVJlc3VsdCwgYXR0cmlidXRlc1Jlc3VsdF0gPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoW1xuICAgIHRlbGVtZXRyeUFwaSh7IHBhZ2U6IDEsIHBhZ2Vfc2l6ZTogRURJVE9SX1RFTVBMQVRFX0ZJRUxEX1BBR0VfU0laRSwgZGV2aWNlX3RlbXBsYXRlX2lkOiB0ZW1wbGF0ZUlkIH0pLFxuICAgIGF0dHJpYnV0ZXNBcGkoeyBwYWdlOiAxLCBwYWdlX3NpemU6IEVESVRPUl9URU1QTEFURV9GSUVMRF9QQUdFX1NJWkUsIGRldmljZV90ZW1wbGF0ZV9pZDogdGVtcGxhdGVJZCB9KVxuICBdKVxuXG4gIGNvbnN0IHRlbGVtZXRyeVJlcyA9IHRlbGVtZXRyeVJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnID8gdGVsZW1ldHJ5UmVzdWx0LnZhbHVlIDogbnVsbFxuICBjb25zdCBhdHRyaWJ1dGVzUmVzID0gYXR0cmlidXRlc1Jlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnID8gYXR0cmlidXRlc1Jlc3VsdC52YWx1ZSA6IG51bGxcblxuICBjb25zdCBwbGF0Zm9ybVNvdXJjZSA9IHtcbiAgICB0ZWxlbWV0cnk6IHVud3JhcExpc3QodGVsZW1ldHJ5UmVzPy5kYXRhKSxcbiAgICBhdHRyaWJ1dGVzOiB1bndyYXBMaXN0KGF0dHJpYnV0ZXNSZXM/LmRhdGEpXG4gIH1cbiAgY29uc3QgZXh0cmFjdGVkRmllbGRzID0gZXh0cmFjdFBsYXRmb3JtRmllbGRzKHBsYXRmb3JtU291cmNlKVxuXG4gIGNvbnN0IGVudHJ5OiBUZW1wbGF0ZUVudHJ5ID0ge1xuICAgIGZpZWxkczogZXh0cmFjdGVkRmllbGRzXG4gIH1cblxuICB0ZW1wbGF0ZUVudHJ5Q2FjaGUuc2V0KGNhY2hlS2V5LCBlbnRyeSlcbiAgcmV0dXJuIGVudHJ5XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdGVkRmllbGREYXRhKGZpZWxkSWRzOiB1bmtub3duW10sIGRldmljZUlkPzogc3RyaW5nKTogUHJvbWlzZTxSZXF1ZXN0ZWRGaWVsZFJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0ZWRGaWVsZHMgPSBBcnJheS5pc0FycmF5KGZpZWxkSWRzKVxuICAgID8gZmllbGRJZHMuZmlsdGVyKChmaWVsZElkKTogZmllbGRJZCBpcyBzdHJpbmcgPT4gdHlwZW9mIGZpZWxkSWQgPT09ICdzdHJpbmcnKVxuICAgIDogW11cblxuICBpZiAocmVxdWVzdGVkRmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IGZpZWxkczoge30sIGhpc3RvcmllczogW10gfVxuICB9XG5cbiAgY29uc3QgY3VycmVudEZpZWxkSWRzID0gcmVxdWVzdGVkRmllbGRzLmZpbHRlcihmaWVsZElkID0+ICFmaWVsZElkLmVuZHNXaXRoKCdfX2hpc3RvcnknKSlcbiAgY29uc3QgaGlzdG9yeUZpZWxkSWRzID0gcmVxdWVzdGVkRmllbGRzXG4gICAgLmZpbHRlcihmaWVsZElkID0+IGZpZWxkSWQuZW5kc1dpdGgoJ19faGlzdG9yeScpKVxuICAgIC5tYXAoZmllbGRJZCA9PiBmaWVsZElkLnJlcGxhY2UoL19faGlzdG9yeSQvLCAnJykpXG5cbiAgaWYgKGRldmljZUlkKSB7XG4gICAgY29uc3QgcmVzdWx0OiBSZXF1ZXN0ZWRGaWVsZFJlc3VsdCA9IHsgZmllbGRzOiB7fSwgaGlzdG9yaWVzOiBbXSB9XG5cbiAgICBpZiAoY3VycmVudEZpZWxkSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IFt0ZWxlbWV0cnlSZXN1bHQsIGF0dHJpYnV0ZVJlc3VsdF0gPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoW1xuICAgICAgICB0ZWxlbWV0cnlEYXRhQ3VycmVudChkZXZpY2VJZCwgU0lMRU5UX1JFUVVFU1RfQ09ORklHKSxcbiAgICAgICAgZ2V0QXR0cmlidXRlRGF0YVNldCh7IGRldmljZV9pZDogZGV2aWNlSWQgfSwgU0lMRU5UX1JFUVVFU1RfQ09ORklHKVxuICAgICAgXSlcblxuICAgICAgY29uc3QgdGVsZW1ldHJ5UmVzID0gdGVsZW1ldHJ5UmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcgPyB0ZWxlbWV0cnlSZXN1bHQudmFsdWUgOiBudWxsXG4gICAgICBjb25zdCBhdHRyaWJ1dGVSZXMgPSBhdHRyaWJ1dGVSZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJyA/IGF0dHJpYnV0ZVJlc3VsdC52YWx1ZSA6IG51bGxcblxuICAgICAgY29uc3Qga3ZNYXA6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge31cbiAgICAgIGNvbnN0IGNvbGxlY3QgPSAoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGlmIChpdGVtPy5rZXkgIT09IHVuZGVmaW5lZCkga3ZNYXBbaXRlbS5rZXldID0gaXRlbS52YWx1ZVxuICAgICAgICBpZiAoaXRlbT8ubGFiZWwpIGt2TWFwW2l0ZW0ubGFiZWxdID0gaXRlbS52YWx1ZVxuICAgICAgfVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0ZWxlbWV0cnlSZXM/LmRhdGEpKSB0ZWxlbWV0cnlSZXMuZGF0YS5mb3JFYWNoKGNvbGxlY3QpXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShhdHRyaWJ1dGVSZXM/LmRhdGEpKSBhdHRyaWJ1dGVSZXMuZGF0YS5mb3JFYWNoKGNvbGxlY3QpXG5cbiAgICAgIGN1cnJlbnRGaWVsZElkcy5mb3JFYWNoKGZpZWxkSWQgPT4ge1xuICAgICAgICBpZiAoa3ZNYXBbZmllbGRJZF0gIT09IHVuZGVmaW5lZCkgcmVzdWx0LmZpZWxkc1tmaWVsZElkXSA9IGt2TWFwW2ZpZWxkSWRdXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChoaXN0b3J5RmllbGRJZHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgaGlzdG9yeVJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoXG4gICAgICAgIGhpc3RvcnlGaWVsZElkcy5tYXAoYXN5bmMgZmllbGRJZCA9PiB7XG4gICAgICAgICAgY29uc3QgaGlzdG9yeVJlcyA9IGF3YWl0IHRlbGVtZXRyeURhdGFIaXN0b3J5TGlzdChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZGV2aWNlX2lkOiBkZXZpY2VJZCxcbiAgICAgICAgICAgICAga2V5OiBmaWVsZElkLFxuICAgICAgICAgICAgICB0aW1lX3JhbmdlOiAnY3VzdG9tJyxcbiAgICAgICAgICAgICAgc3RhcnRfdGltZTogRGF0ZS5ub3coKSAtIDM2MDAgKiAxMDAwLFxuICAgICAgICAgICAgICBlbmRfdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgYWdncmVnYXRlX3dpbmRvdzogJzFtJyxcbiAgICAgICAgICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAnYXZnJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNJTEVOVF9SRVFVRVNUX0NPTkZJR1xuICAgICAgICAgIClcbiAgICAgICAgICBjb25zdCBsaXN0ID0gQXJyYXkuaXNBcnJheShoaXN0b3J5UmVzPy5kYXRhPy5saXN0KSA/IGhpc3RvcnlSZXMuZGF0YS5saXN0IDogW11cbiAgICAgICAgICBjb25zdCBoaXN0b3J5ID0gbm9ybWFsaXplSGlzdG9yeShsaXN0LCAndmFsdWUnKVxuICAgICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlc3VsdC5oaXN0b3JpZXMucHVzaCh7IGZpZWxkSWQsIGhpc3RvcnksIGRldmljZUlkIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKVxuXG4gICAgICBoaXN0b3J5UmVzdWx0cy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAoaXRlbS5zdGF0dXMgPT09ICdyZWplY3RlZCcgJiYgIWlzSWdub3JhYmxlUGxhdGZvcm1SZXF1ZXN0RXJyb3IoaXRlbS5yZWFzb24pKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbQXBwRnJhbWVdIERldmljZSBoaXN0b3J5IGZldGNoIGZhaWxlZDonLCBpdGVtLnJlYXNvbilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICBjb25zdCByZXN1bHQ6IFJlcXVlc3RlZEZpZWxkUmVzdWx0ID0geyBmaWVsZHM6IHt9LCBoaXN0b3JpZXM6IFtdIH1cbiAgY29uc3QgcmVxdWVzdGVkQ3VycmVudEZpZWxkU2V0ID0gbmV3IFNldChjdXJyZW50RmllbGRJZHMpXG4gIGNvbnN0IHJlcXVlc3RlZEhpc3RvcnlGaWVsZFNldCA9IG5ldyBTZXQoaGlzdG9yeUZpZWxkSWRzKVxuXG4gIGNvbnN0IHJlcXVpcmVzRGV2aWNlU3VtbWFyeSA9IFsnZGV2aWNlX3RvdGFsJywgJ2RldmljZV9vbmxpbmUnLCAnZGV2aWNlX29mZmxpbmUnLCAnZGV2aWNlX2FjdGl2aXR5J10uc29tZShcbiAgICBmaWVsZElkID0+IHJlcXVlc3RlZEN1cnJlbnRGaWVsZFNldC5oYXMoZmllbGRJZCkgfHwgcmVxdWVzdGVkSGlzdG9yeUZpZWxkU2V0LmhhcyhmaWVsZElkKVxuICApXG4gIGNvbnN0IHJlcXVpcmVzQWxhcm1TdW1tYXJ5ID1cbiAgICByZXF1ZXN0ZWRDdXJyZW50RmllbGRTZXQuaGFzKCdhbGFybV9kZXZpY2VfdG90YWwnKSB8fCByZXF1ZXN0ZWRIaXN0b3J5RmllbGRTZXQuaGFzKCdhbGFybV9kZXZpY2VfdG90YWwnKVxuICBjb25zdCByZXF1aXJlc1RlbmFudFN1bW1hcnkgPVxuICAgIGdldEN1cnJlbnRQbGF0Zm9ybUZpZWxkU2NvcGUoKSA9PT0gJ3N1cGVyLWFkbWluJyAmJlxuICAgIFsndGVuYW50X2FkZGVkX3llc3RlcmRheScsICd0ZW5hbnRfYWRkZWRfbW9udGgnLCAndGVuYW50X3RvdGFsJ10uc29tZShmaWVsZElkID0+XG4gICAgICByZXF1ZXN0ZWRDdXJyZW50RmllbGRTZXQuaGFzKGZpZWxkSWQpXG4gICAgKVxuICBjb25zdCByZXF1aXJlc1RlbmFudEhpc3RvcnkgPVxuICAgIGdldEN1cnJlbnRQbGF0Zm9ybUZpZWxkU2NvcGUoKSA9PT0gJ3N1cGVyLWFkbWluJyAmJiByZXF1ZXN0ZWRIaXN0b3J5RmllbGRTZXQuaGFzKCd0ZW5hbnRfZ3Jvd3RoJylcbiAgY29uc3QgcmVxdWlyZXNNZXRyaWNTdW1tYXJ5ID1cbiAgICBnZXRDdXJyZW50UGxhdGZvcm1GaWVsZFNjb3BlKCkgPT09ICdzdXBlci1hZG1pbicgJiZcbiAgICBbJ2NwdV91c2FnZScsICdtZW1vcnlfdXNhZ2UnLCAnZGlza191c2FnZSddLnNvbWUoZmllbGRJZCA9PiByZXF1ZXN0ZWRDdXJyZW50RmllbGRTZXQuaGFzKGZpZWxkSWQpKVxuICBjb25zdCByZXF1aXJlc01ldHJpY0hpc3RvcnkgPVxuICAgIGdldEN1cnJlbnRQbGF0Zm9ybUZpZWxkU2NvcGUoKSA9PT0gJ3N1cGVyLWFkbWluJyAmJlxuICAgIFsnY3B1X3VzYWdlJywgJ21lbW9yeV91c2FnZScsICdkaXNrX3VzYWdlJ10uc29tZShmaWVsZElkID0+IHJlcXVlc3RlZEhpc3RvcnlGaWVsZFNldC5oYXMoZmllbGRJZCkpXG4gIGNvbnN0IHJlcXVpcmVzRGV2aWNlVHJlbmQgPSBbJ2RldmljZV90b3RhbCcsICdkZXZpY2Vfb25saW5lJywgJ2RldmljZV9vZmZsaW5lJywgJ2RldmljZV9hY3Rpdml0eSddLnNvbWUoXG4gICAgZmllbGRJZCA9PiByZXF1ZXN0ZWRIaXN0b3J5RmllbGRTZXQuaGFzKGZpZWxkSWQpXG4gIClcblxuICBjb25zdCBbXG4gICAgZGV2aWNlTGlzdFJlc3VsdCxcbiAgICBhbGFybUNvdW50UmVzdWx0LFxuICAgIHRlbmFudFJlc3VsdCxcbiAgICBzeXN0ZW1NZXRyaWNzQ3VycmVudFJlc3VsdCxcbiAgICBzeXN0ZW1NZXRyaWNzSGlzdG9yeVJlc3VsdCxcbiAgICBkZXZpY2VUcmVuZFJlc3VsdFxuICBdID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFtcbiAgICByZXF1aXJlc0RldmljZVN1bW1hcnkgPyBkZXZpY2VMaXN0KHsgcGFnZTogMSwgcGFnZV9zaXplOiAxMDAwIH0pIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLFxuICAgIHJlcXVpcmVzQWxhcm1TdW1tYXJ5ID8gZ2V0QWxhcm1Db3VudCgpIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLFxuICAgIHJlcXVpcmVzVGVuYW50U3VtbWFyeSB8fCByZXF1aXJlc1RlbmFudEhpc3RvcnkgPyB0ZW5hbnQoKSA6IFByb21pc2UucmVzb2x2ZShudWxsKSxcbiAgICByZXF1aXJlc01ldHJpY1N1bW1hcnkgPyBnZXRTeXN0ZW1NZXRyaWNzQ3VycmVudCgpIDogUHJvbWlzZS5yZXNvbHZlKG51bGwpLFxuICAgIHJlcXVpcmVzTWV0cmljSGlzdG9yeSA/IGdldFN5c3RlbU1ldHJpY3NIaXN0b3J5KHt9KSA6IFByb21pc2UucmVzb2x2ZShudWxsKSxcbiAgICByZXF1aXJlc0RldmljZVRyZW5kID8gZ2V0T25saW5lRGV2aWNlVHJlbmQoKSA6IFByb21pc2UucmVzb2x2ZShudWxsKVxuICBdKVxuXG4gIGNvbnN0IGRldmljZXMgPVxuICAgIGRldmljZUxpc3RSZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJ1xuICAgICAgPyBkZXZpY2VMaXN0UmVzdWx0LnZhbHVlPy5kYXRhPy5saXN0IHx8IGRldmljZUxpc3RSZXN1bHQudmFsdWU/LmRhdGEgfHwgW11cbiAgICAgIDogW11cbiAgY29uc3QgZGV2aWNlVG90YWwgPSBBcnJheS5pc0FycmF5KGRldmljZXMpID8gZGV2aWNlcy5sZW5ndGggOiAwXG4gIGNvbnN0IGRldmljZU9ubGluZSA9IEFycmF5LmlzQXJyYXkoZGV2aWNlcylcbiAgICA/IGRldmljZXMuZmlsdGVyKChkZXZpY2U6IGFueSkgPT4gTnVtYmVyKGRldmljZT8uaXNfb25saW5lIHx8IDApICE9PSAwKS5sZW5ndGhcbiAgICA6IDBcbiAgY29uc3QgYWdncmVnYXRlVmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBkZXZpY2VfdG90YWw6IGRldmljZVRvdGFsLFxuICAgIGRldmljZV9vbmxpbmU6IGRldmljZU9ubGluZSxcbiAgICBkZXZpY2Vfb2ZmbGluZTogTWF0aC5tYXgoMCwgZGV2aWNlVG90YWwgLSBkZXZpY2VPbmxpbmUpLFxuICAgIGRldmljZV9hY3Rpdml0eTogZGV2aWNlT25saW5lXG4gIH1cblxuICBpZiAoYWxhcm1Db3VudFJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgYWdncmVnYXRlVmFsdWVzLmFsYXJtX2RldmljZV90b3RhbCA9IG5vcm1hbGl6ZU1ldHJpY1ZhbHVlKGFsYXJtQ291bnRSZXN1bHQudmFsdWU/LmRhdGE/LmFsYXJtX2RldmljZV90b3RhbClcbiAgfVxuXG4gIGlmICh0ZW5hbnRSZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgIGFnZ3JlZ2F0ZVZhbHVlcy50ZW5hbnRfdG90YWwgPSBub3JtYWxpemVNZXRyaWNWYWx1ZSh0ZW5hbnRSZXN1bHQudmFsdWU/LmRhdGE/LnVzZXJfdG90YWwpXG4gICAgYWdncmVnYXRlVmFsdWVzLnRlbmFudF9hZGRlZF95ZXN0ZXJkYXkgPSBub3JtYWxpemVNZXRyaWNWYWx1ZSh0ZW5hbnRSZXN1bHQudmFsdWU/LmRhdGE/LnVzZXJfYWRkZWRfeWVzdGVyZGF5KVxuICAgIGFnZ3JlZ2F0ZVZhbHVlcy50ZW5hbnRfYWRkZWRfbW9udGggPSBub3JtYWxpemVNZXRyaWNWYWx1ZSh0ZW5hbnRSZXN1bHQudmFsdWU/LmRhdGE/LnVzZXJfYWRkZWRfbW9udGgpXG4gIH1cblxuICBpZiAoc3lzdGVtTWV0cmljc0N1cnJlbnRSZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgIGFnZ3JlZ2F0ZVZhbHVlcy5jcHVfdXNhZ2UgPSBub3JtYWxpemVNZXRyaWNWYWx1ZShzeXN0ZW1NZXRyaWNzQ3VycmVudFJlc3VsdC52YWx1ZT8uZGF0YT8uY3B1X3VzYWdlKVxuICAgIGFnZ3JlZ2F0ZVZhbHVlcy5tZW1vcnlfdXNhZ2UgPSBub3JtYWxpemVNZXRyaWNWYWx1ZShzeXN0ZW1NZXRyaWNzQ3VycmVudFJlc3VsdC52YWx1ZT8uZGF0YT8ubWVtb3J5X3VzYWdlKVxuICAgIGFnZ3JlZ2F0ZVZhbHVlcy5kaXNrX3VzYWdlID0gbm9ybWFsaXplTWV0cmljVmFsdWUoc3lzdGVtTWV0cmljc0N1cnJlbnRSZXN1bHQudmFsdWU/LmRhdGE/LmRpc2tfdXNhZ2UpXG4gIH1cblxuICBjdXJyZW50RmllbGRJZHMuZm9yRWFjaChmaWVsZElkID0+IHtcbiAgICBpZiAoYWdncmVnYXRlVmFsdWVzW2ZpZWxkSWRdICE9PSB1bmRlZmluZWQpIHJlc3VsdC5maWVsZHNbZmllbGRJZF0gPSBhZ2dyZWdhdGVWYWx1ZXNbZmllbGRJZF1cbiAgfSlcblxuICBpZiAocmVxdWlyZXNEZXZpY2VUcmVuZCkge1xuICAgIGNvbnN0IHBvaW50cyA9XG4gICAgICBkZXZpY2VUcmVuZFJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnICYmIEFycmF5LmlzQXJyYXkoZGV2aWNlVHJlbmRSZXN1bHQudmFsdWU/LmRhdGE/LnBvaW50cylcbiAgICAgICAgPyBkZXZpY2VUcmVuZFJlc3VsdC52YWx1ZS5kYXRhLnBvaW50c1xuICAgICAgICA6IFtdXG4gICAgY29uc3QgdHJlbmRUaW1lc3RhbXBzID0gcG9pbnRzXG4gICAgICAubWFwKChpdGVtOiBhbnkpID0+IG5ldyBEYXRlKGl0ZW0/LnRpbWVzdGFtcCB8fCBpdGVtPy50aW1lIHx8IGl0ZW0/LnggfHwgaXRlbT8udHMgfHwgRGF0ZS5ub3coKSkuZ2V0VGltZSgpKVxuICAgICAgLmZpbHRlcigodHM6IG51bWJlcikgPT4gIU51bWJlci5pc05hTih0cykpXG5cbiAgICBpZiAoaGlzdG9yeUZpZWxkSWRzLmluY2x1ZGVzKCdkZXZpY2Vfb25saW5lJykpIHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSBub3JtYWxpemVIaXN0b3J5KHBvaW50cywgJ2RldmljZV9vbmxpbmUnKVxuICAgICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gMCkgcmVzdWx0Lmhpc3Rvcmllcy5wdXNoKHsgZmllbGRJZDogJ2RldmljZV9vbmxpbmUnLCBoaXN0b3J5IH0pXG4gICAgfVxuXG4gICAgaWYgKGhpc3RvcnlGaWVsZElkcy5pbmNsdWRlcygnZGV2aWNlX29mZmxpbmUnKSkge1xuICAgICAgY29uc3QgaGlzdG9yeSA9IG5vcm1hbGl6ZUhpc3RvcnkocG9pbnRzLCAnZGV2aWNlX29mZmxpbmUnKVxuICAgICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gMCkgcmVzdWx0Lmhpc3Rvcmllcy5wdXNoKHsgZmllbGRJZDogJ2RldmljZV9vZmZsaW5lJywgaGlzdG9yeSB9KVxuICAgIH1cblxuICAgIGlmIChoaXN0b3J5RmllbGRJZHMuaW5jbHVkZXMoJ2RldmljZV90b3RhbCcpKSB7XG4gICAgICBjb25zdCBoaXN0b3J5ID0gbm9ybWFsaXplRGVyaXZlZEhpc3RvcnkoXG4gICAgICAgIHBvaW50cyxcbiAgICAgICAgKGl0ZW06IGFueSkgPT4gbm9ybWFsaXplTWV0cmljVmFsdWUoaXRlbT8uZGV2aWNlX29ubGluZSkgKyBub3JtYWxpemVNZXRyaWNWYWx1ZShpdGVtPy5kZXZpY2Vfb2ZmbGluZSlcbiAgICAgIClcbiAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDApIHJlc3VsdC5oaXN0b3JpZXMucHVzaCh7IGZpZWxkSWQ6ICdkZXZpY2VfdG90YWwnLCBoaXN0b3J5IH0pXG4gICAgfVxuXG4gICAgaWYgKGhpc3RvcnlGaWVsZElkcy5pbmNsdWRlcygnZGV2aWNlX2FjdGl2aXR5JykpIHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSBub3JtYWxpemVEZXJpdmVkSGlzdG9yeShwb2ludHMsIChpdGVtOiBhbnkpID0+IGl0ZW0/LmRldmljZV9vbmxpbmUpXG4gICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAwKSByZXN1bHQuaGlzdG9yaWVzLnB1c2goeyBmaWVsZElkOiAnZGV2aWNlX2FjdGl2aXR5JywgaGlzdG9yeSB9KVxuICAgIH1cblxuICAgIGlmIChoaXN0b3J5RmllbGRJZHMuaW5jbHVkZXMoJ2FsYXJtX2RldmljZV90b3RhbCcpKSB7XG4gICAgICBjb25zdCBoaXN0b3J5ID0gYnVpbGRGbGF0SGlzdG9yeShhZ2dyZWdhdGVWYWx1ZXMuYWxhcm1fZGV2aWNlX3RvdGFsLCB0cmVuZFRpbWVzdGFtcHMpXG4gICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAwKSByZXN1bHQuaGlzdG9yaWVzLnB1c2goeyBmaWVsZElkOiAnYWxhcm1fZGV2aWNlX3RvdGFsJywgaGlzdG9yeSB9KVxuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICAhcmVxdWlyZXNEZXZpY2VUcmVuZCAmJlxuICAgIGhpc3RvcnlGaWVsZElkcy5pbmNsdWRlcygnYWxhcm1fZGV2aWNlX3RvdGFsJykgJiZcbiAgICBhZ2dyZWdhdGVWYWx1ZXMuYWxhcm1fZGV2aWNlX3RvdGFsICE9PSB1bmRlZmluZWRcbiAgKSB7XG4gICAgY29uc3QgaGlzdG9yeSA9IGJ1aWxkRmxhdEhpc3RvcnkoYWdncmVnYXRlVmFsdWVzLmFsYXJtX2RldmljZV90b3RhbCwgW10pXG4gICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gMCkgcmVzdWx0Lmhpc3Rvcmllcy5wdXNoKHsgZmllbGRJZDogJ2FsYXJtX2RldmljZV90b3RhbCcsIGhpc3RvcnkgfSlcbiAgfVxuXG4gIGlmIChyZXF1aXJlc1RlbmFudEhpc3RvcnkgJiYgdGVuYW50UmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICBjb25zdCBncm93dGhIaXN0b3J5ID0gbm9ybWFsaXplVGVuYW50R3Jvd3RoSGlzdG9yeSh0ZW5hbnRSZXN1bHQudmFsdWU/LmRhdGE/LnVzZXJfbGlzdF9tb250aCB8fCBbXSlcbiAgICBpZiAoZ3Jvd3RoSGlzdG9yeS5sZW5ndGggPiAwKSB7XG4gICAgICByZXN1bHQuaGlzdG9yaWVzLnB1c2goeyBmaWVsZElkOiAndGVuYW50X2dyb3d0aCcsIGhpc3Rvcnk6IGdyb3d0aEhpc3RvcnkgfSlcbiAgICB9XG4gIH1cblxuICBpZiAocmVxdWlyZXNNZXRyaWNIaXN0b3J5ICYmIHN5c3RlbU1ldHJpY3NIaXN0b3J5UmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICBjb25zdCByZWNvcmRzID0gQXJyYXkuaXNBcnJheShzeXN0ZW1NZXRyaWNzSGlzdG9yeVJlc3VsdC52YWx1ZT8uZGF0YSkgPyBzeXN0ZW1NZXRyaWNzSGlzdG9yeVJlc3VsdC52YWx1ZS5kYXRhIDogW11cblxuICAgIGNvbnN0IG1ldHJpY0ZpZWxkTWFwOiBBcnJheTx7XG4gICAgICBmaWVsZElkOiAnY3B1X3VzYWdlJyB8ICdtZW1vcnlfdXNhZ2UnIHwgJ2Rpc2tfdXNhZ2UnXG4gICAgICBzb3VyY2U6ICdjcHUnIHwgJ21lbW9yeScgfCAnZGlzaydcbiAgICB9PiA9IFtcbiAgICAgIHsgZmllbGRJZDogJ2NwdV91c2FnZScsIHNvdXJjZTogJ2NwdScgfSxcbiAgICAgIHsgZmllbGRJZDogJ21lbW9yeV91c2FnZScsIHNvdXJjZTogJ21lbW9yeScgfSxcbiAgICAgIHsgZmllbGRJZDogJ2Rpc2tfdXNhZ2UnLCBzb3VyY2U6ICdkaXNrJyB9XG4gICAgXVxuXG4gICAgbWV0cmljRmllbGRNYXAuZm9yRWFjaCgoeyBmaWVsZElkLCBzb3VyY2UgfSkgPT4ge1xuICAgICAgaWYgKCFoaXN0b3J5RmllbGRJZHMuaW5jbHVkZXMoZmllbGRJZCkpIHJldHVyblxuICAgICAgY29uc3QgaGlzdG9yeSA9IG5vcm1hbGl6ZVN5c3RlbU1ldHJpY0hpc3RvcnkocmVjb3Jkcywgc291cmNlKVxuICAgICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXN1bHQuaGlzdG9yaWVzLnB1c2goeyBmaWVsZElkLCBoaXN0b3J5IH0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuYXN5bmMgZnVuY3Rpb24gaHlkcmF0ZUNvbmZpZ3VyZWRQbGF0Zm9ybVNvdXJjZXMoKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGxvYWRWaWV3ZXJEYXNoYm9hcmRDb25maWcoKVxuICBpZiAoIWNvbmZpZykgcmV0dXJuXG5cbiAgY29uc3QgZGVzY3JpcHRvcnMgPSBjb2xsZWN0UGxhdGZvcm1Tb3VyY2VEZXNjcmlwdG9ycyhjb25maWcpXG4gIGlmIChkZXNjcmlwdG9ycy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGNvbnN0IGhhbmRsZWREZXZpY2VJZHMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICBsZXQgZ2xvYmFsSHlkcmF0ZWQgPSBmYWxzZVxuXG4gIGZvciAoY29uc3QgZGVzY3JpcHRvciBvZiBkZXNjcmlwdG9ycykge1xuICAgIGNvbnN0IHJlcXVlc3RlZEZpZWxkcyA9IGRlc2NyaXB0b3IucmVxdWVzdGVkRmllbGRzXG5cbiAgICBpZiAoZGVzY3JpcHRvci5kZXZpY2VJZCkge1xuICAgICAgaWYgKHJlcXVlc3RlZEZpZWxkcy5sZW5ndGggPT09IDApIGNvbnRpbnVlXG4gICAgICBpZiAoaGFuZGxlZERldmljZUlkcy5oYXMoZGVzY3JpcHRvci5kZXZpY2VJZCkpIGNvbnRpbnVlXG4gICAgICBoYW5kbGVkRGV2aWNlSWRzLmFkZChkZXNjcmlwdG9yLmRldmljZUlkKVxuXG4gICAgICBlbnN1cmVEZXZpY2VXcyhkZXNjcmlwdG9yLmRldmljZUlkKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBidWlsZFJlcXVlc3RlZEZpZWxkRGF0YShyZXF1ZXN0ZWRGaWVsZHMsIGRlc2NyaXB0b3IuZGV2aWNlSWQpXG4gICAgICBwb3N0UGxhdGZvcm1EYXRhKHJlc3VsdC5maWVsZHMsIGRlc2NyaXB0b3IuZGV2aWNlSWQpXG4gICAgICByZXN1bHQuaGlzdG9yaWVzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIHBvc3RQbGF0Zm9ybUhpc3RvcnkoaXRlbS5maWVsZElkLCBpdGVtLmhpc3RvcnksIGl0ZW0uZGV2aWNlSWQpXG4gICAgICB9KVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAoZ2xvYmFsSHlkcmF0ZWQpIGNvbnRpbnVlXG4gICAgZ2xvYmFsSHlkcmF0ZWQgPSB0cnVlXG5cbiAgICBjb25zdCBmYWxsYmFja0dsb2JhbEZpZWxkcyA9XG4gICAgICByZXF1ZXN0ZWRGaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICA/IHJlcXVlc3RlZEZpZWxkc1xuICAgICAgICA6IGdldEN1cnJlbnRHbG9iYWxQbGF0Zm9ybUZpZWxkcygpXG4gICAgICAgICAgICAubWFwKGZpZWxkID0+IGZpZWxkLmlkKVxuICAgICAgICAgICAgLmZpbHRlcigoZmllbGRJZCk6IGZpZWxkSWQgaXMgc3RyaW5nID0+IHR5cGVvZiBmaWVsZElkID09PSAnc3RyaW5nJyAmJiBmaWVsZElkLmxlbmd0aCA+IDApXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYnVpbGRSZXF1ZXN0ZWRGaWVsZERhdGEoZmFsbGJhY2tHbG9iYWxGaWVsZHMpXG4gICAgcG9zdFBsYXRmb3JtRGF0YShyZXN1bHQuZmllbGRzKVxuICAgIHJlc3VsdC5oaXN0b3JpZXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIHBvc3RQbGF0Zm9ybUhpc3RvcnkoaXRlbS5maWVsZElkLCBpdGVtLmhpc3RvcnkpXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBzY2hlZHVsZVZpZXdlckh5ZHJhdGlvbigpIHtcbiAgaWYgKHByb3BzLm1vZGUgIT09ICd2aWV3ZXInKSByZXR1cm5cblxuICBjbGVhclZpZXdlckh5ZHJhdGlvblRpbWVycygpXG4gIGlmICh2aWV3ZXJIeWRyYXRpb25Db21wbGV0ZWQgfHwgdmlld2VySHlkcmF0aW9uSW5GbGlnaHQpIHJldHVyblxuXG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgaWYgKHZpZXdlckh5ZHJhdGlvbkNvbXBsZXRlZCB8fCB2aWV3ZXJIeWRyYXRpb25JbkZsaWdodCkgcmV0dXJuXG4gICAgdmlld2VySHlkcmF0aW9uSW5GbGlnaHQgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGh5ZHJhdGVDb25maWd1cmVkUGxhdGZvcm1Tb3VyY2VzKClcbiAgICAgIHZpZXdlckh5ZHJhdGlvbkNvbXBsZXRlZCA9IHRydWVcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdmlld2VySHlkcmF0aW9uSW5GbGlnaHQgPSBmYWxzZVxuICAgIH1cbiAgfSwgMClcbiAgdmlld2VySHlkcmF0aW9uVGltZXJzLnB1c2godGltZXIpXG59XG5cbmZ1bmN0aW9uIHJlc29sdmVXcml0ZURldmljZUlkKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkLmRldmljZUlkID09PSAnc3RyaW5nJyAmJiBwYXlsb2FkLmRldmljZUlkKSB7XG4gICAgcmV0dXJuIHBheWxvYWQuZGV2aWNlSWRcbiAgfVxuXG4gIGNvbnN0IGRhdGFTb3VyY2VJZCA9IHR5cGVvZiBwYXlsb2FkLmRhdGFTb3VyY2VJZCA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmRhdGFTb3VyY2VJZCA6ICcnXG4gIGNvbnN0IG1hdGNoID0gZGF0YVNvdXJjZUlkLm1hdGNoKC9eX19wbGF0Zm9ybV8oLispX18kLylcbiAgaWYgKG1hdGNoPy5bMV0pIHtcbiAgICByZXR1cm4gbWF0Y2hbMV1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUGxhdGZvcm1Xcml0ZShwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICBjb25zdCBkZXZpY2VJZCA9IHJlc29sdmVXcml0ZURldmljZUlkKHBheWxvYWQpXG4gIGNvbnN0IGRhdGEgPSBwYXlsb2FkLmRhdGFcbiAgaWYgKCFkZXZpY2VJZCB8fCBkYXRhID09PSB1bmRlZmluZWQpIHJldHVyblxuXG4gIHRyeSB7XG4gICAgY29uc3QgdmFsdWUgPSB0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycgPyBkYXRhIDogSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICBhd2FpdCB0ZWxlbWV0cnlEYXRhUHViKHsgZGV2aWNlX2lkOiBkZXZpY2VJZCwgdmFsdWUgfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbQXBwRnJhbWVdIEZhaWxlZCB0byBwdWJsaXNoIHBsYXRmb3JtIHdyaXRlOicsIGVycm9yKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUhvc3RTYXZlKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gIGNvbnN0IGNvbmZpZyA9IHBheWxvYWQuY29uZmlnICYmIHR5cGVvZiBwYXlsb2FkLmNvbmZpZyA9PT0gJ29iamVjdCcgPyBwYXlsb2FkLmNvbmZpZyA6IHBheWxvYWRcbiAgY29uc3QgbWV0YSA9IChjb25maWcubWV0YSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCkgfHwge31cbiAgY29uc3QgY2FudmFzID0gY29uZmlnLmNhbnZhc1xuICBjb25zdCB1cGRhdGVQYXlsb2FkOiBVcGRhdGVEYXNoYm9hcmREYXRhID0ge31cblxuICBpZiAodHlwZW9mIG1ldGEubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICB1cGRhdGVQYXlsb2FkLm5hbWUgPSBtZXRhLm5hbWVcbiAgfVxuICBpZiAoY2FudmFzICYmIHR5cGVvZiBjYW52YXMgPT09ICdvYmplY3QnKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZENhbnZhcyA9IHsgLi4uKGNhbnZhcyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgfVxuICAgIG5vcm1hbGl6ZWRDYW52YXMuYmFja2dyb3VuZCA9IG5vcm1hbGl6ZUNhbnZhc0JhY2tncm91bmQobm9ybWFsaXplZENhbnZhcy5iYWNrZ3JvdW5kKVxuICAgIHVwZGF0ZVBheWxvYWQuY2FudmFzQ29uZmlnID0gbm9ybWFsaXplZENhbnZhc1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGNvbmZpZy5ub2RlcykpIHtcbiAgICB1cGRhdGVQYXlsb2FkLm5vZGVzID0gY29uZmlnLm5vZGVzXG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoY29uZmlnLmRhdGFTb3VyY2VzKSkge1xuICAgIHVwZGF0ZVBheWxvYWQuZGF0YVNvdXJjZXMgPSBjb25maWcuZGF0YVNvdXJjZXNcbiAgfVxuICBpZiAoY29uZmlnLnZhcmlhYmxlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdXBkYXRlUGF5bG9hZC52YXJpYWJsZXMgPSBjb25maWcudmFyaWFibGVzIGFzIHVua25vd25bXVxuICB9XG5cbiAgY29uc3QgdGh1bWJuYWlsID1cbiAgICB0eXBlb2YgbWV0YS50aHVtYm5haWwgPT09ICdzdHJpbmcnXG4gICAgICA/IG1ldGEudGh1bWJuYWlsXG4gICAgICA6IHR5cGVvZiBwYXlsb2FkLnRodW1ibmFpbCA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBwYXlsb2FkLnRodW1ibmFpbFxuICAgICAgICA6IHVuZGVmaW5lZFxuXG4gIGlmICh0aHVtYm5haWwgIT09IHVuZGVmaW5lZCkge1xuICAgIHVwZGF0ZVBheWxvYWQudGh1bWJuYWlsID0gdGh1bWJuYWlsXG4gIH1cblxuICBsZXQgcmVzdWx0ID0gYXdhaXQgdXBkYXRlVGhpbmdzVmlzRGFzaGJvYXJkKHByb3BzLmlkLCB1cGRhdGVQYXlsb2FkKVxuXG4gIGlmIChyZXN1bHQuZXJyb3I/LnN0YXR1cyA9PT0gNDAxIHx8IHJlc3VsdC5lcnJvcj8uc3RhdHVzID09PSA0MDQpIHtcbiAgICBjbGVhclRoaW5nc1Zpc1Rva2VuKClcbiAgICByZXN1bHQgPSBhd2FpdCB1cGRhdGVUaGluZ3NWaXNEYXNoYm9hcmQocHJvcHMuaWQsIHVwZGF0ZVBheWxvYWQpXG4gIH1cblxuICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignW0FwcEZyYW1lXSBGYWlsZWQgdG8gc2F2ZSBkYXNoYm9hcmQgdmlhIGhvc3QgYnJpZGdlOicsIHJlc3VsdC5lcnJvcilcbiAgICBpZiAoKHdpbmRvdyBhcyBhbnkpLiRtZXNzYWdlKSB7XG4gICAgICA7KHdpbmRvdyBhcyBhbnkpLiRtZXNzYWdlLmVycm9yKCfkv53lrZjlpLHotKUnKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICgod2luZG93IGFzIGFueSkuJG1lc3NhZ2UpIHtcbiAgICA7KHdpbmRvdyBhcyBhbnkpLiRtZXNzYWdlLnN1Y2Nlc3MoJ+S/neWtmOaIkOWKnycpXG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRQbGF0Zm9ybURldmljZXMoKTogUHJvbWlzZTx7XG4gIGRldmljZXM6IFBsYXRmb3JtRGV2aWNlRW50cnlbXVxuICBkZWJ1ZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbn0+IHtcbiAgaWYgKHBsYXRmb3JtRGV2aWNlc0NhY2hlKSB7XG4gICAgcmV0dXJuIHsgZGV2aWNlczogcGxhdGZvcm1EZXZpY2VzQ2FjaGUsIGRlYnVnOiB7IGNhY2hlZDogdHJ1ZSwgYXNzZW1ibGVkQ291bnQ6IHBsYXRmb3JtRGV2aWNlc0NhY2hlLmxlbmd0aCB9IH1cbiAgfVxuXG4gIGlmIChwbGF0Zm9ybURldmljZXNDYWNoZVByb21pc2UpIHtcbiAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgcGxhdGZvcm1EZXZpY2VzQ2FjaGVQcm9taXNlXG4gICAgcmV0dXJuIHsgZGV2aWNlcywgZGVidWc6IHsgY2FjaGVkOiB0cnVlLCBhc3NlbWJsZWRDb3VudDogZGV2aWNlcy5sZW5ndGggfSB9XG4gIH1cblxuICBwbGF0Zm9ybURldmljZXNDYWNoZVByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBbZGV2UmVzLCBjb25mUmVzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgZGV2aWNlTGlzdCh7IHBhZ2U6IDEsIHBhZ2Vfc2l6ZTogMTAwMCB9KSxcbiAgICAgICAgZ2V0RGV2aWNlQ29uZmlnTGlzdCh7IHBhZ2U6IDEsIHBhZ2Vfc2l6ZTogMTAwMCB9KVxuICAgICAgXSlcblxuICAgICAgY29uc3QgZGV2aWNlcyA9IHVud3JhcExpc3QoZGV2UmVzPy5kYXRhKVxuICAgICAgY29uc3QgY29uZmlncyA9IHVud3JhcExpc3QoY29uZlJlcz8uZGF0YSlcblxuICAgICAgLy8gQnVpbGQgY29uZmlnIOKGkiB0ZW1wbGF0ZSBtYXAgKG9ubHkgY29uZmlncyB0aGF0IGFjdHVhbGx5IGhhdmUgYSB0ZW1wbGF0ZSlcbiAgICAgIGNvbnN0IGNvbmZpZ1RlbXBsYXRlTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuICAgICAgZm9yIChjb25zdCBjb25maWcgb2YgY29uZmlncykge1xuICAgICAgICBpZiAoY29uZmlnLmlkICYmIGNvbmZpZy5kZXZpY2VfdGVtcGxhdGVfaWQpIHtcbiAgICAgICAgICBjb25maWdUZW1wbGF0ZU1hcC5zZXQoU3RyaW5nKGNvbmZpZy5pZCksIFN0cmluZyhjb25maWcuZGV2aWNlX3RlbXBsYXRlX2lkKSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gQ29sbGVjdCB0ZW1wbGF0ZSBJRHMgZnJvbSBjb25maWdzIGRpcmVjdGx5IChtb3JlIHJlbGlhYmxlIHRoYW4gZ29pbmcgdGhyb3VnaFxuICAgICAgLy8gZGV2aWNlcywgd2hpY2ggbWF5IG5vdCBoYXZlIGRldmljZV9jb25maWdfaWQgcG9wdWxhdGVkIGluIGV2ZXJ5IGxpc3QgcmVzcG9uc2UpXG4gICAgICBjb25zdCB0ZW1wbGF0ZUlkU2V0ID0gbmV3IFNldDxzdHJpbmc+KClcbiAgICAgIGZvciAoY29uc3QgY29uZmlnIG9mIGNvbmZpZ3MpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5kZXZpY2VfdGVtcGxhdGVfaWQpIHRlbXBsYXRlSWRTZXQuYWRkKFN0cmluZyhjb25maWcuZGV2aWNlX3RlbXBsYXRlX2lkKSlcbiAgICAgIH1cbiAgICAgIC8vIEFsc28gcGljayB1cCBhbnkgdGVtcGxhdGUgSURzIGVtYmVkZGVkIGRpcmVjdGx5IG9uIGRldmljZSBvYmplY3RzIChzb21lIEFQSSB2ZXJzaW9uc1xuICAgICAgLy8gcmV0dXJuIHRoZSBmdWxsIGRldmljZV9jb25maWcgb2JqZWN0IGluc2lkZSB0aGUgbGlzdCBpdGVtKVxuICAgICAgZm9yIChjb25zdCBkZXZpY2Ugb2YgZGV2aWNlcykge1xuICAgICAgICBjb25zdCB0aWQgPSBkZXZpY2U/LmRldmljZV9jb25maWc/LmRldmljZV90ZW1wbGF0ZV9pZFxuICAgICAgICBpZiAodGlkKSB0ZW1wbGF0ZUlkU2V0LmFkZChTdHJpbmcodGlkKSlcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcGxhdGVJZHMgPSBBcnJheS5mcm9tKHRlbXBsYXRlSWRTZXQpXG5cbiAgICAgIGlmICh0ZW1wbGF0ZUlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcGxhdGZvcm1EZXZpY2VzQ2FjaGUgPSBbXVxuICAgICAgICByZXR1cm4gW11cbiAgICAgIH1cblxuICAgICAgY29uc3QgcGxhdGZvcm1EZXZpY2VzID0gZGV2aWNlc1xuICAgICAgICAubWFwKChkZXZpY2U6IGFueSk6IFBsYXRmb3JtRGV2aWNlRW50cnkgfCBudWxsID0+IHtcbiAgICAgICAgICAvLyBQcmVmZXIgZW1iZWRkZWQgZGV2aWNlX2NvbmZpZyAoZGV2aWNlLWRldGFpbCBzdHlsZSByZXNwb25zZSksIG90aGVyd2lzZSBsb29rIHVwIHZpYSBjb25maWdUZW1wbGF0ZU1hcFxuICAgICAgICAgIGNvbnN0IHRlbXBsYXRlSWQgPVxuICAgICAgICAgICAgKGRldmljZT8uZGV2aWNlX2NvbmZpZz8uZGV2aWNlX3RlbXBsYXRlX2lkID8gU3RyaW5nKGRldmljZS5kZXZpY2VfY29uZmlnLmRldmljZV90ZW1wbGF0ZV9pZCkgOiBudWxsKSB8fFxuICAgICAgICAgICAgKGRldmljZT8uZGV2aWNlX2NvbmZpZ19pZCA/IGNvbmZpZ1RlbXBsYXRlTWFwLmdldChTdHJpbmcoZGV2aWNlLmRldmljZV9jb25maWdfaWQpKSA6IG51bGwpXG5cbiAgICAgICAgICBpZiAoIXRlbXBsYXRlSWQgfHwgIWRldmljZT8uaWQpIHJldHVybiBudWxsXG5cbiAgICAgICAgICBjb25zdCBncm91cE5hbWUgPSBTdHJpbmcoZGV2aWNlPy5kZXZpY2VfY29uZmlnPy5uYW1lIHx8IGRldmljZT8uZGV2aWNlX2NvbmZpZ19uYW1lIHx8ICcnKS50cmltKCkgfHwgJ+iuvuWkh+Wtl+autSdcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZXZpY2VJZDogU3RyaW5nKGRldmljZS5pZCksXG4gICAgICAgICAgICBkZXZpY2VOYW1lOiBTdHJpbmcoZGV2aWNlLm5hbWUgfHwgZGV2aWNlLmRldmljZV9udW1iZXIgfHwgZGV2aWNlLmlkKSxcbiAgICAgICAgICAgIGdyb3VwTmFtZSxcbiAgICAgICAgICAgIHRlbXBsYXRlSWQsXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICAgICAgcHJlc2V0czogW11cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBsYXRmb3JtRGV2aWNlRW50cnkgPT4gQm9vbGVhbihpdGVtKSlcblxuICAgICAgcGxhdGZvcm1EZXZpY2VzQ2FjaGUgPSBwbGF0Zm9ybURldmljZXNcbiAgICAgIHJldHVybiBwbGF0Zm9ybURldmljZXNcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tBcHBGcmFtZV0gRmFpbGVkIHRvIGFzc2VtYmxlIHBsYXRmb3JtRGV2aWNlcycsIGVycilcbiAgICAgIHBsYXRmb3JtRGV2aWNlc0NhY2hlID0gW11cbiAgICAgIHJldHVybiBbXVxuICAgIH0gZmluYWxseSB7XG4gICAgICBwbGF0Zm9ybURldmljZXNDYWNoZVByb21pc2UgPSBudWxsXG4gICAgfVxuICB9KSgpXG5cbiAgY29uc3QgZGV2aWNlcyA9IGF3YWl0IHBsYXRmb3JtRGV2aWNlc0NhY2hlUHJvbWlzZVxuICByZXR1cm4geyBkZXZpY2VzLCBkZWJ1ZzogeyBhc3NlbWJsZWRDb3VudDogZGV2aWNlcy5sZW5ndGggfSB9XG59XG5cbi8qKiBGdWxsIGluaXQgc2VxdWVuY2UgdHJpZ2dlcmVkIG9uY2UgcGVyIHR2OnJlYWR5IChkZWJvdW5jZWQpLiAqL1xuYXN5bmMgZnVuY3Rpb24gZG9Jbml0KCkge1xuICBpZiAoIWlmcmFtZVJlZi52YWx1ZT8uY29udGVudFdpbmRvdyB8fCAhdG9rZW4udmFsdWUpIHJldHVyblxuXG4gIGNvbnN0IGFwaUJhc2VVcmwgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgJy90aGluZ3N2aXMtYXBpJ1xuXG4gIGxldCBkYXNoYm9hcmRQYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHsgbWV0YTogeyBpZDogcHJvcHMuaWQgfSB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBkYXNoYm9hcmREYXRhID0gcHJvcHMuc2NoZW1hXG4gICAgICA/IHtcbiAgICAgICAgICBpZDogcHJvcHMuc2NoZW1hLmlkIHx8IHByb3BzLmlkLFxuICAgICAgICAgIG5hbWU6IHByb3BzLnNjaGVtYS5uYW1lLFxuICAgICAgICAgIHRodW1ibmFpbDogcHJvcHMuc2NoZW1hLnRodW1ibmFpbCA/PyBudWxsLFxuICAgICAgICAgIGNhbnZhc0NvbmZpZzogcHJvcHMuc2NoZW1hLmNhbnZhc0NvbmZpZyxcbiAgICAgICAgICBub2RlczogcHJvcHMuc2NoZW1hLm5vZGVzLFxuICAgICAgICAgIGRhdGFTb3VyY2VzOiBwcm9wcy5zY2hlbWEuZGF0YVNvdXJjZXNcbiAgICAgICAgfVxuICAgICAgOiBudWxsXG4gICAgY29uc3QgZmV0Y2hlZCA9IGRhc2hib2FyZERhdGEgPyB7IGRhdGE6IGRhc2hib2FyZERhdGEsIGVycm9yOiBudWxsIH0gOiBhd2FpdCBnZXRUaGluZ3NWaXNEYXNoYm9hcmQocHJvcHMuaWQpXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gZmV0Y2hlZFxuICAgIGlmICghZXJyb3IgJiYgZGF0YSkge1xuICAgICAgZGFzaGJvYXJkUGF5bG9hZCA9IHtcbiAgICAgICAgbWV0YToge1xuICAgICAgICAgIGlkOiBkYXRhLmlkLFxuICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICB0aHVtYm5haWw6IGRhdGEudGh1bWJuYWlsXG4gICAgICAgIH0sXG4gICAgICAgIGNhbnZhczogZGF0YS5jYW52YXNDb25maWcsXG4gICAgICAgIG5vZGVzOiBBcnJheS5pc0FycmF5KGRhdGEubm9kZXMpID8gZGF0YS5ub2RlcyA6IFtdLFxuICAgICAgICBkYXRhU291cmNlczogQXJyYXkuaXNBcnJheShkYXRhLmRhdGFTb3VyY2VzKSA/IGRhdGEuZGF0YVNvdXJjZXMgOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tBcHBGcmFtZV0gRmFpbGVkIHRvIHByZWxvYWQgZGFzaGJvYXJkIHNjaGVtYSBmb3IgZW1iZWQgaW5pdDonLCBwcm9wcy5pZCwgZXJyb3IpXG4gIH1cblxuICBjb25zdCB2aWV3ZXJEZXZpY2VEZXNjcmlwdG9ycyA9XG4gICAgcHJvcHMubW9kZSA9PT0gJ3ZpZXdlcidcbiAgICAgID8gY29sbGVjdFBsYXRmb3JtU291cmNlRGVzY3JpcHRvcnMoZGFzaGJvYXJkUGF5bG9hZCkuZmlsdGVyKFxuICAgICAgICAgIGRlc2NyaXB0b3IgPT4gZGVzY3JpcHRvci5kZXZpY2VJZCAmJiBkZXNjcmlwdG9yLnJlcXVlc3RlZEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgIClcbiAgICAgIDogW11cbiAgY29uc3QgcmVxdWlyZWRWaWV3ZXJEZXZpY2VJZHMgPSBuZXcgU2V0KFxuICAgIHZpZXdlckRldmljZURlc2NyaXB0b3JzXG4gICAgICAubWFwKGRlc2NyaXB0b3IgPT4gZGVzY3JpcHRvci5kZXZpY2VJZClcbiAgICAgIC5maWx0ZXIoKGRldmljZUlkKTogZGV2aWNlSWQgaXMgc3RyaW5nID0+IHR5cGVvZiBkZXZpY2VJZCA9PT0gJ3N0cmluZycgJiYgZGV2aWNlSWQubGVuZ3RoID4gMClcbiAgKVxuICBjb25zdCBzaG91bGRCdWlsZFBsYXRmb3JtRGV2aWNlcyA9XG4gICAgcHJvcHMubW9kZSAhPT0gJ3ZpZXdlcicgfHwgcmVxdWlyZWRWaWV3ZXJEZXZpY2VJZHMuc2l6ZSA+IDBcbiAgY29uc3QgeyBkZXZpY2VzOiBsb2FkZWRQbGF0Zm9ybURldmljZXMgfSA9IHNob3VsZEJ1aWxkUGxhdGZvcm1EZXZpY2VzXG4gICAgPyBhd2FpdCBidWlsZFBsYXRmb3JtRGV2aWNlcygpXG4gICAgOiB7IGRldmljZXM6IFtdIH1cbiAgY29uc3QgcGxhdGZvcm1EZXZpY2VzID0gbG9hZGVkUGxhdGZvcm1EZXZpY2VzXG4gIGNvbnN0IHBsYXRmb3JtQnVmZmVyU2l6ZSA9IE1hdGgubWF4KFxuICAgIERFRkFVTFRfUExBVEZPUk1fQlVGRkVSX1NJWkUsXG4gICAgcmVzb2x2ZVBsYXRmb3JtQnVmZmVyU2l6ZShkYXNoYm9hcmRQYXlsb2FkLmRhdGFTb3VyY2VzKVxuICApXG5cbiAgaWYgKHByb3BzLm1vZGUgPT09ICd2aWV3ZXInKSB7XG4gICAgdmlld2VySHlkcmF0aW9uQ29tcGxldGVkID0gZmFsc2VcbiAgICB2aWV3ZXJIeWRyYXRpb25JbkZsaWdodCA9IGZhbHNlXG4gICAgY2xlYXJWaWV3ZXJIeWRyYXRpb25UaW1lcnMoKVxuICAgIGRpc2Nvbm5lY3RBbGxEZXZpY2VXcygpXG4gIH1cblxuICBhY3RpdmVQbGF0Zm9ybURldmljZXMuY2xlYXIoKVxuICBmb3IgKGNvbnN0IGRldmljZSBvZiBwbGF0Zm9ybURldmljZXMpIHtcbiAgICBpZiAoZGV2aWNlPy5kZXZpY2VJZCkge1xuICAgICAgYWN0aXZlUGxhdGZvcm1EZXZpY2VzLnNldChkZXZpY2UuZGV2aWNlSWQsIHtcbiAgICAgICAgZGV2aWNlSWQ6IGRldmljZS5kZXZpY2VJZCxcbiAgICAgICAgZmllbGRzOiBBcnJheS5pc0FycmF5KGRldmljZS5maWVsZHMpID8gZGV2aWNlLmZpZWxkcyA6IFtdXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIEpTT04gcm91bmQtdHJpcCBzdHJpcHMgVnVlIHJlYWN0aXZlIFByb3h5IHdyYXBwZXJzIChmcm9tIHNjaGVtYSBwcm9wKSBzb1xuICAvLyBwb3N0TWVzc2FnZSdzIHN0cnVjdHVyZWQtY2xvbmUgYWxnb3JpdGhtIGNhbiBzZXJpYWxpemUgdGhlIHBheWxvYWQuXG4gIGNvbnN0IGluaXRNZXNzYWdlID0gSlNPTi5wYXJzZShcbiAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICB0eXBlOiAndHY6aW5pdCcsXG4gICAgICBwYXlsb2FkOiB7XG4gICAgICAgIHBsYXRmb3JtRmllbGRzOiBnZXRDdXJyZW50R2xvYmFsUGxhdGZvcm1GaWVsZHMoKSxcbiAgICAgICAgcGxhdGZvcm1CdWZmZXJTaXplLFxuICAgICAgICBwbGF0Zm9ybUZpZWxkU2NvcGU6IGdldEN1cnJlbnRQbGF0Zm9ybUZpZWxkU2NvcGUoKSxcbiAgICAgICAgcGxhdGZvcm1EZXZpY2VzLFxuICAgICAgICBkYXRhOiBkYXNoYm9hcmRQYXlsb2FkLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBtb2RlOiAnYXBwJyxcbiAgICAgICAgICBzYXZlVGFyZ2V0OiAnaG9zdCcsXG4gICAgICAgICAgdG9rZW46IHRva2VuLnZhbHVlLFxuICAgICAgICAgIGFwaUJhc2VVcmxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIClcbiAgaWZyYW1lUmVmLnZhbHVlLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoaW5pdE1lc3NhZ2UsIGdldFRoaW5nc1Zpc1RhcmdldE9yaWdpbigpKVxuXG4gIC8vIE1hcmsgaW5pdCBhcyBzdWNjZWVkZWQgYW5kIGNhbmNlbCByZW1haW5pbmcgcmV0cnkgdGltZXJzIChGSVgtSDEpXG4gIGluaXRTdWNjZWVkZWQgPSB0cnVlXG4gIGNsZWFySW5pdFJldHJ5VGltZXJzKClcbiAgaWYgKHBlbmRpbmdJbml0RGVib3VuY2VUaW1lcikge1xuICAgIGNsZWFyVGltZW91dChwZW5kaW5nSW5pdERlYm91bmNlVGltZXIpXG4gICAgcGVuZGluZ0luaXREZWJvdW5jZVRpbWVyID0gbnVsbFxuICB9XG5cbiAgaWYgKHByb3BzLm1vZGUgIT09ICd2aWV3ZXInKSB7XG4gICAgZGlzY29ubmVjdEFsbERldmljZVdzKClcbiAgfVxufVxuXG5mdW5jdGlvbiBzY2hlZHVsZUluaXQoKSB7XG4gIGlmICghaWZyYW1lUmVmLnZhbHVlPy5jb250ZW50V2luZG93IHx8ICF0b2tlbi52YWx1ZSkgcmV0dXJuXG5cbiAgLy8gUmVzZXQgc3VjY2VzcyBmbGFnIHNvIHJldHJ5IHRpbWVycyBjYW4gZmlyZSBmb3IgdGhpcyBuZXcgc2NoZWR1bGUgY3ljbGVcbiAgaW5pdFN1Y2NlZWRlZCA9IGZhbHNlXG5cbiAgaWYgKHBlbmRpbmdJbml0RGVib3VuY2VUaW1lcikgY2xlYXJUaW1lb3V0KHBlbmRpbmdJbml0RGVib3VuY2VUaW1lcilcbiAgY2xlYXJJbml0UmV0cnlUaW1lcnMoKVxuXG4gIGNvbnN0IHJ1bkluaXQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKGluaXRJblByb2dyZXNzIHx8IGluaXRTdWNjZWVkZWQpIHJldHVyblxuICAgIGluaXRJblByb2dyZXNzID0gdHJ1ZVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBkb0luaXQoKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBpbml0SW5Qcm9ncmVzcyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcGVuZGluZ0luaXREZWJvdW5jZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgcGVuZGluZ0luaXREZWJvdW5jZVRpbWVyID0gbnVsbFxuICAgIHZvaWQgcnVuSW5pdCgpXG4gIH0sIDE1MClcbiAgO1s2MDAsIDE1MDAsIDMwMDBdLmZvckVhY2goZGVsYXkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB2b2lkIHJ1bkluaXQoKVxuICAgIH0sIGRlbGF5KVxuICAgIGluaXRSZXRyeVRpbWVycy5wdXNoKHRpbWVyKVxuICB9KVxufVxuXG5mdW5jdGlvbiBoYW5kbGVJZnJhbWVMb2FkKCkge1xuICBzY2hlZHVsZUluaXQoKVxufVxuXG5jb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgaWYgKCFldmVudC5kYXRhIHx8IHR5cGVvZiBldmVudC5kYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuXG4gIGlmIChldmVudC5vcmlnaW4gIT09IGdldFRoaW5nc1Zpc1RhcmdldE9yaWdpbigpKSByZXR1cm5cblxuICBjb25zdCB7IHR5cGUsIHByb2plY3RJZCB9ID0gZXZlbnQuZGF0YVxuICBjb25zdCBwYXlsb2FkID0gZXZlbnQuZGF0YT8ucGF5bG9hZCAmJiB0eXBlb2YgZXZlbnQuZGF0YS5wYXlsb2FkID09PSAnb2JqZWN0JyA/IGV2ZW50LmRhdGEucGF5bG9hZCA6IHt9XG5cbiAgaWYgKHR5cGUgPT09ICd0djpzYXZlJykge1xuICAgIGF3YWl0IGhhbmRsZUhvc3RTYXZlKHBheWxvYWQpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAodHlwZSA9PT0gJ3R2OnBsYXRmb3JtLXdyaXRlJykge1xuICAgIGF3YWl0IGhhbmRsZVBsYXRmb3JtV3JpdGUocGF5bG9hZClcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0eXBlID09PSAndGhpbmdzdmlzOnJlcXVlc3RGaWVsZERhdGEnKSB7XG4gICAgaWYgKCFpZnJhbWVSZWYudmFsdWU/LmNvbnRlbnRXaW5kb3cpIHJldHVyblxuXG4gICAgdHJ5IHtcbiAgICAgIGVuc3VyZURldmljZVdzKChwYXlsb2FkIGFzIGFueSkuZGV2aWNlSWQpXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBidWlsZFJlcXVlc3RlZEZpZWxkRGF0YSgocGF5bG9hZCBhcyBhbnkpLmZpZWxkSWRzLCAocGF5bG9hZCBhcyBhbnkpLmRldmljZUlkKVxuICAgICAgcG9zdFBsYXRmb3JtRGF0YShyZXN1bHQuZmllbGRzLCAocGF5bG9hZCBhcyBhbnkpLmRldmljZUlkKVxuICAgICAgcmVzdWx0Lmhpc3Rvcmllcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBwb3N0UGxhdGZvcm1IaXN0b3J5KGl0ZW0uZmllbGRJZCwgaXRlbS5oaXN0b3J5LCBpdGVtLmRldmljZUlkKVxuICAgICAgfSlcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEJlc3QgZWZmb3J0IG9ubHk6IGlnbm9yZSB0cmFuc2llbnQgZmllbGQtcmVxdWVzdCBmYWlsdXJlcyB0byBhdm9pZCBjb25zb2xlIG5vaXNlLlxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0eXBlID09PSAnTE9BREVEJykge1xuICAgIGlmIChwcm9wcy5tb2RlID09PSAndmlld2VyJykge1xuICAgICAgc2NoZWR1bGVWaWV3ZXJIeWRyYXRpb24oKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0eXBlID09PSAndGhpbmdzdmlzOnJlcXVlc3REZXZpY2VGaWVsZHMnKSB7XG4gICAgY29uc3QgZGV2aWNlSWQgPSB0eXBlb2YgKHBheWxvYWQgYXMgYW55KS5kZXZpY2VJZCA9PT0gJ3N0cmluZycgPyAocGF5bG9hZCBhcyBhbnkpLmRldmljZUlkIDogdW5kZWZpbmVkXG4gICAgY29uc3QgdGVtcGxhdGVJZCA9IHR5cGVvZiAocGF5bG9hZCBhcyBhbnkpLnRlbXBsYXRlSWQgPT09ICdzdHJpbmcnID8gKHBheWxvYWQgYXMgYW55KS50ZW1wbGF0ZUlkIDogdW5kZWZpbmVkXG4gICAgaWYgKCFpZnJhbWVSZWYudmFsdWU/LmNvbnRlbnRXaW5kb3cgfHwgIWRldmljZUlkIHx8ICF0ZW1wbGF0ZUlkKSByZXR1cm5cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGF3YWl0IGxvYWRUZW1wbGF0ZUVudHJ5KHRlbXBsYXRlSWQpXG4gICAgICBwb3N0VG9UaGluZ3NWaXMoJ3R2OmRldmljZS1maWVsZHMnLCB7XG4gICAgICAgIGRldmljZUlkLFxuICAgICAgICB0ZW1wbGF0ZUlkLFxuICAgICAgICBmaWVsZHM6IEFycmF5LmlzQXJyYXkoZW50cnkuZmllbGRzKSA/IGVudHJ5LmZpZWxkcyA6IFtdXG4gICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tBcHBGcmFtZV0gRmFpbGVkIHRvIGxvYWQgcmVxdWVzdGVkIGRldmljZSBmaWVsZHM6JywgZGV2aWNlSWQsIHRlbXBsYXRlSWQsIGVycm9yKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0eXBlID09PSAndHY6cmVhZHknIHx8IHR5cGUgPT09ICdSRUFEWScpIHtcbiAgICBpZiAoIWluaXRTdWNjZWVkZWQpIHtcbiAgICAgIHNjaGVkdWxlSW5pdCgpXG4gICAgfVxuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKHR5cGUgPT09ICd0djpwcmV2aWV3Jykge1xuICAgIGNvbnN0IHRhcmdldCA9IHJvdXRlci5yZXNvbHZlKHtcbiAgICAgIHBhdGg6ICcvdmlzdWFsaXphdGlvbi90aGluZ3N2aXMtcHJldmlldycsXG4gICAgICBxdWVyeTogeyBpZDogcHJvamVjdElkIHx8IHByb3BzLmlkIH1cbiAgICB9KVxuICAgIHdpbmRvdy5vcGVuKHRhcmdldC5ocmVmLCAnX2JsYW5rJylcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0eXBlID09PSAndHY6cHVibGlzaCcpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBwdWJsaXNoVGhpbmdzVmlzRGFzaGJvYXJkIH0gPSBhd2FpdCBpbXBvcnQoJ0Avc2VydmljZS9hcGkvdGhpbmdzdmlzJylcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHB1Ymxpc2hUaGluZ3NWaXNEYXNoYm9hcmQocHJvamVjdElkIHx8IHByb3BzLmlkKVxuXG4gICAgICBpZiAocmVzLmRhdGEpIHtcbiAgICAgICAgaWYgKCh3aW5kb3cgYXMgYW55KS4kbWVzc2FnZSkge1xuICAgICAgICAgIDsod2luZG93IGFzIGFueSkuJG1lc3NhZ2Uuc3VjY2Vzcygn5Y+R5biD5oiQ5YqfJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhbGVydCgn5Y+R5biD5oiQ5YqfJylcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW0FwcEZyYW1lXSBQdWJsaXNoIGZhaWxlZDonLCByZXMuZXJyb3IpXG4gICAgICAgIGlmICgod2luZG93IGFzIGFueSkuJG1lc3NhZ2UpIHtcbiAgICAgICAgICA7KHdpbmRvdyBhcyBhbnkpLiRtZXNzYWdlLmVycm9yKGDlj5HluIPlpLHotKU6ICR7cmVzLmVycm9yPy5tZXNzYWdlIHx8ICfmnKrnn6XplJnor68nfWApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbQXBwRnJhbWVdIFB1Ymxpc2ggZXhjZXB0aW9uOicsIGUpXG4gICAgfVxuICB9XG59XG5cbm9uTW91bnRlZChhc3luYyAoKSA9PiB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlTWVzc2FnZSlcblxuICB0cnkge1xuICAgIGNsZWFyVGhpbmdzVmlzVG9rZW4oKVxuICAgIGNvbnN0IHRva2VuU3RyID0gYXdhaXQgZ2V0VGhpbmdzVmlzVG9rZW4oKVxuICAgIGlmICh0b2tlblN0cikge1xuICAgICAgdG9rZW4udmFsdWUgPSB0b2tlblN0clxuICAgICAgdXJsLnZhbHVlID0gYnVpbGRUaGluZ3NWaXNGcmFtZVVybCh0b2tlblN0cilcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdbQXBwRnJhbWVdIFRva2VuIGFjcXVpc2l0aW9uIHJldHVybmVkIG51bGwnKVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbQXBwRnJhbWVdIEZhaWxlZCB0byBhY3F1aXJlIFRoaW5nc1ZpcyB0b2tlbjonLCBlcnJvcilcbiAgfVxufSlcblxub25CZWZvcmVVbm1vdW50KCgpID0+IHtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kbGVNZXNzYWdlKVxuICBpZiAocGVuZGluZ0luaXREZWJvdW5jZVRpbWVyKSBjbGVhclRpbWVvdXQocGVuZGluZ0luaXREZWJvdW5jZVRpbWVyKVxuICBjbGVhckluaXRSZXRyeVRpbWVycygpXG4gIGNsZWFyVmlld2VySHlkcmF0aW9uVGltZXJzKClcbiAgdmlld2VySHlkcmF0aW9uQ29tcGxldGVkID0gZmFsc2VcbiAgdmlld2VySHlkcmF0aW9uSW5GbGlnaHQgPSBmYWxzZVxuICBpbml0U3VjY2VlZGVkID0gZmFsc2VcbiAgYWN0aXZlUGxhdGZvcm1EZXZpY2VzLmNsZWFyKClcbiAgcGxhdGZvcm1EZXZpY2VzQ2FjaGUgPSBudWxsXG4gIHBsYXRmb3JtRGV2aWNlc0NhY2hlUHJvbWlzZSA9IG51bGxcbiAgdmlld2VyRGFzaGJvYXJkQ29uZmlnQ2FjaGUgPSBudWxsXG4gIHZpZXdlckRhc2hib2FyZENvbmZpZ0NhY2hlSWQgPSBudWxsXG4gIHZpZXdlckRhc2hib2FyZENvbmZpZ1Byb21pc2UgPSBudWxsXG4gIHRlbXBsYXRlRW50cnlDYWNoZS5jbGVhcigpXG4gIGRpc2Nvbm5lY3RBbGxEZXZpY2VXcygpXG59KVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBzY29wZWQ+XG4udGhpbmdzdmlzLWZyYW1lLWNvbnRhaW5lciB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLnRoaW5nc3Zpcy1mcmFtZSB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIGRpc3BsYXk6IGJsb2NrO1xufVxuXG4ubG9hZGluZy1wbGFjZWhvbGRlciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBoZWlnaHQ6IDEwMCU7XG4gIGNvbG9yOiAjODg4O1xufVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiRjovY29kaW5nL3RoaW5nc3BhbmVsLWZyb250ZW5kLWNvbW11bml0eS9zcmMvY29tcG9uZW50cy90aGluZ3N2aXMvVGhpbmdzVmlzQXBwRnJhbWUudnVlIn0=