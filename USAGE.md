# Usage Guide for @haposoft/zalo-zns-nestjs

## Installation

### Method 1: Install from npm (after publishing)

```bash
npm install @haposoft/zalo-zns-nestjs
```

### Method 2: Use npm link (development)

```bash
# In the zalo-zns-nestjs directory
npm link

# In the project where you want to use it
npm link @haposoft/zalo-zns-nestjs
```

### Method 3: Use from local path

In your project's `package.json`:

```json
{
  "dependencies": {
    "@haposoft/zalo-zns-nestjs": "file:../zalo-zns-nestjs"
  }
}
```

## Usage in NestJS Application

### 1. Import Module

#### Option 1: Automatic Token Management (Recommended)

This option automatically handles token management. Third-party apps only need 3 environment variables.

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
        // OAuth credentials (configured once at platform level)
        appId: configService.get<string>('ZALO_APP_ID'),
        appSecret: configService.get<string>('ZALO_APP_SECRET'),
        oaCode: configService.get<string>('ZALO_OA_CODE'), // Only for initial setup
        refreshToken: configService.get<string>('ZALO_REFRESH_TOKEN'), // Optional

        // Third-party apps only need these 3 variables
        apiUrl: configService.get<string>('ZALO_API_URL', 'https://business.openapi.zalo.me'),
        timeout: configService.get<number>('ZALO_TIMEOUT', 30000),
        templateId: configService.get<string>('ZALO_TEMPLATE_ID'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Option 2: Direct Access Token (Backward Compatible)

#### Synchronous Configuration

```typescript
import { Module } from '@nestjs/common';
import { ZnsModule } from '@haposoft/zalo-zns-nestjs';

@Module({
  imports: [
    ZnsModule.forRoot({
      accessToken: 'your-zalo-access-token',
      apiUrl: 'https://business.openapi.zalo.me', // Optional
      timeout: 30000, // Optional, default 30000ms
    }),
  ],
})
export class AppModule {}
```

#### Asynchronous Configuration (Recommended)

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

If you want to use ZnsService everywhere without importing ZnsModule:

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
import { ZnsService, ZnsMessage } from '@haposoft/zalo-zns-nestjs';

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

## Environment Variables

### For Automatic Token Management (Recommended)

Create a `.env` file:

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

## Token Management Features

When using automatic token management (`appId` + `appSecret`):

- ✅ Automatically gets initial access token using OAuth flow
- ✅ Automatically refreshes token when it expires (5 minutes before expiration)
- ✅ Thread-safe refresh (prevents multiple simultaneous refresh requests)
- ✅ Stores refresh token for future use
- ✅ No manual token management needed

## API Reference

### ZnsModule Methods

- `forRoot(options: ZnsModuleOptions)` - Register module with synchronous options
- `forRootAsync(options: ZnsAsyncOptions)` - Register module with asynchronous options
- `forRootGlobal(options: ZnsModuleOptions)` - Register module as global with synchronous options
- `forRootAsyncGlobal(options: ZnsAsyncOptions)` - Register module as global with asynchronous options

### ZnsService Methods

- `sendMessage(message: ZnsMessage): Promise<ZnsSendResponse>` - Send a single ZNS notification
- `sendBulkMessages(messages: ZnsMessage[]): Promise<ZnsSendResponse[]>` - Send multiple ZNS notifications

### Interfaces

See details in README.md
