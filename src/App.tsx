/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Key,
  ChevronRight,
  Presentation,
  Globe,
  Crosshair,
  Moon,
  Sun,
  LogIn,
  LogOut,
  User as UserIcon,
  Check,
} from "lucide-react";
import { UserProvider, useUser } from "./context/UserContext";
import { CIPFInputs } from "./lib/cipf_core";
import ErrorBoundary from "./components/ErrorBoundary";
import ExecutiveSummaryCard from "./components/ExecutiveSummaryCard";
import EscalationTimeline from "./components/EscalationTimeline";
import MarketImpactCard from "./components/MarketImpactCard";
import ActorMatrixCard from "./components/ActorMatrixCard";
import ScenarioProjectionsCard from "./components/ScenarioProjectionsCard";
import VariableExplanationsCard from "./components/VariableExplanationsCard";
import SituationAssessmentCard from "./components/SituationAssessmentCard";
import SectorDecisionCard from "./components/SectorDecisionCard";
import GeographicImpactCard from "./components/GeographicImpactCard";
import OrderEffectsCard from "./components/OrderEffectsCard";
import StrategicQACard from "./components/StrategicQACard";
import DecisionArchitectureCard from "./components/DecisionArchitectureCard";
import SimulationPanel from "./components/SimulationPanel";
import { getCachedResult, setCachedResult } from "./lib/cache";
import { addHistoryEntry } from "./lib/history";
import AnalysisHistory from "./components/AnalysisHistory";
import ActorMap from "./components/ActorMap";
import LiveNewsPanel from "./components/LiveNewsPanel";
import type { AnalysisResponse } from "./types";

