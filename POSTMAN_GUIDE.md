# 🧪 Postman Testing Guide - Event Code Management

## 🚀 เริ่มต้น

### 1. ตรวจสอบ Server ทำงาน
```
GET http://localhost:8080/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timeStamp": "2025-10-26T...",
  "uptime": 123.456
}
```

---

## 📝 Test Users ที่มีอยู่ใน Database

| User ID | Username | Role | Coin Balance |
|---------|----------|------|--------------|
| `user-junior-1` | junior1 | junior | 100 |
| `user-senior-1` | senior1 | senior | 150 |
| `user-mod-1` | moderator1 | moderator | 200 |
| `user-admin-1` | admin1 | superadmin | 300 |

---

## 1️⃣ สร้างโค้ด (Generate Code) - Moderator/Admin Only

### Endpoint
```
POST http://localhost:8080/api/code/generate
```

### Headers
```
Content-Type: application/json
x-user-id: user-mod-1
```
> หรือใส่ `creatorUserId` ใน body แทน header ก็ได้

### Test Case 1: Moderator สร้าง Code สำหรับ Junior (✅ ควรสำเร็จ)
```json
{
  "targetRole": "junior",
  "activityName": "กิจกรรมต้อนรับน้องใหม่",
  "rewardCoin": 50,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```
