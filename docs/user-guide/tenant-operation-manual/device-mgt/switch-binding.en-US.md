---
id: switch-binding-model-en
title: Configure a Switch Field in the Thing Model
sidebar_label: Thing Model: Configure a Switch Field
sidebar_position: 1
slug: /en/user-guide/tenant-operation-manual/device-mgt/switch-binding
description: Configure a writable Boolean state field for a ThingsPanel visualization switch.
---

# Configure a Switch Field in the Thing Model

This tutorial shows how to define a readable and writable Boolean state field for a switch device. After this setup, a visualization switch can read the device state and send `true` or `false` when a user toggles it.

## Prerequisites

- Sign in with a tenant administrator account.
- Open **Device Access → Thing Models**.
- Create a new thing model; this tutorial starts from the no-model creation flow.

## Configure the Boolean state field

1. Click **Create Thing Model** and fill in the name, author, version, and other basic information.
2. Click **Next** to open **Thing Model Definition**.
3. Select the **Telemetry** tab and click **Add**.
4. Use the following values:

   | Setting | Recommended value | Purpose |
   | --- | --- | --- |
   | Data name | Switch status | Human-readable display name |
   | Data identifier | `ha_state` | Stable identifier used by bindings |
   | Read/write flag | Read-write | Required for control writes |
   | Data type | Boolean | Lets the widget treat on/off as a Boolean |
   | Unit | Leave empty | A switch state has no unit |

5. Click **Confirm**. Verify that `ha_state` is listed as **Read-write** and **Boolean**.

![Boolean switch field in the thing model](./images/switch-model-boolean-field.png)

## Bind the switch in the model's Web chart configuration

After defining the field, bind the component in the Web chart configuration of the same model. Do not replace this step by opening an existing dashboard outside the model wizard.

1. Click **Next** on **Thing Model Definition** to open **Web Chart Configuration**.
2. Click **New Configuration** to enter **Edit Web Chart Configuration**. Confirm that the embedded editor uses Chinese labels such as **组件库**, **控件**, and **属性** when the tenant UI is Chinese.
3. Expand **控件** in the left component library and drag **开关** onto the canvas.
4. Select the switch and configure **内容 → 设备状态与控制** in the Properties panel:

   | Setting | Value |
   | --- | --- |
   | Binding mode | Field |
   | Data scope | Device data |
   | Data type | Current value |
   | Field | `ha_state [boolean]` |

5. Confirm that the panel shows **已启用双向控制** and **开启 → `true` · 关闭 → `false`**, then click **保存配置**.

![Switch binding in the model Web chart configuration](./images/switch-web-chart-config.jpg)

This saves the model's own Web chart configuration so the same switch semantics can be reused by device templates and visualization dashboards.

If your platform exposes control capabilities in a separate **Commands** tab, use the same identifier, `ha_state`, for the matching command. The runtime can then use telemetry for state readback and the same-named command for control writes.

:::tip

Using one identifier for the state and its matching command is the recommended pattern for binary controls such as lights, HVAC power, and access control. Reads use telemetry; writes use the command.

:::

## Publish and bind the device template

1. Complete the App chart and publish steps after saving the Web chart configuration; you can also validate the Web configuration in a test device template before publishing.
2. Bind the thing model to the device template.
3. Confirm that the target device uses the updated template.

For an already published model, validate the change with a test device before applying it to production devices.

## Verify the setup

On the device details page, verify that:

- The current telemetry value is `true` or `false`.
- A control write creates a command record such as `{"ha_state":true}` or `{"ha_state":false}`.
- The device publishes a new `ha_state` telemetry report after executing the command.

## Troubleshooting

### The switch displays state but cannot control the device

The field is usually read-only, or the device template does not expose a matching command. Check the read/write flag and make sure the command identifier is `ha_state`.

### The bound value is a string

Use Boolean as the data type instead of String, Number, or a text enum. A device adapter may translate protocol values such as `on/off`, but the visualization contract should keep Boolean semantics.

### The command succeeds but the state does not change

Command success means that the platform accepted and sent the command. The device must still execute it and publish telemetry. If no report arrives, check device connectivity, the command identifier, and the adapter logs.

## Recording actions

The reusable Playwright CLI actions for this tutorial are `model.open-new-switch-web-editor` and `model.configure-new-switch-web-binding` in `thingspanel-test-automation/playwright-cli-actions/model/`.
