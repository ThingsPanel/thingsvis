import type { Props } from './schema';

export type EzopenSource = {
  serial: string;

  channel: number;

  hd: boolean;
};

export type PlaybackOptions = {
  mode: Props['playbackMode'];
  begin: string;
  end?: string;

  spaceId?: string;

  busType?: string;
};

export function parseEzopenSource(url: string): EzopenSource | null {
  const trimmed = url.trim();

  const match = /ezopen:\/\/open\.ys7\.com\/([^/]+)\/(\d+)(?:\.hd)?\./i.exec(trimmed);

  if (!match?.[1]) return null;

  return {
    serial: match[1],

    channel: Number(match[2] || 1) || 1,

    hd: /\.hd\./i.test(trimmed),
  };
}

export function parseCloudRecQuery(url: string): Partial<PlaybackOptions> {
  const trimmed = url.trim();

  if (!trimmed.includes('?')) return {};

  const query = trimmed.split('?').slice(1).join('?');

  const params = new URLSearchParams(query);

  return {
    begin: params.get('begin') || undefined,

    end: params.get('end') || undefined,

    spaceId: params.get('spaceId') || undefined,

    busType: params.get('busType') || undefined,
  };
}

export function getDefaultRecEndTimestamp(begin: string): string {
  if (!/^\d{14}$/.test(begin)) return '';

  const hour = Number(begin.slice(8, 10));

  const nextHour = (hour + 1) % 24;

  return `${begin.slice(0, 8)}${String(nextHour).padStart(2, '0')}${begin.slice(10)}`;
}

export function resolveSpaceId(props: Props): string {
  const direct = props.spaceId.trim();

  if (direct) return direct;

  const fromHint = parseCloudRecQuery(props.playbackParamsUrl.trim()).spaceId?.trim();

  if (fromHint) return fromHint;

  return parseCloudRecQuery(props.ezopenUrl.trim()).spaceId?.trim() || '';
}

export function resolvePlaybackParams(props: Props, beginOverride?: string): PlaybackOptions {
  const hint = props.playbackParamsUrl.trim() || props.ezopenUrl.trim();

  const parsed = parseCloudRecQuery(hint);

  const begin = beginOverride || parsed.begin || getTodayBeginTimestamp();

  const spaceId = props.playbackMode === 'cloud' ? resolveSpaceId(props) : '';
  const busType =
    props.playbackMode === 'cloud'
      ? props.busType.trim() || parsed.busType || (spaceId ? '7' : '')
      : '';
  const end =
    props.playbackEnd.trim() ||
    parsed.end ||
    (props.playbackMode === 'cloud' && spaceId ? getDefaultRecEndTimestamp(begin) : '');

  return {
    mode: props.playbackMode,
    begin,
    end: end || undefined,

    spaceId: spaceId || undefined,

    busType: busType || undefined,
  };
}

export function buildLiveEzopenUrl(source: EzopenSource): string {
  const stream = source.hd ? `${source.channel}.hd.live` : `${source.channel}.live`;

  return `ezopen://open.ys7.com/${source.serial}/${stream}`;
}

export function buildPlaybackEzopenUrl(source: EzopenSource, options: PlaybackOptions): string {
  const params = options;
  const spaceId = params.spaceId?.trim();

  const busType = params.busType?.trim() || (spaceId ? '7' : '');

  const end =
    params.end?.trim() ||
    (params.mode === 'cloud' && spaceId && params.begin
      ? getDefaultRecEndTimestamp(params.begin)
      : '');

  const stream = params.mode === 'cloud' ? `${source.channel}.cloud.rec` : `${source.channel}.rec`;

  const query = new URLSearchParams();

  if (params.begin) query.set('begin', params.begin);

  if (end) query.set('end', end);

  if (params.mode === 'cloud' && spaceId) query.set('spaceId', spaceId);
  if (params.mode === 'cloud' && busType) query.set('busType', busType);

  return `ezopen://open.ys7.com/${source.serial}/${stream}?${query.toString()}`;
}

export function resolveDeviceSource(props: Props): EzopenSource | null {
  const serial = props.deviceSerial.trim();

  if (serial) {
    return {
      serial,

      channel: Math.max(1, Number(props.channelNo) || 1),

      hd: props.hd,
    };
  }

  return parseEzopenSource(props.ezopenUrl);
}

export function resolveInitLiveUrl(props: Props): string {
  const source = resolveDeviceSource(props);

  if (!source) return '';

  return buildLiveEzopenUrl(source);
}

export function isPlayerConfigured(props: Props): boolean {
  return Boolean(props.accessToken.trim() && resolveDeviceSource(props));
}

export function buildEzopenUrl(props: Props): string {
  return resolveInitLiveUrl(props);
}

export function playbackFingerprint(props: Props): string {
  const source = resolveDeviceSource(props);

  const sourceKey = source
    ? `${source.serial}|${source.channel}|${source.hd ? 'hd' : 'sd'}`
    : `${props.deviceSerial.trim()}|${props.channelNo}|${props.hd ? 'hd' : 'sd'}|${props.ezopenUrl.trim()}`;

  return [
    props.accessToken.trim(),

    sourceKey,
    props.playbackMode,
    resolveSpaceId(props),

    props.busType.trim(),

    props.validCode.trim(),

    props.template,

    props.themeId.trim(),

    props.autoplay ? '1' : '0',

    props.audio ? '1' : '0',

    props.domain.trim(),
  ].join('|');
}

export function getTodayBeginTimestamp(now = new Date()): string {
  const pad = (input: number) => String(input).padStart(2, '0');

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}000000`;
}

export function toEzopenTimestamp(value: string): string {
  const date = new Date(value);

  const time = date.getTime();

  if (Number.isNaN(time)) return '';

  const pad = (input: number) => String(input).padStart(2, '0');

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
