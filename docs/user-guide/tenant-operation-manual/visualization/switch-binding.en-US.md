---
id: switch-binding-visualization-en
title: Bind a Switch Component in a Visualization
sidebar_label: Visualization: Bind a Switch
sidebar_position: 1
slug: /en/user-guide/tenant-operation-manual/visualization/switch-binding
description: Bind a Boolean device state to a ThingsVis switch and enable two-way control.
---

# Bind a Switch Component in a Visualization

This tutorial shows how to add a ThingsVis switch and bind it to a Boolean field from the thing model. The component displays the device name, icon, and state on the left, while the control switch stays on the right.

## Prerequisites

- The thing model contains a writable Boolean field such as `ha_state`.
- The device template is bound to that thing model.
- The device reports telemetry for the field.

## Add and bind the switch

1. Open a ThingsVis dashboard and click **Edit**.
2. Expand **Controls** in the component library and drag **Switch** onto the canvas.
3. Select the switch and open **Content** in the Properties panel.
4. Configure **Device State & Control** as follows:

   | Setting | Value |
   | --- | --- |
   | Binding Mode | Field |
   | Data Scope | Single Device Data |
   | Device | The target device, for example `二层会客厅灯` |
   | Data Type | Current Value |
   | Field | `ha_state [boolean]` |

5. Confirm that the panel shows **Two-way control enabled**. The Boolean switch automatically uses **On → `true`** and **Off → `false`**.

![Bind the ha_state Boolean field in the visualization editor](./images/switch-binding-field.png)

You do not need to configure a manual `change` event or build a request body. The saved configuration is a field binding; the host runtime routes a matching writable field to the device command automatically.

## Adjust the switch appearance

The recommended defaults are:

- Show Label: enabled.
- Label Position: left.
- Icon, device name, and state: left side.
- Switch track: right side.

When the device is on, the icon and state label become brighter. When it is off, they become dimmer. The user can therefore see the state and the control entry at the same time.

## Save and preview

1. Click **Save** and wait for **All changes saved**.
2. Click **Preview**.
3. Toggle the switch in the preview page. Do not use the editor canvas as the device-control test surface.
4. Wait for the device telemetry report and confirm that the label changes between **Enabled** and **Disabled**.

![Switch component in the dashboard preview](./images/switch-preview-state.png)

The complete round trip is:

```text
Preview click
  → send ha_state=true/false command
  → device executes the command
  → device reports ha_state telemetry
  → device details, charts, and switch label update
```

## Troubleshooting

### `ha_state [boolean]` is not available

Check the thing model identifier, data type, and read/write flag. The field must be Boolean, and the device template may need to be rebound or refreshed.

### The field can be selected, but two-way control is not enabled

The field may be read-only. Confirm that the model exposes a matching writable command, or mark the field as Read-write where supported.

### A command record appears, but the chart does not change

Check whether the device actually received and executed the command. A command record confirms platform delivery, not the final device state; charts use device telemetry as the source of truth.

### Nothing changes after clicking

Make sure you are operating the **Preview** page, then check device connectivity, the command identifier, and the latest telemetry timestamp on the device details page.

## Recording actions

The reusable Playwright CLI sequence for this tutorial is `thingsvis.open-switch-binding-editor`, `thingsvis.show-switch-binding`, and `thingsvis.verify-switch-preview` in `thingspanel-test-automation/playwright-cli-actions/thingsvis/`.
