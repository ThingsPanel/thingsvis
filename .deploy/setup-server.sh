#!/bin/bash
set -e

echo "=== ThingsVis Server Setup ==="

# Create directories
mkdir -p /opt/thingsvis/server
mkdir -p /var/www/thingsvis-studio
mkdir -p /var/www/thingsvis-plugins

# Copy nginx config
cp /tmp/thingsvis.conf /etc/nginx/conf.d/thingsvis.conf

# Test and reload nginx
nginx -t && systemctl reload nginx
echo "✅ Nginx configured and reloaded"

# Create .env for server
cat > /opt/thingsvis/server/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgresThingsPanel@127.0.0.1:5432/thingsvis_test"
AUTH_SECRET="thingsvis-test-secret-2026-secure-key-32c"
AUTH_URL="http://47.92.253.145:3001"
EOF
echo "✅ Server .env created"

# Create a placeholder page for studio
cat > /var/www/thingsvis-studio/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>ThingsVis Studio</title></head>
<body><h1>ThingsVis Studio - Awaiting deployment</h1></body>
</html>
EOF

echo "=== Setup complete ==="
echo "Now configure GitHub Secrets and run the deploy workflow."
