import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZnsService } from './zns.service';
import { ZnsTokenService } from './zns-token.service';
import { ZnsModuleOptions, ZnsAsyncOptions } from './interfaces/zns-options.interface';
import { ZNS_MODULE_OPTIONS } from './zns.constants';

@Module({})
export class ZnsModule {
  /**
   * Check if token service is needed (when app_id/app_secret are provided)
   */
  private static needsTokenService(options: ZnsModuleOptions | ZnsAsyncOptions): boolean {
    if ('useFactory' in options && options.useFactory) {
      // For async options, we'll always include token service
      // It will check internally if it's needed
      return true;
    }

    const opts = options as ZnsModuleOptions;
    return !!(opts.appId && opts.appSecret);
  }

  /**
   * Create providers array for module configuration
   */
  private static createProviders(options: ZnsModuleOptions | ZnsAsyncOptions): Provider[] {
    const providers: Provider[] = [];

    if ('useFactory' in options && options.useFactory) {
      providers.push({
        provide: ZNS_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      });
    } else {
      providers.push({
        provide: ZNS_MODULE_OPTIONS,
        useValue: options,
      });
    }

    // Always include token service (it will handle backward compatibility)
    providers.push(ZnsTokenService);
    providers.push(ZnsService);

    return providers;
  }

  /**
   * Ensure ConfigModule is included in imports if needed
   */
  private static ensureConfigModule(imports: any[] = []): any[] {
    if (!imports.some((imp) => imp === ConfigModule)) {
      return [...imports, ConfigModule];
    }
    return imports;
  }

  /**
   * Register ZNS module with synchronous options
   */
  static forRoot(options: ZnsModuleOptions): DynamicModule {
    return {
      module: ZnsModule,
      providers: this.createProviders(options),
      exports: [ZnsService],
      global: false,
    };
  }

  /**
   * Register ZNS module with async options
   */
  static forRootAsync(options: ZnsAsyncOptions): DynamicModule {
    return {
      module: ZnsModule,
      imports: this.ensureConfigModule(options.imports),
      providers: this.createProviders(options),
      exports: [ZnsService],
      global: false,
    };
  }

  /**
   * Register ZNS module as global with synchronous options
   */
  static forRootGlobal(options: ZnsModuleOptions): DynamicModule {
    return {
      module: ZnsModule,
      providers: this.createProviders(options),
      exports: [ZnsService],
      global: true,
    };
  }

  /**
   * Register ZNS module as global with async options
   */
  static forRootAsyncGlobal(options: ZnsAsyncOptions): DynamicModule {
    return {
      module: ZnsModule,
      imports: this.ensureConfigModule(options.imports),
      providers: this.createProviders(options),
      exports: [ZnsService],
      global: true,
    };
  }
}
