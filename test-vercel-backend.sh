#!/bin/bash

# Test script for Vercel backend
BACKEND_URL="https://shardeum-quest-omega.vercel.app"

echo "🧪 Testing Vercel Backend: $BACKEND_URL"
echo "=" .repeat(60)

echo "1. Health Check:"
curl -s "$BACKEND_URL/api/health" | jq . || curl -s "$BACKEND_URL/api/health"
echo -e "\n"

echo "2. Database Test:"
curl -s "$BACKEND_URL/api/db-test" | jq . || curl -s "$BACKEND_URL/api/db-test"
echo -e "\n"

echo "3. User Interaction Test:"
curl -s "$BACKEND_URL/api/public/users/interaction/0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9" | jq . || curl -s "$BACKEND_URL/api/public/users/interaction/0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9"
echo -e "\n"

echo "4. Quests Endpoint:"
curl -s "$BACKEND_URL/api/quests" | jq . || curl -s "$BACKEND_URL/api/quests"
echo -e "\n"

echo "✅ If all tests show data instead of errors, your backend is working!"