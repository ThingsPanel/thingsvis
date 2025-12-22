// Placeholder benchmark script — measure-first-frame
// Usage: node -r ts-node/register measure-first-frame.ts
import fs from "fs";
import path from "path";

function loadFixture(name: string) {
  const p = path.resolve(__dirname, "../fixtures", name);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function main() {
  const fixture = loadFixture("1k.json");
  console.log("Loaded fixture:", fixture.id, "nodes:", fixture.nodes.length);
  // TODO: spawn headless browser to mount CanvasView and measure first frame
}

main();


