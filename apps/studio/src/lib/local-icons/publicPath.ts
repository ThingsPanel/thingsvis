/** 本地图库静态资源前缀（线上 Studio 在 /main 下时有值，本地开发为空） */
export function resolveLocalIconsPublicPath(): string {
  if (typeof window === 'undefined') return '';

  const normalized = window.location.pathname.replace(/\/index\.html$/i, '');
  if (!normalized || normalized === '/') return '';

  return normalized.replace(/\/$/, '');
}

export function resolveLocalIconsPublicUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveLocalIconsPublicPath()}${normalizedPath}`;
}
