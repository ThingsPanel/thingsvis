# Data Source Configuration Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-31

ThingsVis supports multiple types of data sources to power your visualizations. This guide explains how to configure and use them.

## 📋 Table of Contents

- [Supported Types](#supported-types)
- [Configuration](#configuration)
- [Data Binding](#data-binding)
- [Data Transformation (JS Sandbox)](#data-transformation-js-sandbox)

---

## Supported Types

1.  **Static JSON**: For prototyping and mocking data.
2.  **REST API**: Connect to standard HTTP/HTTPS endpoints.
3.  **WebSocket / MQTT**: Real-time bidirectional communication.
4.  **Database Proxy**: (Note: Direct SQL is not supported; use REST API forwarding).

---

## Configuration

### 1. Static JSON

Ideal for quick testing without a backend.

-   **Fields**:
    -   `Data Content`: Paste your JSON object here.
-   **Example**:
    ```json
    {
      "temperature": 25.5,
      "status": "active"
    }
    ```

### 2. REST API
Connect to external APIs with enterprise-grade features.

-   **Authentication**:
    -   `None`: No auth.
    -   `Bearer Token`: Adds `Authorization: Bearer <token>`.
    -   `Basic Auth`: Adds `Authorization: Basic <base64>`.
    -   `API Key`: Adds Key via Header or Query Param.
-   **Request**:
    -   `Method`: GET, POST, PUT, DELETE, etc.
    -   `Headers`: Dynamic Key-Value pairs.
    -   `Body`: JSON editor (available for POST/PUT).
    -   `Timeout`: Request timeout in seconds (1-300s).

### 3. WebSocket / MQTT
For robust real-time data streaming.

-   **Connection**:
    -   `URL`: `ws://`, `wss://`, `mqtt://`, `mqtts://`.
    -   `Subprotocols`: WebSocket subprotocols (e.g., `graphql-ws`).
-   **Resilience**:
    -   `Reconnect Policy`: Configurable retries, interval, and exponential backoff.
    -   `Heartbeat`: Keep-alive messages (interval + content).
-   **Workflow**:
    -   `Initial Subscription`: Messages sent automatically upon successful connection (e.g., specific topic subscription commands).

---

## Data Binding

Bind data source values to component properties using **Expressions**.

### Syntax

Use double curly braces `{{ ... }}` to write expressions.

### Examples

-   **Simple Value Access**:
    ```javascript
    {{ ds.myDataSource.data.temperature }}
    ```
-   **Calculation**:
    ```javascript
    {{ ds.sensor.data.value * 100 }}
    ```
-   **String Concatenation**:
    ```javascript
    {{ "Status: " + ds.statusAPI.data.state }}
    ```

**Note**: `ds` is the global object containing all registered data sources by their ID/Key.

---

## Data Transformation (JS Sandbox)

You can write JavaScript code to transform raw data before it reaches the component.

### Usage

1.  Enable "Data Transformation" in the data source settings.
2.  Write a JavaScript function that receives `data` and returns the new format.

### Examples

**Scenario**: Extract a nested value from a complex API response.

**Input Data**:
```json
{
  "response": {
    "items": [
      { "id": 1, "value": 100 }
    ]
  }
}
```

**Transformation Script**:
```javascript
// Extract the value of the first item
return data.response.items[0].value;
```

**Result**: `100`

### Limitations
-   **Sandboxed**: No access to `window`, `document`, or external libraries.
-   **Performance**: Scripts should be lightweight (< 10ms execution time) to avoid blocking the UI.
