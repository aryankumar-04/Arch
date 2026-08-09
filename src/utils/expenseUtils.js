/**
 * Utility helpers for Expenses, Recurring Expenses, and Savings Goals
 */

/**
 * Normalizes any frequency amount to its monthly-equivalent cost.
 * Weekly x 4.33, Monthly x 1, Quarterly / 3, Half-Yearly / 6, Yearly / 12
 */
export const getMonthlyEquivalent = (amount, frequency) => {
  const num = Number(amount || 0);
  switch (frequency) {
    case 'Weekly':
      return num * 4.33;
    case 'Quarterly':
      return num / 3;
    case 'Half-Yearly':
      return num / 6;
    case 'Yearly':
      return num / 12;
    case 'Monthly':
    default:
      return num;
  }
};

const advanceDateByFrequency = (dateObj, frequency) => {
  switch (frequency) {
    case 'Weekly':
      dateObj.setDate(dateObj.getDate() + 7);
      break;
    case 'Quarterly':
      dateObj.setMonth(dateObj.getMonth() + 3);
      break;
    case 'Half-Yearly':
      dateObj.setMonth(dateObj.getMonth() + 6);
      break;
    case 'Yearly':
      dateObj.setFullYear(dateObj.getFullYear() + 1);
      break;
    case 'Monthly':
    default:
      dateObj.setMonth(dateObj.getMonth() + 1);
      break;
  }
};

const getFrequencyDays = (frequency) => {
  switch (frequency) {
    case 'Weekly': return 7;
    case 'Quarterly': return 90;
    case 'Half-Yearly': return 182;
    case 'Yearly': return 365;
    case 'Monthly':
    default: return 30;
  }
};

/**
 * Computes upcoming Next Due date and status badge metadata based on renewDate, frequency, and lastPaidDate.
 */
