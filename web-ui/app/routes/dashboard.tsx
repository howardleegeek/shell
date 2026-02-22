import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@remix-run/react';
import { isAnalyticsEnabled, optInAnalytics, optOutAnalytics } from '../lib/services/analytics';

type Stats = {
  today: number;
  week: number;
  month: number;
};

function fetchDashboardStats(): Stats {
  try {
    const raw = localStorage.getItem('bolt_dashboard_events');
    const events: { timestamp: number }[] = raw ? (JSON.parse(raw) as any[]) : [];
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const startTodayTs = startToday.getTime();
    const weekAgo = now - 7 * msInDay;
    const monthAgo = now - 30 * msInDay;

    const today = events.filter((e) => e.timestamp >= startTodayTs).length;
    const week = events.filter((e) => e.timestamp >= weekAgo).length;
    const month = events.filter((e) => e.timestamp >= monthAgo).length;
    return { today, week, month };
  } catch {
    return { today: 0, week: 0, month: 0 };
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ today: 0, week: 0, month: 0 });
  const [enabled, setEnabled] = useState<boolean>(isAnalyticsEnabled());

  useEffect(() => {
    setStats(fetchDashboardStats());
  }, []);

  const toggleAnalytics = async () => {
    // Optimistic toggle; real state is updated by the analytics module
    if (enabled) {
      optOutAnalytics();
      setEnabled(false);
    } else {
      optInAnalytics();
      setEnabled(true);
    }
  };

  const statusText = useMemo(() => (enabled ? 'Enabled' : 'Disabled'), [enabled]);

  return (
    <div className="p-6 space-y-6 bg-bolt-elements-background-depth-1 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bolt Analytics Dashboard</h1>
        <button
          onClick={toggleAnalytics}
          className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-sm"
          aria-label="Toggle analytics"
        >
          Analytics: {statusText}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-sm text-gray-500">Today events</div>
          <div className="text-2xl font-bold">{stats.today}</div>
        </div>
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-sm text-gray-500">Last 7 days</div>
          <div className="text-2xl font-bold">{stats.week}</div>
        </div>
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-sm text-gray-500">Last 30 days</div>
          <div className="text-2xl font-bold">{stats.month}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/">Back to home</Link>
      </div>
      <p className="text-sm text-gray-600">Note: This dashboard uses client-side counts stored in your browser for privacy. It complements the PostHog integration but does not expose sensitive data.</p>
    </div>
  );
}
