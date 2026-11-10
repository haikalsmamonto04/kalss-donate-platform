import fs from "fs";
import path from "path";

export interface ApiKeyRecord {
  id: string;
  key: string;
  name: string;
  robloxUserId?: string;
  robloxUsername?: string;
  avatarUrl?: string;
  createdAt: string;
  totalAmount: number;
  donationCount: number;
}

export interface DonationItem {
  id: string;
  apiKey: string;
  amount: number;
  donorName: string;
  username: string;
  message: string;
  targetName: string;
  platform: "saweria" | "bagibagi" | "sociabuzz" | "simulation" | "manual";
  status: "pending" | "processing" | "done" | "failed";
  leaseToken?: string;
  claimedAt?: number;
  createdAt: string;
  processedAt?: string;
}

interface DataStore {
  keys: ApiKeyRecord[];
  donations: DonationItem[];
}

// Global in-memory storage fallback for serverless
declare global {
  // eslint-disable-next-line no-var
  var __kalssStore: DataStore | undefined;
}

const DATA_FILE = path.join(process.cwd(), ".kalss-data.json");

function getDefaultData(): DataStore {
  return {
    keys: [
      {
        id: "default-key-1",
        key: "kalss_live_demo_key_57",
        name: "Game Utama Kalss Studio",
        createdAt: new Date().toISOString(),
        totalAmount: 1750000,
        donationCount: 3,
      },
    ],
    donations: [
      {
        id: "demo-tx-001",
        apiKey: "kalss_live_demo_key_57",
        amount: 1000000,
        donorName: "Sultan_Roblox",
        username: "Sultan_Roblox",
        message: "Semangat terus dev! Ini buat beli kopi 🚀",
        targetName: "",
        platform: "saweria",
        status: "done",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        processedAt: new Date(Date.now() - 3590000).toISOString(),
      },
      {
        id: "demo-tx-002",
        apiKey: "kalss_live_demo_key_57",
        amount: 500000,
        donorName: "GamerSejati",
        username: "GamerSejati",
        message: "Gg gamenya makin keren!",
        targetName: "",
        platform: "bagibagi",
        status: "done",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        processedAt: new Date(Date.now() - 7190000).toISOString(),
      },
      {
        id: "demo-tx-003",
        apiKey: "kalss_live_demo_key_57",
        amount: 250000,
        donorName: "PlayerOne",
        username: "PlayerOne",
        message: "Support selalu!",
        targetName: "",
        platform: "sociabuzz",
        status: "done",
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        processedAt: new Date(Date.now() - 14390000).toISOString(),
      },
    ],
  };
}

function loadData(): DataStore {
  if (globalThis.__kalssStore) {
    return globalThis.__kalssStore;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      globalThis.__kalssStore = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn("[KalssStore] File read warning:", err);
  }

  const def = getDefaultData();
  globalThis.__kalssStore = def;
  saveData(def);
  return def;
}

function saveData(data: DataStore) {
  globalThis.__kalssStore = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Vercel serverless filesystem is read-only outside /tmp
    console.warn("[KalssStore] File write warning:", err);
  }
}

export const KalssStore = {
  // API Keys
  getKeys(): ApiKeyRecord[] {
    const data = loadData();
    return data.keys;
  },

  findKey(apiKey: string): ApiKeyRecord | undefined {
    const data = loadData();
    return data.keys.find((k) => k.key === apiKey);
  },

  findByRobloxUserId(userId: string): ApiKeyRecord | undefined {
    const data = loadData();
    return data.keys.find((k) => k.robloxUserId === userId);
  },

  createOrGetRobloxKey(userId: string, username: string, avatarUrl?: string): ApiKeyRecord {
    const data = loadData();
    const existing = data.keys.find((k) => k.robloxUserId === userId);
    if (existing) {
      if (avatarUrl) existing.avatarUrl = avatarUrl;
      if (username) existing.robloxUsername = username;
      saveData(data);
      return existing;
    }
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomHex = "";
    for (let i = 0; i < 20; i++) {
      randomHex += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newRecord: ApiKeyRecord = {
      id: "key-" + Date.now(),
      key: `kalss_live_${randomHex}`,
      name: `Game Roblox (${username})`,
      robloxUserId: userId,
      robloxUsername: username,
      avatarUrl: avatarUrl || "",
      createdAt: new Date().toISOString(),
      totalAmount: 0,
      donationCount: 0,
    };
    data.keys.unshift(newRecord);
    saveData(data);
    return newRecord;
  },

  createKey(name: string, robloxUsername?: string, avatarUrl?: string): ApiKeyRecord {
    const data = loadData();
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomHex = "";
    for (let i = 0; i < 20; i++) {
      randomHex += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newRecord: ApiKeyRecord = {
      id: "key-" + Date.now(),
      key: `kalss_live_${randomHex}`,
      name: name || "Game Baru",
      robloxUsername: robloxUsername || "",
      avatarUrl: avatarUrl || "",
      createdAt: new Date().toISOString(),
      totalAmount: 0,
      donationCount: 0,
    };
    data.keys.unshift(newRecord);
    saveData(data);
    return newRecord;
  },

  // Donations
  getDonations(apiKey?: string, limit = 50): DonationItem[] {
    const data = loadData();
    let list = data.donations;
    if (apiKey) {
      list = list.filter((d) => d.apiKey === apiKey);
    }
    return list.slice(0, limit);
  },

  addDonation(item: Omit<DonationItem, "id" | "status" | "createdAt">): DonationItem {
    const data = loadData();
    const newDonation: DonationItem = {
      ...item,
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    data.donations.unshift(newDonation);

    // Update key stats
    const keyRecord = data.keys.find((k) => k.key === item.apiKey);
    if (keyRecord) {
      keyRecord.totalAmount += item.amount;
      keyRecord.donationCount += 1;
    }

    saveData(data);
    return newDonation;
  },

  pullPendingDonations(apiKey: string, limit = 10): DonationItem[] {
    const data = loadData();
    const now = Date.now();

    const pending = data.donations.filter((d) => {
      if (d.apiKey !== apiKey) return false;
      if (d.status === "pending") return true;
      // Reclaim abandoned processing items after 60 seconds
      if (d.status === "processing" && d.claimedAt && now - d.claimedAt > 60000) {
        return true;
      }
      return false;
    });

    const selected = pending.slice(0, limit);
    for (const item of selected) {
      item.status = "processing";
      item.leaseToken = "lease-" + Math.random().toString(36).substring(2, 12);
      item.claimedAt = now;
    }

    if (selected.length > 0) {
      saveData(data);
    }

    return selected;
  },

  acknowledgeDonations(
    apiKey: string,
    items: Array<{ id: string; leaseToken?: string; status: "done" | "failed" }>
  ): number {
    const data = loadData();
    let updatedCount = 0;

    for (const ack of items) {
      const match = data.donations.find((d) => d.id === ack.id && d.apiKey === apiKey);
      if (match) {
        match.status = ack.status;
        match.processedAt = new Date().toISOString();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      saveData(data);
    }

    return updatedCount;
  },

  getStats(apiKey?: string) {
    const data = loadData();
    const list = apiKey ? data.donations.filter((d) => d.apiKey === apiKey) : data.donations;
    const totalAmount = list.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCount = list.length;
    const pendingCount = list.filter((d) => d.status === "pending" || d.status === "processing").length;
    const keyCount = data.keys.length;

    return {
      totalAmount,
      totalCount,
      pendingCount,
      keyCount,
    };
  },
};
