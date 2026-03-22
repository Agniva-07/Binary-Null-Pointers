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
  orderId: string;
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

/**
 * Generate mock users in a ring between minRadiusM and maxRadiusM.
 */
function generateMockUsersRing(
  centerLat: number,
  centerLng: number,
  count: number,
  minRadiusM: number,
  maxRadiusM: number
): UserLocation[] {
  const users: UserLocation[] = [];
  for (let i = 0; i < count; i++) {
    const dist = minRadiusM + Math.random() * (maxRadiusM - minRadiusM);
    const angle = Math.random() * 2 * Math.PI;
    const dLat = (dist * Math.cos(angle)) / 111_320;
    const dLng =
      (dist * Math.sin(angle)) /
      (111_320 * Math.cos(toRadians(centerLat)));
    users.push({
      userId: `mock-ring-${i}`,
      lat: centerLat + dLat,
      lng: centerLng + dLng,
      phone: MOCK_PHONES[i % MOCK_PHONES.length],
      displayName: MOCK_NAMES[(i + 5) % MOCK_NAMES.length],
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
  initMockUsers(centerLat: number, centerLng: number, force = false): void {
    if (this.mockInitialized && !force) return;
    this.mockInitialized = true;

    // Remove old mock users on re-init
    if (force) {
      for (const key of Array.from(this.activeUsers.keys())) {
        if (key.startsWith("mock-")) this.activeUsers.delete(key);
      }
    }

    // Tier 1: 6 users within 50m-90m (alerted at stage 1 — 100m radius)
    const tier1 = generateMockUsers(centerLat, centerLng, 6, 90);
    tier1.forEach((u, i) => { u.userId = `mock-t1-${i}`; });

    // Tier 2: 5 users 100m-190m away (alerted at stage 2 — 200m radius)
    const tier2 = generateMockUsersRing(centerLat, centerLng, 5, 100, 190);
    tier2.forEach((u, i) => { u.userId = `mock-t2-${i}`; });

    // Tier 3: 4 users 200m-500m away (alerted at higher radii)
    const tier3 = generateMockUsersRing(centerLat, centerLng, 4, 200, 480);
    tier3.forEach((u, i) => { u.userId = `mock-t3-${i}`; });

    [...tier1, ...tier2, ...tier3].forEach((u) => {
      this.activeUsers.set(u.userId, u);
    });
  }

  // ── SOS Broadcast ──────────────────────────────────────────────────────

  /**
   * Broadcast an SOS — stores it and returns nearby users within radius.
   */
  broadcastSOS(
    sosData: Omit<SOSData, "id" | "active">,
    radiusM: number = 500
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
    helper: Omit<VolunteerInfo, "status" | "acceptedAt" | "orderId">
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
      orderId: sosId,
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

  // ── Location Tracking ──────────────────────────────────────────────────

  /**
   * Update the location stored inside an active SOS event.
   * Called by the escalation system every 7 seconds during stage 2+.
   */
  updateSOSLocation(sosId: string, lat: number, lng: number): void {
    const sos = this.activeSOS.get(sosId);
    if (sos && sos.active) {
      sos.lat = lat;
      sos.lng = lng;
      this.notifySosChange(sosId);
    }
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
