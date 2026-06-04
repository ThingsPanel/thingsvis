import type { Props } from './schema';

export function buildEzopenUrl(props: Props): string {
  const direct = props.ezopenUrl.trim();
  if (direct) return direct;

  const serial = props.deviceSerial.trim();
  if (!serial) return '';

  const channel = props.channelNo || 1;
  const suffix = props.streamSuffix === 'rec' ? 'rec' : 'live';
  let url = `ezopen://open.ys7.com/${serial}/${channel}.${suffix}`;

  if (suffix === 'rec') {
    const begin = props.playbackBegin.trim();
    const end = props.playbackEnd.trim();
    if (begin && end) {
      const params = new URLSearchParams({ begin, end });
      url += `?${params.toString()}`;
    }
  }

  return url;
}

export function playbackFingerprint(props: Props): string {
  return [
    props.accessToken.trim(),
    buildEzopenUrl(props),
    props.validCode.trim(),
    props.template,
    props.themeId.trim(),
    props.autoplay ? '1' : '0',
    props.audio ? '1' : '0',
    props.domain.trim(),
  ].join('|');
}
