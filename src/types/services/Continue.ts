export type ContinueRequest = Record<string, never>;

export interface ContinueResponse {
  success: boolean;
  error_message: string;
}
