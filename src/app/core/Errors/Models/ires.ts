export interface IRes {
  type: string;
  title: string;
  status: number;
  message: string;
  retryAfterSeconds: number;
}
