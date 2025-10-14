const axios = require('axios');
const { checkDatabaseHealth } = require('./src/utils/dbUtils');

/**
 * Health monitoring script for the Shardeum Quest backend
 * Monitors API health, database connectivity, and system resources
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const CHECK_INTERVAL = process.env.CHECK_INTERVAL || 60000; // 30 seconds

class HealthMonitor {
  constructor() {
    this.failures = 0;
    this.maxFailures = 5;
    this.alerts = [];
  }

  async checkAPIHealth() {
    try {
      const response = await axios.get(`${API_URL}/api/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.logSuccess('API Health Check', response.data);
        this.failures = 0; // Reset failure count
        return true;
      } else {
        throw new Error(`API returned status: ${response.status}`);
      }
    } catch (error) {
      this.logError('API Health Check Failed', error.message);
      this.failures++;
      return false;
    }
  }

  async checkDatabaseHealth() {
    try {
      const dbHealth = await checkDatabaseHealth();
      
      if (dbHealth.status === 'healthy') {
        this.logSuccess('Database Health Check', dbHealth);
        return true;
      } else {
        throw new Error(`Database unhealthy: ${dbHealth.error}`);
      }
    } catch (error) {
      this.logError('Database Health Check Failed', error.message);
      return false;
    }
  }

  async performHealthCheck() {
    console.log(`\n🔍 Health Check - ${new Date().toISOString()}`);
    console.log('=' .repeat(50));

    const apiHealthy = await this.checkAPIHealth();
    const dbHealthy = await this.checkDatabaseHealth();

    const overallHealth = apiHealthy && dbHealthy;
    
    if (!overallHealth) {
      console.log(`⚠️  System unhealthy - Failures: ${this.failures}/${this.maxFailures}`);
      
      if (this.failures >= this.maxFailures) {
        await this.handleCriticalFailure();
      }
    } else {
      console.log('✅ All systems operational');
    }

    return overallHealth;
  }

  async handleCriticalFailure() {
    console.log('🚨 CRITICAL: Maximum failures reached!');
    
    // Log critical alert
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'CRITICAL_FAILURE',
      message: `System has failed ${this.failures} consecutive health checks`,
      action: 'Manual intervention required'
    };
    
    this.alerts.push(alert);
    console.error('🔥 ALERT:', JSON.stringify(alert, null, 2));

    // In production, you might want to:
    // 1. Send alerts to monitoring service (Datadog, New Relic, etc.)
    // 2. Send notifications (email, Slack, etc.)
    // 3. Attempt automatic recovery (restart services, etc.)
    
    // For now, we'll just log and continue monitoring
    console.log('📧 Alert logged. Continuing monitoring...');
  }

  logSuccess(check, data) {
    console.log(`✅ ${check}:`, {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
    });
  }

  logError(check, error) {
    console.error(`❌ ${check}:`, {
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      error: error,
      failures: this.failures
    });
  }

  async start() {
    console.log('🎯 Starting Health Monitor...');
    console.log(`📍 API URL: ${API_URL}`);
    console.log(`⏱️  Check Interval: ${CHECK_INTERVAL}ms`);
    console.log(`🚨 Max Failures: ${this.maxFailures}`);
    
    // Initial health check
    await this.performHealthCheck();
    
    // Set up periodic monitoring
    setInterval(async () => {
      await this.performHealthCheck();
    }, CHECK_INTERVAL);

    console.log('🔄 Health monitoring started. Press Ctrl+C to stop.');
  }

  getStats() {
    return {
      failures: this.failures,
      maxFailures: this.maxFailures,
      alerts: this.alerts.length,
      lastCheck: new Date().toISOString()
    };
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new HealthMonitor();
  monitor.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down health monitor...');
    console.log('📊 Final Stats:', monitor.getStats());
    process.exit(0);
  });
}

module.exports = HealthMonitor;