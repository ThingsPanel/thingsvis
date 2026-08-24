#!/usr/bin/env python3
"""Simulate environmental telemetry and fan control over ThingsPanel MQTT."""

from __future__ import annotations

import argparse
import json
import random
import signal
import sys
import time
from typing import Any


DEFAULT_HOST = "c.thingspanel.cn"
DEFAULT_PORT = 1883
DEFAULT_CLIENT_ID = "mqtt_6eada66d-649"
DEFAULT_TELEMETRY_TOPIC = "devices/telemetry"
DEFAULT_CONTROL_TOPIC = (
    "devices/telemetry/control/6eada66d-6495-f3fc-743e-81140e67e029"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publish simulated temperature, humidity, PM2.5 and fan state."
    )
    parser.add_argument("--username", required=True, help="ThingsPanel MQTT Username")
    parser.add_argument("--password", default="", help="MQTT password (default: empty)")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--client-id", default=DEFAULT_CLIENT_ID)
    parser.add_argument("--telemetry-topic", default=DEFAULT_TELEMETRY_TOPIC)
    parser.add_argument("--control-topic", default=DEFAULT_CONTROL_TOPIC)
    parser.add_argument("--interval", type=float, default=5.0)
    parser.add_argument("--qos", type=int, choices=(0, 1, 2), default=0)
    return parser.parse_args()


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def parse_switch(payload: bytes) -> bool | None:
    try:
        message = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None

    value = message.get("switch")
    if value in (1, True, "1", "true", "on"):
        return True
    if value in (0, False, "0", "false", "off"):
        return False
    return None


def main() -> int:
    args = parse_args()
    running = True
    fan_on = True
    temperature = 26.8
    humidity = 63.5
    pm25 = 32.0

    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        print("Missing dependency: paho-mqtt", file=sys.stderr)
        print("Install it with: pip install paho-mqtt", file=sys.stderr)
        return 1

    def stop(_signum: int, _frame: Any) -> None:
        nonlocal running
        running = False

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    client = mqtt.Client(client_id=args.client_id)
    client.username_pw_set(args.username, args.password)

    def on_connect(
        mqtt_client: mqtt.Client,
        _userdata: Any,
        _flags: dict[str, Any],
        reason_code: int,
    ) -> None:
        if reason_code != 0:
            print(f"MQTT connection failed, reason_code={reason_code}", file=sys.stderr)
            return
        print(f"Connected to {args.host}:{args.port}")
        mqtt_client.subscribe(args.control_topic, qos=args.qos)
        print(f"Subscribed: {args.control_topic}")

    def on_message(
        _mqtt_client: mqtt.Client,
        _userdata: Any,
        message: mqtt.MQTTMessage,
    ) -> None:
        nonlocal fan_on
        requested_state = parse_switch(message.payload)
        if requested_state is None:
            print(f"Ignored invalid control payload: {message.payload!r}")
            return
        fan_on = requested_state
        print(f"Fan control received: switch={int(fan_on)}")

    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(args.host, args.port, keepalive=60)
    client.loop_start()

    try:
        while running:
            temperature = clamp(temperature + random.uniform(-0.18, 0.18), 18, 38)
            humidity = clamp(humidity + random.uniform(-0.7, 0.7), 30, 90)
            pm25 = clamp(pm25 + random.uniform(-1.5, 1.5), 5, 180)

            payload = {
                "temperature": round(temperature, 1),
                "humidity": round(humidity, 1),
                "pm25": round(pm25, 1),
                "switch": int(fan_on),
            }
            body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
            result = client.publish(
                args.telemetry_topic,
                payload=body,
                qos=args.qos,
                retain=False,
            )
            result.wait_for_publish()
            print(f"Published {args.telemetry_topic}: {body}")
            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
