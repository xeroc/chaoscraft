"use client";

import { useState } from "react";
import { Star, Sparkles, Zap, Clock } from "lucide-react";
import RequestForm from "@/components/RequestForm";
import QueueTracker from "@/components/QueueTracker";
import GalaxyViewer from "@/components/GalaxyViewer";

export default function Home() {
  const [currentView, setCurrentView] = useState<"craft" | "queue" | "galaxy">(
    "craft",
  );

  return (
    <main className="min-h-screen galaxy-gradient text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎪</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  chaoscraft
                </h1>
                <p className="text-sm text-blue-300/70">
                  Pay $1 → Watch chaos unfold
                </p>
              </div>
            </div>

            <nav className="flex gap-2">
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
                href="https://app.chaoscraft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
              >
                Chaos
              </a>
            </nav>
          </div>
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
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white/70">
                Current Galaxy:{" "}
                <span className="text-white font-semibold" id="star-count">
                  142
                </span>{" "}
                stars
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-white/70">
                Last Feature:{" "}
                <span className="text-white font-semibold" id="last-feature">
                  Dancing robot
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-white/70">
                Queue:{" "}
                <span className="text-white font-semibold" id="queue-count">
                  23
                </span>{" "}
                pending
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