export const calculateNextDueAndStatus = (item) => {
  if (!item || !item.renewDate) {
    return { nextDueDate: null, displayDate: '—', status: 'Unknown', isOverdue: false, isPaid: false, badgeBg: 'var(--bg4)', badgeColor: 'var(--text)' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewDate = new Date(item.renewDate);
  renewDate.setHours(0, 0, 0, 0);

  const frequency = item.frequency || 'Monthly';
  const lastPaidDate = item.lastPaidDate ? new Date(item.lastPaidDate) : null;

  let nextDue = new Date(renewDate);

  // If lastPaidDate exists, advance nextDue past lastPaidDate
  if (lastPaidDate) {
    const paidTime = new Date(lastPaidDate);
    paidTime.setHours(0, 0, 0, 0);
    while (nextDue <= paidTime) {
      advanceDateByFrequency(nextDue, frequency);
    }
  }

  // Check if paid in current cycle
  let isPaidForCurrentCycle = false;
  if (lastPaidDate) {
    const paidTime = new Date(lastPaidDate);
    paidTime.setHours(0, 0, 0, 0);

    if (frequency === 'Monthly') {
      isPaidForCurrentCycle = (
        paidTime.getFullYear() === today.getFullYear() &&
        paidTime.getMonth() === today.getMonth()
      );
    } else if (frequency === 'Weekly') {
      const daysDiff = Math.floor((today.getTime() - paidTime.getTime()) / (1000 * 60 * 60 * 24));
      isPaidForCurrentCycle = daysDiff >= 0 && daysDiff < 7;
    } else if (frequency === 'Yearly') {
      isPaidForCurrentCycle = paidTime.getFullYear() === today.getFullYear();
    } else {
      const daysDiff = Math.floor((today.getTime() - paidTime.getTime()) / (1000 * 60 * 60 * 24));
      isPaidForCurrentCycle = daysDiff >= 0 && daysDiff < getFrequencyDays(frequency);
    }
  }

  if (!isPaidForCurrentCycle) {
    while (nextDue < today) {
      break;
    }
  }

  const timeDiff = nextDue.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  let statusText = '';
  let badgeBg = '#F1F5F9';
  let badgeColor = '#0F172A';
  let isOverdue = false;

  if (isPaidForCurrentCycle) {
    statusText = 'Paid';
    badgeBg = '#D1FAE5';
    badgeColor = '#065F46';
  } else if (daysDiff < 0) {
    statusText = 'Overdue';
    badgeBg = '#FEE2E2';
    badgeColor = '#991B1B';
    isOverdue = true;
  } else if (daysDiff === 0) {
    statusText = 'Due Today';
    badgeBg = '#FFEDD5';
    badgeColor = '#9A3412';
  } else if (daysDiff === 1) {
    statusText = 'Due Tomorrow';
    badgeBg = '#FFEDD5';
    badgeColor = '#9A3412';
  } else {
    statusText = `${daysDiff} Days Left`;
    badgeBg = '#FEF3C7';
    badgeColor = '#92400E';
  }

  const formatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const displayDate = nextDue.toLocaleDateString('en-GB', formatOptions);

  return {
    nextDueDate: nextDue,
    displayDate,
    status: statusText,
    daysLeft: daysDiff,
    badgeBg,
    badgeColor,
    isOverdue,
    isPaid: isPaidForCurrentCycle
  };
};

/**
 * Keyword-based brand/category icon resolver for recurring expenses and savings goals.
 */
export const getExpenseIconSymbol = (name = '', category = '', iconUrl = '') => {
  if (iconUrl && typeof iconUrl === 'string' && (iconUrl.startsWith('http') || iconUrl.startsWith('data:'))) {
    return { type: 'img', url: iconUrl };
  }

  const lowerName = String(name).toLowerCase();
  const lowerCat = String(category).toLowerCase();

  // Keyword Brand & Service Mapping
  if (lowerName.includes('netflix')) return { type: 'emoji', symbol: '🔴', label: 'N' };
  if (lowerName.includes('spotify')) return { type: 'emoji', symbol: '🟢', label: '🎧' };
  if (lowerName.includes('rent') || lowerName.includes('house') || lowerName.includes('home')) return { type: 'emoji', symbol: '🏠', label: '🏠' };
  if (lowerName.includes('google') || lowerName.includes('cloud') || lowerName.includes('drive')) return { type: 'emoji', symbol: '☁️', label: '☁️' };
  if (lowerName.includes('gym') || lowerName.includes('fitness')) return { type: 'emoji', symbol: '🏋️', label: '🏋️' };
  if (lowerName.includes('laptop') || lowerName.includes('pc') || lowerName.includes('macbook')) return { type: 'emoji', symbol: '💻', label: '💻' };
  if (lowerName.includes('trip') || lowerName.includes('travel') || lowerName.includes('goa') || lowerName.includes('flight')) return { type: 'emoji', symbol: '🌴', label: '🌴' };
  if (lowerName.includes('electricity') || lowerName.includes('power')) return { type: 'emoji', symbol: '⚡', label: '⚡' };
  if (lowerName.includes('internet') || lowerName.includes('wifi')) return { type: 'emoji', symbol: '🌐', label: '🌐' };
  if (lowerName.includes('phone') || lowerName.includes('mobile')) return { type: 'emoji', symbol: '📱', label: '📱' };
  if (lowerName.includes('insurance')) return { type: 'emoji', symbol: '🛡️', label: '🛡️' };
  if (lowerName.includes('coffee') || lowerName.includes('cafe')) return { type: 'emoji', symbol: '☕', label: '☕' };

  // Category Fallbacks
  if (lowerCat.includes('food')) return { type: 'emoji', symbol: '🍔', label: '🍔' };
  if (lowerCat.includes('transport')) return { type: 'emoji', symbol: '🚗', label: '🚗' };
  if (lowerCat.includes('college')) return { type: 'emoji', symbol: '🎓', label: '🎓' };
  if (lowerCat.includes('entertainment')) return { type: 'emoji', symbol: '🎬', label: '🎬' };
  if (lowerCat.includes('goal') || lowerCat.includes('saving')) return { type: 'emoji', symbol: '🎯', label: '🎯' };

  return { type: 'emoji', symbol: '💳', label: '💳' };
};
