const cron = require('node-cron');
const User = require('./models/User');

const startCronJobs = () => {
  // Daily reset at midnight IST (18:30 UTC)
  cron.schedule('30 18 * * *', async () => {
    console.log('[CRON] Running daily reset at midnight IST...');
    try {
      const result = await User.updateMany(
        {},
        {
          $set: {
            'subscription.questionsPostedToday': 0,
            'subscription.lastResetDate': new Date(),
            socialPostsToday: 0,
            socialPostsLastReset: new Date()
          }
        }
      );
      console.log(`[CRON] Reset ${result.modifiedCount} users' daily counters`);
    } catch (err) {
      console.error('[CRON] Error in daily reset:', err.message);
    }
  });

  // Check expired subscriptions every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking expired subscriptions...');
    try {
      const result = await User.updateMany(
        {
          'subscription.plan': { $ne: 'free' },
          'subscription.expiresAt': { $lt: new Date() }
        },
        { $set: { 'subscription.plan': 'free' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[CRON] Downgraded ${result.modifiedCount} expired subscriptions to free`);
      }
    } catch (err) {
      console.error('[CRON] Error checking subscriptions:', err.message);
    }
  });

  console.log('[CRON] All cron jobs scheduled');
};

module.exports = { startCronJobs };
