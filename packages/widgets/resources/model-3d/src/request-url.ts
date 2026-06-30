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

/** 平台上传和组件静态资源直连，其他 HTTP(S) 资源统一经服务端代理。 */
export function resolveModelRequestUrl(source: string, apiBaseUrl: string): string {
  if (!isHttpUrl(source) || isManagedUploadUrl(source) || isWidgetStaticAssetUrl(source)) {
    return source;
  }

  const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  return `${normalizedApiBaseUrl}/public/assets/proxy?url=${encodeURIComponent(source)}`;
}
