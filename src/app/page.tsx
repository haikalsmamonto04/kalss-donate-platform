"use client";

import React, { useEffect, useState } from "react";
import {
  Coins,
  Key,
  Flame,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  Zap,
  Globe,
  Radio,
  Clock,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  Gamepad2,
  AlertCircle,
  ArrowRight,
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
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>("");

  // Login form state
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [inputToken, setInputToken] = useState<string>("");
  const [regGameName, setRegGameName] = useState<string>("");
  const [regRobloxUser, setRegRobloxUser] = useState<string>("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
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
  const [origin, setOrigin] = useState<string>("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Simulator state
  const [simDonor, setSimDonor] = useState("Sultan_Roblox");
  const [simAmount, setSimAmount] = useState(100000);
  const [simMessage, setSimMessage] = useState("Efek Nuke buat gamemu! 🔥");
  const [simPlatform, setSimPlatform] = useState<"saweria" | "bagibagi" | "sociabuzz">("saweria");
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Check stored auth or OAuth token on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get("token");
      const authErr = urlParams.get("auth_error");

      if (authErr) {
        setAuthError("Gagal otentikasi dengan Roblox. Silakan coba lagi.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (tokenParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
        verifyAndLogin(tokenParam);
        return;
      }

      const saved = localStorage.getItem("kalss_auth_token");
      if (saved) {
        verifyAndLogin(saved);
      } else {
        setAuthLoading(false);
      }
    }
  }, []);

  const verifyAndLogin = async (key: string) => {
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
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setAuthError("Harap masukkan token kamu");
      return;
    }
    await verifyAndLogin(inputToken.trim());
  };

  const handleRegisterToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regGameName.trim()) {
      setAuthError("Harap masukkan nama game kamu");
      return;
    }
    setIsSubmittingAuth(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: regGameName.trim(),
          robloxUsername: regRobloxUser.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.keyRecord) {
        setJustCreatedToken(data.keyRecord);
      } else {
        setAuthError(data.error || "Gagal membuat token");
      }
    } catch {
      setAuthError("Gagal membuat token");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

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

  const fetchStats = async (key: string) => {
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
  };

  // Poll stats every 5 seconds when in dashboard
  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => {
      fetchStats(authToken);
    }, 5000);
    return () => clearInterval(interval);
  }, [authToken]);

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
    } catch (err: any) {
      setSimStatus("❌ Error koneksi: " + err.message);
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

  // LOGIN & REGISTRATION GATE
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal / Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative z-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 mb-4">
              <Coins className="w-8 h-8 text-slate-950" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              KALSS GATEWAY
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v2.0 Real
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Platform Jembatan Donasi Saweria & BagiBagi ke Game Roblox
            </p>
          </div>

          {/* Just Created Token Success View */}
          {justCreatedToken ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-emerald-400">Token Berhasil Dibuat!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Simpan kode unik token kamu ini baik-baik. Gunakan untuk login ke dashboard dan masukkan ke script Roblox kamu.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Token Unik Kamu:
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-950 border border-amber-500/30 rounded-xl">
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
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                Masuk ke Dashboard Saya Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Primary: Continue with Roblox (OAuth 2.0) */}
              <div className="mb-6">
                <a
                  href="/api/auth/roblox/login"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-100 text-slate-950 shadow-xl shadow-white/5 transition flex items-center justify-center gap-3 border border-slate-200 group"
                >
                  <svg className="w-5 h-5 fill-slate-950 shrink-0" viewBox="0 0 24 24">
                    <path d="M5.166 0L0 18.834 18.834 24 24 5.166 5.166 0zm9.467 14.502l-4.734-1.298 1.298-4.734 4.734 1.298-1.298 4.734z" />
                  </svg>
                  <span>Continue with Roblox</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                </a>
                <p className="text-[10px] text-center text-slate-500 mt-2">
                  Masuk resmi via akun Roblox kamu (aman 100% tanpa password)
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center my-5">
                <div className="flex-1 border-t border-slate-800" />
                <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  atau kelola token
                </span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Tabs Switch: Login vs Register */}
              <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-6">
                <button
                  onClick={() => {
                    setLoginMode("login");
                    setAuthError("");
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    loginMode === "login"
                      ? "bg-slate-800 text-amber-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Masuk via Token
                </button>
                <button
                  onClick={() => {
                    setLoginMode("register");
                    setAuthError("");
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    loginMode === "register"
                      ? "bg-slate-800 text-amber-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Buat Token Baru
                </button>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Mode 1: Login via Token */}
              {loginMode === "login" ? (
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Ketik Token Unik Kamu
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="kalss_live_4848jdjdja8fg8g8g8hg..."
                        value={inputToken}
                        onChange={(e) => setInputToken(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    Buka Dashboard Saya
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-500">
                      Mau uji coba cepat? Pakai token demo:{" "}
                      <button
                        type="button"
                        onClick={() => setInputToken("kalss_live_demo_key_57")}
                        className="text-amber-400 hover:underline font-mono"
                      >
                        kalss_live_demo_key_57
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* Mode 2: Register New Token */
                <form onSubmit={handleRegisterToken} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Nama Game Roblox Kamu
                    </label>
                    <div className="relative">
                      <Gamepad2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="misal: Donasi Efek Koin Kalss"
                        value={regGameName}
                        onChange={(e) => setRegGameName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Username Roblox Kamu <span className="text-slate-500 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="misal: haikalsmamonto04"
                        value={regRobloxUser}
                        onChange={(e) => setRegRobloxUser(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Foto profil avatar Roblox kamu akan otomatis ditampilkan di dashboard.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    {isSubmittingAuth ? "Membuat Kunci..." : "Generate Token Kalss Saya"}
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-8 pt-5 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sistem Terisolasi & Aman • Multi-Game Dedicated
            </span>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  const currentKey = currentUser.key;
  const saweriaUrl = `${origin}/api/webhook/saweria?key=${currentKey}`;
  const bagiBagiUrl = `${origin}/api/webhook/bagibagi?key=${currentKey}`;
  const sociabuzzUrl = `${origin}/api/webhook/sociabuzz?key=${currentKey}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coins className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">
                  KALSS DONATION GATEWAY
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  v2.0 Real
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bridge Saweria, BagiBagi, & Sociabuzz ke Game Roblox
              </p>
            </div>
          </div>

          {/* User Profile & Token Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-amber-500/40 bg-slate-950 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">
                  {currentUser.robloxUsername || currentUser.name}
                </div>
                <div className="text-[10px] font-mono text-amber-400/80">
                  {currentKey.substring(0, 14)}...{currentKey.substring(currentKey.length - 4)}
                </div>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(currentKey, "activeToken")}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              title="Salin Token Saya"
            >
              {copiedText === "activeToken" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition"
              title="Ganti Token / Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards (Scoped strictly to this token!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Donasi */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-4 right-4 p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Donasi Real Game Ini
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
              Rp {stats.totalAmount.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-slate-500 mt-1">Akumulasi donasi masuk yang sukses</p>
          </div>

          {/* Card 2: Total Transaksi */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-4 right-4 p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Transaksi
            </p>
            <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-2">
              {stats.totalCount}{" "}
              <span className="text-sm font-normal text-slate-400">donasi</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Diproses dan memicu efek koin di map</p>
          </div>

          {/* Card 3: Status Worker */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-4 right-4 p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status Roblox Worker
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 flex items-center gap-2">
              Siap Jemput
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.pendingCount} transaksi dalam antrean pending
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setActiveTab("webhook")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === "webhook"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            Pengaturan API & Webhook
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === "simulator"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-4 h-4" />
            Simulator Uji Coba Efek
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === "logs"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Riwayat Transaksi Live ({donations.length})
          </button>
        </div>

        {/* TAB 1: WEBHOOK & ROBLOX CONFIG */}
        {activeTab === "webhook" && (
          <div className="space-y-6">
            {/* Webhook URLs Box */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  URL Webhook Payment Gateway (Saweria, BagiBagi, Sociabuzz)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Salin URL di bawah ini ke menu Webhook di dashboard akun pembayaran kamu. Uang tetap 100% masuk ke rekening/akunmu!
                </p>
              </div>

              {/* Saweria */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Saweria Webhook URL
                  </span>
                  <button
                    onClick={() => copyToClipboard(saweriaUrl, "saweria")}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition"
                  >
                    {copiedText === "saweria" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Salin URL
                  </button>
                </div>
                <code className="text-xs font-mono text-slate-300 break-all select-all block bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  {saweriaUrl}
                </code>
              </div>

              {/* BagiBagi */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    BagiBagi Webhook URL
                  </span>
                  <button
                    onClick={() => copyToClipboard(bagiBagiUrl, "bagibagi")}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition"
                  >
                    {copiedText === "bagibagi" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Salin URL
                  </button>
                </div>
                <code className="text-xs font-mono text-slate-300 break-all select-all block bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  {bagiBagiUrl}
                </code>
              </div>

              {/* Sociabuzz */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Sociabuzz Webhook URL
                  </span>
                  <button
                    onClick={() => copyToClipboard(sociabuzzUrl, "sociabuzz")}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition"
                  >
                    {copiedText === "sociabuzz" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Salin URL
                  </button>
                </div>
                <code className="text-xs font-mono text-slate-300 break-all select-all block bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  {sociabuzzUrl}
                </code>
              </div>
            </div>

            {/* Roblox Config Box */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Pasang di Roblox Studio (KalssDonateRealConfig)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Buka <code className="text-amber-400">KalssDonateRealConfig</code> di game Roblox kamu dan isi bagian Backend:
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `Config.Backend = {\n\tEnabled = true,\n\tWorkerBaseUrl = "${origin}",\n\tApiKey = "${currentKey}",\n\tPollInterval = 3,\n}`,
                      "robloxConfig"
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 transition"
                >
                  {copiedText === "robloxConfig" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Salin Konfigurasi
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
{`-- Di ReplicatedStorage.KalssDonateRealRS.KalssDonateRealConfig:
Config.Backend = {
    Enabled = true,
    WorkerBaseUrl = "${origin}",
    ApiKey = "${currentKey}",
    PollInterval = 3,
}`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Simulator Donasi Real Instan
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kirim donasi simulasi ke token game kamu untuk menguji efek Nuke, Smite, Meteor, atau Black Hole di Roblox Studio tanpa bayar uang asli!
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">
                Pilih Preset Nominal Efek:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Smite", amount: 50000 },
                  { name: "Nuke", amount: 100000 },
                  { name: "Meteor", amount: 250000 },
                  { name: "Black Hole", amount: 1000000 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSimAmount(preset.amount);
                      setSimMessage(`Efek ${preset.name} Rp ${preset.amount.toLocaleString()}! 🔥`);
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      simAmount === preset.amount
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Rp {preset.amount.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Username Donatur di Roblox
                </label>
                <input
                  type="text"
                  value={simDonor}
                  onChange={(e) => setSimDonor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Nominal Donasi (Rupiah)
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Pesan Donatur
                </label>
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Penyedia Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["saweria", "bagibagi", "sociabuzz"] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSimPlatform(plat)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition ${
                        simPlatform === plat
                          ? "bg-slate-800 border-amber-500 text-amber-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {simStatus && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-medium">
                {simStatus}
              </div>
            )}

            <button
              onClick={handleSimulate}
              disabled={simLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {simLoading ? "Mengirim ke Antrean..." : "Kirim Test Donasi Sekarang"}
            </button>
          </div>
        )}

        {/* TAB 3: TRANSACTION LOGS */}
        {activeTab === "logs" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Riwayat Transaksi Khusus Game Kamu
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hanya menampilkan donasi yang terhubung ke token kamu.
                </p>
              </div>
              <button
                onClick={() => fetchStats(currentKey)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {donations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada transaksi untuk token ini. Coba kirim simulasi di tab Simulator!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Donatur</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Pesan</th>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {donations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {item.donorName || item.username}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          Rp {item.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {item.message || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                            {item.platform}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === "done"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : item.status === "processing"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {item.status}
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
