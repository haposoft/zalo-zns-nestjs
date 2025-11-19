# haposoft zalo-zns-nestjs

Zalo Notification Service (ZNS) NestJS module for sending notifications via Zalo ZNS API.

> **Note**: Publish public packages lên npm hoàn toàn **miễn phí**. Package này là public package nên không có chi phí.

## Installation

```bash
npm install @haposoft/zalo-zns-nestjs
```

or

```bash
yarn add @haposoft/zalo-zns-nestjs
```

## Quick Start

### Option 1: Automatic Token Management (Recommended for Third-Party Apps)

This option automatically handles access token and refresh token management. Third-party apps only need to provide 3 environment variables.

#### Step 1: Get OAuth Credentials

First, you need to get OAuth credentials from Zalo Developer Console:

1. Go to [Zalo Developers](https://developers.zalo.me/)
2. Create or select your application
3. Get your `app_id` and `app_secret`
4. Get `oa_code` from OAuth callback (see [Zalo OAuth Documentation](https://developers.zalo.me/docs/official-account/bat-dau/xac-thuc-va-uy-quyen-cho-ung-dung-new))

#### Step 2: Configure Module

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZnsModule } from '@haposoft/zalo-zns-nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ZnsModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // OAuth credentials (configured once)
        appId: configService.get<string>('ZALO_APP_ID'),
        appSecret: configService.get<string>('ZALO_APP_SECRET'),
        oaCode: configService.get<string>('ZALO_OA_CODE'), // Only needed for initial setup
        refreshToken: configService.get<string>('ZALO_REFRESH_TOKEN'), // Optional, will be saved after first use

        // Third-party apps only need these 3 variables
        apiUrl: configService.get<string>('ZALO_API_URL', 'https://business.openapi.zalo.me'),
        timeout: configService.get<number>('ZALO_TIMEOUT', 30000),
        templateId: configService.get<string>('ZALO_TEMPLATE_ID'), // Optional default template
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Simplified Configuration for Third-Party Apps

If `app_id` and `app_secret` are configured at the platform level, third-party apps only need:

```env
ZALO_TEMPLATE_ID=your-template-id
ZALO_API_URL=https://business.openapi.zalo.me
ZALO_TIMEOUT=30000
```

The module will automatically:

- Get initial access token using `oa_code` (first time only)
- Refresh access token when it expires
- Store and reuse refresh token

### Option 2: Direct Access Token (Backward Compatible)

If you already have an access token, you can use it directly:

#### Synchronous Configuration

```typescript
import { Module } from '@nestjs/common';
import { ZnsModule } from '@haposoft/zalo-zns-nestjs';

@Module({
  imports: [
    ZnsModule.forRoot({
      accessToken: 'your-zalo-access-token',
      apiUrl: 'https://business.openapi.zalo.me', // Optional, default value
      timeout: 30000, // Optional, default 30000ms
    }),
  ],
})
export class AppModule {}
```

#### Asynchronous Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZnsModule } from '@haposoft/zalo-zns-nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ZnsModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        accessToken: configService.get<string>('ZALO_ACCESS_TOKEN'),
        apiUrl: configService.get<string>('ZALO_API_URL', 'https://business.openapi.zalo.me'),
        timeout: configService.get<number>('ZALO_TIMEOUT', 30000),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Global Module

If you want to use ZnsService globally without importing ZnsModule in every module:

```typescript
// Synchronous
ZnsModule.forRootGlobal({
  accessToken: 'your-zalo-access-token',
});

// Asynchronous
ZnsModule.forRootAsyncGlobal({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    accessToken: configService.get<string>('ZALO_ACCESS_TOKEN'),
  }),
  inject: [ConfigService],
});
```

### 2. Use ZnsService

```typescript
import { Injectable } from '@nestjs/common';
import { ZnsService } from '@haposoft/zalo-zns-nestjs';
import { ZnsMessage } from '@haposoft/zalo-zns-nestjs';

@Injectable()
export class NotificationService {
  constructor(private readonly znsService: ZnsService) {}

  async sendNotification() {
    const message: ZnsMessage = {
      phone: '0912345678',
      templateId: 'your-template-id',
      templateData: {
        name: 'John Doe',
        code: '123456',
      },
      trackingId: 'optional-tracking-id',
    };

    const result = await this.znsService.sendMessage(message);

    if (result.error === 0) {
      console.log('Message sent successfully!', result.data?.trackingId);
    } else {
      console.error('Failed to send message:', result.message);
    }
  }

  async sendBulkNotifications() {
    const messages: ZnsMessage[] = [
      {
        phone: '0912345678',
        templateId: 'template-1',
        templateData: { name: 'User 1' },
      },
      {
        phone: '0987654321',
        templateId: 'template-2',
        templateData: { name: 'User 2' },
      },
    ];

    const results = await this.znsService.sendBulkMessages(messages);
    console.log('Bulk send results:', results);
  }
}
```

## API Reference

### ZnsModule

#### `forRoot(options: ZnsModuleOptions)`

Register ZNS module with synchronous options.

#### `forRootAsync(options: ZnsAsyncOptions)`

Register ZNS module with asynchronous options.

#### `forRootGlobal(options: ZnsModuleOptions)`

Register ZNS module as global with synchronous options.

#### `forRootAsyncGlobal(options: ZnsAsyncOptions)`

Register ZNS module as global with asynchronous options.

### ZnsService

#### `sendMessage(message: ZnsMessage): Promise<ZnsSendResponse>`

Send a single ZNS notification.

#### `sendBulkMessages(messages: ZnsMessage[]): Promise<ZnsSendResponse[]>`

Send multiple ZNS notifications.

### Interfaces

#### `ZnsModuleOptions`

```typescript
interface ZnsModuleOptions {
  // Option 1: Direct access token (backward compatible)
  accessToken?: string;

  // Option 2: OAuth credentials for automatic token management
  appId?: string; // Zalo app ID
  appSecret?: string; // Zalo app secret
  oaCode?: string; // OA code from OAuth callback (for initial token)
  refreshToken?: string; // Refresh token (optional, will be saved after first use)

  // Common options
  apiUrl?: string; // Optional: API URL (default: 'https://business.openapi.zalo.me')
  timeout?: number; // Optional: Request timeout in ms (default: 30000)
  templateId?: string; // Optional: Default template ID
}
```

**Note**: Either provide `accessToken` directly OR provide `appId` + `appSecret` + `oaCode` for automatic token management.

#### `ZnsMessage`

```typescript
interface ZnsMessage {
  phone: string; // Required: Phone number
  templateId: string; // Required: ZNS template ID
  templateData?: Record<string, any>; // Optional: Template data
  trackingId?: string; // Optional: Tracking ID
}
```

#### `ZnsSendResponse`

```typescript
interface ZnsSendResponse {
  error: number; // 0 = success, non-zero = error
  message: string; // Response message
  data?: {
    trackingId: string; // Tracking ID if successful
  };
}
```

## Environment Variables

### For Automatic Token Management (Recommended)

```env
# OAuth credentials (configured once at platform level)
ZALO_APP_ID=your-app-id
ZALO_APP_SECRET=your-app-secret
ZALO_OA_CODE=your-oa-code  # Only needed for initial setup
ZALO_REFRESH_TOKEN=your-refresh-token  # Optional, will be saved automatically

# Third-party apps only need these 3 variables
ZALO_TEMPLATE_ID=your-template-id
ZALO_API_URL=https://business.openapi.zalo.me
ZALO_TIMEOUT=30000
```

### For Direct Access Token (Backward Compatible)

```env
ZALO_ACCESS_TOKEN=your-access-token
ZALO_API_URL=https://business.openapi.zalo.me
ZALO_TIMEOUT=30000
```

## Token Management

The module automatically handles:

- ✅ Getting initial access token using OAuth flow
- ✅ Refreshing access token when it expires (before 5 minutes of expiration)
- ✅ Storing refresh token for future use
- ✅ Thread-safe token refresh (prevents multiple simultaneous refresh requests)

You don't need to manually manage tokens when using `appId` + `appSecret` configuration.

## License

MIT

## Support

For issues and feature requests, please visit [GitHub Issues](https://github.com/haposoft/zalo-zns-nestjs/issues).
