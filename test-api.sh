#!/bin/bash

echo "🧪 CUCM25 Backend API Testing"
echo "================================"
echo ""

BASE_URL="http://localhost:8080"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health Check OK${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}❌ Health Check Failed${NC}"
fi
echo ""

echo "2️⃣  Testing Generate Code (Moderator) - Auto CodeString..."
GENERATE_RESULT=$(curl -s -X POST "$BASE_URL/api/code/generate" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-mod-1" \
  -d '{
    "targetRole": "junior",
    "activityName": "ทดสอบระบบ Auto Code",
    "rewardCoin": 50,
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }')

if echo "$GENERATE_RESULT" | grep -q "success"; then
    echo -e "${GREEN}✅ Code Generated${NC}"
    echo "$GENERATE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$GENERATE_RESULT"
    CODE_STRING=$(echo "$GENERATE_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['codeString'])" 2>/dev/null)
else
    echo -e "${RED}❌ Generate Failed${NC}"
    echo "$GENERATE_RESULT"
    CODE_STRING="WELCOME2025"
fi
echo ""

echo "3️⃣  Testing Redeem Code (Junior)..."
if [ -z "$CODE_STRING" ]; then
    CODE_STRING="WELCOME2025"
fi
echo "Using code: $CODE_STRING"

REDEEM_RESULT=$(curl -s -X POST "$BASE_URL/api/code/redeem" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-junior-1" \
  -d "{\"codeString\": \"$CODE_STRING\"}")

if echo "$REDEEM_RESULT" | grep -q "success"; then
    echo -e "${GREEN}✅ Code Redeemed${NC}"
    echo "$REDEEM_RESULT" | python3 -m json.tool 2>/dev/null || echo "$REDEEM_RESULT"
else
    echo -e "${RED}❌ Redeem Failed${NC}"
    echo "$REDEEM_RESULT"
fi
echo ""

echo "4️⃣  Testing Duplicate Redemption (Should Fail)..."
DUPLICATE_RESULT=$(curl -s -X POST "$BASE_URL/api/code/redeem" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-junior-1" \
  -d "{\"codeString\": \"$CODE_STRING\"}")

if echo "$DUPLICATE_RESULT" | grep -q "already redeemed"; then
    echo -e "${GREEN}✅ Duplicate Prevention Works${NC}"
    echo "$DUPLICATE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DUPLICATE_RESULT"
else
    echo -e "${YELLOW}⚠️  Unexpected Result${NC}"
    echo "$DUPLICATE_RESULT"
fi
echo ""

echo "5️⃣  Testing System Status..."
SYSTEM_STATUS=$(curl -s "$BASE_URL/api/system/status")
if echo "$SYSTEM_STATUS" | grep -q "success"; then
    echo -e "${GREEN}✅ System Status Retrieved${NC}"
    echo "$SYSTEM_STATUS" | python3 -m json.tool 2>/dev/null || echo "$SYSTEM_STATUS"
else
    echo -e "${RED}❌ System Status Failed${NC}"
    echo "$SYSTEM_STATUS"
fi
echo ""

echo "6️⃣  Testing System Toggle (Admin)..."
TOGGLE_RESULT=$(curl -s -X POST "$BASE_URL/api/system/toggle" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-admin-1" \
  -d '{
    "settingKey": "junior_login_enabled",
    "enabled": false
  }')

if echo "$TOGGLE_RESULT" | grep -q "success"; then
    echo -e "${GREEN}✅ System Toggle Works${NC}"
    echo "$TOGGLE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$TOGGLE_RESULT"
    
    # Re-enable for next tests
    curl -s -X POST "$BASE_URL/api/system/toggle" \
      -H "Content-Type: application/json" \
      -H "x-user-id: user-admin-1" \
      -d '{"settingKey": "junior_login_enabled", "enabled": true}' > /dev/null
else
    echo -e "${RED}❌ System Toggle Failed${NC}"
    echo "$TOGGLE_RESULT"
fi
echo ""

echo "================================"
echo "✅ Testing Complete!"
