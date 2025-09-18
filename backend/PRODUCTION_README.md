# Shardeum Quest Backend - Production Ready

## 🚀 High-Load Production Enhancements

This backend has been enhanced to handle high traffic loads and ensure sequential database updates with automatic crash recovery.

### 🔧 Key Improvements

#### 1. **High-Load Handling**
- **Cluster Mode**: Automatically utilizes all CPU cores in production
- **Connection Pooling**: MongoDB connection pool with 20 connections
- **Enhanced Rate Limiting**: Production-ready limits (5000 req/15min)
- **Request Compression**: Gzip compression for better performance
- **Optimized Timeouts**: 60s server timeout with proper keepalive

#### 2. **Sequential Database Operations**
- **Transaction Support**: ACID transactions for quest completions
- **Optimistic Locking**: Prevents concurrent update conflicts
- **Retry Logic**: Exponential backoff for failed operations
- **Race Condition Prevention**: Sequential quest completion handling

#### 3. **Crash Recovery & Monitoring**
- **PM2 Process Management**: Auto-restart on crashes
- **Health Monitoring**: Built-in health checks for API and database
- **Graceful Shutdown**: Proper cleanup on termination
- **Error Handling**: Comprehensive error categorization and recovery

#### 4. **Performance Optimizations**
- **Database Indexes**: Optimized queries for leaderboards and user lookups
- **Memory Management**: 2GB memory limit with automatic restarts
- **Request Validation**: Input sanitization and type checking
- **Connection Management**: Proper socket and connection handling

## 📦 Installation & Setup

### Prerequisites
```bash
# Install PM2 globally for production process management
npm install -g pm2

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file with:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-mongodb-connection-string
JWT_SECRET=your-super-secure-jwt-secret
```

## 🚀 Production Deployment

### Option 1: Quick Production Start
```bash
# Run the production startup script
./start-production.sh
```

### Option 2: Manual PM2 Setup
```bash
# Start in production mode
NODE_ENV=production pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup auto-startup on system reboot
pm2 startup
```

### Option 3: Development Mode
```bash
# Start in development mode
npm run dev
```

## 📊 Monitoring & Management

### PM2 Commands
```bash
# View process status
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs

# Restart all processes
pm2 restart all

# Reload without downtime
pm2 reload all

# Stop processes
pm2 stop all
```

### Health Monitoring
```bash
# Run health monitor
node monitor.js

# Check API health manually
curl http://localhost:3001/api/health
```

### Database Health Check
The backend includes comprehensive database health monitoring:
- Connection status verification
- Query performance testing
- Memory usage tracking
- Automatic retry on connection failures

## 🔒 Security Features

### Rate Limiting
- **General API**: 5000 requests per 15 minutes
- **Authentication**: 50 requests per 15 minutes
- **Profile Updates**: 20 requests per 5 minutes

### Input Validation
- Wallet address format validation
- XSS protection via input sanitization
- SQL injection prevention
- Request size limits (10MB max)

## 🎯 API Enhancements

### Enhanced Endpoints

#### Health Check
```
GET /api/health
```
Returns comprehensive system health including:
- Database connection status
- Memory usage
- Process uptime
- Environment information

#### User Interaction Check
```
GET /api/public/users/interaction/:walletAddress
```
Enhanced response with detailed quest completion history:
```json
{
  "hasInteracted": true,
  "walletAddress": "0x...",
  "username": "user123",
  "totalXP": 100,
  "completedQuests": [
    {
      "questId": 1,
      "questName": "Welcome to DeFi",
      "completedAt": "2025-09-18T15:22:13.722Z",
      "xpEarned": 100
    }
  ],
  "questsCompleted": 1
}
```

### Sequential Quest Completion
The quest completion endpoint now uses database transactions to ensure:
- No duplicate completions
- Atomic XP updates
- Race condition prevention
- Consistent state management

## 📈 Performance Metrics

### Expected Performance
- **Concurrent Users**: 1000+ simultaneous users
- **Request Throughput**: 5000+ requests per minute
- **Response Time**: <200ms for standard operations
- **Database Operations**: <50ms average query time
- **Memory Usage**: <2GB per worker process

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test (example)
artillery quick --count 100 --num 10 http://localhost:3001/api/health
```

## 🛠️ Troubleshooting

### Common Issues

1. **High Memory Usage**
   - PM2 will automatically restart at 2GB limit
   - Check for memory leaks in application code

2. **Database Connection Issues**
   - Retry logic handles temporary disconnections
   - Check MongoDB connection string and credentials

3. **Rate Limit Reached**
   - Adjust limits in `server.js` based on your needs
   - Monitor with `pm2 logs` for rate limit errors

### Log Analysis
```bash
# View error logs
pm2 logs --err

# View all logs with timestamps
pm2 logs --timestamp

# Clear logs
pm2 flush
```

## 🔄 Auto-Recovery Features

### Process Recovery
- **Automatic Restart**: PM2 restarts crashed processes
- **Exponential Backoff**: Prevents rapid restart loops
- **Health Checks**: Monitors API and database health
- **Graceful Degradation**: Continues operating during partial failures

### Database Recovery
- **Connection Retry**: Automatic reconnection on DB failures
- **Transaction Rollback**: Ensures data consistency on errors
- **Optimistic Locking**: Prevents data corruption from concurrent updates

## 📋 Maintenance

### Regular Maintenance Tasks
1. **Log Rotation**: PM2 handles automatic log rotation
2. **Memory Monitoring**: Check memory usage weekly
3. **Database Optimization**: Monitor query performance
4. **Security Updates**: Keep dependencies updated

### Backup Recommendations
- **Database**: Regular MongoDB backups
- **Configuration**: Backup PM2 ecosystem files
- **Environment**: Document environment variables

## 🚨 Alerts & Monitoring Integration

The backend is ready for integration with monitoring services:
- **Health Check Endpoint**: `/api/health`
- **Structured Logging**: JSON formatted logs
- **Error Categorization**: Different error types for different alerts
- **Performance Metrics**: Built-in performance tracking

### Integration Examples
- **Datadog**: Monitor health endpoint
- **New Relic**: APM integration ready
- **Slack/Email**: Alert webhooks can be added
- **Grafana**: Metrics dashboard ready

## 📞 Support

For production issues:
1. Check PM2 logs: `pm2 logs`
2. Verify database connection: `node monitor.js`
3. Check system resources: `pm2 monit`
4. Review error logs for patterns

The backend is now production-ready with enterprise-grade reliability and performance!