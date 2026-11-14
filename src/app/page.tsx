"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Coins,
  Key,
  Flame,
  CheckCircle2,
  Copy,
  RefreshCw,
  Send,
  Zap,
  Globe,
  Radio,
  Clock,
  Sparkles,
  LogOut,
  ShieldCheck,
  Gamepad2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Clipboard,
  Activity,
  Terminal,
  Shield,
  Cpu,
  Lock,
} from "lucide-react";

interface KeyRecord {
  id: string;
  key: string;
  name: string;
  robloxUsername?: string;
  avatarUrl?: string;
  createdAt: string;
  totalAmount: number;
  donationCount: number;
}

interface Donation {
  id: string;
  apiKey: string;
  amount: number;
  donorName: string;
  username?: string;
  message: string;
  targetName: string;
  platform: string;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: string;
  processedAt?: string;
}

interface StatsData {
  totalAmount: number;
  totalCount: number;
  pendingCount: number;
  keyCount: number;
}

export default function DashboardPage() {
  // Auth state
  const [authToken, setAuthToken] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<KeyRecord | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const tokenParam = new URLSearchParams(window.location.search).get("token");
    const saved = localStorage.getItem("kalss_auth_token");
    return !!(tokenParam || saved);
  });
  const [authError, setAuthError] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const authErr = new URLSearchParams(window.location.search).get("auth_error");
    return authErr ? "Gagal otentikasi dengan Roblox. Silakan coba lagi." : "";
  });

  // Login form state
  const [inputToken, setInputToken] = useState<string>("");
  const [isSubmittingAuth] = useState<boolean>(false);
  const [justCreatedToken, setJustCreatedToken] = useState<KeyRecord | null>(null);

  // Dashboard data state
  const [stats, setStats] = useState<StatsData>({
    totalAmount: 0,
    totalCount: 0,
    pendingCount: 0,
    keyCount: 0,
  });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<"webhook" | "simulator" | "logs">("webhook");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Simulator state
  const [simDonor, setSimDonor] = useState("Sultan_Roblox");
  const [simAmount, setSimAmount] = useState(100000);
  const [simMessage, setSimMessage] = useState("Efek Nuke buat gamemu! 🔥");
  const [simPlatform, setSimPlatform] = useState<"real" | "bagibagi" | "sociabuzz">("real");
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Landing UI state
  const [showToken, setShowToken] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demoEvents = [
    { provider: "BagiBagi", donor: "Sultan_Jaksel", amount: "Rp 50.000", vfx: "SMITE GIANT (R15)", latency: "18ms", color: "from-amber-400 to-amber-600" },
    { provider: "Sociabuzz", donor: "Raja_Roblox", amount: "Rp 100.000", vfx: "ENDOWMENT ANGEL", latency: "22ms", color: "from-amber-300 to-yellow-500" },
    { provider: "Real QRIS", donor: "Mega_Donatur", amount: "Rp 250.000", vfx: "BLACK HOLE COLLAPSE", latency: "16ms", color: "from-yellow-400 to-amber-500" },
  ];

  useEffect(() => {
    if (authToken) return;
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 3);
    }, 3200);
    return () => clearInterval(interval);
  }, [authToken]);

  const handlePasteToken = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputToken(text.trim());
        }
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchStats = useCallback(async (key: string) => {
    try {
      const res = await fetch(`/api/stats?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setDonations(data.recent);
        if (data.keyRecord) {
          setCurrentUser(data.keyRecord);
        }
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  const verifyAndLogin = useCallback(
    async (key: string) => {
      setAuthLoading(true);
      setAuthError("");
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        const data = await res.json();
        if (data.ok && data.keyRecord) {
          setAuthToken(data.keyRecord.key);
          setCurrentUser(data.keyRecord);
          localStorage.setItem("kalss_auth_token", data.keyRecord.key);
          fetchStats(data.keyRecord.key);
        } else {
          localStorage.removeItem("kalss_auth_token");
          setAuthError(data.error || "Token tidak valid");
          setAuthToken("");
          setCurrentUser(null);
        }
      } catch {
        setAuthError("Gagal menghubungi server");
      } finally {
        setAuthLoading(false);
      }
    },
    [fetchStats]
  );

  // Check stored auth or OAuth token on load
  useEffect(() => {
    const tokenParam = new URLSearchParams(window.location.search).get("token");
    const saved = localStorage.getItem("kalss_auth_token");
    const key = tokenParam || saved;
    if (!key) return;
    const timer = setTimeout(() => {
      verifyAndLogin(key);
    }, 0);
    return () => clearTimeout(timer);
  }, [verifyAndLogin]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setAuthError("Harap masukkan token kamu");
      return;
    }
    await verifyAndLogin(inputToken.trim());
  };

  // Handler registrasi token sementara tidak digunakan (UI login hanya token manual).

  const handleEnterDashboard = () => {
    if (justCreatedToken) {
      setAuthToken(justCreatedToken.key);
      setCurrentUser(justCreatedToken);
      localStorage.setItem("kalss_auth_token", justCreatedToken.key);
      setJustCreatedToken(null);
      fetchStats(justCreatedToken.key);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kalss_auth_token");
    setAuthToken("");
    setCurrentUser(null);
    setInputToken("");
    setAuthError("");
  };

  // fetchStats dipindahkan ke atas (useCallback) bersama verifyAndLogin.
  // Poll stats every 5 seconds when in dashboard
  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => {
      fetchStats(authToken);
    }, 5000);
    return () => clearInterval(interval);
  }, [authToken, fetchStats]);

  const handleSimulate = async () => {
    if (!authToken) return;
    setSimLoading(true);
    setSimStatus(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: authToken,
          donorName: simDonor || "Sultan_Roblox",
          amount: Number(simAmount) || 100000,
          message: simMessage || "Donasi Real Kalss!",
          platform: simPlatform,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSimStatus("✅ Berhasil! Donasi terkirim ke antrean game kamu.");
        fetchStats(authToken);
      } else {
        setSimStatus("❌ Gagal: " + (data.error || "Error"));
      }
    } catch (err) {
      setSimStatus("❌ Error koneksi: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setSimLoading(false);
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Memuat Kalss Donation Gateway...</p>
        </div>
      </div>
    );
  }

  // LOGIN & REGISTRATION GATE (Obsidian Gold Luxury Anti-UI-Slop Edition)
  if (!authToken || !currentUser) {
    const activeDemo = demoEvents[demoStep] || demoEvents[0];

    return (
      <div className="min-h-screen w-full relative overflow-hidden bg-obsidian-stage flex flex-col justify-between">
        {/* Subtle Geometric Matrix Grid & Ambient Radiance */}
        <div className="absolute inset-0 matrix-grid-overlay pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[42rem] h-[26rem] bg-amber-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[42rem] h-[26rem] bg-amber-600/[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* TOP EXECUTIVE BAR */}
        <header className="relative z-20 w-full px-6 py-5 lg:px-12 flex items-center justify-between border-b border-amber-500/10 backdrop-blur-md bg-[#06070a]/60">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
              <Coins className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase">KALSS STUDIO</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 tracking-widest uppercase">
                  GATEWAY
                </span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider">Platform Donasi Real & Efek Sinematik</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1017] border border-emerald-500/20 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-emerald-dot" />
              <span className="font-medium tracking-wide">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>
        </header>

        {/* MAIN LUXURY HERO & AUTH SPLIT */}
        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14 flex items-center justify-center">
          <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: THE PLATFORM SHOWCASE (7 COLS) */}
            <div className="lg:col-span-7 space-y-8 luxury-fade-up">
              
              {/* Kicker Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-[11px] font-semibold tracking-wider text-amber-300 uppercase backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>REAL-TIME IN-GAME ENGINE</span>
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span className="text-slate-400 font-mono text-[10px]">v2.4 HIGH FREQUENCY</span>
              </div>

              {/* Master Display Typography */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] text-white">
                  Donasi <span className="text-gold-luxury">Real</span> yang Meledakkan Efek di Roblox
                </h1>
                <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl font-normal">
                  Infrastruktur jembatan resmi dari pembayaran nyata (BagiBagi, Sociabuzz, QRIS) langsung ke efek sinematik server Roblox tanpa perantara manual.
                </p>
              </div>

              {/* BESPOKE LIVE TELEMETRY TERMINAL (Anti-UI-Slop Showcase) */}
              <div className="rounded-2xl card-obsidian-luxury p-5 sm:p-6 space-y-4 gold-glow-border">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" /> live-handshake-telemetry
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LATENCY: {activeDemo.latency}</span>
                  </div>
                </div>

                {/* Animated Pipeline Simulation */}
                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#090b12] border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>1. Webhook In</span>
                      <span className="text-amber-400 text-[9px] font-bold">{activeDemo.provider}</span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{activeDemo.donor}</div>
                    <div className="text-[11px] font-mono text-amber-300 font-bold">{activeDemo.amount}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#090b12] border border-amber-500/20 space-y-1">
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>2. Kalss Gateway</span>
                      <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-semibold text-slate-200">Dispatch Queue</div>
                    <div className="text-[11px] font-mono text-emerald-400">Validated 100%</div>
                  </div>

                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-700/5 border border-amber-500/30 space-y-1">
                    <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider flex items-center justify-between">
                      <span>3. In-Game VFX</span>
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    </div>
                    <div className="text-xs font-bold text-amber-300 truncate">{activeDemo.vfx}</div>
                    <div className="text-[11px] font-mono text-slate-400">Board Updated</div>
                  </div>
                </div>
              </div>

              {/* 3 Luxury Architectural Feature Pills */}
              <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-4 rounded-xl bg-[#0c0e17]/80 border border-white/5 hover:border-amber-500/30 transition group">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2.5 text-amber-400 group-hover:scale-105 transition">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-white">0.18s Engine Sync</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">Jemput antrean cepat tanpa lag di server game.</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0e17]/80 border border-white/5 hover:border-amber-500/30 transition group">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2.5 text-amber-400 group-hover:scale-105 transition">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-white">Multi-Gateway</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">BagiBagi, Sociabuzz & QRIS payment link.</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0e17]/80 border border-white/5 hover:border-amber-500/30 transition group">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2.5 text-amber-400 group-hover:scale-105 transition">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-white">Terisolasi & Aman</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">Otorisasi token per-game, fail-closed & anti-duplikasi.</div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: THE MASTER ACCESS TERMINAL (5 COLS) */}
            <div className="lg:col-span-5 luxury-fade-up">
              <div className="w-full card-obsidian-luxury rounded-3xl p-6 sm:p-8 space-y-6 gold-glow-border relative">
                
                {/* Monolith Header Lockup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/25">
                      <Lock className="w-3 h-3 text-amber-400" /> SECURE GATEWAY
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">PORTAL v2.4</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Masuk ke Dashboard</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Kelola lisensi, webhook endpoint, dan riwayat transaksi donasi Real kamu.
                  </p>
                </div>

                {justCreatedToken ? (
                  /* Just Created Token View */
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <h3 className="text-base font-bold text-emerald-300">Token Berhasil Dibuat!</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Simpan kode unik token kamu baik-baik. Gunakan untuk login dan masukkan ke script Roblox kamu.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                        Token Game Unik Kamu:
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-[#080a10] border border-amber-500/30 rounded-xl">
                        <Key className="w-4 h-4 text-amber-400 shrink-0" />
                        <code className="text-xs font-mono text-amber-300 break-all select-all flex-1">
                          {justCreatedToken.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(justCreatedToken.key, "newToken")}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                          title="Salin Token"
                        >
                          {copiedText === "newToken" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleEnterDashboard}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 btn-gold-shimmer"
                    >
                      Masuk ke Dashboard Saya Sekarang
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* OPTION 1: ROBLOX OFFICIAL OAUTH 2.0 */}
                    <div className="space-y-2">
                      <a
                        href="/api/auth/roblox/login"
                        className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#121622] hover:bg-[#181d2d] text-white shadow-lg transition flex items-center justify-between border border-white/10 hover:border-amber-500/40 group focus-gold"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-105 transition">
                            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                              <path d="M5.166 0L0 18.834 18.834 24 24 5.166 5.166 0zm9.467 14.502l-4.734-1.298 1.298-4.734 4.734 1.298-1.298 4.734z" />
                            </svg>
                          </div>
                          <span className="tracking-wide">Continue with Roblox</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs group-hover:text-amber-400 transition">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">OAuth 2.0</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </div>
                      </a>
                      <p className="text-[10px] text-center text-slate-400">
                        Otentikasi resmi via akun Roblox (aman 100% tanpa password)
                      </p>
                    </div>

                    {/* DIVIDER */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-white/10" />
                      <span className="px-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        atau masuk via token
                      </span>
                      <div className="flex-1 border-t border-white/10" />
                    </div>

                    {/* Error Banner */}
                    {authError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-200">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {/* OPTION 2: DIRECT TOKEN LOGIN FORM */}
                    <form onSubmit={handleManualLogin} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-300 block">
                            Masukkan Token Game Kamu
                          </label>
                          <button
                            type="button"
                            onClick={handlePasteToken}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition"
                          >
                            <Clipboard className="w-3 h-3" /> Paste
                          </button>
                        </div>

                        <div className="relative">
                          <Key className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-3.5 pointer-events-none" />
                          <input
                            type={showToken ? "text" : "password"}
                            placeholder="kalss_live_4848jdjdja8fg8g8g8hg..."
                            value={inputToken}
                            onChange={(e) => setInputToken(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-[#080a10] border border-white/10 focus:border-amber-400/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                            title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                          >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          💡 Token dapat disalin dari <span className="text-slate-300 font-mono">Config.Backend.ApiKey</span> di dalam script game.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 btn-gold-shimmer disabled:opacity-60 disabled:cursor-not-allowed focus-gold"
                      >
                        Buka Dashboard via Token
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                )}

                {/* Card Security Footnote */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400/80" /> 256-BIT ENCRYPTED
                  </span>
                  <span>KALSS STUDIO © 2026</span>
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* BOTTOM FOOTER */}
        <footer className="relative z-20 w-full px-6 py-4 lg:px-12 border-t border-white/5 text-center sm:text-left sm:flex items-center justify-between text-[11px] text-slate-400 bg-[#06070a]/70 backdrop-blur-sm">
          <div>
            © 2026 KALSS STUDIO · All Rights Reserved. Protected by Kalss License Engine.
          </div>
          <div className="mt-2 sm:mt-0 flex items-center justify-center sm:justify-end gap-5">
            <span className="hover:text-slate-300 transition cursor-pointer">Dokumentasi</span>
            <span className="hover:text-slate-300 transition cursor-pointer">Roblox Integration</span>
            <span className="hover:text-slate-300 transition cursor-pointer">Support Discord</span>
          </div>
        </footer>

      </div>
    );
  }

  // LOGGED IN DASHBOARD
  const currentKey = currentUser.key;
  const realUrl = `${origin}/api/webhook/real?key=${currentKey}`;
  const bagiBagiUrl = `${origin}/api/webhook/bagibagi?key=${currentKey}`;
  const sociabuzzUrl = `${origin}/api/webhook/sociabuzz?key=${currentKey}`;

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 antialiased matrix-grid-overlay relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[340px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-[#06070a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/30">
              <Coins className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                  KALSS STUDIO <span className="text-amber-400">REAL GATEWAY</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  SYSTEM LICENSE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pusat Integrasi Webhook & Donasi Real In-Game Roblox
              </p>
            </div>
          </div>

          {/* User Profile & Token Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-[#090b10] border border-white/10 shadow-inner">
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-amber-400/50 bg-slate-950 object-cover shadow-sm shadow-amber-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 ring-2 ring-amber-400/30 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {currentUser.robloxUsername || currentUser.name}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                </div>
                <div className="text-[10px] font-mono text-amber-400/80">
                  {currentKey.substring(0, 14)}...{currentKey.substring(currentKey.length - 4)}
                </div>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(currentKey, "activeToken")}
              className="p-2.5 rounded-xl bg-[#090b10] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 transition shadow-sm"
              title="Salin Token Game Saya"
            >
              {copiedText === "activeToken" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 text-xs font-semibold transition"
              title="Ganti Token / Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 relative z-10">
        
        {/* Bento Metric Cards (Obsidian 24K Gold) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Total Donasi */}
          <div className="p-6 rounded-3xl card-obsidian-luxury relative overflow-hidden group hover:border-amber-400/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                TOTAL DONASI REAL GAME INI
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-tight">
                Rp {stats.totalAmount.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Akumulasi donasi sukses terhubung ke server Roblox
              </p>
            </div>
          </div>

          {/* Card 2: Total Transaksi */}
          <div className="p-6 rounded-3xl card-obsidian-luxury relative overflow-hidden group hover:border-amber-400/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                TOTAL TRANSAKSI TEREKSEKUSI
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
                {stats.totalCount}{" "}
                <span className="text-sm font-normal text-slate-400">donasi</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Semua donasi otomatis memicu efek sinematik & podium di map
              </p>
            </div>
          </div>

          {/* Card 3: Status Worker */}
          <div className="p-6 rounded-3xl card-obsidian-luxury relative overflow-hidden group hover:border-emerald-400/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                STATUS ROBLOX WORKER
              </span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                Siap Jemput
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-mono font-semibold">{stats.pendingCount}</span> transaksi antrean pending · ~18ms latency
              </p>
            </div>
          </div>

        </div>

        {/* Tab Controls (Obsidian Pill Segmented Bar) */}
        <div className="flex items-center justify-start p-1.5 rounded-2xl bg-[#090b10] border border-white/10 w-fit max-w-full overflow-x-auto space-x-1.5">
          <button
            onClick={() => setActiveTab("webhook")}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === "webhook"
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            Pengaturan API & Webhook
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === "simulator"
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            Simulator Uji Coba Efek
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === "logs"
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            Riwayat Transaksi Live ({donations.length})
          </button>
        </div>

        {/* TAB 1: WEBHOOK & ROBLOX CONFIG */}
        {activeTab === "webhook" && (
          <div className="space-y-6">
            
            {/* Webhook URLs Box */}
            <div className="p-6 sm:p-8 rounded-3xl card-obsidian-luxury border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    URL Webhook Payment Gateway (Real, BagiBagi, Sociabuzz)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Salin URL webhook resmi di bawah ini ke dashboard akun pembayaran kamu. Uang tetap 100% masuk langsung ke rekening/akun payment gateway milikmu!
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% DIRECT TO MERCHANT
                </div>
              </div>

              {/* Endpoint Rows */}
              <div className="space-y-3.5">
                {/* Real Webhook */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#080a10] border border-white/10 hover:border-amber-400/30 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                      Real Webhook URL (Universal / Direct QRIS)
                    </span>
                    <button
                      onClick={() => copyToClipboard(realUrl, "real")}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                    >
                      {copiedText === "real" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Salin URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-slate-200 break-all select-all block bg-[#050608] p-3 rounded-xl border border-white/5 text-amber-300/90">
                    {realUrl}
                  </code>
                </div>

                {/* BagiBagi Webhook */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#080a10] border border-white/10 hover:border-amber-400/30 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-2 font-mono">
                      <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
                      BagiBagi Webhook URL
                    </span>
                    <button
                      onClick={() => copyToClipboard(bagiBagiUrl, "bagibagi")}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                    >
                      {copiedText === "bagibagi" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-sky-400" />
                          <span>Salin URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-slate-200 break-all select-all block bg-[#050608] p-3 rounded-xl border border-white/5 text-sky-300/90">
                    {bagiBagiUrl}
                  </code>
                </div>

                {/* Sociabuzz Webhook */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#080a10] border border-white/10 hover:border-amber-400/30 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-2 font-mono">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                      Sociabuzz Webhook URL
                    </span>
                    <button
                      onClick={() => copyToClipboard(sociabuzzUrl, "sociabuzz")}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                    >
                      {copiedText === "sociabuzz" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Salin URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-slate-200 break-all select-all block bg-[#050608] p-3 rounded-xl border border-white/5 text-indigo-300/90">
                    {sociabuzzUrl}
                  </code>
                </div>
              </div>
            </div>

            {/* Roblox Studio Integration Config Box */}
            <div className="p-6 sm:p-8 rounded-3xl card-obsidian-luxury border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Pasang di Roblox Studio (KalssDonateRealConfig)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Buka ModuleScript <code className="text-amber-400 font-mono">KalssDonateRealConfig</code> di game Roblox kamu dan tempelkan bagian Backend berikut:
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `Config.Backend = {\n\tEnabled = true,\n\tWorkerBaseUrl = "${origin}",\n\tApiKey = "${currentKey}",\n\tPollInterval = 3,\n}`,
                      "robloxConfig"
                    )
                  }
                  className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
                >
                  {copiedText === "robloxConfig" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Konfigurasi Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-950" />
                      <span>Salin Konfigurasi Luau</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl bg-[#040508] border border-white/10 p-4 sm:p-5 overflow-x-auto">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
                  ReplicatedStorage • KalssDonateRealRS • KalssDonateRealConfig.luau
                </div>
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
{`-- Konfigurasi resmi Kalss Donate Real
Config.Backend = {
    Enabled = true,
    WorkerBaseUrl = "${origin}",
    ApiKey = "${currentKey}",
    PollInterval = 3,
}`}
                </pre>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="p-6 sm:p-8 rounded-3xl card-obsidian-luxury border border-white/10 max-w-2xl mx-auto space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] uppercase tracking-wider mb-2">
                <Cpu className="w-3 h-3" /> REAL-TIME DISPATCH ENGINE
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Simulator Donasi Real Instan
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Kirim donasi simulasi ke token game kamu untuk menguji efek Nuke, Smite, Meteor, atau Black Hole di Roblox Studio tanpa perlu pembayaran uang asli!
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilih Preset Efek Sinematik:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: "Smite", amount: 50000, tag: "Light VFX" },
                  { name: "Nuke", amount: 100000, tag: "Kaboom" },
                  { name: "Meteor", amount: 250000, tag: "Cataclysm" },
                  { name: "Black Hole", amount: 1000000, tag: "Singularity" },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSimAmount(preset.amount);
                      setSimMessage(`Efek ${preset.name} Rp ${preset.amount.toLocaleString()}! 🔥`);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      simAmount === preset.amount
                        ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
                        : "bg-[#080a10] border-white/10 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.name}</div>
                    <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                      Rp {preset.amount.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase mt-1">{preset.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Username Donatur di Roblox
                </label>
                <input
                  type="text"
                  value={simDonor}
                  onChange={(e) => setSimDonor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#080a10] border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none transition font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nominal Donasi (Rupiah)
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#080a10] border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Pesan Donatur
                </label>
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#080a10] border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Penyedia Gateway
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["real", "bagibagi", "sociabuzz"] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSimPlatform(plat)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                        simPlatform === plat
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/10"
                          : "bg-[#080a10] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {plat === "real" ? "Real" : plat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {simStatus && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{simStatus}</span>
              </div>
            )}

            <button
              onClick={handleSimulate}
              disabled={simLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 btn-gold-shimmer disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {simLoading ? "Mengirim ke Antrean Server..." : "Kirim Test Donasi Sekarang"}
            </button>
          </div>
        )}

        {/* TAB 3: TRANSACTION LOGS */}
        {activeTab === "logs" && (
          <div className="p-6 sm:p-8 rounded-3xl card-obsidian-luxury border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Riwayat Transaksi Khusus Game Kamu
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Menampilkan log donasi live yang masuk ke token terdaftar ini.
                </p>
              </div>
              <button
                onClick={() => fetchStats(currentKey)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                Segarkan Data
              </button>
            </div>

            {donations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2 card-obsidian-luxury rounded-2xl border border-white/5">
                <Coins className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-semibold">Belum ada transaksi donasi untuk token ini.</p>
                <p className="text-slate-500 text-[11px]">Kirim donasi simulasi di tab Simulator untuk mencoba pemicuan efek!</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#07090e]">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/10 bg-[#050608]">
                    <tr>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Donatur</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Pesan</th>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {donations.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {item.donorName || item.username}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                          Rp {item.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                          {item.message || "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-mono text-slate-300 border border-white/10">
                            {item.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono ${
                              item.status === "done"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : item.status === "processing"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
