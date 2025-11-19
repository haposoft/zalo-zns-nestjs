export interface ZnsModuleOptions {
  // Option 1: Direct access token (backward compatible)
  accessToken?: string;

  // Option 2: OAuth credentials for automatic token management
  appId?: string;
  appSecret?: string;
  oaCode?: string; // OA code from OAuth callback
  refreshToken?: string; // Initial refresh token (optional if oaCode is provided)

  // Common options
  apiUrl?: string;
  timeout?: number;
  templateId?: string; // Default template ID (optional, can be overridden per message)
}

export interface ZnsAsyncOptions {
  useFactory?: (...args: any[]) => Promise<ZnsModuleOptions> | ZnsModuleOptions;
  inject?: any[];
  imports?: any[];
}
