// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate random password with only upper/lowercase letters (no numbers/special chars)
const generatePassword = (length = 10) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const all = upper + lower;
  let password = '';
  // Ensure at least one uppercase and one lowercase
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  for (let i = 2; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Check if current time is within IST window (10:00 AM - 11:00 AM)
const isPaymentTimeAllowed = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes >= 600 && totalMinutes < 660; // 10:00 AM to 11:00 AM IST
};

// Check if mobile login time is allowed (10:00 AM - 1:00 PM IST)
const isMobileLoginAllowed = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes >= 600 && totalMinutes < 780; // 10:00 AM to 1:00 PM IST
};

// Parse user agent
const parseUserAgent = (ua = '') => {
  let browser = 'Other';
  let os = 'Unknown';
  let device = 'desktop';

  if (/chrome/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua)) browser = 'Chrome';
  else if (/edg/i.test(ua) || /msie/i.test(ua) || /trident/i.test(ua)) browser = 'Microsoft';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opr/i.test(ua)) browser = 'Opera';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';

  if (/mobile|android|iphone/i.test(ua)) device = 'mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'tablet';
  else device = 'desktop';

  return { browser, os, device };
};

// Subscription plan question limits
const getPlanLimit = (plan) => {
  const limits = { free: 1, bronze: 5, silver: 10, gold: Infinity };
  return limits[plan] || 1;
};

// Invoice number generator
const generateInvoiceNumber = () => {
  const ts = Date.now().toString().slice(-8);
  return `INV-${ts}`;
};

module.exports = {
  generateOTP,
  generatePassword,
  isPaymentTimeAllowed,
  isMobileLoginAllowed,
  parseUserAgent,
  getPlanLimit,
  generateInvoiceNumber
};
