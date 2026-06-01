# Camera Control

Composite camera widget for ThingsPanel device models.

The default UI is optimized for customer-facing video monitoring:

- live or playback video fills the widget
- live/playback, online, and recording state are shown as chips
- snapshot, fullscreen, and request-playback actions are shown as readable actions
- PTZ, zoom, focus, and preset controls are hidden until enabled in advanced controls

The widget does not create per-device REST data sources. Bind `streamUrl` and
`playbackUrl` to the existing `PLATFORM_FIELD` device data source, then route
widget events to `callWrite` actions on the same data source.

Recommended command identifiers:

- `ptz_move`
- `ptz_stop`
- `ptz_zoom`
- `ptz_focus`
- `preset_goto`
- `snapshot`
- `playback_open`

PTZ events emit command-shaped payloads, for example:

```json
{ "ptz_move": { "direction": "left", "speed": 3 } }
```

ThingsPanel should forward this as:

```json
{
  "device_id": "current device",
  "identify": "ptz_move",
  "value": "{\"direction\":\"left\",\"speed\":3}"
}
```

## Testing playback

Use the local simulator when you only need to verify playback UI and stream
binding:

```powershell
cd tmp\camera-simulator
.\start-camera-simulator-local.ps1
```

Bind the widget fields to platform telemetry:

- `streamUrl` -> `live_stream_url`
- `playbackUrl` -> `playback_stream_url`

Publish telemetry with the same HLS URL for live and playback:

```powershell
python .\publish-camera-telemetry.py
```

Then switch the widget `mode` to `playback`. The video should load through
`playbackUrl`, the status chip should read `Playback`, and native video controls
should be visible.

## Testing controls

Use unit tests for command payload shape:

```powershell
pnpm vitest run packages/widgets/media/camera-control/index.test.ts
```

For an end-to-end command test in ThingsPanel:

1. Add command fields to the device model, for example `ptz_move`, `ptz_stop`,
   `ptz_zoom`, `ptz_focus`, `preset_goto`, `snapshot`, and `playback_open`.
2. Bind the widget command identifiers to those field keys.
3. Enable the advanced controls you want to test, such as PTZ pad or zoom.
4. Open the dashboard in runtime/viewer mode and click the control.
5. Verify ThingsPanel receives `/api/v1/command/datas/pub` with:
   - `identify` equal to the command key, for example `ptz_move`
   - `value` equal to the JSON params, for example `{"direction":"left","speed":3}`

The simulator validates video playback only. It does not emulate a physical PTZ
camera, so control validation is based on command publication/logs.
