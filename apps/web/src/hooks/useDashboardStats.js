import { useState, useEffect } from 'react';
import { properties, bills, payments } from '../lib/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLast6Months() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES[d.getMonth()] });
  }
  return months;
}

function computeStats(propertiesList, billsList, paymentsList) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // --- Bill aggregations ---
  let totalCollected = 0;
  let totalCollectedAllTime = 0;
  let pending = 0;
  let overdue = 0;
  const overdueBills = [];

  for (const bill of billsList) {
    const amount = Number(bill.totalAmount) || 0;
    if (bill.status === 'PAID') {
      totalCollectedAllTime += amount;
      // Check if paid in current calendar month via dueDate (best proxy available)
      const d = bill.dueDate ? new Date(bill.dueDate) : null;
      if (d && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        totalCollected += amount;
      }
    } else if (bill.status === 'PENDING') {
      pending += amount;
    } else if (bill.status === 'OVERDUE') {
      overdue += amount;
      overdueBills.push(bill);
    }
  }

  // --- Properties aggregations ---
  const propertiesCount = propertiesList.length;
  const unitsCount = propertiesList.reduce((sum, p) => sum + (p._count?.units || 0), 0);

  // occupiedCount: derive from non-OVERDUE, non-cancelled bills as a proxy; default 0
  // A unit with an active PENDING or PAID bill this month is likely occupied
  const occupiedUnitIds = new Set();
  for (const bill of billsList) {
    if ((bill.status === 'PENDING' || bill.status === 'PAID') && bill.tenancy?.unitId) {
      const d = bill.dueDate ? new Date(bill.dueDate) : null;
      if (d && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        occupiedUnitIds.add(bill.tenancy.unitId);
      }
    }
  }
  const occupiedCount = occupiedUnitIds.size;

  // --- Pending payments ---
  const pendingPayments = paymentsList.filter(p => p.status === 'PENDING');

  // --- Collection trend: last 6 months of PAID bills ---
  const last6 = getLast6Months();
  const trendMap = {};
  for (const m of last6) {
    trendMap[`${m.year}-${m.month}`] = { month: m.label, amount: 0 };
  }

  for (const bill of billsList) {
    if (bill.status === 'PAID' && bill.dueDate) {
      const d = new Date(bill.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (trendMap[key] !== undefined) {
        trendMap[key].amount += Number(bill.totalAmount) || 0;
      }
    }
  }

  const collectionTrend = last6.map(m => trendMap[`${m.year}-${m.month}`]);

  return {
    stats: {
      totalCollected,
      totalCollectedAllTime,
      pending,
      overdue,
      propertiesCount,
      unitsCount,
      occupiedCount,
    },
    pendingPayments,
    overdueBills,
    collectionTrend,
  };
}

export function useDashboardStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    stats: {
      totalCollected: 0,
      totalCollectedAllTime: 0,
      pending: 0,
      overdue: 0,
      propertiesCount: 0,
      unitsCount: 0,
      occupiedCount: 0,
    },
    pendingPayments: [],
    overdueBills: [],
    collectionTrend: getLast6Months().map(m => ({ month: m.label, amount: 0 })),
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const [propertiesRes, billsRes, paymentsRes] = await Promise.all([
          properties.list(),
          bills.list(),
          payments.list(),
        ]);

        if (!cancelled) {
          const propArr = Array.isArray(propertiesRes)
            ? propertiesRes
            : propertiesRes?.properties || [];
          const billArr = Array.isArray(billsRes)
            ? billsRes
            : billsRes?.bills || [];
          const payArr = Array.isArray(paymentsRes)
            ? paymentsRes
            : paymentsRes?.payments || [];

          const computed = computeStats(propArr, billArr, payArr);
          setData(computed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading, error, ...data };
}
