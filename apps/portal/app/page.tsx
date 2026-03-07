"use client";

import { useState, useEffect } from "react";
import { Star, Sparkles, Zap, Clock, Menu, X } from "lucide-react";
import RequestForm from "@/components/RequestForm";
import QueueTracker from "@/components/QueueTracker";
import GalaxyViewer from "@/components/GalaxyViewer";

interface Stats {
  stars: number;
  lastFeature: string | null;
  queue: number;
}

interface FlowStatus {
  id: number;
  issue_id: number;
  method: string;
  updatedAt: string;
  stories: Array<{
    id: number;
    title: string;
    description: string;
  }>;
  task: string;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<"craft" | "queue" | "galaxy">(
    "craft",
  );
  const [stats, setStats] = useState<Stats>({
    stars: 0,
    lastFeature: null,
    queue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [flowStatus, setFlowStatus] = useState<FlowStatus[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function getTimeDelta(timestamp: string): string {
    const diff = currentTime.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/galaxy/stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchFlowStatus() {
      try {
        const response = await fetch("/api/flow/status");
        if (!response.ok) return;
        const data: FlowStatus[] = await response.json();
        setFlowStatus(data);
      } catch (error) {
        console.error("Failed to fetch flow status:", error);
      }
    }

    fetchFlowStatus();
    const interval = setInterval(fetchFlowStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen galaxy-gradient text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎪</div>
              <a
                onClick={() => setCurrentView("craft")}
                className="cursor-pointer"
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  chaoscraft
                </h1>
                <p className="text-sm text-blue-300/70 hidden sm:block">
                  Pay $1 → Watch chaos unfold
                </p>
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <nav className="hidden md:flex gap-2">
              <button
                onClick={() => setCurrentView("craft")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === "craft"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Craft
              </button>
              <button
                onClick={() => setCurrentView("queue")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === "queue"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => setCurrentView("galaxy")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === "galaxy"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Galaxy
              </button>
              <a
                type="button"
                href="https://chaoscraft.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
              >
                🌪️Chaos
              </a>
            </nav>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  setCurrentView("craft");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg transition-all text-left ${
                  currentView === "craft"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Craft
              </button>
              <button
                onClick={() => {
                  setCurrentView("queue");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg transition-all text-left ${
                  currentView === "queue"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => {
                  setCurrentView("galaxy");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg transition-all text-left ${
                  currentView === "galaxy"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Galaxy
              </button>
              <a
                href="https://chaoscraft.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
              >
                🌪️Chaos
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {currentView === "craft" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-4">
                <Star className="w-8 h-8 text-yellow-400 animate-pulse-slow" />
                <Sparkles
                  className="w-6 h-6 text-purple-400 animate-pulse-slow"
                  style={{ animationDelay: "0.5s" }}
                />
                <Star
                  className="w-8 h-8 text-blue-400 animate-pulse-slow"
                  style={{ animationDelay: "1s" }}
                />
              </div>
              <h2 className="text-4xl font-bold mb-2">
                What do you want to build?
              </h2>
              <p className="text-xl text-blue-200/70">
                120 characters max. One star at a time.
              </p>
            </div>

            <RequestForm />
          </div>
        )}

        {currentView === "queue" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Build Queue</h2>
              <p className="text-blue-200/70">
                Watch the chaos unfold in real-time
              </p>
            </div>

            <QueueTracker />
          </div>
        )}

        {currentView === "galaxy" && (
          <div className="h-[calc(100vh-200px)]">
            <GalaxyViewer />
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-sm h-auto md:h-10">
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-8 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
              <span className="text-white/70">
                Galaxy:{" "}
                <span className="text-white font-semibold">
                  {loading ? "..." : stats.stars}
                </span>{" "}
                stars
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
              <span className="text-white/70">
                Last:{" "}
                <span
                  className="text-white font-semibold cursor-help max-w-[120px] md:max-w-none truncate"
                  title={loading ? "Loading..." : stats.lastFeature || "None"}
                >
                  {loading
                    ? "..."
                    : stats.lastFeature
                      ? `${stats.lastFeature.slice(0, 15)}${stats.lastFeature.length > 15 ? "..." : ""}`
                      : "None"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
              <span className="text-white/70">
                Queue:{" "}
                <span className="text-white font-semibold">
                  {loading ? "..." : stats.queue}
                </span>{" "}
                pending
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Console Log Entry */}
      <div className="fixed bottom-10 left-0 right-0 border-t border-white/5 bg-black/30 backdrop-blur-sm md:max-h-32 max-h-20 overflow-y-auto">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col gap-1 text-xs font-mono text-white/60">
            {flowStatus.length > 0 ? (
              flowStatus.map((status, idx) => (
                <div key={status.id} className="flex items-start gap-2">
                  <span
                    className={idx === 0 ? "text-green-400" : "text-white/30"}
                  >
                    &gt;
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          idx === 0 ? "text-blue-400" : "text-white/40"
                        }
                      >
                        [{status.method.toUpperCase()}]
                      </span>
                      <span
                        className={
                          idx === 0 ? "text-white/80" : "text-white/40"
                        }
                      >
                        #{status.issue_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          idx === 0
                            ? "text-white/70 font-semibold"
                            : "text-white/40"
                        }
                      >
                        {status.task}
                      </span>
                      {status.method == "implement_story" &&
                        status.stories.length > 0 && (
                          <span
                            className={
                              idx === 0
                                ? "text-white/50 truncate"
                                : "text-white/20 truncate"
                            }
                          >
                            {status.stories[0].description}
                          </span>
                        )}
                    </div>
                  </div>
                  <span className="text-white/40 whitespace-nowrap mt-1">
                    {getTimeDelta(status.updatedAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white/40">Waiting for chaos...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
