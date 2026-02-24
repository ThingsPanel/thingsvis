import { eventBus } from "../src/event-bus";
import { WIDGET_LOAD_START, WIDGET_LOAD_SUCCESS, WIDGET_LOAD_FAILURE } from "../src/events/widgetEvents";
import { loadWidget } from "@thingsvis/ui";

describe("widget load events", () => {
  it("emits start and success events when loading a widget", async () => {
    const events: string[] = [];
    const startHandler = () => events.push(WIDGET_LOAD_START);
    const successHandler = () => events.push(WIDGET_LOAD_SUCCESS);
    eventBus.on(WIDGET_LOAD_START, startHandler);
    eventBus.on(WIDGET_LOAD_SUCCESS, successHandler);

    // call UI loader which emits events via kernel eventBus
    await loadWidget("http://example.com/remoteEntry.js", "./Main");

    expect(events).toContain(WIDGET_LOAD_START);
    expect(events).toContain(WIDGET_LOAD_SUCCESS);

    eventBus.off(WIDGET_LOAD_START, startHandler);
    eventBus.off(WIDGET_LOAD_SUCCESS, successHandler);
  });
});


