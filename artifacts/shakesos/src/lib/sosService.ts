/**
 * Community SOS Service — In-memory mock backend
 *
 * Manages active users, SOS broadcasts, and volunteer coordination.
 * Uses the Haversine formula for proximity filtering (50m radius).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserLocation {
  userId: string;
  lat: number;
  lng: number;
  phone: string;
  timestamp: number;
  displayName?: string;
}

export interface SOSData {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  phone: string;
  timestamp: number;
  active: boolean;
}

export interface NearbyUser {
  userId: string;
  phone: string;
  displayName?: string;
  distance: number; // meters
  lat: number;
  lng: number;
}

export interface VolunteerInfo {
  oderId: string;
  helperId: string;
  phone: string;
  displayName?: string;
  distance: number;
  lat: number;
  lng: number;
  status: "accepted" | "on_the_way" | "arrived";
  acceptedAt: number;
}

// ── Haversine Distance ──────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000; // meters

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine formula: returns distance in meters between two lat/lng points.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// ── Mock Data Generation ────────────────────────────────────────────────────

const MOCK_NAMES = [
  "Aarav S.",
  "Priya M.",
  "Rohan K.",
  "Ananya R.",
  "Vikram P.",
  "Sneha D.",
  "Arjun T.",
  "Kavya N.",
  "Ishaan B.",
  "Meera G.",
];

const MOCK_PHONES = [
  "+919876543210",
  "+919876543211",
  "+919876543212",
  "+919876543213",
  "+919876543214",
  "+919876543215",
  "+919876543216",
  "+919876543217",
  "+919876543218",
  "+919876543219",
];

/**
 * Generate mock users around a center point within a given radius (meters).
 */
function generateMockUsers(
  centerLat: number,
  centerLng: number,
  count: number,
  maxRadiusM: number
): UserLocation[] {
  const users: UserLocation[] = [];
  for (let i = 0; i < count; i++) {
    // Random distance from 5m to maxRadiusM
    const dist = 5 + Math.random() * (maxRadiusM - 5);
    // Random angle
    const angle = Math.random() * 2 * Math.PI;

    // Convert meters to approximate lat/lng offsets
    const dLat = (dist * Math.cos(angle)) / 111_320;
    const dLng =
      (dist * Math.sin(angle)) /
      (111_320 * Math.cos(toRadians(centerLat)));

    users.push({
      userId: `mock-user-${i}`,
      lat: centerLat + dLat,
      lng: centerLng + dLng,
      phone: MOCK_PHONES[i % MOCK_PHONES.length],
      displayName: MOCK_NAMES[i % MOCK_NAMES.length],
      timestamp: Date.now(),
    });
  }
  return users;
}

// ── In-Memory Store ─────────────────────────────────────────────────────────

class SOSService {
  private activeUsers: Map<string, UserLocation> = new Map();
  private activeSOS: Map<string, SOSData> = new Map();
  private volunteers: Map<string, VolunteerInfo[]> = new Map(); // sosId → helpers
  private listeners: Map<string, Set<(sos: SOSData) => void>> = new Map();
  private sosChangeListeners: Map<string, Set<() => void>> = new Map();
  private mockInitialized = false;

  // ── User registration ───────────────────────────────────────────────────

  /** Register or update a user's location. */
  updateUserLocation(user: UserLocation): void {
    this.activeUsers.set(user.userId, { ...user, timestamp: Date.now() });
  }

  /** Remove a user from active tracking. */
  removeUser(userId: string): void {
    this.activeUsers.delete(userId);
  }

  /** Get all active users. */
  getActiveUsers(): UserLocation[] {
    return Array.from(this.activeUsers.values());
  }

  // ── Mock data ───────────────────────────────────────────────────────────

  /** Populate mock nearby users around the given center. */
  initMockUsers(centerLat: number, centerLng: number): void {
    if (this.mockInitialized) return;
    this.mockInitialized = true;

    // 6 users within 50m, 4 users 50-120m away (to show filtering)
    const nearbyUsers = generateMockUsers(centerLat, centerLng, 6, 48);
    const farUsers = generateMockUsers(centerLat, centerLng, 4, 120);
    // ensure far users are actually > 50m
    farUsers.forEach((u) => {
      u.userId = `mock-far-${u.userId}`;
    });

    [...nearbyUsers, ...farUsers].forEach((u) => {
      this.activeUsers.set(u.userId, u);
    });
  }

  // ── SOS Broadcast ──────────────────────────────────────────────────────

