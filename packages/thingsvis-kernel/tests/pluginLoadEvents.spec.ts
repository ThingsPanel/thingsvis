import { eventBus } from "../src/event-bus";
import { PLUGIN_LOAD_START, PLUGIN_LOAD_SUCCESS, PLUGIN_LOAD_FAILURE } from "../src/events/pluginEvents";
import { loadPlugin } from "@thingsvis/ui";

describe("plugin load events", () => {
  it("emits start and success events when loading a plugin", async () => {
    const events: string[] = [];
    const startHandler = () => events.push(PLUGIN_LOAD_START);
    const successHandler = () => events.push(PLUGIN_LOAD_SUCCESS);
    eventBus.on(PLUGIN_LOAD_START, startHandler);
    eventBus.on(PLUGIN_LOAD_SUCCESS, successHandler);

    // call UI loader which emits events via kernel eventBus
    await loadPlugin("http://example.com/remoteEntry.js", "./Main");

    expect(events).toContain(PLUGIN_LOAD_START);
    expect(events).toContain(PLUGIN_LOAD_SUCCESS);

    eventBus.off(PLUGIN_LOAD_START, startHandler);
    eventBus.off(PLUGIN_LOAD_SUCCESS, successHandler);
  });
});


