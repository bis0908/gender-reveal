export type AdminLoginErrorCode =
  | "invalid_credentials"
  | "forbidden"
  | "generic";

export interface AdminLoginState {
  error: AdminLoginErrorCode | null;
}

export const initialAdminLoginState: AdminLoginState = { error: null };
