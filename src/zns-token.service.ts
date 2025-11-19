import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ZNS_MODULE_OPTIONS } from './zns.constants';
import { ZnsModuleOptions } from './interfaces/zns-options.interface';

interface ZaloTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  error?: number;
  message?: string;
}

@Injectable()
export class ZnsTokenService implements OnModuleInit {
  private readonly logger = new Logger(ZnsTokenService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private readonly oauthAxiosInstance: AxiosInstance;

  constructor(
    @Inject(ZNS_MODULE_OPTIONS)
    private readonly options: ZnsModuleOptions,
  ) {
    this.oauthAxiosInstance = axios.create({
      baseURL: 'https://oauth.zaloapp.com',
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async onModuleInit() {
    // Nếu có app_id và app_secret, tự động lấy token
    if (this.options.appId && this.options.appSecret) {
      if (this.options.oaCode) {
        // Lấy token lần đầu bằng OA code
        try {
          await this.getInitialToken();
        } catch (error) {
          this.logger.error('Failed to get initial token, will try on first use', error);
        }
      } else if (this.options.refreshToken) {
        // Sử dụng refresh token có sẵn để lấy access token
        try {
          await this.refreshAccessToken(this.options.refreshToken);
        } catch (error) {
          this.logger.error('Failed to refresh token on init, will try on first use', error);
        }
      } else {
        this.logger.warn(
          'app_id and app_secret provided but no oa_code or refresh_token. Token will be fetched on first use.',
        );
      }
    } else if (this.options.accessToken) {
      // Sử dụng access token trực tiếp (backward compatible)
      this.accessToken = this.options.accessToken;
      this.logger.log('Using provided access token directly');
    } else {
      this.logger.warn(
        'No access token, app_id/app_secret, or refresh_token provided. ZNS service may not work.',
      );
    }
  }

  /**
   * Get initial access token using OA code
   */
  private async getInitialToken(): Promise<void> {
    if (!this.options.appId || !this.options.appSecret || !this.options.oaCode) {
      throw new Error('app_id, app_secret, and oa_code are required for initial token');
    }

    try {
      this.logger.log('Getting initial access token using OA code...');

      const params = new URLSearchParams({
        app_id: this.options.appId,
        app_secret: this.options.appSecret,
        code: this.options.oaCode,
      });

      const response = await this.oauthAxiosInstance.post<ZaloTokenResponse>(
        '/v4/oa/access_token',
        params.toString(),
      );

      if (response.data.error && response.data.error !== 0) {
        throw new Error(`Failed to get access token: ${response.data.message || 'Unknown error'}`);
      }

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiresAt = response.data.expires_in
        ? Date.now() + response.data.expires_in * 1000
        : null;

      this.logger.log('Successfully obtained initial access token');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting initial token: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    if (!this.options.appId) {
      throw new Error('app_id is required for refreshing token');
    }

    try {
      this.logger.log('Refreshing access token...');

      const params = new URLSearchParams({
        refresh_token: refreshToken,
        app_id: this.options.appId,
        grant_type: 'refresh_token',
      });

      const response = await this.oauthAxiosInstance.post<ZaloTokenResponse>(
        '/v4/oa/access_token',
        params.toString(),
      );

      if (response.data.error && response.data.error !== 0) {
        throw new Error(
          `Failed to refresh access token: ${response.data.message || 'Unknown error'}`,
        );
      }

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiresAt = response.data.expires_in
        ? Date.now() + response.data.expires_in * 1000
        : null;

      this.logger.log('Successfully refreshed access token');
      return this.accessToken!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error refreshing token: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get current access token, refresh if needed
   */
  async getAccessToken(): Promise<string> {
    // Nếu có access token trực tiếp (backward compatible)
    if (this.options.accessToken && !this.options.appId) {
      return this.options.accessToken;
    }

    // Nếu chưa có token và có refresh token, lấy token mới
    if (!this.accessToken && this.options.refreshToken) {
      return await this.refreshAccessToken(this.options.refreshToken);
    }

    // Nếu chưa có token và có app_id/app_secret/oa_code, lấy token lần đầu
    if (!this.accessToken && this.options.appId && this.options.appSecret && this.options.oaCode) {
      await this.getInitialToken();
      return this.accessToken!;
    }

    // Nếu không có token, throw error
    if (!this.accessToken) {
      throw new Error(
        'No access token available. Please provide access_token or app_id/app_secret/oa_code.',
      );
    }

    // Kiểm tra token có sắp hết hạn không (refresh trước 5 phút)
    const shouldRefresh = this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt - 5 * 60 * 1000;

    if (shouldRefresh && this.refreshToken) {
      // Nếu đang refresh, đợi promise hiện tại
      if (this.isRefreshing && this.refreshPromise) {
        return await this.refreshPromise;
      }

      // Bắt đầu refresh
      this.isRefreshing = true;
      this.refreshPromise = this.refreshAccessToken(this.refreshToken);

      try {
        const newToken = await this.refreshPromise;
        this.isRefreshing = false;
        this.refreshPromise = null;
        return newToken;
      } catch (error) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        throw error;
      }
    }

    return this.accessToken;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken || this.options.refreshToken || null;
  }

  /**
   * Set tokens manually (useful for external token management)
   */
  setTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (expiresIn) {
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;
    }
    this.logger.log('Tokens updated manually');
  }
}
