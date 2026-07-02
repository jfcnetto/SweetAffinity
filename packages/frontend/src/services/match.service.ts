import { api } from "./api.js";

export interface FeedProfile {
  id: string;
  displayName: string;
  birthDate: string;
  city: string;
  state: string;
  bio: string;
  relationshipType: "baby" | "daddy" | "mommy";
  popularityScore: number;
}

export interface MatchResponse {
  success: boolean;
  match: boolean;
}

export interface MatchListProfile {
  matchId: string;
  createdAt: string;
  profile: {
    id: string;
    displayName: string;
    relationshipType: "baby" | "daddy" | "mommy";
  };
}

export class MatchService {
  static async getFeed(): Promise<FeedProfile[]> {
    const res = await api.get("/feed");
    return res.data;
  }

  static async swipe(toUserId: string, action: "like" | "pass"): Promise<MatchResponse> {
    const res = await api.post("/swipe", { toUserId, action });
    return res.data;
  }

  static async getMatches(): Promise<MatchListProfile[]> {
    const res = await api.get("/matches");
    return res.data;
  }
}
