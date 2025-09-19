# Shardeum Quest API Documentation

## 🌐 Base URL
- **Production**: `https://shardeum-quest-eight.vercel.app`
- **Local Development**: `http://localhost:3001`

## 📋 Table of Contents
1. [Health & Status](#health--status)
2. [Authentication](#authentication)
3. [Quests](#quests)
4. [Users (Public)](#users-public)
5. [Users (Authenticated)](#users-authenticated)
6. [Progress (Public)](#progress-public)
7. [Progress (Authenticated)](#progress-authenticated)
8. [Error Codes](#error-codes)

---

## Health & Status

### 🔍 Health Check
**Endpoint**: `GET /api/health`  
**Description**: Check API and database health  
**Authentication**: None

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-09-18T16:13:25.957Z",
  "environment": "production",
  "platform": "vercel",
  "database": "connected",
  "region": "iad1",
  "mongoUri": "SET"
}
```

### 🧪 Simple API Test
**Endpoint**: `GET /api/test`  
**Description**: Test API without database (debug endpoint)  
**Authentication**: None

**Response**:
```json
{
  "status": "OK",
  "message": "API is working",
  "timestamp": "2025-09-18T16:11:30.651Z",
  "platform": "vercel",
  "environment": "production",
  "mongoUriSet": true,
  "jwtSecretSet": true
}
```

### 🔌 Database Test
**Endpoint**: `GET /api/db-test`  
**Description**: Test database connection and operations  
**Authentication**: None

**Response**:
```json
{
  "status": "DB_CONNECTION_SUCCESS",
  "timestamp": "2025-09-18T16:13:31.178Z",
  "database": {
    "status": "connected",
    "readyState": 1,
    "name": "tip-dapp",
    "host": "ac-88elrm6-shard-00-01.ldxyoqv.mongodb.net"
  },
  "userCount": 2,
  "mongoUri": "SET"
}
```

---

## Authentication

### 🔐 Login with Wallet
**Endpoint**: `POST /api/auth/login`  
**Description**: Authenticate user with wallet signature  
**Rate Limit**: 50 requests per 15 minutes  
**Authentication**: Signature verification

**Request Body**:
```json
{
  "message": "Sign this message to authenticate with ShardeumQuest\nTimestamp: 1726681200000",
  "signature": "0x1234567890abcdef...",
  "address": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68cc20847745614ea96da5a9",
    "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
    "totalXP": 250,
    "completedQuests": 2,
    "achievements": 1
  }
}
```

### ✅ Verify Token
**Endpoint**: `POST /api/auth/verify`  
**Description**: Verify JWT token validity  
**Authentication**: Bearer token

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "user": {
    "id": "68cc20847745614ea96da5a9",
    "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
    "totalXP": 250
  }
}
```

---

## Quests

### 📚 Get All Quests
**Endpoint**: `GET /api/quests`  
**Description**: Get all available quests  
**Authentication**: None

**Response**:
```json
[
  {
    "id": 1,
    "title": "Welcome to DeFi",
    "description": "Complete your first transaction on Shardeum",
    "xpReward": 100,
    "category": "beginner",
    "estimatedTime": "10 minutes"
  },
  {
    "id": 2,
    "title": "Token Explorer", 
    "description": "Learn about ERC-20 tokens and standards",
    "xpReward": 150,
    "category": "intermediate",
    "estimatedTime": "15 minutes"
  }
]
```

### 📖 Get Quest Details
**Endpoint**: `GET /api/quests/:id`  
**Description**: Get specific quest details  
**Authentication**: None

**Parameters**:
- `id` (path): Quest ID (1-5)

**Response**:
```json
{
  "id": 1,
  "title": "Welcome to DeFi",
  "description": "Complete your first transaction on Shardeum",
  "xpReward": 100,
  "category": "beginner",
  "estimatedTime": "10 minutes",
  "steps": [
    {
      "id": 1,
      "title": "Connect Your Wallet",
      "description": "Connect your MetaMask wallet to Shardeum",
      "completed": false
    }
  ]
}
```

### 📝 Get Quest Content
**Endpoint**: `GET /api/quests/:id/content`  
**Description**: Get detailed quest content, tutorials, and quiz  
**Authentication**: None

**Parameters**:
- `id` (path): Quest ID (1-5)

**Response**:
```json
{
  "content": "# Welcome to DeFi on Shardeum!\n\n## What is DeFi?\nDecentralized Finance...",
  "quiz": [
    {
      "question": "What does DeFi stand for?",
      "options": ["Digital Finance", "Decentralized Finance", "Direct Finance", "Distributed Finance"],
      "correct": 1
    }
  ]
}
```

---

## Users (Public)

### 👤 Get User Profile
**Endpoint**: `GET /api/public/users/profile/:walletAddress`  
**Description**: Get or create user profile by wallet address  
**Authentication**: None

**Parameters**:
- `walletAddress` (path): User's wallet address

**Response**:
```json
{
  "id": "68cc20847745614ea96da5a9",
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
  "username": "nickk'z",
  "totalXP": 250,
  "completedQuests": [
    {
      "questId": 1,
      "completedAt": "2025-09-18T15:22:13.722Z",
      "xpEarned": 100,
      "_id": "68cc23a5143766b83dad5420"
    }
  ],
  "achievements": [],
  "registeredAt": "2025-09-18T15:08:52.959Z",
  "lastActiveAt": "2025-09-18T15:22:38.082Z"
}
```

### 🎯 Check User Interaction
**Endpoint**: `GET /api/public/users/interaction/:walletAddress`  
**Description**: Check if user has interacted with dapp and show completed quests  
**Authentication**: None

**Parameters**:
- `walletAddress` (path): User's wallet address

**Response (User exists)**:
```json
{
  "hasInteracted": true,
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
  "username": "nickk'z",
  "totalXP": 250,
  "completedQuests": [
    {
      "questId": 1,
      "completedAt": "2025-09-18T15:22:13.722Z",
      "xpEarned": 100,
      "questName": "Welcome to DeFi"
    },
    {
      "questId": 2,
      "completedAt": "2025-09-18T16:17:01.426Z",
      "xpEarned": 150,
      "questName": "Token Explorer"
    }
  ],
  "questsCompleted": 2,
  "registeredAt": "2025-09-18T15:08:52.959Z",
  "lastActiveAt": "2025-09-18T15:22:38.082Z"
}
```

**Response (User doesn't exist)**:
```json
{
  "hasInteracted": false,
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "totalXP": 0,
  "completedQuests": [],
  "questsCompleted": 0
}
```

### 🏆 Get Leaderboard
**Endpoint**: `GET /api/public/users/leaderboard`  
**Description**: Get XP leaderboard  
**Authentication**: None

**Query Parameters**:
- `limit` (optional): Number of users to return (default: 20, max: 100)
- `offset` (optional): Number of users to skip (default: 0)

**Example**: `GET /api/public/users/leaderboard?limit=10&offset=0`

**Response**:
```json
{
  "users": [
    {
      "rank": 1,
      "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
      "username": "nickk'z",
      "totalXP": 250,
      "completedQuests": 2,
      "achievements": 0
    }
  ],
  "total": 2,
  "page": 0,
  "totalPages": 1
}
```

### 📊 Get Platform Statistics
**Endpoint**: `GET /api/public/users/stats`  
**Description**: Get platform-wide statistics  
**Authentication**: None

**Response**:
```json
{
  "totalUsers": 2,
  "totalXP": 250,
  "totalQuestsCompleted": 2,
  "timestamp": "2025-09-18T15:52:15.106Z"
}
```

### ✅ Check User Exists
**Endpoint**: `GET /api/public/users/exists/:walletAddress`  
**Description**: Check if user exists in the system  
**Authentication**: None

**Parameters**:
- `walletAddress` (path): User's wallet address

**Response**:
```json
{
  "exists": true,
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9"
}
```

### ✏️ Update Username
**Endpoint**: `PUT /api/public/users/profile/:walletAddress`  
**Description**: Update username without authentication  
**Rate Limit**: 20 requests per 5 minutes  
**Authentication**: None

**Parameters**:
- `walletAddress` (path): User's wallet address

**Request Body**:
```json
{
  "username": "new_username"
}
```

**Response**:
```json
{
  "id": "68cc20847745614ea96da5a9",
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
  "username": "new_username",
  "totalXP": 250,
  "completedQuests": [...],
  "achievements": [],
  "registeredAt": "2025-09-18T15:08:52.959Z",
  "lastActiveAt": "2025-09-18T15:22:38.082Z"
}
```

---

## Users (Authenticated)

### 👤 Get My Profile
**Endpoint**: `GET /api/users/profile`  
**Description**: Get authenticated user's profile  
**Authentication**: Bearer token required

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**: Same as public profile endpoint

### ✏️ Update My Profile
**Endpoint**: `PUT /api/users/profile`  
**Description**: Update authenticated user's profile  
**Rate Limit**: 20 requests per 5 minutes  
**Authentication**: Bearer token required

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body**:
```json
{
  "username": "new_username"
}
```

**Response**: Same as public profile endpoint

---

## Progress (Public)

### 📈 Get User Progress
**Endpoint**: `GET /api/public/progress/user/:walletAddress`  
**Description**: Get user's quest progress by wallet address  
**Authentication**: None

**Parameters**:
- `walletAddress` (path): User's wallet address

**Response**:
```json
{
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
  "totalXP": 250,
  "completedQuests": [
    {
      "questId": 1,
      "completedAt": "2025-09-18T15:22:13.722Z",
      "xpEarned": 100,
      "_id": "68cc23a5143766b83dad5420"
    }
  ],
  "activeProgress": []
}
```

### ✅ Check Quest Status
**Endpoint**: `GET /api/public/progress/quest/:questId/status`  
**Description**: Check if a specific quest is completed by a user  
**Authentication**: None

**Parameters**:
- `questId` (path): Quest ID (1-5)

**Query Parameters**:
- `walletAddress` (required): User's wallet address

**Example**: `GET /api/public/progress/quest/1/status?walletAddress=0x24901d...`

**Response (Completed)**:
```json
{
  "completed": true,
  "questId": 1,
  "xpEarned": 100,
  "completedAt": "2025-09-18T15:22:13.722Z"
}
```

**Response (Not completed)**:
```json
{
  "completed": false,
  "questId": 1
}
```

### 🕒 Get Recent Completions
**Endpoint**: `GET /api/public/progress/recent-completions`  
**Description**: Get recent quest completions across all users  
**Authentication**: None

**Query Parameters**:
- `limit` (optional): Number of completions to return (default: 10)

**Example**: `GET /api/public/progress/recent-completions?limit=5`

**Response**:
```json
[
  {
    "questId": 2,
    "xpEarned": 150,
    "completedAt": "2025-09-18T16:17:01.426Z",
    "user": {
      "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
      "username": "nickk'z"
    }
  }
]
```

### 🚀 Start Quest
**Endpoint**: `POST /api/public/progress/start/:questId`  
**Description**: Start a quest without authentication  
**Authentication**: None

**Parameters**:
- `questId` (path): Quest ID (1-5)

**Request Body**:
```json
{
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9"
}
```

**Response**:
```json
{
  "questId": 1,
  "status": "in_progress",
  "steps": [
    {
      "id": 1,
      "completed": false
    },
    {
      "id": 2,
      "completed": false
    }
  ],
  "startedAt": "2025-09-18T16:30:00.000Z"
}
```

### 📝 Update Quest Progress
**Endpoint**: `PUT /api/public/progress/update/:questId`  
**Description**: Update quest step completion  
**Authentication**: None

**Parameters**:
- `questId` (path): Quest ID (1-5)

**Request Body**:
```json
{
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
  "stepId": 1,
  "completed": true
}
```

**Response**:
```json
{
  "questId": 1,
  "status": "in_progress",
  "steps": [
    {
      "id": 1,
      "completed": true,
      "completedAt": "2025-09-18T16:35:00.000Z"
    },
    {
      "id": 2,
      "completed": false
    }
  ],
  "updatedAt": "2025-09-18T16:35:00.000Z"
}
```

### 🎉 Complete Quest
**Endpoint**: `POST /api/public/progress/complete/:questId`  
**Description**: Complete a quest and award XP  
**Authentication**: None

**Parameters**:
- `questId` (path): Quest ID (1-5)

**Request Body**:
```json
{
  "walletAddress": "0x24901d3adeaed9cd53b7d7b6154caf7afd4648b9",
  "transactionHash": "0xabcdef1234567890...",
  "blockchainVerified": true
}
```

**Response**:
```json
{
  "message": "Quest completed successfully",
  "xpEarned": 100,
  "totalXP": 350,
  "transactionHash": "0xabcdef1234567890...",
  "completedAt": "2025-09-18T16:40:00.000Z"
}
```

---

## Progress (Authenticated)

All authenticated progress endpoints require:
```
Authorization: Bearer <jwt_token>
```

### 🚀 Start Quest (Auth)
**Endpoint**: `POST /api/progress/start/:questId`  
**Description**: Start a quest (authenticated version)  
**Authentication**: Bearer token required

**Response**: Same as public version

### 📝 Update Progress (Auth)
**Endpoint**: `PUT /api/progress/update/:questId`  
**Description**: Update quest progress (authenticated version)  
**Authentication**: Bearer token required

**Request Body**:
```json
{
  "stepId": 1,
  "completed": true
}
```

### 🎉 Complete Quest (Auth)
**Endpoint**: `POST /api/progress/complete/:questId`  
**Description**: Complete quest with enhanced features  
**Authentication**: Bearer token required

**Request Body**:
```json
{
  "transactionHash": "0xabcdef1234567890..."
}
```

**Response**:
```json
{
  "message": "Quest completed successfully",
  "xpEarned": 100,
  "totalXP": 350,
  "achievements": [
    {
      "id": 1,
      "name": "DeFi Novice",
      "unlockedAt": "2025-09-18T16:40:00.000Z"
    }
  ],
  "transactionHash": "0xabcdef1234567890...",
  "completedAt": "2025-09-18T16:40:00.000Z"
}
```

### 📊 Get My Progress
**Endpoint**: `GET /api/progress/user`  
**Description**: Get authenticated user's complete progress  
**Authentication**: Bearer token required

**Response**:
```json
{
  "totalXP": 250,
  "completedQuests": [
    {
      "questId": 1,
      "completedAt": "2025-09-18T15:22:13.722Z",
      "xpEarned": 100
    }
  ],
  "activeProgress": [
    {
      "questId": 3,
      "status": "in_progress",
      "steps": [...]
    }
  ],
  "achievements": []
}
```

### ✅ Verify Quest Completion
**Endpoint**: `GET /api/progress/verify/:questId`  
**Description**: Verify quest completion on blockchain  
**Authentication**: Bearer token required

**Parameters**:
- `questId` (path): Quest ID (1-5)

**Response**:
```json
{
  "questId": 1,
  "blockchainStatus": "completed",
  "databaseStatus": "completed",
  "synced": true,
  "transactionHash": "0xabcdef1234567890...",
  "blockNumber": 12345678
}
```

---

## Error Codes

### Common HTTP Status Codes

| Code | Description | Example Response |
|------|-------------|------------------|
| 200 | Success | `{"status": "OK"}` |
| 400 | Bad Request | `{"error": "Missing required fields"}` |
| 401 | Unauthorized | `{"error": "Access token required"}` |
| 403 | Forbidden | `{"error": "Invalid or expired token"}` |
| 404 | Not Found | `{"error": "User not found"}` |
| 408 | Request Timeout | `{"error": "Request timeout"}` |
| 429 | Too Many Requests | `{"error": "Too many requests, please try again later.", "retryAfter": "15 minutes"}` |
| 500 | Internal Server Error | `{"error": "Internal server error"}` |
| 503 | Service Unavailable | `{"error": "Database temporarily unavailable"}` |

### Quest-Specific Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `Quest already completed` | User trying to complete same quest twice | Check completion status first |
| `Quest not found` | Invalid quest ID provided | Use quest IDs 1-5 |
| `Progress not found` | Quest not started yet | Start quest first with `/start` endpoint |
| `All steps must be completed` | Trying to complete quest with incomplete steps | Complete all quest steps |
| `Invalid signature` | Wallet signature verification failed | Re-sign with correct wallet |
| `User not found` | Wallet address not in system | User needs to interact with dapp first |

### Rate Limiting

| Endpoint Type | Limit | Window | Error Message |
|---------------|-------|--------|---------------|
| General API | 2000 requests | 15 minutes | `"Too many requests, please try again later."` |
| Authentication | 50 requests | 15 minutes | `"Too many authentication attempts, please try again later."` |
| Profile Updates | 20 requests | 5 minutes | `"Too many profile updates, please wait a moment."` |

---

## 📝 Notes

1. **Wallet Addresses**: Always use lowercase format
2. **Quest IDs**: Valid range is 1-5
3. **XP Rewards**: Quest 1=100, Quest 2=150, Quest 3=200, Quest 4=250, Quest 5=300
4. **Rate Limits**: Apply per IP address
5. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
6. **Authentication**: JWT tokens expire after 7 days
7. **Database**: Uses MongoDB with optimistic locking for concurrent updates
8. **Blockchain**: Integrates with Shardeum Unstablenet (Chain ID: 8080)

---

## 🔗 Quick Reference

**Most Used Endpoints**:
- Check user interaction: `GET /api/public/users/interaction/:walletAddress`
- Complete quest: `POST /api/public/progress/complete/:questId`
- Get leaderboard: `GET /api/public/users/leaderboard`
- Update username: `PUT /api/public/users/profile/:walletAddress`
- Health check: `GET /api/health`

**Authentication Flow**:
1. Connect wallet → 2. Sign message → 3. `POST /api/auth/login` → 4. Use JWT token

**Quest Flow**:
1. `POST /api/public/progress/start/:questId` → 2. `PUT /api/public/progress/update/:questId` (for each step) → 3. `POST /api/public/progress/complete/:questId`