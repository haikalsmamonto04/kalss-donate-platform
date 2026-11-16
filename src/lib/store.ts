import fs from "fs";
import path from "path";
import os from "os";
import { getSupabaseClient } from "./supabase";

export interface GameMember {
  userId: string;
  username: string;
  avatarUrl?: string;
  role: "owner" | "co-owner";
  addedAt: string;
}

export interface ApiKeyRecord {
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

export interface DonationItem {
  id: string;
  apiKey: string;
  amount: number;
  donorName: string;
  username: string;
  message: string;
  targetName: string;
  platform: "real" | "bagibagi" | "sociabuzz" | "simulation" | "manual";
  status: "pending" | "processing" | "done" | "failed";
  leaseToken?: string;
  claimedAt?: number;
  createdAt: string;
  processedAt?: string;
}

export interface SyncedPreset {
  name: string;
  amount: number;
  effect: string;
  desc: string;
  tag: string;
  icon: string;
}

export interface SyncedDonorRecord {
  userId: string;
  username: string;
  displayName: string;
  total: number;
  updatedAt: string;
}

export interface SyncedGameConfig {
  presets: SyncedPreset[];
  popupMinAmount: number;
  cinematicMinAmount: number;
  globalMinAmount: number;
  updatedAt: string;
  customizedByWeb?: boolean;
}

interface DataStore {
  keys: ApiKeyRecord[];
  donations: DonationItem[];
  syncedConfigs?: Record<string, SyncedGameConfig>;
  syncedDonors?: Record<string, SyncedDonorRecord[]>;
  pendingDonorSync?: Record<string, SyncedDonorRecord[]>;
}

export function getDefaultSyncConfig(): SyncedGameConfig {
  return {
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
    updatedAt: new Date().toISOString(),
    customizedByWeb: false,
  };
}

declare global {
  var __kalssStore: DataStore | undefined;
}

const DATA_FILE = path.join(os.tmpdir(), "kalss-platform-data.json");

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
        platform: "real",
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
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        processedAt: new Date(Date.now() - 10790000).toISOString(),
      },
    ],
    syncedConfigs: {},
    syncedDonors: {},
    pendingDonorSync: {},
  };
}

function loadLocalData(): DataStore {
  if (global.__kalssStore) {
    return global.__kalssStore;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      global.__kalssStore = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  const initial = getDefaultData();
  global.__kalssStore = initial;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  } catch {
    // ignore
  }
  return initial;
}

function saveLocalData(data: DataStore) {
  global.__kalssStore = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {
    // ignore
  }
}

function mapDbKey(row: Record<string, unknown>): ApiKeyRecord {
  return {
    id: String(row.id || ""),
    key: String(row.key || ""),
    name: String(row.name || "Game Roblox"),
    robloxUserId: row.roblox_user_id ? String(row.roblox_user_id) : undefined,
    robloxUsername: row.roblox_username ? String(row.roblox_username) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    universeId: row.universe_id ? String(row.universe_id) : undefined,
    placeId: row.place_id ? String(row.place_id) : undefined,
    placeName: row.place_name ? String(row.place_name) : undefined,
    creatorType:
      row.creator_type === "Group"
        ? "Group"
        : row.creator_type === "User"
        ? "User"
        : undefined,
    creatorId: row.creator_id ? String(row.creator_id) : undefined,
    verified: Boolean(row.verified),
    members: Array.isArray(row.members) ? (row.members as GameMember[]) : [],
    createdAt: String(row.created_at || new Date().toISOString()),
    totalAmount: Number(row.total_amount || 0),
    donationCount: Number(row.donation_count || 0),
  };
}

function mapDbDonation(row: Record<string, unknown>): DonationItem {
  return {
    id: String(row.id || ""),
    apiKey: String(row.api_key || ""),
    amount: Number(row.amount || 0),
    donorName: String(row.donor_name || "Anonymous"),
    username: String(row.username || row.donor_name || "Anonymous"),
    message: String(row.message || ""),
    targetName: String(row.target_name || ""),
    platform: (row.platform as DonationItem["platform"]) || "real",
    status: (row.status as DonationItem["status"]) || "pending",
    leaseToken: row.lease_token ? String(row.lease_token) : undefined,
    claimedAt: row.claimed_at ? Number(row.claimed_at) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    processedAt: row.processed_at ? String(row.processed_at) : undefined,
  };
}

