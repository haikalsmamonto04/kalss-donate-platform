"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Filter,
  Layers,
  Wifi,
  QrCode,
} from "lucide-react";

interface GameMember {
  userId: string;
  username: string;
  avatarUrl?: string;
  role: "owner" | "co-owner";
  addedAt: string;
}

interface KeyRecord {
  id: string;
  key: string;
  name: string;
  robloxUserId?: string;
  robloxUsername?: string;
  avatarUrl?: string;
  universeId?: string;
  placeId?: string;
  placeName?: string;
  creatorType?: "User" | "Group";
  creatorId?: string;
  verified?: boolean;
  members?: GameMember[];
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
  const [loggedInUser, setLoggedInUser] = useState<{
    userId: string;
    username: string;
    avatarUrl?: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("kalss_logged_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const activeTokenRef = useRef<string>("");
  const loggedInUserIdRef = useRef<string>(loggedInUser?.userId || "");
  useEffect(() => {
    loggedInUserIdRef.current = loggedInUser?.userId || "";
  }, [loggedInUser]);
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
  const [activeTab, setActiveTab] = useState<"webhook" | "terminal" | "simulator" | "logs" | "sync">("webhook");
  const isGameConnected = Boolean(currentUser?.verified && currentUser?.universeId);

  // Terminal state
  const [termServers, setTermServers] = useState<
    { serverId: string; isStudio: boolean; playerCount: number; uptimeSec: number; status: string; lastSeen: string }[]
  >([]);
  const [termLogs, setTermLogs] = useState<
    { id: string; serverId: string; isStudio: boolean; level: "info" | "warn" | "error"; message: string; ts: string }[]
  >([]);
  const [termServerFilter, setTermServerFilter] = useState<string>("all");
  const [termLevelFilter, setTermLevelFilter] = useState<"all" | "info" | "warn" | "error">("all");
  const [termAutoScroll, setTermAutoScroll] = useState(true);
  const termEndRef = useRef<HTMLDivElement | null>(null);

  const fetchTerminal = useCallback(async () => {
    const key = currentUser?.key;
    if (!key) return;
    try {
      const res = await fetch(`/api/terminal?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.ok) {
        setTermServers(Array.isArray(data.servers) ? data.servers : []);
        setTermLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.verified && !currentUser?.verified) {
          setCurrentUser((prev) => (prev ? { ...prev, verified: true } : prev));
        }
      }
    } catch {
      // ignore transient network errors
    }
  }, [currentUser?.key, currentUser?.verified]);

  useEffect(() => {
    if (!isGameConnected && activeTab !== "webhook" && activeTab !== "terminal") {
      setActiveTab("webhook");
    }
  }, [isGameConnected, activeTab]);

  useEffect(() => {
    if (!currentUser?.key) return;
    if (activeTab !== "terminal" && isGameConnected) return;
    fetchTerminal();
    const id = setInterval(fetchTerminal, 3000);
    return () => clearInterval(id);
  }, [currentUser?.key, activeTab, isGameConnected, fetchTerminal]);

  useEffect(() => {
    if (activeTab === "terminal" && termAutoScroll && termEndRef.current) {
      termEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [termLogs, activeTab, termAutoScroll]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Simulator state
  const [simDonor, setSimDonor] = useState("Sultan_Roblox");
  const [simAmount, setSimAmount] = useState(25000);
  const [simMessage, setSimMessage] = useState("");
  const [simPlatform, setSimPlatform] = useState<"real" | "bagibagi" | "sociabuzz">("real");
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Sync DataStore & Config state
  const [syncConfig, setSyncConfig] = useState<{
    presets: { name: string; amount: number; effect: string; desc: string; tag: string; icon: string }[];
    popupMinAmount: number;
    cinematicMinAmount: number;
    globalMinAmount: number;
    updatedAt?: string;
  }>({
    presets: [
      { name: "Announce", amount: 1000, effect: "announce", desc: "Muncul banner pengumuman saja", tag: "+1K", icon: "📢" },
      { name: "Cinematic UI", amount: 15000, effect: "cinematic", desc: "Kamera sinematik ke donatur", tag: "+15K", icon: "🎬" },
      { name: "Nuke", amount: 25000, effect: "nuke", desc: "Ledakan nuklir mengguncang map", tag: "+25K", icon: "💥" },
      { name: "Phoenix", amount: 30000, effect: "phoenix", desc: "Kebangkitan Phoenix api emas", tag: "+30K", icon: "🔥" },
      { name: "Gojo", amount: 40000, effect: "gojo", desc: "Hollow Purple Gojo Satoru", tag: "+40K", icon: "🟣" },
      { name: "Smite", amount: 50000, effect: "smite", desc: "Petir raksasa menyambar map", tag: "+50K", icon: "⚡" },
      { name: "Endowment", amount: 80000, effect: "endowment", desc: "Aura malaikat suci & avatar raksasa", tag: "+80K", icon: "👑" },
      { name: "Black Hole", amount: 100000, effect: "blackhole", desc: "Singularitas gravitasi menyedot map", tag: "+100K", icon: "🌌" },
    ],
    popupMinAmount: 1000,
    cinematicMinAmount: 15000,
    globalMinAmount: 25000,
  });
  const [syncedDonors, setSyncedDonors] = useState<
    { userId: string; username: string; displayName: string; total: number; updatedAt: string }[]
  >([]);
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [manualUsername, setManualUsername] = useState("");
  const [manualTotal, setManualTotal] = useState(0);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [editingDonorId, setEditingDonorId] = useState<string | null>(null);
  const [editingDonorTotal, setEditingDonorTotal] = useState<number>(0);
  const [editingSaving, setEditingSaving] = useState<boolean>(false);

  // Place Binding & Community Team state
  const [myPlaces, setMyPlaces] = useState<KeyRecord[]>([]);
  const [placeIdInput, setPlaceIdInput] = useState("");
  const [placeStatus, setPlaceStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [memberUsernameInput, setMemberUsernameInput] = useState("");
  const [memberStatus, setMemberStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Interior Guide & Filter state
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"bagibagi" | "sociabuzz" | "real">("bagibagi");
  const [logFilter, setLogFilter] = useState<"all" | "real" | "bagibagi" | "sociabuzz">("all");
  const [pingStatus, setPingStatus] = useState<{ [key: string]: string }>({});

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

  const fetchSync = useCallback(async (key: string) => {
    try {
      const res = await fetch(`/api/sync?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.ok) {
        if (data.config) setSyncConfig(data.config);
        if (Array.isArray(data.donors)) setSyncedDonors(data.donors);
      }
    } catch (err) {
      console.error("Fetch sync error:", err);
    }
  }, []);

  const fetchPlaces = useCallback(async (key: string, actorUserId?: string) => {
    try {
      const uid = actorUserId || loggedInUserIdRef.current || "";
      const qs = uid
        ? `key=${encodeURIComponent(key)}&actorUserId=${encodeURIComponent(uid)}`
        : `key=${encodeURIComponent(key)}`;
      const res = await fetch(`/api/place?${qs}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.places)) {
        setMyPlaces(data.places);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleBindPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !placeIdInput.trim()) return;
    setPlaceLoading(true);
    setPlaceStatus(null);
    const actorUserId = loggedInUser?.userId || currentUser?.robloxUserId;
    const actorUsername = loggedInUser?.username || currentUser?.robloxUsername;
    const actorAvatarUrl = loggedInUser?.avatarUrl || currentUser?.avatarUrl;
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bind_place",
          key: authToken,
          placeId: placeIdInput.trim(),
          actorUserId,
          actorUsername,
          actorAvatarUrl,
        }),
      });
      const data = await res.json();
      if (data.ok && data.keyRecord) {
        setCurrentUser(data.keyRecord);
        if (Array.isArray(data.places)) setMyPlaces(data.places);
        setPlaceIdInput("");
        if (data.joinedExisting && data.keyRecord.key !== authToken) {
          activeTokenRef.current = data.keyRecord.key;
          localStorage.setItem("kalss_auth_token", data.keyRecord.key);
          setAuthToken(data.keyRecord.key);
          window.history.replaceState({}, "", `/?token=${encodeURIComponent(data.keyRecord.key)}`);
          fetchSync(data.keyRecord.key);
        }
        setPlaceStatus({ ok: true, msg: data.message || "Place berhasil ditautkan!" });
      } else {
        setPlaceStatus({ ok: false, msg: data.error || "Gagal menautkan Place." });
      }
    } catch {
      setPlaceStatus({ ok: false, msg: "Terjadi kesalahan koneksi saat verifikasi Place." });
    } finally {
      setPlaceLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !memberUsernameInput.trim()) return;
    setMemberStatus(null);
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_member",
          key: authToken,
          username: memberUsernameInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.keyRecord) {
        setCurrentUser(data.keyRecord);
        setMemberUsernameInput("");
        setMemberStatus({ ok: true, msg: data.message || "Co-Owner ditambahkan!" });
      } else {
        setMemberStatus({ ok: false, msg: data.error || "Gagal menambah Co-Owner." });
      }
    } catch {
      setMemberStatus({ ok: false, msg: "Gagal terhubung ke server." });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_member",
          key: authToken,
          userId,
        }),
      });
      const data = await res.json();
      if (data.ok && data.keyRecord) {
        setCurrentUser(data.keyRecord);
      }
    } catch {
      // ignore
    }
  };

  const fetchStats = useCallback(async (key: string, actorIdOverride?: string) => {
    try {
      const res = await fetch(`/api/stats?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (activeTokenRef.current && activeTokenRef.current !== key) {
        return;
      }
      if (data.ok) {
        setStats(data.stats);
        setDonations(data.recent);
        if (data.keyRecord) {
          setCurrentUser(data.keyRecord);
        }
      }
      fetchSync(key);
      fetchPlaces(key, actorIdOverride);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, [fetchSync, fetchPlaces]);

  const handleSelectPrimaryPlace = (place: KeyRecord) => {
    activeTokenRef.current = place.key;
    setCurrentUser(place);
    setAuthToken(place.key);
    localStorage.setItem("kalss_auth_token", place.key);
    window.history.replaceState({}, "", `/?token=${encodeURIComponent(place.key)}`);
    setPlaceStatus({
      ok: true,
      msg: `Place utama aktif dialihkan ke "${place.placeName || place.name}" (Token: ${place.key}).`,
    });
    fetchStats(place.key);
  };

  const verifyAndLogin = useCallback(
    async (key: string, isFreshLogin = false) => {
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
          activeTokenRef.current = data.keyRecord.key;
          setAuthToken(data.keyRecord.key);
          setCurrentUser(data.keyRecord);
          localStorage.setItem("kalss_auth_token", data.keyRecord.key);

          let actorIdForFetch = loggedInUserIdRef.current;
          const existingSavedUser = localStorage.getItem("kalss_logged_user");
          if ((isFreshLogin || !existingSavedUser) && data.keyRecord.robloxUserId) {
            const profile = {
              userId: data.keyRecord.robloxUserId,
              username: data.keyRecord.robloxUsername || data.keyRecord.name,
              avatarUrl: data.keyRecord.avatarUrl || "",
            };
            setLoggedInUser(profile);
            loggedInUserIdRef.current = profile.userId;
            actorIdForFetch = profile.userId;
            localStorage.setItem("kalss_logged_user", JSON.stringify(profile));
          }

          if (typeof window !== "undefined" && window.location.search.includes("oauth=1")) {
            window.history.replaceState({}, "", `/?token=${encodeURIComponent(data.keyRecord.key)}`);
          }

          fetchStats(data.keyRecord.key, actorIdForFetch || undefined);
        } else {
          activeTokenRef.current = "";
          localStorage.removeItem("kalss_auth_token");
          localStorage.removeItem("kalss_logged_user");
          setLoggedInUser(null);
          loggedInUserIdRef.current = "";
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
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    const isOAuthRedirect = params.get("oauth") === "1";
    const saved = localStorage.getItem("kalss_auth_token");
    const key = tokenParam || saved;
    if (!key) return;
    const timer = setTimeout(() => {
      verifyAndLogin(key, isOAuthRedirect);
    }, 0);
    return () => clearTimeout(timer);
  }, [verifyAndLogin]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setAuthError("Harap masukkan token kamu");
      return;
    }
    await verifyAndLogin(inputToken.trim(), true);
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
    activeTokenRef.current = "";
    localStorage.removeItem("kalss_auth_token");
    localStorage.removeItem("kalss_logged_user");
    setLoggedInUser(null);
    loggedInUserIdRef.current = "";
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

  const handleTestPing = async (provider: "real" | "bagibagi" | "sociabuzz") => {
    if (!authToken) return;
    setPingStatus((prev) => ({ ...prev, [provider]: "Pinging..." }));
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: authToken,
          donorName: `PingTest_${provider.toUpperCase()}`,
          amount: 10000,
          message: `Ping Test Webhook ${provider.toUpperCase()} OK!`,
          platform: provider,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPingStatus((prev) => ({ ...prev, [provider]: "✅ 200 OK • 18ms" }));
        fetchStats(authToken);
        setTimeout(() => {
          setPingStatus((prev) => {
            const next = { ...prev };
            delete next[provider];
            return next;
          });
        }, 4000);
      } else {
        setPingStatus((prev) => ({ ...prev, [provider]: "❌ Error" }));
      }
    } catch {
      setPingStatus((prev) => ({ ...prev, [provider]: "❌ Gagal" }));
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
        <header className="relative z-20 w-full px-4 sm:px-6 py-4 sm:py-5 lg:px-12 flex items-center justify-between gap-3 border-b border-amber-500/10 backdrop-blur-md bg-[#06070a]/60">
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

  const filteredDonations = donations.filter((d) => {
    if (logFilter === "all") return true;
    return d.platform === logFilter;
  });

  const effectPresets = syncConfig.presets;

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#06070a] text-slate-100 antialiased relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* Subtle Geometric Matrix Grid & Top Ambient Glow */}
      <div className="absolute inset-0 matrix-grid-overlay pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[340px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-[#06070a]/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 min-h-16 sm:h-20 py-2.5 sm:py-0 flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/40 shrink-0">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 font-bold" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-black text-xs sm:text-base tracking-tight text-white flex flex-wrap items-center gap-x-1.5 leading-tight">
                  <span className="whitespace-nowrap">KALSS STUDIO</span>
                  <span className="text-amber-400 whitespace-nowrap">REAL GATEWAY</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hidden md:inline-block shrink-0">
                  LIFETIME LICENSE
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 truncate">
                Pusat Integrasi Webhook &amp; Donasi Real In-Game Roblox
              </p>
            </div>
          </div>

          {/* User Profile & Token Info */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GATEWAY ACTIVE · 18ms
            </div>

            <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#090b10] border border-white/10 shadow-inner max-w-[148px] sm:max-w-none">
              {(loggedInUser?.avatarUrl || currentUser.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={loggedInUser?.avatarUrl || currentUser.avatarUrl}
                  alt="Avatar"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-amber-400/80 bg-slate-950 object-cover shadow-sm shadow-amber-500/30 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 ring-2 ring-amber-400/40 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1 min-w-0">
                  <span className="truncate">{loggedInUser?.username || currentUser.robloxUsername || currentUser.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 shrink-0" />
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-amber-400/80 truncate">
                  {currentKey.substring(0, 10)}...{currentKey.substring(currentKey.length - 4)}
                </div>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(currentKey, "activeToken")}
              className="p-2 sm:p-2.5 rounded-xl bg-[#090b10] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 transition shadow-sm cursor-pointer shrink-0"
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 text-xs font-semibold transition cursor-pointer shrink-0"
              title="Ganti Token / Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-7 relative z-10">
        
        {/* Bento Metric Cards (Obsidian 24K Gold) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          
          {/* Card 1: Total Donasi */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl card-obsidian-luxury relative overflow-hidden group hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-amber-400/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  TOTAL DONASI REAL GAME INI
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-tight break-words">
                  Rp {stats.totalAmount.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Akumulasi donasi sukses terhubung ke server Roblox
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("simulator")}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-4 pt-3 border-t border-white/5 transition cursor-pointer"
            >
              Uji Coba Simulasi Donasi <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Total Transaksi */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl card-obsidian-luxury relative overflow-hidden group hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  TOTAL TRANSAKSI TEREKSEKUSI
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
                  {stats.totalCount}{" "}
                  <span className="text-sm font-normal text-slate-400">donasi</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Semua donasi otomatis memicu efek sinematik &amp; podium di map
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("logs")}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-4 pt-3 border-t border-white/5 transition cursor-pointer"
            >
              Buka Riwayat Transaksi Live <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Status Worker */}
          <div className="sm:col-span-2 lg:col-span-1 p-5 sm:p-6 rounded-2xl sm:rounded-3xl card-obsidian-luxury relative overflow-hidden group hover:border-emerald-400/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  STATUS ROBLOX WORKER
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                  Siap Jemput
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-300 font-mono font-semibold">{stats.pendingCount}</span> transaksi antrean pending · ~18ms latency
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("webhook")}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-4 pt-3 border-t border-white/5 transition cursor-pointer"
            >
              Lihat Konfigurasi Luau <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Tab Controls (Obsidian Pill Segmented Bar) */}
        <div className="flex items-center justify-start p-1.5 rounded-2xl bg-[#090b10] border border-white/10 w-full sm:w-fit max-w-full overflow-x-auto gap-1.5">
          <button
            onClick={() => setActiveTab("webhook")}
            className={`shrink-0 whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === "webhook"
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            Pengaturan API &amp; Webhook
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={`shrink-0 whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === "terminal"
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
            Terminal
            <span
              className={`w-2 h-2 rounded-full ${
                termServers.some((s) => s.status === "online")
                  ? "bg-emerald-400 animate-pulse"
                  : currentUser?.universeId
                  ? "bg-amber-400"
                  : "bg-slate-600"
              }`}
            />
          </button>
          {isGameConnected && (
            <>
              <button
                onClick={() => setActiveTab("simulator")}
                className={`shrink-0 whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  activeTab === "simulator"
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                Simulator Uji Coba Efek
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`shrink-0 whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  activeTab === "logs"
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                Riwayat Transaksi Live ({donations.length})
              </button>
              <button
                onClick={() => setActiveTab("sync")}
                className={`shrink-0 whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  activeTab === "sync"
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                Sync DataStore &amp; Config ({syncedDonors.length})
              </button>
            </>
          )}
        </div>

        {/* TAB 1: WEBHOOK & ROBLOX CONFIG */}
        {activeTab === "webhook" && (
          <div className="space-y-6">

            {/* Place Verification & Community Team Box */}
            <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-amber-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    Verifikasi Place Roblox &amp; Tim Owner Komunitas
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Tautkan Place ID agar token ini terkunci ke Universe game kamu. Jika Place milik Community/Group, sesama role Owner (rank &ge; 250) atau Co-Owner yang diundang akan berbagi 1 token &amp; DataStore yang sama.
                  </p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono shrink-0 border ${
                  currentUser?.verified
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : currentUser?.universeId
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {currentUser?.verified
                    ? "VERIFIED STUDIO CONNECTED"
                    : currentUser?.universeId
                    ? "MENUNGGU KONEKSI STUDIO"
                    : "BELUM DITAUTKAN"}
                </div>
              </div>

              {myPlaces.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-300">
                    Daftar Place Kamu ({myPlaces.length}) &mdash; Pilih Salah Satu Sebagai Utama
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myPlaces.map((p) => {
                      const isActive = p.key === authToken;
                      return (
                        <div
                          key={p.key}
                          className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 text-xs ${
                            isActive
                              ? "bg-amber-500/10 border-amber-500/40"
                              : "bg-black/40 border-white/10 hover:border-white/25"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white truncate">
                                {p.placeName || p.name}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                                  p.verified
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                    : p.universeId
                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                    : "bg-white/5 border-white/10 text-slate-400"
                                }`}
                              >
                                {p.verified ? "VERIFIED" : p.universeId ? "WAITING STUDIO" : "UNBOUND"}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {p.universeId ? (
                                <>
                                  Place: <span className="text-amber-300">{p.placeId}</span> &bull; Universe:{" "}
                                  <span className="text-amber-300">{p.universeId}</span> &bull;{" "}
                                  <span className="text-emerald-300">{p.creatorType || "User"}</span>
                                </>
                              ) : (
                                <span>Belum ditautkan ke Place ID</span>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 truncate">
                              Token: {p.key}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {isActive ? (
                              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Utama / Aktif
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectPrimaryPlace(p)}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-black text-white font-bold text-[11px] transition"
                              >
                                Jadikan Utama
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleBindPlace} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={placeIdInput}
                  onChange={(e) => setPlaceIdInput(e.target.value)}
                  placeholder="Tambah / Verifikasi Place ID Roblox baru (contoh: 132133195058596)"
                  className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500/60"
                />
                <button
                  type="submit"
                  disabled={placeLoading || !placeIdInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs transition shrink-0"
                >
                  {placeLoading ? "Memverifikasi..." : "+ Tambah / Verifikasi Place"}
                </button>
              </form>

              {placeStatus && (
                <div className={`text-xs px-3.5 py-2.5 rounded-xl border ${
                  placeStatus.ok
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  {placeStatus.msg}
                </div>
              )}

              {/* Co-Owner Team Management */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="text-xs font-bold text-slate-300">
                  Akses Owner &amp; Co-Owner Dashboard ({(currentUser?.members || []).length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {(currentUser?.members || []).map((m) => (
                    <div
                      key={m.userId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                    >
                      <span className="font-mono text-white">{m.username}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {m.role}
                      </span>
                      {m.userId !== currentUser?.robloxUserId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId)}
                          className="text-rose-400 hover:text-rose-300 ml-1"
                          title="Hapus akses"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={memberUsernameInput}
                    onChange={(e) => setMemberUsernameInput(e.target.value)}
                    placeholder="Undang Co-Owner via Username Roblox..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!memberUsernameInput.trim()}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white font-semibold text-xs transition shrink-0"
                  >
                    + Tambah Co-Owner
                  </button>
                </form>
                {memberStatus && (
                  <div className={`text-xs ${memberStatus.ok ? "text-emerald-400" : "text-rose-400"}`}>
                    {memberStatus.msg}
                  </div>
                )}
              </div>
            </div>
            
            {/* Webhook URLs Box */}
            <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 space-y-5 sm:space-y-6">
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

              {/* Endpoint Rows (Branded High-Contrast Cards) */}
              <div className="space-y-4">
                
                {/* 1. Real / QRIS Universal Card */}
                <div className="card-brand-real p-4 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-black text-white font-mono">
                            Saweria Webhook URL
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                            SAWERIA.CO
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80">
                          Integrasi webhook resmi saweran kreator Saweria (QRIS, GoPay, OVO, Dana)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href="https://saweria.co/admin/integration"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                      >
                        Buka Saweria <ExternalLink className="w-3 h-3" />
                      </a>
                      {pingStatus["real"] && (
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                          {pingStatus["real"]}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTestPing("real")}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 transition cursor-pointer"
                        title="Kirim test ping ke endpoint ini"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        Test Ping
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(realUrl, "real")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 px-3.5 py-1.5 rounded-xl transition shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        {copiedText === "real" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-950" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <code className="text-xs font-mono text-emerald-300 break-all select-all block bg-[#03140c] p-3.5 rounded-2xl border border-emerald-500/20 shadow-inner">
                    {realUrl}
                  </code>
                </div>

                {/* 2. BagiBagi.co.id Card */}
                <div className="card-brand-bagibagi p-4 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0">
                        BB
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-black text-white font-mono">
                            BagiBagi Webhook URL
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/40 shrink-0">
                            BAGIBAGI.CO.ID
                          </span>
                        </div>
                        <p className="text-[11px] text-orange-200/80">
                          Integrasi webhook resmi saweran kreator BagiBagi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {pingStatus["bagibagi"] && (
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse">
                          {pingStatus["bagibagi"]}
                        </span>
                      )}
                      <a
                        href="https://bagibagi.co.id"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-orange-300 hover:text-white px-2.5 py-1.5 inline-flex items-center gap-1 transition"
                      >
                        Buka BagiBagi <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleTestPing("bagibagi")}
                        className="flex items-center gap-1.5 text-xs font-bold text-orange-300 hover:text-white px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/30 border border-orange-500/30 transition cursor-pointer"
                        title="Kirim test ping ke endpoint BagiBagi"
                      >
                        <Zap className="w-3.5 h-3.5 text-orange-400" />
                        Test Ping
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bagiBagiUrl, "bagibagi")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 px-3.5 py-1.5 rounded-xl transition shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        {copiedText === "bagibagi" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-950" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <code className="text-xs font-mono text-amber-300 break-all select-all block bg-[#180a03] p-3.5 rounded-2xl border border-orange-500/20 shadow-inner">
                    {bagiBagiUrl}
                  </code>
                </div>

                {/* 3. SociaBuzz.com Card */}
                <div className="card-brand-sociabuzz p-4 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">
                        SB
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-black text-white font-mono">
                            Sociabuzz Webhook URL
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 shrink-0">
                            SOCIABUZZ.COM
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-200/80">
                          Integrasi webhook resmi donasi kreator SociaBuzz
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {pingStatus["sociabuzz"] && (
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                          {pingStatus["sociabuzz"]}
                        </span>
                      )}
                      <a
                        href="https://sociabuzz.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-purple-300 hover:text-white px-2.5 py-1.5 inline-flex items-center gap-1 transition"
                      >
                        Buka SociaBuzz <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleTestPing("sociabuzz")}
                        className="flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 transition cursor-pointer"
                        title="Kirim test ping ke endpoint SociaBuzz"
                      >
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        Test Ping
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(sociabuzzUrl, "sociabuzz")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-300 hover:to-indigo-400 px-3.5 py-1.5 rounded-xl transition shadow-md shadow-purple-500/20 cursor-pointer"
                      >
                        {copiedText === "sociabuzz" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-950" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <code className="text-xs font-mono text-purple-300 break-all select-all block bg-[#13071d] p-3.5 rounded-2xl border border-purple-500/20 shadow-inner">
                    {sociabuzzUrl}
                  </code>
                </div>

              </div>

              {/* Accordion: Panduan Pasang Webhook */}
              <div className="pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#090b10] border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold text-amber-400">
                    <HelpCircle className="w-4 h-4" />
                    Panduan Praktis Cara Pasang Webhook di BagiBagi & Sociabuzz
                  </span>
                  {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showGuide && (
                  <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-[#07090e] border border-white/10 space-y-4 luxury-fade-up">
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                      <button
                        type="button"
                        onClick={() => setActiveGuideTab("bagibagi")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeGuideTab === "bagibagi"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        BagiBagi.co.id
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGuideTab("sociabuzz")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeGuideTab === "sociabuzz"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        SociaBuzz.com
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGuideTab("real")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeGuideTab === "real"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Saweria Webhook
                      </button>
                    </div>

                    {activeGuideTab === "bagibagi" && (
                      <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                        <li>Buka dashboard akun kreator kamu di <a href="https://bagibagi.co.id" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">bagibagi.co.id</a>.</li>
                        <li>Masuk ke menu <span className="font-semibold text-white">Pengaturan / Integrasi</span> lalu cari bagian <span className="font-semibold text-white">Webhook URL</span>.</li>
                        <li>Salin <span className="font-mono text-sky-300">BagiBagi Webhook URL</span> di atas, lalu tempelkan ke kolom URL di BagiBagi.</li>
                        <li>Simpan pengaturan. Setiap donatur mengirim uang di BagiBagi dengan nama Roblox mereka, donasi dan efek koin akan otomatis meledak di server game!</li>
                      </ol>
                    )}

                    {activeGuideTab === "sociabuzz" && (
                      <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                        <li>Login ke akun kamu di <a href="https://sociabuzz.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-semibold">sociabuzz.com</a>.</li>
                        <li>Masuk ke menu <span className="font-semibold text-white">Edit Profile</span> &rarr; pilih <span className="font-semibold text-white">Webhook Notification</span>.</li>
                        <li>Salin <span className="font-mono text-indigo-300">Sociabuzz Webhook URL</span> di atas dan masukkan ke kolom yang tersedia.</li>
                        <li>Klik <span className="font-semibold text-white">Simpan / Activate</span>. Webhook siap menerima payload notifikasi transaksi instan!</li>
                      </ol>
                    )}

                    {activeGuideTab === "real" && (
                      <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                        <li>Buka dashboard integrasi Saweria kamu di <a href="https://saweria.co/admin/integration" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">saweria.co/admin/integration</a>.</li>
                        <li>Pilih menu <span className="font-semibold text-white">Webhook</span> lalu aktifkan integrasi webhook.</li>
                        <li>Salin <span className="font-mono text-emerald-300">Saweria Webhook URL</span> di atas dan tempelkan ke kolom Webhook URL di Saweria.</li>
                        <li>Klik <span className="font-semibold text-white">Simpan</span>. Payload Saweria (<code className="text-amber-400 font-mono">amount_raw</code>, <code className="text-amber-400 font-mono">donator_name</code>, <code className="text-amber-400 font-mono">message</code>) otomatis terhubung ke server Roblox!</li>
                      </ol>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Roblox Studio Integration Config Box */}
            <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 space-y-4">
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

        {/* TAB TERMINAL & SERVER MONITOR */}
        {activeTab === "terminal" && (
          <div className="space-y-5">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-amber-400" />
                    Terminal &amp; Server Monitor
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {!currentUser?.universeId
                      ? "Place belum didaftarkan. Masukkan Place ID di tab Pengaturan API & Webhook terlebih dahulu."
                      : !isGameConnected
                      ? `Place ${currentUser.placeName || currentUser.universeId} terdaftar. Menunggu koneksi dari Roblox Studio atau Live Server...`
                      : `Terhubung ke ${currentUser.placeName || currentUser.universeId}. Memantau status server, restart, dan log secara real-time.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchTerminal}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentKey) return;
                      await fetch(`/api/terminal?key=${encodeURIComponent(currentKey)}`, {
                        method: "DELETE",
                      });
                      setTermLogs([]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 cursor-pointer"
                  >
                    Clear Log
                  </button>
                </div>
              </div>

              {termServers.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#07090e] border border-white/5 text-xs text-slate-400">
                  Belum ada server Roblox (Studio / Live) yang mengirim heartbeat ke terminal.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {termServers.map((srv) => {
                    const secAgo = Math.max(
                      0,
                      Math.floor((Date.now() - Date.parse(srv.lastSeen || "")) / 1000)
                    );
                    const badgeColor =
                      srv.status === "online"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : srv.status === "restarting"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-slate-500/15 text-slate-400 border-slate-500/30";
                    return (
                      <div
                        key={srv.serverId}
                        className="p-3.5 rounded-2xl bg-[#07090e] border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">
                            {srv.isStudio ? "STUDIO PLAYTEST" : "LIVE SERVER"}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                            {srv.status}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-300 truncate" title={srv.serverId}>
                          {srv.serverId}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{srv.playerCount} Players</span>
                          <span>Uptime {srv.uptimeSec}s · {Number.isFinite(secAgo) ? `${secAgo}s lalu` : "-"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={termServerFilter}
                    onChange={(e) => setTermServerFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#07090e] border border-white/10 text-xs text-slate-200 font-mono"
                  >
                    <option value="all">Semua Server ({termServers.length})</option>
                    {termServers.map((s) => (
                      <option key={s.serverId} value={s.serverId}>
                        {s.isStudio ? "[STUDIO] " : "[LIVE] "}
                        {s.serverId.slice(0, 18)}
                      </option>
                    ))}
                  </select>
                  {(["all", "info", "warn", "error"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTermLevelFilter(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border cursor-pointer ${
                        termLevelFilter === lvl
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termAutoScroll}
                    onChange={(e) => setTermAutoScroll(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Auto-scroll
                </label>
              </div>

              <div className="h-80 overflow-y-auto rounded-2xl bg-[#05070b] border border-white/10 p-3.5 font-mono text-[11px] space-y-1.5">
                {termLogs
                  .filter((l) => (termServerFilter === "all" ? true : l.serverId === termServerFilter))
                  .filter((l) => (termLevelFilter === "all" ? true : l.level === termLevelFilter))
                  .map((l) => {
                    const lvlColor =
                      l.level === "error"
                        ? "text-rose-400"
                        : l.level === "warn"
                        ? "text-amber-300"
                        : "text-emerald-300";
                    return (
                      <div key={l.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0">
                          {new Date(l.ts).toLocaleTimeString("id-ID")}
                        </span>
                        <span className={`uppercase font-bold shrink-0 ${lvlColor}`}>
                          [{l.level}]
                        </span>
                        <span className="text-sky-400 shrink-0">
                          {l.isStudio ? "[STUDIO]" : `[${l.serverId.slice(0, 8)}]`}
                        </span>
                        <span className="text-slate-200 break-all">{l.message}</span>
                      </div>
                    );
                  })}
                {termLogs.length === 0 && (
                  <div className="text-slate-500 italic">Menunggu log dari server Roblox...</div>
                )}
                <div ref={termEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 max-w-3xl mx-auto space-y-5 sm:space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] uppercase tracking-wider mb-2">
                <Cpu className="w-3 h-3" /> REAL-TIME DISPATCH ENGINE
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Simulator Donasi Real Instan
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Kirim donasi simulasi ke token game kamu untuk menguji efek Nuke, Smite, Meteor, Black Hole, atau Angel di Roblox Studio tanpa perlu transaksi uang asli!
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilih Preset Efek Sinematik:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {effectPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSimAmount(preset.amount);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                      simAmount === preset.amount
                        ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
                        : "bg-[#080a10] border-white/10 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{preset.icon}</span> {preset.name}
                      </div>
                      <span className="text-[9px] font-mono text-amber-400/90 font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {preset.tag}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                      Rp {preset.amount.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-2">
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
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {(["real", "bagibagi", "sociabuzz"] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSimPlatform(plat)}
                      className={`py-2.5 px-2 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-bold uppercase transition cursor-pointer truncate ${
                        simPlatform === plat
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/10"
                          : "bg-[#080a10] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {plat === "real" ? "Saweria" : plat}
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
              className="w-full py-4 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 btn-gold-shimmer disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {simLoading ? "Mengirim ke Antrean Server..." : "Kirim Test Donasi Sekarang 🚀"}
            </button>
          </div>
        )}

        {/* TAB 3: TRANSACTION LOGS */}
        {activeTab === "logs" && (
          <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Riwayat Transaksi Khusus Game Kamu
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Menampilkan log donasi live yang masuk ke token terdaftar ini.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Platform Filters */}
                <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-[#090b10] border border-white/10 gap-1 max-w-full">
                  {(["all", "real", "bagibagi", "sociabuzz"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setLogFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                        logFilter === filter
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter === "real" ? "Saweria" : filter}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchStats(currentKey)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  Segarkan Data
                </button>
              </div>
            </div>

            {filteredDonations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-3 card-obsidian-luxury rounded-2xl border border-white/5">
                <Coins className="w-9 h-9 text-slate-600 mx-auto" />
                <p className="text-slate-300 font-semibold text-sm">Belum ada transaksi donasi untuk token ini.</p>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                  Kirim donasi simulasi di tab Simulator atau buat donasi uji coba melalui link BagiBagi / Sociabuzz untuk melihat entri di ledger ini!
                </p>
                <button
                  onClick={() => setActiveTab("simulator")}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  Buka Simulator Donasi <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#07090e]">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/10 bg-[#050608]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Waktu</th>
                      <th className="py-3 px-4 whitespace-nowrap">Donatur</th>
                      <th className="py-3 px-4 whitespace-nowrap">Nominal</th>
                      <th className="py-3 px-4 whitespace-nowrap">Pesan</th>
                      <th className="py-3 px-4 whitespace-nowrap">Platform</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDonations.map((item) => (
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

        {/* TAB 4: SYNC DATASTORE & CONFIG */}
        {activeTab === "sync" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-amber-400" />
                    Sinkronisasi Config &amp; Preset Tier
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Atur nominal preset &amp; threshold di sini agar tersinkron otomatis dengan Roblox Worker (`KalssDonateRealConfig`).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={syncSaving}
                  onClick={async () => {
                    setSyncSaving(true);
                    setSyncStatus(null);
                    try {
                      const res = await fetch("/api/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          key: currentKey,
                          action: "save_config",
                          config: syncConfig,
                        }),
                      });
                      const data = await res.json();
                      if (data.ok) {
                        setSyncConfig(data.config);
                        setSyncStatus("✅ Config & preset tersimpan! Roblox server akan sinkron otomatis.");
                      } else {
                        setSyncStatus("❌ Gagal menyimpan: " + (data.error || "unknown"));
                      }
                    } catch {
                      setSyncStatus("❌ Gagal menghubungi server.");
                    } finally {
                      setSyncSaving(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                >
                  {syncSaving ? "Menyimpan..." : "Simpan & Sync ke Roblox"}
                </button>
                <button
                  type="button"
                  disabled={syncSaving}
                  onClick={async () => {
                    setSyncSaving(true);
                    setSyncStatus(null);
                    try {
                      const res = await fetch("/api/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          key: currentKey,
                          action: "reset_config",
                        }),
                      });
                      const data = await res.json();
                      if (data.ok) {
                        setSyncConfig(data.config);
                        setSyncStatus("✅ Mode sinkronisasi direset! Website akan otomatis mengambil config dari server Roblox.");
                      } else {
                        setSyncStatus("❌ Gagal reset: " + (data.error || "unknown"));
                      }
                    } catch {
                      setSyncStatus("❌ Gagal menghubungi server.");
                    } finally {
                      setSyncSaving(false);
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Ambil dari Config Roblox
                </button>
              </div>

              {syncStatus && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
                  {syncStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Popup Announce Min (Rp)</label>
                  <input
                    type="number"
                    value={syncConfig.popupMinAmount}
                    onChange={(e) => setSyncConfig({ ...syncConfig, popupMinAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-[#080a10] border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cinematic UI Min (Rp)</label>
                  <input
                    type="number"
                    value={syncConfig.cinematicMinAmount}
                    onChange={(e) => setSyncConfig({ ...syncConfig, cinematicMinAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-[#080a10] border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Global Broadcast Min (Rp)</label>
                  <input
                    type="number"
                    value={syncConfig.globalMinAmount}
                    onChange={(e) => setSyncConfig({ ...syncConfig, globalMinAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-[#080a10] border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">Daftar Preset Tier:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {syncConfig.presets.map((p, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#080a10] border border-white/10 flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span className="text-base shrink-0">{p.icon}</span>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...syncConfig.presets];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setSyncConfig({ ...syncConfig, presets: next });
                        }}
                        className="flex-1 min-w-[100px] sm:w-28 sm:flex-none px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-semibold"
                      />
                      <input
                        type="text"
                        value={p.effect}
                        onChange={(e) => {
                          const next = [...syncConfig.presets];
                          next[idx] = { ...next[idx], effect: e.target.value };
                          setSyncConfig({ ...syncConfig, presets: next });
                        }}
                        className="w-24 px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[11px] text-amber-300 font-mono"
                      />
                      <input
                        type="number"
                        value={p.amount}
                        onChange={(e) => {
                          const next = [...syncConfig.presets];
                          next[idx] = { ...next[idx], amount: Number(e.target.value) };
                          setSyncConfig({ ...syncConfig, presets: next });
                        }}
                        className="w-full sm:w-auto sm:flex-1 px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-emerald-400 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl card-obsidian-luxury border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    DataStore Donatur Tersinkron ({syncedDonors.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Data top donatur dari Roblox DataStore (`KalssDonateRealBoard`) yang tersinkron ke dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchSync(currentKey)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {/* Form Tambah / Update DataStore Manual */}
              <div className="p-4 rounded-2xl bg-[#080a10] border border-white/10 space-y-3">
                <div className="text-xs font-bold text-amber-300">+ Tambah / Update DataStore Manual (Tersinkron ke Roblox)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Username Roblox (cth: rabaikuda)"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                  <input
                    type="number"
                    placeholder="Total Donasi (Rp)"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(Number(e.target.value))}
                    className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-emerald-400 font-mono"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {manualStatus || "Cukup isi Username & Total Donasi — UserId otomatis di-resolve dan disync ke Roblox."}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      setManualStatus(null);
                      try {
                        const res = await fetch("/api/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            key: currentKey,
                            action: "upsert_donor",
                            donor: {
                              username: manualUsername.trim(),
                              total: Number(manualTotal) || 0,
                            },
                          }),
                        });
                        const data = await res.json();
                        if (data.ok) {
                          setSyncedDonors(data.donors || []);
                          setManualStatus("✅ DataStore donatur ditambahkan & masuk antrean sync Roblox!");
                          setManualUsername("");
                          setManualTotal(0);
                        } else {
                          setManualStatus("❌ Gagal: " + (data.error || "invalid"));
                        }
                      } catch {
                        setManualStatus("❌ Gagal menghubungi server.");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer"
                  >
                    Simpan ke DataStore &amp; Sync
                  </button>
                </div>
              </div>

              {syncedDonors.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-[#080a10] rounded-2xl border border-white/5">
                  Belum ada data DataStore yang masuk dari server Roblox. Jalankan server/Playtest dengan `EnableInStudio = true` untuk sync otomatis.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#07090e]">
                  <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2.5 px-3 whitespace-nowrap">Rank</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Donatur</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">UserId</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Total Donasi</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Last Sync</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {syncedDonors.map((d, i) => {
                        const isEditing = editingDonorId === d.userId;
                        return (
                        <tr key={d.userId} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">#{i + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {d.displayName} <span className="text-slate-400 font-normal">(@{d.username})</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{d.userId}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                value={editingDonorTotal}
                                onChange={(e) => setEditingDonorTotal(Number(e.target.value))}
                                className="w-36 px-2.5 py-1 bg-black/60 border border-amber-500/60 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none"
                              />
                            ) : (
                              <>Rp {Number(d.total || 0).toLocaleString("id-ID")}</>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {new Date(d.updatedAt).toLocaleTimeString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={editingSaving}
                                  onClick={async () => {
                                    setEditingSaving(true);
                                    setManualStatus(null);
                                    try {
                                      const res = await fetch("/api/sync", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          key: currentKey,
                                          action: "upsert_donor",
                                          donor: {
                                            userId: d.userId,
                                            username: d.username,
                                            displayName: d.displayName,
                                            total: Math.max(0, Number(editingDonorTotal) || 0),
                                          },
                                        }),
                                      });
                                      const data = await res.json();
                                      if (data.ok) {
                                        setSyncedDonors(data.donors || []);
                                        setEditingDonorId(null);
                                        setManualStatus(`✅ DataStore @${d.username} diperbarui & disync ke Roblox!`);
                                      } else {
                                        setManualStatus("❌ Gagal update: " + (data.error || "invalid"));
                                      }
                                    } catch {
                                      setManualStatus("❌ Gagal menghubungi server.");
                                    } finally {
                                      setEditingSaving(false);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                                >
                                  {editingSaving ? "..." : "Simpan"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDonorId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDonorId(d.userId);
                                    setEditingDonorTotal(Number(d.total) || 0);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[11px] cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!window.confirm(`Hapus & reset data donasi @${d.username}?`)) {
                                      return;
                                    }
                                    setManualStatus(null);
                                    try {
                                      const res = await fetch("/api/sync", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          key: currentKey,
                                          action: "delete_donor",
                                          donor: {
                                            userId: d.userId,
                                            username: d.username,
                                          },
                                        }),
                                      });
                                      const data = await res.json();
                                      if (data.ok) {
                                        setSyncedDonors(data.donors || []);
                                        setManualStatus(`✅ DataStore @${d.username} dihapus & direset di Roblox!`);
                                      } else {
                                        setManualStatus("❌ Gagal hapus: " + (data.error || "invalid"));
                                      }
                                    } catch {
                                      setManualStatus("❌ Gagal menghubungi server.");
                                    }
                                  }}
                                  className="px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[11px] cursor-pointer"
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
