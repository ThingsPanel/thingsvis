#!/usr/bin/env python3
"""
Simulate secondary-network heating telemetry (supply/return temperature and pressure)
and publish to MQTT for 供热大屏 / gateway telemetry.

Install dependency:
  pip install paho-mqtt

Run:
  python scripts/publish_heating_telemetry.py
"""

from __future__ import annotations

import argparse
import json
import random
import signal
import sys
import time
from datetime import datetime, timezone
from typing import Any


DEFAULT_HOST = "c.thingspanel.cn"
DEFAULT_PORT = 1883
DEFAULT_USERNAME = "879a2c94-577d-ca54-41b"
DEFAULT_PASSWORD = "43feaa7"
DEFAULT_CLIENT_ID = "mqtt_28e68c7b-e1e"
DEFAULT_TELEMETRY_TOPIC = "gateway/telemetry"
DEFAULT_CONTROL_TOPIC = "gateway/telemetry/control/28e68c7b-e1e6-c783-6d68-ceabd1ce661b"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publish simulated heating plant telemetry (temps & pressures) to MQTT."
    )
    parser.add_argument("--host", default=DEFAULT_HOST, help="MQTT broker host.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="MQTT broker port.")
    parser.add_argument("--username", default=DEFAULT_USERNAME, help="MQTT username.")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="MQTT password.")
    parser.add_argument("--client-id", default=DEFAULT_CLIENT_ID, help="MQTT client ID.")
    parser.add_argument(
        "--telemetry-topic",
        default=DEFAULT_TELEMETRY_TOPIC,
        help="Topic used for telemetry reports.",
    )
    parser.add_argument(
        "--control-topic",
        default=DEFAULT_CONTROL_TOPIC,
        help="Topic used for device control messages. Empty string disables subscribe.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Publish interval in seconds.",
    )
    parser.add_argument(
        "--qos",
        type=int,
        choices=(0, 1, 2),
        default=0,
        help="MQTT publish/subscribe QoS.",
    )
    parser.add_argument(
        "--retain",
        action="store_true",
        help="Publish retained telemetry messages.",
    )
    parser.add_argument(
        "--flat-payload",
        action="store_true",
        help="Put metrics at top level instead of under gateway_data.",
    )
    parser.add_argument(
        "--supply-temp",
        type=float,
        default=47.2,
        help="Initial supply water temperature (°C).",
    )
    parser.add_argument(
        "--return-temp",
        type=float,
        default=39.1,
        help="Initial return water temperature (°C).",
    )
    parser.add_argument(
        "--supply-pressure",
        type=float,
        default=0.38,
        help="Initial supply pressure (MPa).",
    )
    parser.add_argument(
        "--return-pressure",
        type=float,
        default=0.32,
        help="Initial return pressure (MPa).",
    )
    return parser.parse_args()


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


class HeatingSimulator:
    """
    Simple secondary-network model: supply temp wanders slowly; delta-T (supply-return)
    wanders more slowly (load proxy); pressures use very small steps with fixed head loss.
    """

    def __init__(
        self,
        supply_temp: float,
        return_temp: float,
        supply_pressure: float,
        return_pressure: float,
    ) -> None:
        self.supply_temp = supply_temp
        self.delta_t = supply_temp - return_temp
        self.supply_pressure = supply_pressure
        self.return_pressure = return_pressure
        # Head loss MPa supply - return; rough nominal for the given ~0.38/0.32 pair.
        self._head_loss = max(0.02, min(0.12, supply_pressure - return_pressure))

    def step(self) -> tuple[float, float, float, float]:
        # Supply temperature: random walk + weak pull toward a typical setpoint band.
        self.supply_temp += random.gauss(0, 0.04)
        self.supply_temp += (47.0 - self.supply_temp) * 0.002
        self.supply_temp = clamp(self.supply_temp, 40.0, 55.0)

        # Delta-T: slow variation (load / weather proxy), ~7–10 °C like real secondary nets.
        self.delta_t += random.gauss(0, 0.025)
        self.delta_t = clamp(self.delta_t, 6.5, 11.0)

        return_temp = clamp(self.supply_temp - self.delta_t, 32.0, 52.0)
        # Keep physics: if clamp hit, nudge delta
        if return_temp >= self.supply_temp - 0.5:
            self.delta_t = max(6.5, self.supply_temp - return_temp)
            return_temp = self.supply_temp - self.delta_t

        # Pressures: much smaller noise than temperature; maintain supply > return.
        self.supply_pressure += random.gauss(0, 0.0012)
        self.supply_pressure = clamp(self.supply_pressure, 0.30, 0.45)
        self._head_loss += random.gauss(0, 0.00025)
        self._head_loss = clamp(self._head_loss, 0.04, 0.09)
        self.return_pressure = self.supply_pressure - self._head_loss
        self.return_pressure = clamp(self.return_pressure, 0.25, 0.42)
        if self.return_pressure >= self.supply_pressure - 0.01:
            self.return_pressure = self.supply_pressure - 0.04

        self.supply_temp = round(self.supply_temp, 2)
        r_temp = round(return_temp, 2)
        s_p = round(self.supply_pressure, 3)
        r_p = round(self.return_pressure, 3)
        return self.supply_temp, r_temp, s_p, r_p


def build_payload(
    supply_temp: float,
    return_temp: float,
    supply_pressure: float,
    return_pressure: float,
    flat: bool,
) -> dict[str, Any]:
    metrics = {
        "supplyTemp": supply_temp,
        "returnTemp": return_temp,
        "supplyPressure": supply_pressure,
        "returnPressure": return_pressure,
    }
    ts = datetime.now(timezone.utc).isoformat()
    if flat:
        out: dict[str, Any] = {**metrics, "ts": ts}
        return out
    return {"gateway_data": metrics, "ts": ts}


def main() -> int:
    args = parse_args()
    running = True

    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        print("Missing dependency: paho-mqtt", file=sys.stderr)
        print("Install it with: pip install paho-mqtt", file=sys.stderr)
        return 1

    def stop(_: int, __: Any) -> None:
        nonlocal running
        running = False

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    client = mqtt.Client(client_id=args.client_id)
    client.username_pw_set(args.username, args.password)

    def on_connect(
        client: mqtt.Client,
        _userdata: Any,
        _flags: dict[str, Any],
        reason_code: int,
    ) -> None:
        if reason_code == 0:
            print(f"Connected to MQTT broker {args.host}:{args.port}")
            if args.control_topic:
                client.subscribe(args.control_topic, qos=args.qos)
                print(f"Subscribed control topic: {args.control_topic}")
            return

        print(f"MQTT connection failed, reason_code={reason_code}", file=sys.stderr)

    def on_message(_client: mqtt.Client, _userdata: Any, message: mqtt.MQTTMessage) -> None:
        payload = message.payload.decode("utf-8", errors="replace")
        print(f"Control message from {message.topic}: {payload}")

    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(args.host, args.port, keepalive=60)
    client.loop_start()

    sim = HeatingSimulator(
        args.supply_temp,
        args.return_temp,
        args.supply_pressure,
        args.return_pressure,
    )

    try:
        while running:
            st, rt, sp, rp = sim.step()
            payload = build_payload(st, rt, sp, rp, args.flat_payload)
            body = json.dumps(payload, separators=(",", ":"))
            result = client.publish(
                args.telemetry_topic,
                payload=body,
                qos=args.qos,
                retain=args.retain,
            )
            result.wait_for_publish()

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"Published {args.telemetry_topic}: {body}")
            else:
                print(f"Publish failed, rc={result.rc}: {body}", file=sys.stderr)

            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
