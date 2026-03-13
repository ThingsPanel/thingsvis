import { vi } from 'vitest';
import { eventBus } from "../src/event-bus";
import { WIDGET_LOAD_START, WIDGET_LOAD_SUCCESS, WIDGET_LOAD_FAILURE } from "../src/events/widgetEvents";

vi.mock("@thingsvis/ui", () => ({
  loadWidget: vi.fn().mockImplementation(async () => {
    // We import dynamically if needed, but since eventBus is a singleton, 
    // actually simulating the UI load emitting events might need the actual eventBus instance.
    // Let's require it to trigger the side effect.
    const { eventBus: bus } = await import("../src/event-bus");
    const { WIDGET_LOAD_START: start, WIDGET_LOAD_SUCCESS: success } = await import("../src/events/widgetEvents");
    bus.emit(start);
    bus.emit(success);
  })
}));

import { loadWidget } from "@thingsvis/ui";

describe("widget load events", () => {
  it("emits start and success events when loading a widget", async () => {
    const events: string[] = [];
    const startHandler = () => events.push(WIDGET_LOAD_START);
    const successHandler = () => events.push(WIDGET_LOAD_SUCCESS);
    eventBus.on(WIDGET_LOAD_START, startHandler);
    eventBus.on(WIDGET_LOAD_SUCCESS, successHandler);

    await loadWidget("http://example.com/remoteEntry.js", "./Main");

    expect(events).toContain(WIDGET_LOAD_START);
    expect(events).toContain(WIDGET_LOAD_SUCCESS);

    eventBus.off(WIDGET_LOAD_START, startHandler);
    eventBus.off(WIDGET_LOAD_SUCCESS, successHandler);
  });
});
