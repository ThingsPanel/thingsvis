# EZVIZ Player (EZUIKit)

ThingsVis widget for [EZVIZ Open Platform EZUIKit](https://open.ys7.com/cn/s/110) — live preview and recording playback via the official `ezuikit-js` SDK (H.264/H.265, Chrome/Firefox, no plugin).

This is a **separate** widget from `media/camera-control`. Use camera-control for generic RTSP/HLS/WebRTC streams and platform `callWrite` commands; use this widget when devices are on EZVIZ cloud and you have an `accessToken` + `ezopen://` address.

## Prerequisites

1. Register at [EZVIZ Open Platform](https://open.ys7.com/) and create an application.
2. Obtain `accessToken` (server-side refresh recommended; bind via `PLATFORM_FIELD`).
3. Provide the **device serial** and **channel**. Live playback uses `.live` / `.hd.live`.
4. For encrypted devices, set **validCode** (device verification code).
5. Playback defaults to the device SD card (`.rec`). Select cloud storage to use `.cloud.rec`; cloud-only `spaceId` and `busType` are optional.

Official npm package: [ezuikit-js](https://www.npmjs.com/package/ezuikit-js)

## Templates

| Template   | Typical use                            |
| ---------- | -------------------------------------- |
| `security` | Monitoring + playback UI (recommended) |
| `pcLive`   | PC live view                           |
| `simple`   | Minimal live                           |
| `standard` | Standard controls                      |
| `voice`    | Talk-enabled                           |
| `theme`    | Custom theme (`themeId`)               |

EZUIKit renders its own toolbar, timeline, and “return to live” inside the player — no need to duplicate that in ThingsVis.

## Build

```powershell
pnpm install
pnpm --filter thingsvis-widget-media-ezuikit-player build
pnpm registry:generate
```

## Test

```powershell
pnpm vitest run packages/widgets/media/ezuikit-player
```
