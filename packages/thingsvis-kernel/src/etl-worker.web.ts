import { PageSchema } from "../../thingsvis-schema/src/canvas-schema";

function handleMessage(msg: any) {
  try {
    const parsed = PageSchema.parse(msg);
    (self as any).postMessage({ type: "page", page: parsed });
  } catch (err) {
    (self as any).postMessage({ type: "error", error: String(err) });
  }
}

(self as any).addEventListener("message", (e: any) => handleMessage(e.data));

export {}; // web worker entry


