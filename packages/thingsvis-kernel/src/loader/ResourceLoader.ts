export type ResourceRequest = {
  url: string;
};

export type ResourceResponse<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: unknown;
};

export class ResourceLoader {
  async load<T = unknown>(request: ResourceRequest): Promise<ResourceResponse<T>> {
    try {
      const res = await fetch(request.url);
      if (!res.ok) {
        return { ok: false, error: new Error(`Failed to load: ${res.status}`) };
      }
      const data = (await res.json()) as T;
      return { ok: true, data };
    } catch (error) {
      // mock-friendly: swallow errors and return structured response
      return { ok: false, error };
    }
  }
}