  /**
   * Broadcast an SOS — stores it and returns nearby users within radius.
   */
  broadcastSOS(
    sosData: Omit<SOSData, "id" | "active">,
    radiusM: number = 50
  ): { sosId: string; nearbyUsers: NearbyUser[] } {
    const sosId = `sos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sos: SOSData = { ...sosData, id: sosId, active: true };
    this.activeSOS.set(sosId, sos);
    this.volunteers.set(sosId, []);

    // Initialize mock users if we have none
    if (this.activeUsers.size === 0) {
      this.initMockUsers(sosData.lat, sosData.lng);
    }

    // Filter nearby users (exclude the SOS sender)
    const nearby: NearbyUser[] = [];
    this.activeUsers.forEach((user) => {
      if (user.userId === sosData.userId) return;
      const dist = haversineDistance(sosData.lat, sosData.lng, user.lat, user.lng);
      if (dist <= radiusM) {
        nearby.push({
          userId: user.userId,
          phone: user.phone,
          displayName: user.displayName,
          distance: Math.round(dist),
          lat: user.lat,
          lng: user.lng,
        });
      }
    });

    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);

    // Notify listeners (for nearby SOS alerts on other "users")
    this.listeners.forEach((callbacks, userId) => {
      if (userId !== sosData.userId) {
        callbacks.forEach((cb) => cb(sos));
      }
    });

    return { sosId, nearbyUsers: nearby };
  }

  /** Cancel an active SOS. */
  cancelSOS(sosId: string): void {
    const sos = this.activeSOS.get(sosId);
    if (sos) {
      sos.active = false;
      this.activeSOS.set(sosId, sos);
    }
  }

  /** Get an active SOS by ID. */
  getActiveSOS(sosId: string): SOSData | undefined {
    return this.activeSOS.get(sosId);
  }

  // ── Volunteer System ────────────────────────────────────────────────────

  /** A helper accepts an SOS — store their info. */
  acceptHelp(
    sosId: string,
    helper: Omit<VolunteerInfo, "status" | "acceptedAt" | "oderId">
  ): VolunteerInfo | null {
    const sos = this.activeSOS.get(sosId);
    if (!sos || !sos.active) return null;

    const existing = this.volunteers.get(sosId) || [];
    // Don't allow duplicate
    if (existing.find((v) => v.helperId === helper.helperId)) {
      return existing.find((v) => v.helperId === helper.helperId)!;
    }

    const vol: VolunteerInfo = {
      ...helper,
      oderId: sosId,
      status: "on_the_way",
      acceptedAt: Date.now(),
    };
    existing.push(vol);
    this.volunteers.set(sosId, existing);

    // Notify SOS change listeners (victim side)
    this.notifySosChange(sosId);

    return vol;
  }

  /** Get all volunteers for an SOS. */
  getVolunteers(sosId: string): VolunteerInfo[] {
    return this.volunteers.get(sosId) || [];
  }

  /** Update volunteer status. */
  updateVolunteerStatus(
    sosId: string,
    helperId: string,
    status: VolunteerInfo["status"]
  ): void {
    const vols = this.volunteers.get(sosId);
    if (vols) {
      const vol = vols.find((v) => v.helperId === helperId);
      if (vol) {
        vol.status = status;
        this.notifySosChange(sosId);
      }
    }
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  /** Subscribe to incoming SOS broadcasts (for potential helpers). */
  onSOSReceived(userId: string, callback: (sos: SOSData) => void): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(callback);

    return () => {
      this.listeners.get(userId)?.delete(callback);
    };
  }

  /** Subscribe to volunteer changes for an SOS (for victim). */
  onSOSChange(sosId: string, callback: () => void): () => void {
    if (!this.sosChangeListeners.has(sosId)) {
      this.sosChangeListeners.set(sosId, new Set());
    }
    this.sosChangeListeners.get(sosId)!.add(callback);

    return () => {
      this.sosChangeListeners.get(sosId)?.delete(callback);
    };
  }

  private notifySosChange(sosId: string): void {
    this.sosChangeListeners.get(sosId)?.forEach((cb) => cb());
  }

  // ── Demo Helpers ───────────────────────────────────────────────────────

  /** Simulate random volunteers accepting after a delay (for demo). */
  simulateVolunteers(
    sosId: string,
    nearbyUsers: NearbyUser[],
    delayRange: [number, number] = [2000, 6000]
  ): void {
    // Randomly 2-4 users will accept
    const acceptCount = Math.min(
      nearbyUsers.length,
      2 + Math.floor(Math.random() * 3)
    );
    const shuffled = [...nearbyUsers].sort(() => Math.random() - 0.5);
    const accepting = shuffled.slice(0, acceptCount);

    accepting.forEach((user, i) => {
      const delay =
        delayRange[0] + Math.random() * (delayRange[1] - delayRange[0]) + i * 1500;
      setTimeout(() => {
        this.acceptHelp(sosId, {
          helperId: user.userId,
          phone: user.phone,
          displayName: user.displayName,
          distance: user.distance,
          lat: user.lat,
          lng: user.lng,
        });
      }, delay);
    });
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────

export const sosService = new SOSService();
