# KALSS DONATION GATEWAY • Platform Donasi Real Roblox

Platform jembatan (bridge) donasi **Real** otomatis dari berbagai platform pembayaran Indonesia (**BagiBagi**, **Sociabuzz**, **Trakteer**, dan lainnya) langsung ke game Roblox **Kalss Studio**. Donasi masuk via webhook yang nanti akan disesuaikan dengan link donasi aktif.

---

## 🚀 Fitur Utama
1. **Multi-Game API Key**: Buat API Key terpisah untuk setiap game Roblox yang kamu miliki (`kalss_live_...`).
2. **Webhook Receiver**:
   - `POST /api/webhook/real?key=YOUR_API_KEY`
   - `POST /api/webhook/bagibagi?key=YOUR_API_KEY`
   - `POST /api/webhook/sociabuzz?key=YOUR_API_KEY`
3. **Roblox Integration**:
   - `POST /api/pull`: Menjemput transaksi antrean secara real-time dari Roblox.
   - `POST /api/ack`: Mengonfirmasi donasi yang sudah berhasil diproses di game.
4. **Simulator Donasi**: Tombol test instan untuk menguji efek Nuke / Smite / BlackHole langsung di Roblox tanpa bayar uang asli.
5. **Dashboard Analytics**: Statistik total donasi (Rp), jumlah transaksi, dan tabel riwayat live.

---

## 📦 Cara Deploy ke GitHub + Vercel (Gratis)

### 1. Push ke GitHub
Buka terminal di folder project ini:
```bash
git add .
git commit -m "feat: initial kalss donation platform"
```

Buat repository baru di [GitHub](https://github.com/new) (misal: `kalss-donate-platform`), lalu jalankan perintah GitHub kamu:
```bash
git remote add origin https://github.com/USERNAME/kalss-donate-platform.git
git branch -M main
git push -u origin main
```

### 2. Deploy ke Vercel (1-Click)
1. Buka [Vercel](https://vercel.com) dan login dengan akun GitHub kamu.
2. Klik tombol **"Add New"** -> **"Project"**.
3. Pilih repository `kalss-donate-platform` yang baru saja kamu push.
4. Klik **"Deploy"** (Semua pengaturan default Next.js sudah otomatis pas!).
5. Dalam ~1 menit, websitemu sudah aktif online dengan domain HTTPS (contoh: `https://kalss-donate.vercel.app`).

---

## ⚙️ Cara Menghubungkan ke Real / BagiBagi

1. Buka website kamu di Vercel (contoh: `https://kalss-donate.vercel.app`).
2. Di tab **Pengaturan API & Webhook**, salin URL webhook platform yang kamu pakai:
   * **Real**: `https://kalss-donate.vercel.app/api/webhook/real?key=kalss_live_...`
   * **BagiBagi**: `https://kalss-donate.vercel.app/api/webhook/bagibagi?key=kalss_live_...`
   * **Sociabuzz**: `https://kalss-donate.vercel.app/api/webhook/sociabuzz?key=kalss_live_...`
3. Tempelkan URL tersebut ke menu **Webhook** di dashboard akun pembayaran kamu.

---

## 🎮 Cara Menghubungkan ke Game Roblox Kamu

Buka game kamu di Roblox Studio, lalu buka file:
📁 `ReplicatedStorage.KalssDonateRealRS.KalssDonateRealConfig`

Isi bagian **Backend**:
```lua
Config.Backend = {
    Enabled = true,
    WorkerBaseUrl = "https://kalss-donate.vercel.app", -- Ganti dengan domain Vercel kamu
    ApiKey = "kalss_live_demo_key_57",                -- Ganti dengan API Key kamu
    PollInterval = 3,                                  -- Menjemput donasi tiap 3 detik
}
```

Sekarang setiap ada donasi masuk di Real, efek sinematik (Nuke, Smite, Blackhole, Endowment) dan papan donasi Kalss kamu akan meledak otomatis secara real-time!
