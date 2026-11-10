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
  Plus,
  Send,
  Zap,
  Globe,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";

interface KeyRecord {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  totalAmount: number;
  donationCount: number;
}

interface Donation {
  id: string;
  apiKey: string;
  amount: number;
  donorName: string;
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
  const [stats, setStats] = useState<StatsData>({
    totalAmount: 0,
    totalCount: 0,
    pendingCount: 0,
    keyCount: 0,
  });
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"keys" | "simulator" | "logs">("keys");
  const [origin, setOrigin] = useState<string>("");

  // Key creation state
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  // Simulator state
  const [simDonor, setSimDonor] = useState("Sultan_Gamer");
  const [simAmount, setSimAmount] = useState(2000);
  const [simMessage, setSimMessage] = useState("Ini efek Lubang Hitam buat game kamu! 🔥");
  const [simTarget, setSimTarget] = useState("");
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats${selectedKey ? `?key=${selectedKey}` : ""}`);
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setKeys(data.keys);
        setDonations(data.recent);
        if (!selectedKey && data.keys.length > 0) {
          setSelectedKey(data.keys[0].key);
        }
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [selectedKey]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewKeyName("");
        fetchStats();
        setSelectedKey(data.key.key);
      }
    } finally {
      setCreatingKey(false);
    }
  };

  const handleSimulateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;
    setSimLoading(true);
    setSimStatus(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: selectedKey,
          amount: Number(simAmount),
          donorName: simDonor,
          message: simMessage,
          targetName: simTarget,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSimStatus(data.message);
        fetchStats();
      } else {
        setSimStatus("Error: " + data.error);
      }
    } finally {
      setSimLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getWebhookUrl = (platform: "saweria" | "bagibagi" | "sociabuzz") => {
    const base = origin || "https://kalss-donate.vercel.app";
    return `${base}/api/webhook/${platform}?key=${selectedKey || "YOUR_API_KEY"}`;
  };

  return (
    <main className="min-h-screen pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Top Bar */}
      <header className="border-b border-cyan-900/30 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-400 p-[2px] shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Coins className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-wide">
                  KALSS DONATION GATEWAY
                </h1>
                <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  v2.0 Real
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bridge Saweria, BagiBagi, &amp; Sociabuzz ke Game Roblox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Roblox Worker Ready</span>
            </div>
            <button
              onClick={fetchStats}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Donasi Real</span>
              <Coins className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              {formatRupiah(stats.totalAmount)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Akumulasi donasi masuk</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Transaksi</span>
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {stats.totalCount} <span className="text-sm font-normal text-slate-400">donasi</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Diproses ke dalam game</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Antrean Pending</span>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 tracking-tight">
              {stats.pendingCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Menunggu Roblox jemput</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Game / API Key</span>
              <Key className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {stats.keyCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Game terdaftar aktif</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "keys"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Pengaturan API &amp; Webhook</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "simulator"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Simulator Uji Coba Efek</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "logs"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Riwayat Transaksi Live</span>
          </button>
        </div>

        {/* TAB 1: API KEYS & WEBHOOKS */}
        {activeTab === "keys" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Key List & Creation */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Key className="h-4 w-4 text-cyan-400" />
                    <span>Daftar API Key</span>
                  </h2>
                </div>

                <div className="space-y-2">
                  {keys.map((k) => (
                    <button
                      key={k.key}
                      onClick={() => setSelectedKey(k.key)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        selectedKey === k.key
                          ? "bg-cyan-950/40 border-cyan-500/50 text-white"
                          : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs truncate">{k.name}</span>
                        {selectedKey === k.key && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate">
                        {k.key}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                        <span>{k.donationCount} donasi</span>
                        <span className="text-amber-400/90 font-medium">
                          {formatRupiah(k.totalAmount)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Create Key Form */}
                <form onSubmit={handleCreateKey} className="pt-2 border-t border-slate-800">
                  <label className="text-xs text-slate-400 block mb-1">
                    Tambah Game / Project Baru
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nama Game (mis. Game 2)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={creatingKey}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Buat</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Webhook URLs & Roblox Config */}
            <div className="lg:col-span-2 space-y-6">
              {/* Webhook URLs for payment platforms */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <span>Webhook Payment Gateway (Saweria, BagiBagi, Sociabuzz)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Salin URL webhook di bawah ini ke menu Webhook di dashboard payment kamu:
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Saweria */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Saweria Webhook URL
                      </span>
                      <button
                        onClick={() => copyToClipboard(getWebhookUrl("saweria"), "saweria")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        {copiedText === "saweria" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      {getWebhookUrl("saweria")}
                    </div>
                  </div>

                  {/* BagiBagi */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-cyan-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        BagiBagi Webhook URL
                      </span>
                      <button
                        onClick={() => copyToClipboard(getWebhookUrl("bagibagi"), "bagibagi")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        {copiedText === "bagibagi" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      {getWebhookUrl("bagibagi")}
                    </div>
                  </div>

                  {/* Sociabuzz */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-indigo-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-400" />
                        Sociabuzz Webhook URL
                      </span>
                      <button
                        onClick={() => copyToClipboard(getWebhookUrl("sociabuzz"), "sociabuzz")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        {copiedText === "sociabuzz" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      {getWebhookUrl("sociabuzz")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roblox Studio Setup Snippet */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      <span>Pasang di Roblox Studio (KalssDonateRealConfig)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Buka <code>KalssDonateRealConfig</code> di ReplicatedStorage dan isi bagian Backend:
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const code = `Config.Backend = {\n\tEnabled = true,\n\tWorkerBaseUrl = "${origin || "https://kalss-donate.vercel.app"}",\n\tApiKey = "${selectedKey || "YOUR_API_KEY"}",\n\tPollInterval = 3,\n}`;
                      copyToClipboard(code, "robloxCode");
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs transition font-medium"
                  >
                    {copiedText === "robloxCode" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kode Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Konfigurasi</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-200 overflow-x-auto">
                  <pre>{`-- Di ReplicatedStorage.KalssDonateRealRS.KalssDonateRealConfig:

Config.Backend = {
    Enabled = true,
    WorkerBaseUrl = "${origin || "https://kalss-donate.vercel.app"}",
    ApiKey = "${selectedKey || "YOUR_API_KEY"}",
    PollInterval = 3,
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR UJI COBA */}
        {activeTab === "simulator" && (
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <span>Simulator Donasi Instan ke Roblox</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kirim donasi virtual langsung ke game kamu tanpa harus bayar uang beneran.
                Efek (Nuke / Smite / BlackHole) akan otomatis meledak di Roblox Studio dalam ~3 detik!
              </p>
            </div>

            {simStatus && (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>{simStatus}</span>
              </div>
            )}

            <form onSubmit={handleSimulateDonation} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target API Key Game</label>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                >
                  {keys.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.name} ({k.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Nominal Donasi &amp; Efek</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[
                    { label: "Nuke (Roket)", amount: 250 },
                    { label: "Smite (Palu Giant)", amount: 500 },
                    { label: "Endowment (Sayap)", amount: 1000 },
                    { label: "BlackHole (Lubang)", amount: 2000 },
                  ].map((p) => (
                    <button
                      key={p.amount}
                      type="button"
                      onClick={() => setSimAmount(p.amount)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        simAmount === p.amount
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">{p.label}</div>
                      <div className="font-bold">{p.amount.toLocaleString()} Real</div>
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500 font-mono"
                  placeholder="Nominal angka..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nama Donatur</label>
                  <input
                    type="text"
                    value={simDonor}
                    onChange={(e) => setSimDonor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                    placeholder="Nama di papan donasi"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Roblox Player (Opsional)</label>
                  <input
                    type="text"
                    value={simTarget}
                    onChange={(e) => setSimTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                    placeholder="Username pemain di dalam game"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Pesan Donasi</label>
                <textarea
                  rows={2}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 outline-none focus:border-cyan-500"
                  placeholder="Teks ucapan donatur yang tampil di layar..."
                />
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{simLoading ? "Mengirim Donasi..." : "Kirim Donasi Uji Coba ke Roblox"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: LIVE LOGS */}
        {activeTab === "logs" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Riwayat Donasi Real-Time</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Data transaksi yang masuk dari Webhook atau Simulator
                </p>
              </div>
              <button
                onClick={fetchStats}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Donatur</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Pesan</th>
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">Status di Roblox</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Belum ada donasi masuk. Coba lakukan donasi uji coba di tab Simulator!
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(d.createdAt).toLocaleTimeString("id-ID")}
                        </td>
                        <td className="py-3 px-3 font-medium text-white">{d.donorName}</td>
                        <td className="py-3 px-3 font-semibold text-amber-400">
                          {formatRupiah(d.amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                          &quot;{d.message}&quot;
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {d.platform}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {d.status === "done" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ Selesai Terkirim
                            </span>
                          )}
                          {d.status === "processing" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              ⏳ Sedang Dijemput
                            </span>
                          )}
                          {d.status === "pending" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                              ○ Di Antrean
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
