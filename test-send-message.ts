import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ZnsModule } from './src/zns.module';
import { ZnsService } from './src/zns.service';
import { ZnsMessage } from './src/interfaces/zns-message.interface';

// Giá trị thực tế từ Untitled-1
const ACCESS_TOKEN =
  'vIBkQumERc_d8EjhYWPbQkOWvsUA40aOvadSIly0HqpmKR0s_mDUMSryqHNY1mrnqrkD4Fm9ONsKHg8UlnavID9jpHZ27mbrpbxv1g0rBbl9RQmnn010JVrCan7qPbrzd4ggS9i-VIYnKevhXdXY6u4FbKMjTK90gbsC3xCtJLwxHyCDgoqRS841vdocUNqiZ5UROxWdIIQWSPX5b2jO4P1NrXsw8H5WW7NsCua4Acs6LgqzlIjyHAvHkGkTVsrGzHNeDjX494d70jS_tbuPIx4FcZ62GHvmYJx0DPD_5qgQ5vKAZaTWQESgX3peSaDYqmkJ8Ej0QNtpRUqkx142RFzgs62O1nm7dolTVQu2CtYJHU9rb2mi9PD4escFR78rYqAcKvekP3cWTurZiITAPDPgenZ6HorwNXwsDOyIQcO';
const API_URL = 'https://business.openapi.zalo.me';
const TIMEOUT = 30000;
const OTP_TEMPLATE_ID = '508107';

@Module({
  imports: [
    ZnsModule.forRoot({
      accessToken: ACCESS_TOKEN,
      apiUrl: API_URL,
      timeout: TIMEOUT,
    }),
  ],
})
class TestModule {}

async function testSendMessage() {
  console.log('🚀 Starting ZNS message test...\n');
  console.log('Configuration:');
  console.log(`  - API URL: ${API_URL}`);
  console.log(`  - Timeout: ${TIMEOUT}ms`);
  console.log(`  - Template ID: ${OTP_TEMPLATE_ID}`);
  console.log(`  - Access Token: ${ACCESS_TOKEN.substring(0, 20)}...\n`);

  try {
    // Tạo NestJS application context
    const app = await NestFactory.createApplicationContext(TestModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Lấy ZnsService
    const znsService = app.get(ZnsService);

    // Tạo message test
    // Lưu ý: Bạn cần thay đổi số điện thoại và templateData phù hợp với template của bạn
    const message: ZnsMessage = {
      phone: '0345271166', // Thay đổi số điện thoại này thành số thực tế để test
      templateId: OTP_TEMPLATE_ID,
      templateData: {
        // Thay đổi các trường này theo template của bạn
        // Ví dụ: code, name, etc.
        code: '123456',
      },
      trackingId: `test-${Date.now()}`, // Tracking ID để theo dõi
    };

    console.log('📤 Sending message:');
    console.log(`  - Phone: ${message.phone}`);
    console.log(`  - Template ID: ${message.templateId}`);
    console.log(`  - Template Data:`, JSON.stringify(message.templateData, null, 2));
    console.log(`  - Tracking ID: ${message.trackingId}\n`);

    // Gửi message
    const result = await znsService.sendMessage(message);

    console.log('📥 Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n');

    if (result.error === 0) {
      console.log('✅ Message sent successfully!');
      if (result.data?.trackingId) {
        console.log(`   Tracking ID: ${result.data.trackingId}`);
      }
    } else {
      console.log('❌ Failed to send message');
      console.log(`   Error: ${result.message}`);
    }

    // Đóng application context
    await app.close();
  } catch (error) {
    console.error('❌ Error occurred:');
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('   Unknown error:', error);
    }
    process.exit(1);
  }
}

// Chạy test
testSendMessage()
  .then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
