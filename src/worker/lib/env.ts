export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
  SITE_ORIGIN?: string;
  MAIL_FROM?: string;
  RESEND_API_KEY?: string;
}

export type StaffRole = 'admin' | 'editor' | 'reviewer' | 'ops';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: string;
  mustChangePassword?: boolean;
}

export interface AppVariables {
  requestId: string;
  user?: StaffUser;
  sessionId?: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
