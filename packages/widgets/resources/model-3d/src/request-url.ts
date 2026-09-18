function isHttpUrl(source: string): boolean {
  try {
    const url = new URL(source);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isManagedUploadUrl(source: string): boolean {
  try {
    const pathname = new URL(source).pathname;
    return (
      pathname.startsWith('/uploads/')
      || pathname.startsWith('/api/v1/uploads/')
      || pathname.startsWith('/thingsvis-api/uploads/')
    );
  } catch {
    return false;
  }
}

function isWidgetStaticAssetUrl(source: string): boolean {
  try {
    return new URL(source).pathname.startsWith('/widgets/resources/model-3d/dist/');
  } catch {
    return false;
  }
}

function isPublicSupabaseStorageUrl(source: string): boolean {
  try {
    const url = new URL(source);
    return url.protocol === 'https:'
      && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      && url.pathname.startsWith('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

/** 平台上传、组件静态资源和支持跨域的 Supabase 公开存储直连，其余 HTTP(S) 资源经代理。 */
export function resolveModelRequestUrl(source: string, apiBaseUrl: string): string {
  if (!isHttpUrl(source) || isManagedUploadUrl(source) || isWidgetStaticAssetUrl(source)
    || isPublicSupabaseStorageUrl(source)) {
    return source;
  }

  const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  return `${normalizedApiBaseUrl}/public/assets/proxy?url=${encodeURIComponent(source)}`;
}
