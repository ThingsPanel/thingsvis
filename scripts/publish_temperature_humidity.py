#!/usr/bin/env python3
"""
Simulate a temperature/humidity sensor and publish telemetry over MQTT.

Install dependency:
  pip install paho-mqtt

Run:
  python scripts/publish_temperature_humidity.py
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
DEFAULT_USERNAME = "17cbb474-693b-cf09-a42"
DEFAULT_PASSWORD = ""
DEFAULT_CLIENT_ID = "mqtt_4474b112-6b8"
DEFAULT_TELEMETRY_TOPIC = "devices/telemetry"
DEFAULT_CONTROL_TOPIC = "devices/telemetry/control/4474b112-6b89-f139-4dc7-c6e4db31ba99"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publish simulated temperature and humidity telemetry to MQTT."
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
        "--temperature",
        type=float,
        default=25.0,
        help="Initial temperature in Celsius.",
    )
    parser.add_argument(
        "--humidity",
        type=float,
        default=55.0,
        help="Initial relative humidity percentage.",
    )
    return parser.parse_args()


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def next_reading(temperature: float, humidity: float) -> tuple[float, float]:
    temperature = clamp(temperature + random.uniform(-0.08, 0.08), 15.0, 38.0)
    humidity = clamp(humidity + random.uniform(-0.45, 0.45), 20.0, 90.0)
    return round(temperature, 2), round(humidity, 2)


def build_payload(temperature: float, humidity: float) -> dict[str, Any]:
    return {
        "temperature": temperature,
        "humidity": humidity,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


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

    temperature = args.temperature
    humidity = args.humidity

    try:
        while running:
            temperature, humidity = next_reading(temperature, humidity)
            payload = build_payload(temperature, humidity)
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
