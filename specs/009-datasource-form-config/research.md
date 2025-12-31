# Research: 数据源表单配置增强 (REST & WebSocket Form Configuration)

**Feature**: 009-datasource-form-config  
**Created**: 2025-12-31

## Research Tasks

### R1: AbortController for Fetch Timeout

**Task**: Research best practices for implementing timeout in fetch API using AbortController.

**Decision**: Use `AbortController` with `AbortSignal.timeout()` (modern browsers) or manual `setTimeout` + `abort()` for compatibility.

**Rationale**: 
- Native browser API, no external dependencies
- Clean cancellation semantics
- Compatible with existing fetch-based RESTAdapter

**Implementation Pattern**:
```typescript
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Alternatives Considered**:
- `axios` with timeout option: Rejected (introduces new dependency, project uses native fetch)
- Promise.race with timeout: Rejected (doesn't cancel the actual request)

---

### R2: WebSocket Reconnection with Exponential Backoff

**Task**: Research best practices for WebSocket reconnection strategies.

**Decision**: Implement custom reconnection logic with configurable exponential backoff.

**Rationale**:
- Full control over reconnection behavior
- Matches spec requirements (configurable max attempts, initial interval, backoff)
- No external dependencies

**Implementation Pattern**:
```typescript
function calculateDelay(attempt: number, initialInterval: number, maxInterval: number): number {
  const delay = initialInterval * Math.pow(2, attempt);
  return Math.min(delay, maxInterval);
}
```

**Alternatives Considered**:
- `reconnecting-websocket` library: Rejected (adds dependency, less configurable)
- `socket.io-client`: Rejected (overkill for simple WebSocket, different protocol)

---

### R3: Heartbeat/Keep-alive for WebSocket

**Task**: Research WebSocket heartbeat implementation patterns.

**Decision**: Use `setInterval` for sending heartbeat messages with pause/resume on disconnect/reconnect.

**Rationale**:
- Simple timer-based approach
- Heartbeat content is user-configurable (text or JSON)
- Timer cleanup on disconnect prevents memory leaks

**Implementation Pattern**:
```typescript
class WSAdapter {
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  
  private startHeartbeat(interval: number, message: string) {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(message);
      }
    }, interval);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}
```

**Alternatives Considered**:
- WebSocket ping/pong frames: Rejected (browser WebSocket API doesn't expose ping/pong)

---

### R4: Authentication Header Generation

**Task**: Research patterns for generating authentication headers for REST APIs.

**Decision**: Implement utility functions for each auth type.

**Rationale**:
- Straightforward implementation
- Supports all common auth patterns (Bearer, Basic, API Key)
- Can be unit tested independently

**Implementation Pattern**:
```typescript
type AuthConfig = 
  | { type: 'none' }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'apiKey'; key: string; value: string; location: 'header' | 'query' };

function generateAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'none': return {};
    case 'bearer': return { 'Authorization': `Bearer ${auth.token}` };
    case 'basic': return { 'Authorization': `Basic ${btoa(`${auth.username}:${auth.password}`)}` };
    case 'apiKey': 
      return auth.location === 'header' ? { [auth.key]: auth.value } : {};
  }
}
```

**Alternatives Considered**:
- Third-party auth library: Rejected (simple enough to implement inline)

---

### R5: JSON Editor Component

**Task**: Research JSON editing solutions for request body configuration.

**Decision**: Use CodeMirror 6 with JSON language support.

**Rationale**:
- Already mentioned in user requirements
- Excellent TypeScript support
- Syntax highlighting and validation
- Lightweight modular architecture

**Implementation Pattern**:
- Use `@codemirror/lang-json` for JSON syntax
- Use `@codemirror/lint` for real-time validation
- Integrate with form state via controlled component pattern

**Alternatives Considered**:
- Monaco Editor: Rejected (heavier bundle size, overkill for simple JSON)
- Textarea with manual validation: Rejected (poor UX, no syntax highlighting)

---

### R6: KeyValue Editor Component Pattern

**Task**: Research dynamic key-value pair editing patterns in React.

**Decision**: Array-based state with add/remove/update operations.

**Rationale**:
- Follows React patterns for dynamic lists
- Easy to integrate with Zod validation
- Supports empty state and validation per row

**Implementation Pattern**:
```typescript
interface KeyValuePair {
  id: string; // for React key
  key: string;
  value: string;
}

// State: KeyValuePair[]
// Add: [...pairs, { id: nanoid(), key: '', value: '' }]
// Remove: pairs.filter(p => p.id !== targetId)
// Update: pairs.map(p => p.id === targetId ? { ...p, [field]: newValue } : p)
// Convert to headers: Object.fromEntries(pairs.filter(p => p.key).map(p => [p.key, p.value]))
```

---

### R7: Backward Compatibility Strategy

**Task**: Research Zod schema extension patterns for backward compatibility.

**Decision**: All new fields use `.optional()` with sensible `.default()` values.

**Rationale**:
- Existing saved configurations parse without errors
- New features are opt-in
- Matches Constitution Principle IV

**Implementation Pattern**:
```typescript
// Before (existing)
export const RESTConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  params: z.record(z.any()).optional(),
  pollingInterval: z.number().min(0).optional(),
});

// After (extended)
export const RESTConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  params: z.record(z.any()).optional(),
  pollingInterval: z.number().min(0).optional(),
  // New fields - all optional with defaults
  body: z.string().optional(), // JSON string
  timeout: z.number().min(1).max(300).default(30).optional(), // seconds
  auth: AuthConfigSchema.optional(), // defaults to { type: 'none' }
});
```

---

## Summary

All technical decisions have been made. No NEEDS CLARIFICATION items remain. Ready to proceed to Phase 1 (Data Model & Contracts).

| Research Item | Decision | Status |
|---------------|----------|--------|
| Fetch Timeout | AbortController | ✅ Resolved |
| WS Reconnection | Custom exponential backoff | ✅ Resolved |
| WS Heartbeat | setInterval with pause/resume | ✅ Resolved |
| Auth Headers | Utility function per auth type | ✅ Resolved |
| JSON Editor | CodeMirror 6 | ✅ Resolved |
| KeyValue Editor | Array-based React pattern | ✅ Resolved |
| Backward Compat | Optional fields with defaults | ✅ Resolved |
