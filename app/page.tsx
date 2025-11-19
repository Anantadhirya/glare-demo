"use client";

import { useEffect, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

type LeaderboardEntry = {
  name: string;
  similarity: number;
};

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const image_topic = process.env.NEXT_PUBLIC_IMAGE_TOPIC || "";
  const result_topic = process.env.NEXT_PUBLIC_RESULT_TOPIC || "";

  useEffect(() => {
    // Connect via WebSocket
    const client: MqttClient = mqtt.connect(
      process.env.NEXT_PUBLIC_MQTT_URL || ""
    );

    client.on("connect", () => {
      setIsConnected(true);
      client.subscribe(image_topic);
      client.subscribe(result_topic);
    });

    client.on("disconnect", () => {
      setIsConnected(false);
    });

    client.on("message", (topic, payload) => {
      if (topic === image_topic) {
        // Handle image
        const blob = new Blob([payload as BlobPart], { type: "image/jpeg" });
        setImageUrl(URL.createObjectURL(blob));
      } else if (topic === result_topic) {
        const text = payload.toString();

        try {
          const parsed = JSON.parse(text);
          console.log("Parsed result:", parsed);
          if (parsed.result) {
            setResult(parsed.result);
          }
          if (parsed.leaderboard) {
            setLeaderboard(parsed.leaderboard);
          }
        } catch {
          // If not JSON, keep as plain text
          setMessages((prev) => [...prev, text]);
        }
      }
    });

    return () => {
      client.end();
    };
  }, [image_topic, result_topic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="GLARE Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                GLARE
              </h1>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                } ${isConnected ? "animate-pulse-slow" : ""}`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  isConnected
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Image Display */}
          <div className="lg:col-span-1">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Live Feed
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="aspect-[3/4] relative bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden shadow-inner">
                {imageUrl ? (
                  <div className="w-[133%] h-[75%] origin-top-left object-contain transition-all duration-300 hover:scale-105 absolute top-full rotate-[-90deg]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Live feed from camera"
                      className="w-full h-full object-contain transition-all duration-300 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <svg
                      className="h-16 w-16 mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium">
                      Waiting for camera feed...
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                      Images will appear here when available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recognition Result */}
            {result && (
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Recognition Result
                      </p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-100">
                        {result}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Similarities
                  </h2>
                </div>

                <div className="space-y-3">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0
                              ? "bg-yellow-500 text-white"
                              : i === 1
                              ? "bg-gray-400 text-white"
                              : i === 2
                              ? "bg-amber-600 text-white"
                              : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full w-16">
                          <div
                            className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${entry.similarity * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[3rem] text-right">
                          {(entry.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Messages */}
            {messages.length > 0 && (
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    System Messages
                  </h2>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50"
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {msg}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Card */}
            {!result && (
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    About
                  </h2>
                </div>

                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <p>Real-time image recognition system using MQTT protocol.</p>
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                    <span>Live camera feed processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                    <span>AI-powered recognition</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                    <span>Real-time leaderboard</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
