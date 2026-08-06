/**
 * Utility to calculate 8 calendar week buckets ending at the current week.
 * Bucket 0 = 7 weeks ago (W1), Bucket 7 = Current week (W8 / This Wk).
 * Each bucket contains startStr and endStr (YYYY-MM-DD) for clean comparison.
 */
export const getPast8WeeksBuckets = () => {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const distanceToMon = (currentDayOfWeek + 6) % 7; // days since Monday

  const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMon);
  currentWeekStart.setHours(0, 0, 0, 0);

  const buckets = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const formatYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    buckets.push({
      label: `W${8 - i}`,
      startStr: formatYMD(weekStart),
      endStr: formatYMD(weekEnd)
    });
  }

  return buckets;
};

/**
 * Groups an array of items (having a .date or .createdAt field) into 8 weekly buckets.
 */
export const groupItemsBy8Weeks = (items = [], dateFieldGetter = null) => {
  const buckets = getPast8WeeksBuckets();

  const result = buckets.map(b => ({
    label: b.label,
    startStr: b.startStr,
    endStr: b.endStr,
    value: 0
  }));

  if (!Array.isArray(items) || items.length === 0) {
    return result;
  }

  items.forEach(item => {
    if (!item) return;

    let itemDateStr = null;
    if (typeof dateFieldGetter === 'function') {
      itemDateStr = dateFieldGetter(item);
    } else if (item.date) {
      itemDateStr = String(item.date).split('T')[0];
    } else if (item.createdAt) {
      if (typeof item.createdAt.toDate === 'function') {
        itemDateStr = item.createdAt.toDate().toISOString().split('T')[0];
      } else {
        itemDateStr = String(item.createdAt).split('T')[0];
      }
    }

    if (!itemDateStr) return;

    // Find matching week bucket
    const targetBucket = result.find(b => itemDateStr >= b.startStr && itemDateStr <= b.endStr);
    if (targetBucket) {
      targetBucket.value += 1;
    }
  });

  return result;
};

/**
 * Sums expense amounts (item.amount) grouped by 8 weekly calendar buckets.
 */
export const groupExpensesBy8Weeks = (expenses = []) => {
  const buckets = getPast8WeeksBuckets();

  const result = buckets.map(b => ({
    label: b.label,
    startStr: b.startStr,
    endStr: b.endStr,
    value: 0
  }));

  if (!Array.isArray(expenses) || expenses.length === 0) {
    return result;
  }

  expenses.forEach(e => {
    if (!e) return;
    const dateStr = e.date ? String(e.date).split('T')[0] : (e.createdAt ? String(e.createdAt).split('T')[0] : null);
    if (!dateStr) return;

    const targetBucket = result.find(b => dateStr >= b.startStr && dateStr <= b.endStr);
    if (targetBucket) {
      targetBucket.value += Number(e.amount || 0);
    }
  });

  return result;
};
