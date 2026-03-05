"use client";

import { useEffect, useState } from "react";
import { Clock, GitPullRequest, CheckCircle, Loader } from "lucide-react";

interface Stats {
  stars: number;
  lastFeature: string | null;
  queued: number;
  inProgress: number;
  completed: number;
  lastHour: number;
}

export default function QueueTracker() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/galaxy/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.queued}
          </div>
          <div className="text-sm text-blue-300/70">In Queue</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.inProgress}
          </div>
          <div className="text-sm text-blue-300/70">In Progress</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.completed}
          </div>
          <div className="text-sm text-blue-300/70">Completed</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Requests This Hour</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{stats.lastHour}</div>
            <div className="text-xs text-blue-300/70">Last 60 minutes</div>
          </div>
        </div>
        <div className="mt-2 text-sm text-blue-300/70">
          Tracking all requests in the database
        </div>
      </div>
    </div>
  );
}