> 🎯 **codeString จะถูกสร้างอัตโนมัติ** เป็นรูปแบบ 1 ตัวอักษร + 3 ตัวเลข (เช่น A123, B456)

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codeString": "A123",
    "targetRole": "junior",
    "activityName": "กิจกรรมต้อนรับน้องใหม่",
    "rewardCoin": 50,
    "createdByUserId": "user-mod-1",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-10-30T..."
  }
}
```
> 🎯 **codeString** จะเป็น random (เช่น A123, B456, Z789 ฯลฯ)

### Test Case 2: Moderator พยายามสร้าง Code สำหรับ All (❌ ควรล้มเหลว)
```json
{
  "targetRole": "all",
  "activityName": "กิจกรรมทั้งค่าย",
  "rewardCoin": 100,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```
**Headers:** `x-user-id: user-mod-1`

**Expected Response (403):**
```json
{
  "error": "Moderators can only create junior-only codes"
}
```

### Test Case 3: Admin สร้าง Code สำหรับ All (✅ ควรสำเร็จ)
```json
{
  "targetRole": "all",
  "activityName": "กิจกรรมทั้งค่าย",
  "rewardCoin": 100,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```
**Headers:** `x-user-id: user-admin-1`

**Expected Response (201):** ✅ Success

### Test Case 4: Junior พยายามสร้าง Code (❌ ควรล้มเหลว)
```json
{
  "codeString": "JUNIORCODE",
  "targetRole": "junior",
  "activityName": "ทดสอบ",
  "rewardCoin": 10,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```
**Headers:** `x-user-id: user-junior-1`

**Expected Response (403):**
```json
{
  "error": "Only moderators and admins can generate codes"
}
```

---

## 2️⃣ แลกโค้ด (Redeem Code) - All Users

### Endpoint
```
POST http://localhost:8080/api/code/redeem
```

### Headers
```
Content-Type: application/json
x-user-id: user-junior-1
```

### Test Case 1: Junior แลก Code สำหรับ Junior (✅ ควรสำเร็จ)
**สร้าง Code ก่อน:**
```
POST /api/code/generate
Headers: x-user-id: user-mod-1
Body:
{
  "codeString": "JUNIOR100",
  "targetRole": "junior",
  "activityName": "รางวัลน้องค่าย",
  "rewardCoin": 100,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

**แลก Code:**
```
POST /api/code/redeem
Headers: x-user-id: user-junior-1
Body:
{
  "codeString": "JUNIOR100"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully redeemed code: รางวัลน้องค่าย",
    "rewardCoin": 100,
    "newBalance": 200,
    "transactionId": 1
  }
}
```

### Test Case 2: แลก Code ซ้ำ (❌ ควรล้มเหลว)
```json
{
  "codeString": "JUNIOR100"
}
```
**Headers:** `x-user-id: user-junior-1`

**Expected Response (400):**
```json
{
  "error": "You have already redeemed this code"
}
```

### Test Case 3: Senior พยายามแลก Code สำหรับ Junior (❌ ควรล้มเหลว)
```json
{
  "codeString": "JUNIOR100"
}
```
**Headers:** `x-user-id: user-senior-1`

**Expected Response (403):**
```json
{
  "error": "This code is only for junior role"
}
```

### Test Case 4: แลก Code ที่ไม่มีอยู่ (❌ ควรล้มเหลว)
```json
{
  "codeString": "NOTEXIST"
}
```
**Headers:** `x-user-id: user-junior-1`

**Expected Response (404):**
```json
{
  "error": "Code not found"
}
```

### Test Case 5: ทุกคนแลก Code "all" ได้ (✅ ควรสำเร็จ)
**สร้าง Code สำหรับทุกคนก่อน:**
```
POST /api/code/generate
Headers: x-user-id: user-admin-1
Body:
{
  "codeString": "FORALL",
  "targetRole": "all",
  "activityName": "รางวัลทั้งค่าย",
  "rewardCoin": 50,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

**แลก Code (Junior):**
```
POST /api/code/redeem
Headers: x-user-id: user-junior-1
Body: {"codeString": "FORALL"}
```
✅ Success - Junior ได้ 50 coins

**แลก Code (Senior):**
```
POST /api/code/redeem
Headers: x-user-id: user-senior-1
Body: {"codeString": "FORALL"}
```
✅ Success - Senior ได้ 50 coins

---

## 🎯 Complete Test Flow

### ขั้นตอนทดสอบทั้งหมด:

1. **Health Check**
   ```
   GET http://localhost:8080/health
   ```

2. **Mod สร้าง Code สำหรับ Junior**
   ```
   POST /api/code/generate
   Headers: x-user-id: user-mod-1
   Body: {"codeString": "TEST001", "targetRole": "junior", "activityName": "Test Activity", "rewardCoin": 50, "expiresAt": "2025-12-31T23:59:59.000Z"}
   ```

3. **Junior แลก Code**
   ```
   POST /api/code/redeem
   Headers: x-user-id: user-junior-1
   Body: {"codeString": "TEST001"}
   ```
   ✅ Balance เพิ่มจาก 100 → 150

4. **Junior พยายามแลกซ้ำ**
   ```
   POST /api/code/redeem
   Headers: x-user-id: user-junior-1
   Body: {"codeString": "TEST001"}
   ```
   ❌ Error: "You have already redeemed this code"

5. **Admin สร้าง Code สำหรับ All**
   ```
   POST /api/code/generate
   Headers: x-user-id: user-admin-1
   Body: {"codeString": "GLOBAL", "targetRole": "all", "activityName": "Global Reward", "rewardCoin": 25, "expiresAt": "2025-12-31T23:59:59.000Z"}
   ```

6. **Junior และ Senior แลก Code "all"**
   ```
   POST /api/code/redeem (Junior)
   POST /api/code/redeem (Senior)
   ```
   ✅ ทั้งคู่ได้ coins

---

## 📊 ตรวจสอบข้อมูลใน Database

### เช็คยอด Wallet
```bash
docker exec cucm25-db psql -U postgres -d cucm25db -c "SELECT user_id, coin_balance FROM wallets;"
```

### เช็ค Codes ที่สร้าง
```bash
docker exec cucm25-db psql -U postgres -d cucm25db -c "SELECT id, code_string, target_role, activity_name, reward_coin, created_by_user_id FROM codes;"
```

### เช็ค Redemptions
```bash
docker exec cucm25-db psql -U postgres -d cucm25db -c "SELECT user_id, code_id, redeemed_at FROM code_redemptions;"
```

### เช็ค Transactions (Audit Trail)
```bash
docker exec cucm25-db psql -U postgres -d cucm25db -c "SELECT id, type, recipient_user_id, coin_amount, related_code_id, created_at FROM transactions WHERE type = 'CODE_REDEMPTION';"
```

---

## 🔥 Quick Postman Collection JSON

นำ JSON นี้ไป Import ใน Postman:

```json
{
  "info": {
    "name": "CUCM25 Code Management",
    "_postman_id": "cucm25-code-api",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:8080/health"
      }
    },
    {
      "name": "Generate Code (Moderator)",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-user-id", "value": "user-mod-1"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"codeString\": \"WELCOME2025\",\n  \"targetRole\": \"junior\",\n  \"activityName\": \"กิจกรรมต้อนรับน้องใหม่\",\n  \"rewardCoin\": 50,\n  \"expiresAt\": \"2025-12-31T23:59:59.000Z\"\n}"
        },
        "url": "http://localhost:8080/api/code/generate"
      }
    },
    {
      "name": "Generate Code (Admin - All Roles)",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-user-id", "value": "user-admin-1"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"codeString\": \"ALLCAMP2025\",\n  \"targetRole\": \"all\",\n  \"activityName\": \"กิจกรรมทั้งค่าย\",\n  \"rewardCoin\": 100,\n  \"expiresAt\": \"2025-12-31T23:59:59.000Z\"\n}"
        },
        "url": "http://localhost:8080/api/code/generate"
      }
    },
    {
      "name": "Redeem Code (Junior)",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-user-id", "value": "user-junior-1"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"codeString\": \"WELCOME2025\"\n}"
        },
        "url": "http://localhost:8080/api/code/redeem"
      }
    },
    {
      "name": "Redeem Code (Senior)",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-user-id", "value": "user-senior-1"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"codeString\": \"ALLCAMP2025\"\n}"
        },
        "url": "http://localhost:8080/api/code/redeem"
      }
    }
  ]
}
```

---

## 3️⃣ System Control API (Admin Only)

### Get System Status
```
GET http://localhost:8080/api/system/status
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "juniorLoginEnabled": true,
    "seniorLoginEnabled": true,
    "giftHourlyQuota": 5,
    "lastUpdated": "2025-10-30T..."
  }
}
```

### Toggle System Settings (Admin Only)

#### Disable Junior Login
```
POST http://localhost:8080/api/system/toggle
Headers: 
  Content-Type: application/json
  x-user-id: user-admin-1
