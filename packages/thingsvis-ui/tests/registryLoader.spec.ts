import { getRegistryEntries } from "../src/loader/dynamicLoader";

describe("registry loader", () => {
  it("loads registry.json fixture", async () => {
    const entries = await getRegistryEntries("apps/studio/public/registry.json");
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    const e = entries[0];
    expect(e).toHaveProperty("remoteName");
    expect(e).toHaveProperty("remoteEntryUrl");
  });
});


