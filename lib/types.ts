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
}

export type AnimationType = "confetti" | "balloons" | "fireworks" | "falling";

export interface Animation {
  id: AnimationType;
  name: string;
  description: string;
  thumbnail: string;
}