// Lazy load the heavy components
const PresentationDeck = lazy(() => import("./components/PresentationDeck"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AuthModal = lazy(() => import("./components/AuthModal"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));

const MAX_CHARS = 5000;
const PROGRESS_STEPS = [
  "Connecting to Server...",
  "Analyzing structure & variables...",
  "Generating deep analysis...",
  "Computing CIPF scores...",
];

function AppContent() {
  const { user, token, logout, loading: authLoading } = useUser();
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");

  // View state: input → progress → results
  const [viewState, setViewState] = useState<"input" | "progress" | "results">(
    "input",
  );

  // Guest form fields
  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCountry, setGuestCountry] = useState("");

  // Simulation State
  const [simInputs, setSimInputs] = useState<CIPFInputs | null>(null);
  const [simResults, setSimResults] = useState<any>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<
    "privacy" | "terms" | "ethics" | null
  >(null);
  const [showPresentation, setShowPresentation] = useState(false);

  // Routing
  const currentPath = window.location.pathname;

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("geostrate_dark") === "true";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("geostrate_dark", String(darkMode));
  }, [darkMode]);

  // Progress step animation during loading
  useEffect(() => {
    if (!loading) {
      setProgressStep(0);
      return;
    }
    const timer = setInterval(() => {
      setProgressStep((prev) =>
        prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev,
      );
    }, 8000);
    return () => clearInterval(timer);
  }, [loading]);

  // Auto-detect stored API key when user logs in
  useEffect(() => {
    if (user && token) {
      fetch("/api/auth/has-key", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.hasKey) {
            setHasStoredKey(true);
            setIsKeySet(true);
          } else {
            setHasStoredKey(false);
          }
        })
        .catch(() => {});
    } else {
      setHasStoredKey(false);
    }
  }, [user, token]);

  const handleConnect = () => {
    if (apiKey.trim().length > 10) {
      setIsKeySet(true);
    }
  };

  // Auto-fill form from logged-in user
  useEffect(() => {
    if (user) {
      if (user.name) setGuestName(user.name);
      if (user.email) setGuestEmail(user.email);
      if (user.mobile) setGuestMobile(user.mobile);
      if (user.country) setGuestCountry(user.country);
    }
  }, [user]);

  const handleAnalyze = async () => {
    // Validate all required fields
    if (!guestName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!guestMobile.trim()) {
      setError("Mobile number is required.");
      return;
    }
    if (!guestEmail.trim()) {
      setError("Email is required.");
      return;
    }
    if (!guestCountry.trim()) {
      setError("Country is required.");
      return;
    }
    if (!apiKey.trim() && !hasStoredKey) {
      setError("API Key is required.");
      return;
    }
    if (!problem.trim()) {
      setError("Strategic Target Input is required.");
      return;
    }
    if (problem.length > MAX_CHARS) {
      setError(`Input too long. Maximum ${MAX_CHARS} characters.`);
      return;
    }

    // Check cache first
    const cached = getCachedResult(problem);
    if (cached) {
      setResults(cached);
      setSimInputs(cached.inputs);
      setSimResults(cached.cipf);
      setViewState("results");
      return;
    }

    setViewState("progress");
    setLoading(true);
    setError("");
    setProgressStep(0);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          apiKey: hasStoredKey ? undefined : apiKey,
          problem: problem.trim(),
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestMobile: guestMobile.trim(),
          guestCountry: guestCountry.trim(),
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          response.ok
            ? "Invalid response from server."
            : `Server error (${response.status}): ${text.substring(0, 200)}`,
        );
      }
      if (!response.ok) throw new Error(data.error || "Failed to analyze");

      setResults(data);
      setSimInputs(data.inputs);
      setSimResults(data.cipf);
      setCachedResult(problem, data);
      const risk = data.parsedData?.executiveSummary?.globalRiskIndicator || 0;
      const psi = data.cipf?.Psi_final || 0;
      addHistoryEntry(problem, risk, psi);
      setViewState("results");
    } catch (err: any) {
      setError(err.message);
      setViewState("input");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!results?.report) return;
    const blob = new Blob([results.report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Geostrate_CIPF_Report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const pd = results?.parsedData;

  if (currentPath === "/admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center text-slate-500">
              Loading Admin...
            </div>
          }
        >
          <AdminPanel onClose={() => (window.location.href = "/")} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-sans selection:bg-blue-500/20">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              Geostrate
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {viewState === "results" && (
              <button
                onClick={() => {
                  setViewState("input");
                  setResults(null);
                }}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-sm"
              >
                ← New Analysis
              </button>
            )}
            {/* Stored key badge (only show in results) */}
            {viewState === "results" && hasStoredKey && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-sm px-3 py-1.5">
                <Key className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Key Active
                </span>
              </div>
            )}
            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => setShowProfile(true)}
                >
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[80px] truncate">
                    {user.name}
                  </span>
                  {user.plan ? (
                    <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
                      {user.plan}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
                      Free
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
            )}
            <img
              src="/logo.png"
              alt="Woxsen University"
              className="h-10 object-contain hidden sm:block"
            />
          </div>
        </div>
      </header>

      {/* ═══════════ INPUT VIEW ═══════════ */}
      {viewState === "input" && (
        <main className="flex-grow px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-[1400px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left Column: About GeostrateQ */}
            <div className="space-y-8 lg:sticky lg:top-24">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4">
                  GeostrateQ{" "}
                  <span className="text-blue-600 dark:text-blue-500">:</span>{" "}
                  Strategic Intelligence for Complex Decisions
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
                  GeostrateQ is an advanced predictive intelligence platform
                  designed to analyze complex environments where multiple
                  actors, institutions, and incentives interact. By combining
                  behavioral analytics, institutional dynamics, network
                  relationships, and structural constraints, the platform
                  converts fragmented signals into structured strategic
                  insights.
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  GeostrateQ helps decision-makers understand who holds
                  influence, how alliances evolve, where risks are emerging, and
                  which scenarios are most likely to unfold. Through actor power
                  mapping, scenario modeling, and impact analysis, the platform
                  enables leaders to navigate uncertainty with greater clarity
                  and foresight.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                  Who benefits from GeostrateQ
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4">
                  GeostrateQ is designed for organizations operating in complex
                  and high-stakes environments, including:
                </p>
                <ul className="space-y-3">
                  {[
                    "Governments and public institutions seeking better geopolitical, policy, and national security insights",
                    "Investors and financial institutions assessing market risks and global economic shifts",
                    "Corporations and strategy teams navigating regulatory change, competition, and global expansion",
                    "Think tanks and research institutions analyzing political, economic, and technological systems",
                    "International organizations and policy advisors involved in negotiations, crisis response, and global governance",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                    >
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                  Key application areas
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4">
                  GeostrateQ supports strategic analysis across a wide range of
                  domains, including:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Geopolitical risk and election analysis",
                    "Financial market and investment risk assessment",
                    "Corporate strategy and regulatory forecasting",
                    "Mergers and acquisitions coordination analysis",
                    "Global negotiations and policy dynamics",
                    "Crisis management and multi-agency coordination",
                    "Technology governance and emerging policy environments",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-3 shadow-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 sm:p-5 rounded-r-sm">
                <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                  By transforming complex data into structured intelligence,
                  GeostrateQ empowers leaders to anticipate change, understand
                  power dynamics, and make more informed strategic decisions in
                  an increasingly uncertain world.
                </p>
              </div>
            </div>

            {/* Right Column: Input Form */}
            <div className="w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto">
              <div className="text-center mb-8">
                {/* <Globe className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-80" /> */}
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Strategic Intelligence Briefing
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  Enter details to generate your analysis
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 shadow-sm space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Your full name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    disabled={!!user?.name}
                  />
                </div>

                {/* Mobile & Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      Mobile No. *
                    </label>
                    <input
                      type="tel"
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="+91 98765 43210"
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value)}
                      disabled={!!user?.mobile}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      Email ID *
                    </label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="you@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      disabled={!!user?.email}
                    />
                  </div>
                </div>

                {/* Country & API Key row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="India"
                      value={guestCountry}
                      onChange={(e) => setGuestCountry(e.target.value)}
                      disabled={!!user?.country}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      Gemini API Key *{" "}
                      {hasStoredKey && (
                        <span className="text-emerald-500 ml-1">(stored)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder={hasStoredKey ? "••••••••" : "Gemini API Key"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={hasStoredKey}
                    />
                  </div>
                </div>

                {/* Strategic Target Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                    <Crosshair className="w-3 h-3 inline mr-1" />
                    Strategic Target Input *
                  </label>
                  <div className="relative">
                    <textarea
                      className="w-full h-32 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm p-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all resize-none font-mono text-xs"
                      placeholder="Enter coordination problem, actors, and context..."
                      value={problem}
                      onChange={(e) =>
                        setProblem(e.target.value.slice(0, MAX_CHARS))
                      }
                      onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === "Enter") handleAnalyze();
                      }}
                    />
                    <span
                      className={`absolute bottom-2 right-2 text-[10px] font-mono ${problem.length > MAX_CHARS * 0.9 ? "text-rose-500" : "text-slate-400"}`}
                    >
                      {problem.length}/{MAX_CHARS}
                    </span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-rose-500 text-xs font-mono">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Intelligence Brief{" "}
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* History */}
                <AnalysisHistory onSelect={setProblem} />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ═══════════ PROGRESS VIEW ═══════════ */}
      {viewState === "progress" && (
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <Globe className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
              Generating Intelligence Brief
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">
              Please wait while we analyze your input
            </p>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 shadow-sm text-left">
              <div className="space-y-4">
                {PROGRESS_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i < progressStep
                        ? "text-emerald-600 dark:text-emerald-400"
                        : i === progressStep
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {i < progressStep ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                          ✓
                        </span>
                      </div>
                    ) : i === progressStep ? (
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="text-slate-300 dark:text-slate-600 text-xs">
                          ○
                        </span>
                      </div>
                    )}
                    <span className="text-xs font-mono font-semibold">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-sm">
                <p className="text-rose-600 dark:text-rose-400 text-xs font-mono">
                  {error}
                </p>
                <button
                  onClick={() => setViewState("input")}
                  className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest"
                >
                  ← Back to Input
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ═══════════ RESULTS VIEW ═══════════ */}
      {viewState === "results" && results && (
        <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Actor Intelligence Map */}
          {results?.parsedData?.part2_ActorArchitecture?.actors?.length ? (
            <div className="mb-6">
              <ActorMap results={results} />
            </div>
          ) : null}

          {/* Live News Feed */}
          {results && problem && (
            <div className="mb-6">
              <LiveNewsPanel query={problem} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Executive Summary */}
            <div className="lg:col-span-4 space-y-6">
              {/* Executive Summary */}
              {pd?.executiveSummary && (
                <ErrorBoundary fallbackTitle="Executive Summary Error">
                  <ExecutiveSummaryCard data={pd.executiveSummary} />
                </ErrorBoundary>
              )}

              {/* Escalation Timeline */}
              {pd?.executiveSummary?.escalationTimeline && (
                <ErrorBoundary fallbackTitle="Escalation Timeline Error">
                  <EscalationTimeline
                    events={pd.executiveSummary.escalationTimeline}
                  />
                </ErrorBoundary>
              )}
            </div>

            {/* Right Column: Dashboards */}
            <div className="lg:col-span-8 space-y-6">
              {results && simResults && simInputs ? (
                <>
                  {/* Top Controls */}
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-sm shadow-sm">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                      System Status:{" "}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Active Monitoring
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPresentation(true)}
                        className="text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-sm uppercase tracking-wider font-bold"
                      >
                        <Presentation className="w-3.5 h-3.5" /> Executive
                        Briefing
                      </button>
                    </div>
                  </div>

                  {/* Dashboard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pd?.part3_MarketImpact?.assets && (
                      <ErrorBoundary fallbackTitle="Market Impact Error">
                        <MarketImpactCard
                          assets={pd.part3_MarketImpact.assets}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.part2_ActorArchitecture?.actors && (
                      <ErrorBoundary fallbackTitle="Actor Matrix Error">
                        <ActorMatrixCard
                          actors={pd.part2_ActorArchitecture.actors}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.part4_Scenarios && (
                      <ErrorBoundary fallbackTitle="Scenario Projections Error">
                        <ScenarioProjectionsCard
                          scenarios={pd.part4_Scenarios}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.variableExplanations && (
                      <ErrorBoundary fallbackTitle="Variable Mapping Error">
                        <VariableExplanationsCard
                          variables={pd.variableExplanations}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.part1_SituationAssessment && (
                      <ErrorBoundary fallbackTitle="Situation Assessment Error">
                        <SituationAssessmentCard
                          data={pd.part1_SituationAssessment}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.part5_SectorDecision?.sectors && (
                      <ErrorBoundary fallbackTitle="Sector Decision Error">
                        <SectorDecisionCard
                          sectors={pd.part5_SectorDecision.sectors}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.part6_GeographicImpact?.regions && (
                      <ErrorBoundary fallbackTitle="Geographic Impact Error">
                        <GeographicImpactCard
                          regions={pd.part6_GeographicImpact.regions}
                        />
                      </ErrorBoundary>
                    )}
                    {pd?.part7_OrderEffects && (
                      <ErrorBoundary fallbackTitle="Order Effects Error">
                        <OrderEffectsCard data={pd.part7_OrderEffects} />
                      </ErrorBoundary>
                    )}
                    {pd?.part8_StrategicQA &&
                      pd.part8_StrategicQA.length > 0 && (
                        <ErrorBoundary fallbackTitle="Strategic QA Error">
                          <StrategicQACard questions={pd.part8_StrategicQA} />
                        </ErrorBoundary>
                      )}
                    {pd?.part9_DecisionArchitecture && (
                      <ErrorBoundary fallbackTitle="Decision Architecture Error">
                        <DecisionArchitectureCard
                          data={pd.part9_DecisionArchitecture}
                        />
                      </ErrorBoundary>
                    )}
                    {simInputs && simResults && (
                      <ErrorBoundary fallbackTitle="Simulation Error">
                        <SimulationPanel
                          inputs={simInputs}
                          results={simResults}
                          onInputsChange={setSimInputs}
                          onResultsChange={setSimResults}
                        />
                      </ErrorBoundary>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[600px] border border-slate-200 dark:border-slate-700 border-dashed rounded-sm flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50">
                  <Globe className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-xs uppercase tracking-widest font-mono">
                    Processing Strategic Data
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-8 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Strategic Intelligence Platform{" "}
            <span className="text-slate-600 dark:text-slate-300 font-bold ml-2">
              v4.0
            </span>
          </div>
          <div className="flex items-center gap-6 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
            <button
              onClick={() => setActiveModal("privacy")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal("terms")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveModal("ethics")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Research Ethics
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                {activeModal === "privacy" && "Privacy Policy"}
                {activeModal === "terms" && "Terms of Service"}
                {activeModal === "ethics" && "Research Ethics"}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-4 leading-relaxed font-mono">
              {activeModal === "privacy" && (
                <>
                  <p>
                    <strong>1. Data Collection:</strong> Geostrate collects
                    coordination problem descriptions and Gemini API keys
                    strictly for the purpose of computing the CIPF v4.0
                    framework. API keys are not stored persistently and are only
                    used during the active session.
                  </p>
                  <p>
                    <strong>2. Data Usage:</strong> The data provided is
                    processed using Google's Gemini API to extract entities and
                    map variables. We do not use your data to train our own
                    models.
                  </p>
                  <p>
                    <strong>3. Third-Party Services:</strong> This application
                    relies on the Google Gemini API. By using this service, you
                    also agree to Google's data processing terms.
                  </p>
                  <p>
                    <strong>4. Security:</strong> We implement reasonable
                    security measures to protect your inputs during transit.
                    However, no internet-based service is 100% secure.
                  </p>
                </>
              )}
              {activeModal === "terms" && (
                <>
                  <p>
                    <strong>1. Acceptance of Terms:</strong> By accessing and
                    using Geostrate, you accept and agree to be bound by the
                    terms and provision of this agreement.
                  </p>
                  <p>
                    <strong>2. Use License:</strong> Permission is granted to
                    temporarily use this application for personal,
                    non-commercial, or academic research purposes.
                  </p>
                  <p>
                    <strong>3. Disclaimer:</strong> The materials on Geostrate
                    are provided on an 'as is' basis. AI Research Centre Woxsen
                    University makes no warranties, expressed or implied, and
                    hereby disclaims and negates all other warranties including,
                    without limitation, implied warranties or conditions of
                    merchantability, fitness for a particular purpose, or
                    non-infringement of intellectual property or other violation
                    of rights.
                  </p>
                  <p>
                    <strong>4. Limitations:</strong> In no event shall AI
                    Research Centre Woxsen University or its suppliers be liable
                    for any damages arising out of the use or inability to use
                    the materials on Geostrate.
                  </p>
                </>
              )}
              {activeModal === "ethics" && (
                <>
                  <p>
                    <strong>1. Purpose:</strong> Geostrate is developed as a
                    research tool to explore Evidence-Based Coordination
                    Intelligence. Its primary goal is to advance academic
                    understanding of complex coordination problems.
                  </p>
                  <p>
                    <strong>2. Bias and Fairness:</strong> The CIPF v4.0 engine
                    and the underlying LLM (Gemini) may exhibit biases present
                    in their training data. Users should interpret the results
                    as analytical aids, not absolute truths.
                  </p>
                  <p>
                    <strong>3. Transparency:</strong> We strive to make the CIPF
                    mathematical framework deterministic and transparent. The
                    variable mapping process, however, relies on probabilistic
                    LLM outputs.
                  </p>
                  <p>
                    <strong>4. Responsible Use:</strong> Users are expected to
                    use this tool responsibly. It should not be used to make
                    critical decisions without human oversight and domain
                    expertise.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (lazy loaded) */}
      {showAuth && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="text-white text-xs uppercase tracking-widest">
                Loading...
              </div>
            </div>
          }
        >
          <AuthModal onClose={() => setShowAuth(false)} />
        </Suspense>
      )}

      {/* Profile Page (lazy loaded) */}
      {showProfile && user && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="text-white text-xs uppercase tracking-widest">
                Loading...
              </div>
            </div>
          }
        >
          <ProfilePage onClose={() => setShowProfile(false)} />
        </Suspense>
      )}

      {/* Presentation / Export Modal (lazy loaded) */}
      {showPresentation && results && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="text-white text-xs uppercase tracking-widest">
                Loading...
              </div>
            </div>
          }
        >
          <PresentationDeck
            results={results}
            onClose={() => setShowPresentation(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

// Wrap with UserProvider
export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
