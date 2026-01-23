export type Gender = "boy" | "girl";

export interface BabyInfo {
  name: string;
  gender: Gender;
}

export interface RevealData {
  motherName: string;
  fatherName: string;
  babyName: string;
  gender: Gender;
  dueDate?: string;
  message?: string;
  animationType: AnimationType;
  countdownTime?: number;
  isMultiple?: boolean;
  babiesInfo?: BabyInfo[];

  // D-Day 예약 전용 필드 (선택적)
  scheduledAt?: string; // ISO 8601 형식
  revealId?: string; // 투표용 고유 ID
}

// 투표 타입
export type VoteType = "prince" | "princess";

// 투표 현황
export interface VoteStatus {
  prince: number;
  princess: number;
  total: number;
}

// D-Day 카운트다운 데이터
export interface CountdownData {
  babyName: string;
  scheduledAt: string;
  revealId: string;
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
}

export type AnimationType =
  | "confetti"
  | "balloons"
  | "fireworks"
  | "falling"
  | "reveal";

export interface Animation {
  id: AnimationType;
  name: string;
  description: string;
  thumbnail: string;
}
