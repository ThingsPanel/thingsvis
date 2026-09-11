ALTER TABLE "projects" ADD COLUMN "systemKey" TEXT;

WITH legacy_default AS (
  SELECT DISTINCT ON ("tenantId") id
  FROM "projects"
  WHERE name IN ('默认项目', 'Default Project')
  ORDER BY "tenantId", "createdAt"
)
UPDATE "projects"
SET "systemKey" = 'DEFAULT'
WHERE id IN (SELECT id FROM legacy_default);

CREATE UNIQUE INDEX "projects_tenantId_systemKey_key"
ON "projects"("tenantId", "systemKey");
