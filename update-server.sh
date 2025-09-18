#!/bin/bash

# Script to update the GCP server
# Usage: ./update-server.sh

echo "Updating GCP server at 34.170.218.238..."

# Copy the updated files to server
scp backend/src/models/User.js username@34.170.218.238:/path/to/shardeum-quest/backend/src/models/
scp backend/src/server.js username@34.170.218.238:/path/to/shardeum-quest/backend/src/

# SSH and restart services
ssh username@34.170.218.238 << 'EOF'
cd /path/to/shardeum-quest
pm2 restart all
# OR systemctl restart your-service-name
echo "✅ Server updated and restarted"
EOF

echo "✅ Update completed!"