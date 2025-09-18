# Vercel Deployment Guide - Shardeum Quest Backend

## 🚀 Vercel Deployment Setup

This guide will help you deploy the Shardeum Quest backend to Vercel with all the high-load optimizations.

### 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Database**: 
   - MongoDB Atlas (recommended for production)
   - Or any MongoDB connection string
3. **Environment Variables**: Ready to configure

### 🔧 Vercel Configuration

The backend is optimized for Vercel serverless with:
- **Serverless Functions**: Auto-scaling based on demand
- **Connection Pooling**: Optimized for serverless cold starts
- **Request Timeouts**: 8s timeout (within Vercel's 10s limit)
- **Enhanced Error Handling**: Vercel-specific error responses
- **CORS Configuration**: Production-ready CORS setup

### 📦 Deployment Steps

#### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from backend directory**:
```bash
cd backend
vercel
```

4. **Follow the prompts**:
   - Link to existing project? `N` (for new deployment)
   - Project name: `shardeum-quest-backend`
   - Directory: `./` (current directory)
   - Override settings? `N`

#### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**:
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

2. **Connect GitHub to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Set Root Directory to `backend`
   - Deploy

### ⚙️ Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

**Required Variables:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shardeumquest
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

**Optional Variables:**
```env
VERCEL_REGION=iad1
PORT=3001
```

### 🔐 MongoDB Atlas Setup (Recommended)

1. **Create MongoDB Atlas Account**: [mongodb.com/atlas](https://mongodb.com/atlas)

2. **Create a Cluster**:
   - Choose Free Tier (M0)
   - Select region closest to your users
   - Create cluster

3. **Create Database User**:
   - Database Access → Add New User
   - Username/Password authentication
   - Grant `readWrite` permissions

4. **Configure Network Access**:
   - Network Access → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0` (for Vercel)

5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your actual password

### 🎯 API Endpoints

After deployment, your API will be available at:
```
https://your-project-name.vercel.app/api/
```

**Key Endpoints:**
- `GET /api/health` - Health check
- `GET /api/public/users/interaction/:walletAddress` - Check user interaction
- `POST /api/public/progress/complete/:questId` - Complete quest
- `GET /api/quests` - Get all quests
- `GET /api/public/users/leaderboard` - Get leaderboard

### 📊 Performance Optimizations

#### Serverless Optimizations
- **Connection Caching**: MongoDB connections cached across invocations
- **Smaller Connection Pool**: 5 connections (optimal for serverless)
- **Faster Timeouts**: 3s server selection, 10s socket timeout
- **Request Compression**: Gzip compression enabled
- **Memory Efficient**: Optimized for Vercel's memory limits

#### Rate Limiting
- **Production Limits**: 2000 requests per 15 minutes
- **Auth Limits**: 50 authentication attempts per 15 minutes
- **Profile Updates**: 20 updates per 5 minutes

### 🔄 Database Connection Handling

The Vercel deployment includes smart connection management:

```javascript
// Connection caching for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection; // Reuse existing connection
  }
  // Create new connection with optimized settings
}
```

### 🛠️ Local Development vs Production

#### Local Development:
```bash
npm run dev
# Runs with nodemon, full cluster mode disabled
```

#### Production (Vercel):
- Automatic scaling based on traffic
- Serverless function per request
- Connection pooling and caching
- Enhanced error handling and logging

### 📈 Monitoring & Debugging

#### Vercel Dashboard
- **Functions**: Monitor function executions and errors
- **Analytics**: Track request patterns and response times
- **Logs**: View real-time function logs

#### Health Check Monitoring
```bash
# Check deployment health
curl https://your-project-name.vercel.app/api/health
```

Expected Response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-18T20:00:00.000Z",
  "environment": "production",
  "platform": "vercel",
  "database": "connected",
  "region": "iad1"
}
```

### 🚨 Troubleshooting

#### Common Issues:

1. **Database Connection Timeout**:
   - Check MongoDB Atlas network access settings
   - Verify connection string format
   - Ensure database user has proper permissions

2. **CORS Errors**:
   - Update frontend origin in `api/index.js`
   - Check CORS configuration in `vercel.json`

3. **Function Timeout**:
   - Optimize database queries
   - Check for long-running operations
   - Monitor function execution time in Vercel dashboard

4. **Rate Limit Issues**:
   - Adjust rate limits in `api/index.js`
   - Monitor usage patterns
   - Implement request batching on frontend

#### Debug Commands:
```bash
# View function logs
vercel logs

# Run local development
vercel dev

# Check deployment status
vercel inspect
```

### 🔧 Custom Domain (Optional)

1. **Add Domain in Vercel**:
   - Project Settings → Domains
   - Add your domain
   - Configure DNS records

2. **Update CORS Origins**:
   - Add your custom domain to CORS configuration
   - Update frontend API base URL

### 📝 Environment-Specific Configurations

#### Development:
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shardeumquest
```

#### Production (Vercel):
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...atlas.mongodb.net/shardeumquest
```

### 🎉 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Health check endpoint responding
- [ ] CORS configured for frontend domain
- [ ] Rate limiting configured appropriately
- [ ] Error handling working correctly
- [ ] All API endpoints accessible
- [ ] Frontend can connect to backend

### 📞 Support & Maintenance

**Monitoring**: Set up alerts for function errors and database connectivity
**Scaling**: Vercel auto-scales based on demand
**Updates**: Deploy updates via git push or Vercel CLI
**Backups**: Ensure MongoDB Atlas backups are enabled

Your Shardeum Quest backend is now production-ready on Vercel! 🚀