Body:
{
  "settingKey": "junior_login_enabled",
  "enabled": false
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Setting junior_login_enabled updated to disabled",
    "settingKey": "junior_login_enabled", 
    "enabled": false,
    "updatedAt": "2025-10-30T..."
  }
}
```

#### Enable Junior Login
```
POST http://localhost:8080/api/system/toggle
Headers:
  Content-Type: application/json
  x-user-id: user-admin-1
Body:
{
  "settingKey": "junior_login_enabled",
  "enabled": true
}
```

#### Test System Availability
หลังจาก disable junior_login_enabled แล้ว ลอง login ด้วย junior role:

```
POST http://localhost:8080/api/code/generate
Headers: x-user-role: junior
```

**Expected Response (503):**
```json
{
  "error": "System is currently unavailable. Please try again later.",
  "systemStatus": "disabled"
}
```

### Available Setting Keys:
- `"junior_login_enabled"` - เปิด/ปิดสำหรับน้องค่าย
- `"senior_login_enabled"` - เปิด/ปิดสำหรับพี่ค่าย  
- `"gift_hourly_quota"` - quota การส่งของขวัญ

---

## ✅ Acceptance Criteria Checklist

### Event Code Management
- [x] `/code/generate` endpoint with role-based permissions
- [x] Code metadata: creator, coin value, group eligibility, expiration
- [x] `/code/redeem` endpoint for users
- [x] Prevent reuse of same code (composite PK in `code_redemptions`)
- [x] Log all actions for audit trail (transactions table with type='CODE_REDEMPTION')

### System Control API
- [x] Endpoint: `/system/toggle` (enable/disable system)
- [x] System status returned in `/system/status`
- [x] All core APIs check system availability before processing requests

---

## 🐛 Troubleshooting

### Server ไม่ทำงาน
```bash
# ตรวจสอบ logs
docker logs cucm25-db
# ตรวจสอบ connection
docker exec cucm25-db psql -U postgres -d cucm25db -c "SELECT 1;"
```

### Database connection error
```bash
# เช็ค .env file
cat .env
# ต้องเป็น: DATABASE_URL="postgresql://postgres:1212312121@localhost:5432/cucm25db?schema=public"
```

### TypeScript errors
```bash
# Regenerate Prisma Client
npx prisma generate
# Restart server
npm run dev
```