function generateLiveKey(): string {
  return `kalss_live_${
    Math.random().toString(36).substring(2, 12) +
    Math.random().toString(36).substring(2, 12)
  }`;
}

export const KalssStore = {
  async getKeys(): Promise<ApiKeyRecord[]> {
    const sb = getSupabaseClient();
    if (!sb) return loadLocalData().keys;

    const { data, error } = await sb
      .from("kalss_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapDbKey);
  },

  async findKey(key: string): Promise<ApiKeyRecord | undefined> {
    const clean = key.trim();
    if (!clean) return undefined;
    const sb = getSupabaseClient();
    if (!sb) {
      return loadLocalData().keys.find((k) => k.key === clean);
    }

    const { data, error } = await sb
      .from("kalss_keys")
      .select("*")
      .eq("key", clean)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapDbKey(data);
  },

  async adoptOrFindKey(key: string): Promise<ApiKeyRecord | undefined> {
    const clean = key.trim();
    if (!/^kalss_live_[a-zA-Z0-9_]{8,64}$/.test(clean)) {
      return undefined;
    }
    const existing = await this.findKey(clean);
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const adopted: ApiKeyRecord = {
      id: "adopted-" + Date.now(),
      key: clean,
      name: "Game Kalss Studio",
      verified: false,
      members: [],
      createdAt: nowIso,
      totalAmount: 0,
      donationCount: 0,
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      data.keys.unshift(adopted);
      saveLocalData(data);
      return adopted;
    }

    const { error } = await sb.from("kalss_keys").insert({
      key: adopted.key,
      id: adopted.id,
      name: adopted.name,
      verified: false,
      members: [],
      total_amount: 0,
      donation_count: 0,
      created_at: adopted.createdAt,
    });
    if (error) {
      // In case of race condition, try finding again
      return await this.findKey(clean);
    }
    return adopted;
  },

  async findKeyByUniverseId(universeId: string): Promise<ApiKeyRecord | undefined> {
    const uid = String(universeId || "").trim();
    if (!uid) return undefined;
    const sb = getSupabaseClient();
    if (!sb) {
      return loadLocalData().keys.find((k) => k.universeId === uid);
    }

    const { data, error } = await sb
      .from("kalss_keys")
      .select("*")
      .eq("universe_id", uid)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapDbKey(data);
  },

  async getKeysForUser(robloxUserId: string): Promise<ApiKeyRecord[]> {
    const uid = String(robloxUserId || "").trim();
    if (!uid) return [];
    const all = await this.getKeys();
    return all.filter(
      (k) =>
        k.robloxUserId === uid ||
        (Array.isArray(k.members) && k.members.some((m) => m.userId === uid))
    );
  },

  async createOrGetRobloxKey(
    robloxUserId: string,
    robloxUsername: string,
    avatarUrl?: string
  ): Promise<ApiKeyRecord> {
    const sb = getSupabaseClient();
    const nowIso = new Date().toISOString();

    if (!sb) {
      const data = loadLocalData();
      const existing = data.keys.find(
        (k) =>
          k.robloxUserId === robloxUserId ||
          (Array.isArray(k.members) &&
            k.members.some((m) => m.userId === robloxUserId))
      );
      if (existing) {
        if (existing.robloxUserId === robloxUserId) {
          existing.robloxUsername = robloxUsername;
          if (avatarUrl) existing.avatarUrl = avatarUrl;
          saveLocalData(data);
        }
        return existing;
      }

      const newRecord: ApiKeyRecord = {
        id: "rbx-" + Date.now(),
        key: generateLiveKey(),
        name: `Game ${robloxUsername}`,
        robloxUserId,
        robloxUsername,
        avatarUrl: avatarUrl || "",
        verified: false,
        members: [
          {
            userId: robloxUserId,
            username: robloxUsername,
            avatarUrl: avatarUrl || "",
            role: "owner",
            addedAt: nowIso,
          },
        ],
        createdAt: nowIso,
        totalAmount: 0,
        donationCount: 0,
      };
      data.keys.unshift(newRecord);
      saveLocalData(data);
      return newRecord;
    }

    // Supabase path: check existing ownership or team membership
    const userKeys = await this.getKeysForUser(robloxUserId);
    if (userKeys.length > 0) {
      // Prefer key where user is primary owner or already bound to a universe
      const preferred =
        userKeys.find((k) => Boolean(k.universeId)) ||
        userKeys.find((k) => k.robloxUserId === robloxUserId) ||
        userKeys[0];

      if (preferred.robloxUserId === robloxUserId) {
        await sb
          .from("kalss_keys")
          .update({
            roblox_username: robloxUsername,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          })
          .eq("key", preferred.key);
        preferred.robloxUsername = robloxUsername;
        if (avatarUrl) preferred.avatarUrl = avatarUrl;
      }
      return preferred;
    }

    const newRecord: ApiKeyRecord = {
      id: "rbx-" + Date.now(),
      key: generateLiveKey(),
      name: `Game ${robloxUsername}`,
      robloxUserId,
      robloxUsername,
      avatarUrl: avatarUrl || "",
      verified: false,
      members: [
        {
          userId: robloxUserId,
          username: robloxUsername,
          avatarUrl: avatarUrl || "",
          role: "owner",
          addedAt: nowIso,
        },
      ],
      createdAt: nowIso,
      totalAmount: 0,
      donationCount: 0,
    };

    const { error } = await sb.from("kalss_keys").insert({
      key: newRecord.key,
      id: newRecord.id,
      name: newRecord.name,
      roblox_user_id: newRecord.robloxUserId,
      roblox_username: newRecord.robloxUsername,
      avatar_url: newRecord.avatarUrl,
      verified: false,
      members: newRecord.members,
      total_amount: 0,
      donation_count: 0,
      created_at: newRecord.createdAt,
    });
    if (error) {
      throw new Error(`Supabase insert key failed: ${error.message}`);
    }
    return newRecord;
  },

  async createKey(
    name: string,
    robloxUsername?: string,
    avatarUrl?: string
  ): Promise<ApiKeyRecord> {
    const newRecord: ApiKeyRecord = {
      id: "key-" + Date.now(),
      key: generateLiveKey(),
      name: name || "Game Baru",
      robloxUsername: robloxUsername || "",
      avatarUrl: avatarUrl || "",
      verified: false,
      members: [],
      createdAt: new Date().toISOString(),
      totalAmount: 0,
      donationCount: 0,
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      data.keys.unshift(newRecord);
      saveLocalData(data);
      return newRecord;
    }

    const { error } = await sb.from("kalss_keys").insert({
      key: newRecord.key,
      id: newRecord.id,
      name: newRecord.name,
      roblox_username: newRecord.robloxUsername,
      avatar_url: newRecord.avatarUrl,
      verified: false,
      members: [],
      total_amount: 0,
      donation_count: 0,
      created_at: newRecord.createdAt,
    });
    if (error) throw new Error(error.message);
    return newRecord;
  },

  async bindPlace(
    apiKey: string,
    placeInfo: {
      universeId: string;
      placeId: string;
      placeName: string;
      creatorType: "User" | "Group";
      creatorId: string;
    }
  ): Promise<ApiKeyRecord | undefined> {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      const rec = data.keys.find((k) => k.key === apiKey);
      if (!rec) return undefined;
      const changed = rec.universeId !== placeInfo.universeId;
      rec.universeId = placeInfo.universeId;
      rec.placeId = placeInfo.placeId;
      rec.placeName = placeInfo.placeName;
      rec.name = placeInfo.placeName || rec.name;
      rec.creatorType = placeInfo.creatorType;
      rec.creatorId = placeInfo.creatorId;
      if (changed) rec.verified = false;
      saveLocalData(data);
      return rec;
    }

    const current = await this.findKey(apiKey);
    if (!current) return undefined;
    const changed = current.universeId !== placeInfo.universeId;

    const { data, error } = await sb
      .from("kalss_keys")
      .update({
        universe_id: placeInfo.universeId,
        place_id: placeInfo.placeId,
        place_name: placeInfo.placeName,
        name: placeInfo.placeName || current.name,
        creator_type: placeInfo.creatorType,
        creator_id: placeInfo.creatorId,
        verified: changed ? false : Boolean(current.verified),
      })
      .eq("key", apiKey)
      .select("*")
      .single();
    if (error || !data) return undefined;
    return mapDbKey(data);
  },

  async createKeyForUserPlace(
    user: { userId: string; username: string; avatarUrl?: string },
    placeInfo: {
      universeId: string;
      placeId: string;
      placeName: string;
      creatorType: "User" | "Group";
      creatorId: string;
    }
  ): Promise<ApiKeyRecord> {
    const nowIso = new Date().toISOString();
    const newRecord: ApiKeyRecord = {
      id: "rbx-" + Date.now(),
      key: generateLiveKey(),
      name: placeInfo.placeName || `Game ${user.username}`,
      robloxUserId: user.userId,
      robloxUsername: user.username,
      avatarUrl: user.avatarUrl || "",
      universeId: placeInfo.universeId,
      placeId: placeInfo.placeId,
      placeName: placeInfo.placeName,
      creatorType: placeInfo.creatorType,
      creatorId: placeInfo.creatorId,
      verified: false,
      members: [
        {
          userId: user.userId,
          username: user.username,
          avatarUrl: user.avatarUrl || "",
          role: "owner",
          addedAt: nowIso,
        },
      ],
      createdAt: nowIso,
      totalAmount: 0,
      donationCount: 0,
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      data.keys.unshift(newRecord);
      saveLocalData(data);
      return newRecord;
    }

    const { error } = await sb.from("kalss_keys").insert({
      key: newRecord.key,
      id: newRecord.id,
      name: newRecord.name,
      roblox_user_id: newRecord.robloxUserId,
      roblox_username: newRecord.robloxUsername,
      avatar_url: newRecord.avatarUrl,
      universe_id: newRecord.universeId,
      place_id: newRecord.placeId,
      place_name: newRecord.placeName,
      creator_type: newRecord.creatorType,
      creator_id: newRecord.creatorId,
      verified: false,
      members: newRecord.members,
      total_amount: 0,
      donation_count: 0,
      created_at: newRecord.createdAt,
    });
    if (error) throw new Error(error.message);
    return newRecord;
  },

  async markKeyVerified(apiKey: string): Promise<void> {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      const rec = data.keys.find((k) => k.key === apiKey);
      if (rec && !rec.verified) {
        rec.verified = true;
        saveLocalData(data);
      }
      return;
    }
    await sb.from("kalss_keys").update({ verified: true }).eq("key", apiKey);
  },

  async addMember(
    apiKey: string,
    member: Omit<GameMember, "addedAt">
  ): Promise<ApiKeyRecord | undefined> {
    const current = await this.findKey(apiKey);
    if (!current) return undefined;

    const existingMembers = Array.isArray(current.members) ? [...current.members] : [];
    const idx = existingMembers.findIndex((m) => m.userId === member.userId);
    const entry: GameMember = {
      ...member,
      addedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      existingMembers[idx] = { ...existingMembers[idx], ...entry };
    } else {
      existingMembers.push(entry);
    }

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      const rec = data.keys.find((k) => k.key === apiKey);
      if (rec) {
        rec.members = existingMembers;
        saveLocalData(data);
      }
      return rec;
    }

    const { data, error } = await sb
      .from("kalss_keys")
      .update({ members: existingMembers })
      .eq("key", apiKey)
      .select("*")
      .single();
    if (error || !data) return undefined;
    return mapDbKey(data);
  },

  async removeMember(apiKey: string, userId: string): Promise<ApiKeyRecord | undefined> {
    const current = await this.findKey(apiKey);
    if (!current) return undefined;
    if (current.robloxUserId === userId) return current; // cannot remove primary owner

    const nextMembers = (current.members || []).filter((m) => m.userId !== userId);
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      const rec = data.keys.find((k) => k.key === apiKey);
      if (rec) {
        rec.members = nextMembers;
        saveLocalData(data);
      }
      return rec;
    }

    const { data, error } = await sb
      .from("kalss_keys")
      .update({ members: nextMembers })
      .eq("key", apiKey)
      .select("*")
      .single();
    if (error || !data) return undefined;
    return mapDbKey(data);
  },

  // Donations
  async getDonations(apiKey?: string, limit = 50): Promise<DonationItem[]> {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      let list = data.donations;
      if (apiKey) list = list.filter((d) => d.apiKey === apiKey);
      return list.slice(0, limit);
    }

    let query = sb
      .from("kalss_donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (apiKey) {
      query = query.eq("api_key", apiKey);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapDbDonation);
  },

  async addDonation(
    item: Omit<DonationItem, "id" | "status" | "createdAt">
  ): Promise<DonationItem> {
    const newDonation: DonationItem = {
      ...item,
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      data.donations.unshift(newDonation);
      const keyRecord = data.keys.find((k) => k.key === item.apiKey);
      if (keyRecord) {
        keyRecord.totalAmount += item.amount;
        keyRecord.donationCount += 1;
      }
      saveLocalData(data);
      return newDonation;
    }

    const { error } = await sb.from("kalss_donations").insert({
      id: newDonation.id,
      api_key: newDonation.apiKey,
      amount: newDonation.amount,
      donor_name: newDonation.donorName,
      username: newDonation.username,
      message: newDonation.message,
      target_name: newDonation.targetName,
      platform: newDonation.platform,
      status: "pending",
      created_at: newDonation.createdAt,
    });
    if (error) throw new Error(error.message);

    const keyRecord = await this.findKey(item.apiKey);
    if (keyRecord) {
      await sb
        .from("kalss_keys")
        .update({
          total_amount: keyRecord.totalAmount + item.amount,
          donation_count: keyRecord.donationCount + 1,
        })
        .eq("key", item.apiKey);
    }

    return newDonation;
  },

  async pullPendingDonations(apiKey: string, limit = 10): Promise<DonationItem[]> {
    const now = Date.now();
    const sb = getSupabaseClient();

    if (!sb) {
      const data = loadLocalData();
      const pending = data.donations.filter((d) => {
        if (d.apiKey !== apiKey) return false;
        if (d.status === "pending") return true;
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
      if (selected.length > 0) saveLocalData(data);
      return selected;
    }

    const { data, error } = await sb
      .from("kalss_donations")
      .select("*")
      .eq("api_key", apiKey)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true })
      .limit(50);

    if (error || !data) return [];

    const candidates = data.map(mapDbDonation).filter((d) => {
      if (d.status === "pending") return true;
      if (d.status === "processing" && d.claimedAt && now - d.claimedAt > 60000) {
        return true;
      }
      return false;
    });

    const selected = candidates.slice(0, limit);
    for (const item of selected) {
      const leaseToken = "lease-" + Math.random().toString(36).substring(2, 12);
      item.status = "processing";
      item.leaseToken = leaseToken;
      item.claimedAt = now;

      await sb
        .from("kalss_donations")
        .update({
          status: "processing",
          lease_token: leaseToken,
          claimed_at: now,
        })
        .eq("id", item.id);
    }

    return selected;
  },

  async acknowledgeDonations(
    apiKey: string,
    items: Array<{ id: string; leaseToken?: string; status: "done" | "failed" }>
  ): Promise<number> {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      let updatedCount = 0;
      for (const ack of items) {
        const match = data.donations.find(
          (d) => d.id === ack.id && d.apiKey === apiKey
        );
        if (match) {
          match.status = ack.status;
          match.processedAt = new Date().toISOString();
          updatedCount++;
        }
      }
      if (updatedCount > 0) saveLocalData(data);
      return updatedCount;
    }

    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    for (const ack of items) {
      const { error, count } = await sb
        .from("kalss_donations")
        .update({ status: ack.status, processed_at: nowIso }, { count: "exact" })
        .eq("id", ack.id)
        .eq("api_key", apiKey);
      if (!error && (count === null || count > 0)) {
        updatedCount++;
      }
    }
    return updatedCount;
  },

  async getStats(apiKey?: string) {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      const list = apiKey
        ? data.donations.filter((d) => d.apiKey === apiKey)
        : data.donations;
      return {
        totalAmount: list.reduce((acc, curr) => acc + curr.amount, 0),
        totalCount: list.length,
        pendingCount: list.filter(
          (d) => d.status === "pending" || d.status === "processing"
        ).length,
        keyCount: data.keys.length,
      };
    }

    let query = sb.from("kalss_donations").select("amount, status");
    if (apiKey) query = query.eq("api_key", apiKey);
    const { data: donations } = await query;
    const list = donations || [];

    const { count: keyCount } = await sb
      .from("kalss_keys")
      .select("key", { count: "exact", head: true });

    return {
      totalAmount: list.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
      totalCount: list.length,
      pendingCount: list.filter(
        (d) => d.status === "pending" || d.status === "processing"
      ).length,
      keyCount: keyCount || 0,
    };
  },

  async getSyncState(
    apiKey: string
  ): Promise<{ config: SyncedGameConfig; donors: SyncedDonorRecord[] }> {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.syncedConfigs) data.syncedConfigs = {};
      if (!data.syncedDonors) data.syncedDonors = {};
      if (!data.syncedConfigs[apiKey]) {
        data.syncedConfigs[apiKey] = getDefaultSyncConfig();
        saveLocalData(data);
      }
      return {
        config: data.syncedConfigs[apiKey],
        donors: data.syncedDonors[apiKey] || [],
      };
    }

    const { data } = await sb
      .from("kalss_game_state")
      .select("*")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (!data) {
      const def = getDefaultSyncConfig();
      await sb.from("kalss_game_state").upsert({
        api_key: apiKey,
        synced_config: def,
        synced_donors: [],
        pending_donor_sync: [],
        updated_at: new Date().toISOString(),
      });
      return { config: def, donors: [] };
    }

    return {
      config: (data.synced_config as SyncedGameConfig) || getDefaultSyncConfig(),
      donors: Array.isArray(data.synced_donors)
        ? (data.synced_donors as SyncedDonorRecord[])
        : [],
    };
  },

  async saveSyncConfig(
    apiKey: string,
    partial: Partial<SyncedGameConfig>,
    fromWeb = true
  ): Promise<SyncedGameConfig> {
    const state = await this.getSyncState(apiKey);
    const current = state.config;
    const next: SyncedGameConfig = {
      presets:
        Array.isArray(partial.presets) && partial.presets.length > 0
          ? partial.presets
          : current.presets,
      popupMinAmount:
        typeof partial.popupMinAmount === "number"
          ? partial.popupMinAmount
          : current.popupMinAmount,
      cinematicMinAmount:
        typeof partial.cinematicMinAmount === "number"
          ? partial.cinematicMinAmount
          : current.cinematicMinAmount,
      globalMinAmount:
        typeof partial.globalMinAmount === "number"
          ? partial.globalMinAmount
          : current.globalMinAmount,
      updatedAt: new Date().toISOString(),
      customizedByWeb: fromWeb ? true : current.customizedByWeb,
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.syncedConfigs) data.syncedConfigs = {};
      data.syncedConfigs[apiKey] = next;
      saveLocalData(data);
      return next;
    }

    await sb.from("kalss_game_state").upsert({
      api_key: apiKey,
      synced_config: next,
      updated_at: next.updatedAt,
    });
    return next;
  },

  async resetSyncConfig(apiKey: string): Promise<SyncedGameConfig> {
    const state = await this.getSyncState(apiKey);
    const next: SyncedGameConfig = {
      ...state.config,
      customizedByWeb: false,
      updatedAt: new Date().toISOString(),
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.syncedConfigs) data.syncedConfigs = {};
      data.syncedConfigs[apiKey] = next;
      saveLocalData(data);
      return next;
    }

    await sb.from("kalss_game_state").upsert({
      api_key: apiKey,
      synced_config: next,
      updated_at: next.updatedAt,
    });
    return next;
  },

  async upsertSyncedDonors(
    apiKey: string,
    incoming: SyncedDonorRecord[]
  ): Promise<SyncedDonorRecord[]> {
    const state = await this.getSyncState(apiKey);
    const map = new Map<string, SyncedDonorRecord>();
    for (const existing of state.donors) {
      map.set(String(existing.userId), existing);
    }
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    for (const item of incoming) {
      const uid = String(item.userId || "").trim();
      if (!uid) continue;
      const prev = map.get(uid);
      const prevAgeMs = prev?.updatedAt ? nowMs - Date.parse(prev.updatedAt) : Infinity;
      const incomingTotal = Math.max(0, Number(item.total) || 0);
      // Jika barusan diedit manual dari website (< 10 detik), jangan tertimpa server Roblox yang telat sync;
      // selain itu ikuti nilai resmi dari DataStore Roblox (termasuk jika nilainya turun/reset).
      const nextTotal =
        prev && Number.isFinite(prevAgeMs) && prevAgeMs < 10_000
          ? prev.total
          : incomingTotal;
      map.set(uid, {
        userId: uid,
        username: String(item.username || prev?.username || "Player"),
        displayName: String(
          item.displayName || item.username || prev?.displayName || "Player"
        ),
        total: nextTotal,
        updatedAt: nowIso,
      });
    }
    const merged = Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 100);

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.syncedDonors) data.syncedDonors = {};
      data.syncedDonors[apiKey] = merged;
      saveLocalData(data);
      return merged;
    }

    await sb.from("kalss_game_state").upsert({
      api_key: apiKey,
      synced_donors: merged,
      updated_at: nowIso,
    });
    return merged;
  },

  async queueManualDonor(
    apiKey: string,
    donor: { userId?: string; username: string; displayName?: string; total: number }
  ): Promise<SyncedDonorRecord[]> {
    const cleanUsername = String(donor.username || "Player").trim();
    const uid =
      String(donor.userId || "").trim() || `name:${cleanUsername.toLowerCase()}`;
    const rec: SyncedDonorRecord = {
      userId: uid,
      username: cleanUsername,
      displayName: String(donor.displayName || cleanUsername).trim(),
      total: Math.max(0, Math.floor(Number(donor.total) || 0)),
      updatedAt: new Date().toISOString(),
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.syncedDonors) data.syncedDonors = {};
      if (!data.pendingDonorSync) data.pendingDonorSync = {};

      const list = (data.syncedDonors[apiKey] || []).filter(
        (d) =>
          String(d.userId) !== uid &&
          d.username.toLowerCase() !== cleanUsername.toLowerCase()
      );
      list.push(rec);
      list.sort((a, b) => b.total - a.total);
      data.syncedDonors[apiKey] = list.slice(0, 100);

      const queue = (data.pendingDonorSync[apiKey] || []).filter(
        (d) =>
          String(d.userId) !== uid &&
          d.username.toLowerCase() !== cleanUsername.toLowerCase()
      );
      queue.push(rec);
      data.pendingDonorSync[apiKey] = queue;
      saveLocalData(data);
      return data.syncedDonors[apiKey];
    }

    const { data: row } = await sb
      .from("kalss_game_state")
      .select("synced_donors, pending_donor_sync")
      .eq("api_key", apiKey)
      .maybeSingle();

    const currentDonors: SyncedDonorRecord[] = Array.isArray(row?.synced_donors)
      ? row.synced_donors
      : [];
    const currentQueue: SyncedDonorRecord[] = Array.isArray(
      row?.pending_donor_sync
    )
      ? row.pending_donor_sync
      : [];

    const list = currentDonors.filter(
      (d) =>
        String(d.userId) !== uid &&
        d.username.toLowerCase() !== cleanUsername.toLowerCase()
    );
    list.push(rec);
    list.sort((a, b) => b.total - a.total);
    const nextDonors = list.slice(0, 100);

    const queue = currentQueue.filter(
      (d) =>
        String(d.userId) !== uid &&
        d.username.toLowerCase() !== cleanUsername.toLowerCase()
    );
    queue.push(rec);

    await sb.from("kalss_game_state").upsert({
      api_key: apiKey,
      synced_donors: nextDonors,
      pending_donor_sync: queue,
      updated_at: rec.updatedAt,
    });
    return nextDonors;
  },

  async deleteManualDonor(
    apiKey: string,
    donor: { userId?: string; username?: string }
  ): Promise<SyncedDonorRecord[]> {
    const uid = String(donor.userId || "").trim();
    const cleanUsername = String(donor.username || "").trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const matchesTarget = (d: SyncedDonorRecord) =>
      (uid !== "" && String(d.userId) === uid) ||
      (cleanUsername !== "" && d.username.toLowerCase() === cleanUsername);

    const resetEntry: SyncedDonorRecord = {
      userId: uid || `name:${cleanUsername}`,
      username: String(donor.username || "Player").trim(),
      displayName: String(donor.username || "Player").trim(),
      total: 0,
      updatedAt: nowIso,
    };

    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.syncedDonors) data.syncedDonors = {};
      if (!data.pendingDonorSync) data.pendingDonorSync = {};

      const nextDonors = (data.syncedDonors[apiKey] || []).filter((d) => !matchesTarget(d));
      data.syncedDonors[apiKey] = nextDonors;

      const queue = (data.pendingDonorSync[apiKey] || []).filter((d) => !matchesTarget(d));
      queue.push(resetEntry);
      data.pendingDonorSync[apiKey] = queue;
      saveLocalData(data);
      return nextDonors;
    }

    const { data: row } = await sb
      .from("kalss_game_state")
      .select("synced_donors, pending_donor_sync")
      .eq("api_key", apiKey)
      .maybeSingle();

    const currentDonors: SyncedDonorRecord[] = Array.isArray(row?.synced_donors)
      ? row.synced_donors
      : [];
    const currentQueue: SyncedDonorRecord[] = Array.isArray(row?.pending_donor_sync)
      ? row.pending_donor_sync
      : [];

    const nextDonors = currentDonors.filter((d) => !matchesTarget(d));
    const queue = currentQueue.filter((d) => !matchesTarget(d));
    queue.push(resetEntry);

    await sb.from("kalss_game_state").upsert({
      api_key: apiKey,
      synced_donors: nextDonors,
      pending_donor_sync: queue,
      updated_at: nowIso,
    });
    return nextDonors;
  },

  async consumePendingDonorSync(apiKey: string): Promise<SyncedDonorRecord[]> {
    const sb = getSupabaseClient();
    if (!sb) {
      const data = loadLocalData();
      if (!data.pendingDonorSync) return [];
      const items = data.pendingDonorSync[apiKey] || [];
      if (items.length > 0) {
        data.pendingDonorSync[apiKey] = [];
        saveLocalData(data);
      }
      return items;
    }

    const { data: row } = await sb
      .from("kalss_game_state")
      .select("pending_donor_sync")
      .eq("api_key", apiKey)
      .maybeSingle();

    const items: SyncedDonorRecord[] = Array.isArray(row?.pending_donor_sync)
      ? row.pending_donor_sync
      : [];
    if (items.length > 0) {
      await sb
        .from("kalss_game_state")
        .update({
          pending_donor_sync: [],
          updated_at: new Date().toISOString(),
        })
        .eq("api_key", apiKey);
    }
    return items;
  },
};
