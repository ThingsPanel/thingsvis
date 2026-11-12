# Upload security (A-020)

`POST /api/v1/uploads` requires a ThingsVis session or Bearer access token. Anonymous requests return 401 before body processing. Existing authenticated clients keep the same form field (`file`) and response shape.

SVG uploads are disabled. Images must use PNG/JPEG/GIF/WebP extensions and matching file signatures; GLB/glTF require format checks. The server derives the returned content type and generated extension instead of trusting client MIME. Existing SVG files are rejected by the uploads API. `/uploads/*` static responses receive sandbox CSP and nosniff headers; apply equivalent headers if Nginx/CDN serves these files directly. Previously cached responses must be purged or existing SVG files removed by the operator; the patch does not delete uploaded assets.

Defaults (override with positive integer environment variables):

| Variable | Default |
|---|---|
| UPLOAD_IMAGE_MAX_BYTES | 10485760 (10 MiB) |
| UPLOAD_MODEL_MAX_BYTES | 52428800 (50 MiB) |
| UPLOAD_TOTAL_MAX_BYTES | 1073741824 (1 GiB per upload storage volume) |
| UPLOAD_REQUESTS_PER_MINUTE | 10 per authenticated user |

The body is bounded before multipart parsing, including chunked requests, at the larger per-file limit plus 1 MiB of form overhead. Next middleware buffering uses the same cap in next.config.js (rebuild the production artifact if changing that cap); configure ingress body limits consistently. Oversized requests/files return 413. Failed authenticated upload attempts also consume rate allowance; excess requests return 429. Rate windows last one minute and persist in `.upload-limits` under the server working directory. Read/parse/database errors fail closed.

Before writing, the server counts all existing regular files recursively under `public/uploads` (including models and old files). Quota excess returns 507; old files are not automatically deleted. PostgreSQL transaction advisory lock `(821027, 20)` serializes rate updates and quota check/write operations across workers. Multiple replicas must share both the upload volume AND `.upload-limits` volume and use the same PostgreSQL database. Separate storage volumes have separate disk quotas. Mount `.upload-limits` persistently to preserve rate counters on restart. These limits govern this endpoint; they do not constrain manual filesystem writes or other services.

Tests: `pnpm exec vitest run --config apps/server/vitest.uploads.config.ts`.
The tests use temporary directories and a mocked transaction lock; production PostgreSQL and browser/CDN behavior require deployment verification.

A-008 SSO identity forgery and public/default JWT secrets are separate authentication findings and are not fixed by this upload patch.
