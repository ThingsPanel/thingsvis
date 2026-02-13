#!/bin/bash
set -e

echo "=== ThingsVis Test Server Setup ==="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version)"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi
echo "✅ PM2 $(pm2 --version)"

# Check nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt-get update && apt-get install -y nginx
    systemctl enable nginx
fi
echo "✅ Nginx installed"

# Create directories
mkdir -p /opt/thingsvis/server
mkdir -p /var/www/thingsvis-studio
mkdir -p /var/www/thingsvis-preview
mkdir -p /var/www/thingsvis-plugins

# Copy nginx config
cp /tmp/thingsvis.conf /etc/nginx/conf.d/thingsvis.conf

# Test and reload nginx
nginx -t && systemctl reload nginx
echo "✅ Nginx configured and reloaded"

# Create .env for server (if not exists)
if [ ! -f /opt/thingsvis/server/.env ]; then
    cat > /opt/thingsvis/server/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgresThingsPanel@127.0.0.1:5432/thingsvis_test"
AUTH_SECRET="thingsvis-test-secret-2026-secure-key-32c"
AUTH_URL="http://47.92.253.145:7051"
EOF
    echo "✅ Server .env created"
else
    echo "ℹ️  Server .env already exists, skipping"
fi

# Open firewall ports 7050-7100 (if ufw is active)
if command -v ufw &> /dev/null && ufw status | grep -q "active"; then
    ufw allow 7050:7100/tcp
    echo "✅ Firewall ports 7050-7100 opened"
fi

# Setup PM2 startup
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "=== Setup complete ==="
echo "Directories created:"
echo "  /opt/thingsvis/server        - Next.js server"
echo "  /var/www/thingsvis-studio    - Studio SPA"
echo "  /var/www/thingsvis-preview   - Preview SPA"
echo "  /var/www/thingsvis-plugins   - Plugin assets"
echo ""
echo "Now push to master branch to trigger GitHub Actions deployment."
