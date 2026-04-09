// services/vitalsSaver.js
const VitalSigns = require('../models/VitalSigns');
const User = require('../models/User');

// ✅ NEW: Condition check function
const getPatientCondition = (heartRate, oxygenLevel) => {
  const hr = heartRate || 75;
  const sp = oxygenLevel || 98;

  if (hr > 150 || hr < 40 || sp < 90) return 'critical';
  if (hr > 120 || hr < 50 || sp < 94) return 'abnormal';
  return 'normal';
};

// ✅ NEW: Interval by condition
const getNextFetchInterval = (condition) => {
  switch (condition) {
    case 'critical': return 5 * 60 * 1000;
    case 'abnormal': return 15 * 60 * 1000;
    default:         return 60 * 60 * 1000;
  }
};

// ========== CONFIGURATION ==========
const SAVE_INTERVAL = 5 * 60 * 1000; // Default fallback

// ========== AUTO-SAVE VITALS SERVICE ==========
class VitalsSaverService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    // ✅ NEW
    this.currentCondition = 'normal';
    this.currentInterval = 60 * 60 * 1000;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Vitals saver service is already running');
      return;
    }

    console.log('🚀 Starting vitals auto-save service (adaptive mode)...');
    this.isRunning = true;

    // Save immediately on start
    this.saveVitalsForAllUsers();

    // ✅ NEW: Dynamic schedule
    this.scheduleNext();

    console.log('✅ Vitals auto-save service started successfully');
  }

  // ✅ NEW: Dynamic scheduling
  scheduleNext() {
    if (this.intervalId) clearTimeout(this.intervalId);

    console.log(`⏱️ Next save in: ${this.currentInterval / 60000} min (${this.currentCondition})`);

    this.intervalId = setTimeout(async () => {
      await this.saveVitalsForAllUsers();
      if (this.isRunning) this.scheduleNext();
    }, this.currentInterval);
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Vitals auto-save service stopped');
    }
  }

  async saveVitalsForAllUsers() {
    try {
      const users = await User.find({ status: 'Active' });

      if (users.length === 0) {
        console.log('ℹ️ No active users found');
        return;
      }

      console.log(`\n📈 Saving vitals for ${users.length} active user(s)...`);

      let savedCount = 0;
      let errorCount = 0;
      let worstCondition = 'normal'; // ✅ NEW

      for (const user of users) {
        try {
          const result = await this.saveVitalsForUser(user._id);
          savedCount++;

          // ✅ NEW: Worst condition track karo
          if (result.condition === 'critical') {
            worstCondition = 'critical';
          } else if (result.condition === 'abnormal' && worstCondition !== 'critical') {
            worstCondition = 'abnormal';
          }
        } catch (error) {
          console.error(`❌ Error saving vitals for user ${user._id}:`, error.message);
          errorCount++;
        }
      }

      // ✅ NEW: Interval update karo
      const newInterval = getNextFetchInterval(worstCondition);
      if (newInterval !== this.currentInterval) {
        console.log(`🔄 Interval changed: ${this.currentCondition} → ${worstCondition}`);
        this.currentCondition = worstCondition;
        this.currentInterval = newInterval;
      }

      const timestamp = new Date().toLocaleTimeString();
      console.log(`✅ [${timestamp}] Saved: ${savedCount} success, ${errorCount} errors | Condition: ${worstCondition}`);

    } catch (error) {
      console.error('❌ Error in saveVitalsForAllUsers:', error);
    }
  }

  async saveVitalsForUser(userId) {
    // ✅ NEW: Latest vitals se real data lo (random nahi)
    const latestVital = await VitalSigns.findOne({ userId })
      .sort({ timestamp: -1 })
      .limit(1);

    const heartRate = latestVital?.heartRate || 75;
    const oxygenLevel = latestVital?.oxygenLevel || 98;

    // ✅ NEW: Condition check
    const condition = getPatientCondition(heartRate, oxygenLevel);

    const vitalSigns = new VitalSigns({
      userId: userId,
      heartRate: latestVital?.heartRate,
      temperature: latestVital?.temperature,
      oxygenLevel: latestVital?.oxygenLevel,
      ecgRating: latestVital?.ecgRating,
      bloodPressure: latestVital?.bloodPressure,
      steps: latestVital?.steps,
      calories: latestVital?.calories,
      condition,       // ✅ NEW
      timestamp: new Date(),
    });

    await vitalSigns.save();

    if (condition !== 'normal') {
      await User.findByIdAndUpdate(userId, {
        $inc: { alerts: 1 }
      });
      console.log(`⚠️ Alert! User ${userId} | Condition: ${condition}`);
    }

    return { vitalSigns, condition }; // ✅ NEW: condition return karo
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentCondition: this.currentCondition,           // ✅ NEW
      saveInterval: `${this.currentInterval / 60000} minutes`, // ✅ updated
      nextSave: this.isRunning
        ? new Date(Date.now() + this.currentInterval).toLocaleTimeString()
        : 'Not scheduled',
    };
  }
}

const vitalsSaverService = new VitalsSaverService();

module.exports = vitalsSaverService;