#!/usr/bin/env bun
/**
 * CC Wrapper Development Environment Setup Script
 *
 * Automatically configures the complete development environment within 60 seconds.
 * Supports macOS, Linux, and Windows platforms.
 *
 * Dependencies: Bun 1.3.0+, TypeScript 5.9.3+, Docker 28.5.1+, PostgreSQL 18.0+, Redis 8.2.2+
 */

import { $ } from 'bun';
import * as fs from 'fs/promises';
import { setTimeout } from 'timers/promises';

// Helper function to check if a file/directory exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Configuration constants
const REQUIRED_VERSIONS = {
  bun: '1.3.0',
  typescript: '5.9.3',
  docker: '28.5.1',
  dockerCompose: '2.27.0',
  postgresql: '18.0',
  redis: '8.2.2'
} as const;

// Time constants (in milliseconds)
const SERVICE_WAIT_TIMEOUT = 1000; // 1 second

interface PlatformInfo {
  os: 'macos' | 'linux' | 'windows';
  arch: 'x64' | 'arm64';
  shell: string;
  packageManager: 'bun' | 'npm' | 'yarn';
}

interface EnvironmentStatus {
  platform: PlatformInfo;
  dependencies: Record<string, { installed: boolean; version?: string; required: string }>;
  services: Record<string, { running: boolean; accessible: boolean }>;
  environmentConfigured: boolean;
  ready: boolean;
}

class SetupEnvironment {
  private startTime: number = Date.now();
  private platformInfo: PlatformInfo;

  constructor() {
    this.platformInfo = this.detectPlatform();
  }

  /**
   * Detect the current platform and shell environment
   */
  private detectPlatform(): PlatformInfo {
    const os = process.platform;
    const arch = process.arch;

    let platformOS: PlatformInfo['os'];
    if (os === 'darwin') {
      platformOS = 'macos';
    } else if (os === 'linux') {
      platformOS = 'linux';
    } else if (os === 'win32') {
      platformOS = 'windows';
    } else {
      throw new Error(`Unsupported operating system: ${os}`);
    }

    const shell = process.env.SHELL || process.env.COMSPEC || 'unknown';

    return {
      os: platformOS,
      arch: arch as PlatformInfo['arch'],
      shell,
      packageManager: 'bun' // Bun-first architecture
    };
  }

  /**
   * Main setup execution
   */
  async run(): Promise<void> {
    console.log('🚀 CC Wrapper Development Environment Setup');
    console.log(`📋 Platform: ${this.platformInfo.os} (${this.platformInfo.arch})`);
    console.log(`⏱️  Target: <60 seconds`);
    console.log('━'.repeat(50));

    try {
      // Step 1: Check current environment
      const status = await this.checkEnvironment();
      this.displayStatus(status);

      // Step 2: Install missing dependencies
      await this.installDependencies(status);

      // Step 3: Configure environment variables
      await this.configureEnvironment();

      // Step 4: Start and validate services
      await this.setupServices();

      // Step 5: Setup editor integration
      await this.setupEditorIntegration();

      const totalTime = Date.now() - this.startTime;
      console.log('━'.repeat(50));
      console.log(`✅ Setup completed in ${totalTime}ms!`);
      console.log('🎯 Development environment is ready for productive development.');
    } catch (error) {
      const totalTime = Date.now() - this.startTime;
      console.error(`❌ Setup failed after ${totalTime}ms:`, error);
      process.exit(1);
    }
  }

  /**
   * Check current environment status
   */
  private async checkEnvironment(): Promise<EnvironmentStatus> {
    console.log('🔍 Checking environment...');

    const status: EnvironmentStatus = {
      platform: this.platformInfo,
      dependencies: {},
      services: {},
      environmentConfigured: false,
      ready: false
    };

    // Check Bun
    status.dependencies.bun = await this.checkBun();

    // Check TypeScript
    status.dependencies.typescript = await this.checkTypeScript();

    // Check Docker
    status.dependencies.docker = await this.checkDocker();
    status.dependencies.dockerCompose = await this.checkDockerCompose();

    // Check PostgreSQL
    status.dependencies.postgresql = await this.checkPostgreSQL();

    // Check Redis
    status.dependencies.redis = await this.checkRedis();

    return status;
  }

  private async checkBun(): Promise<{ installed: boolean; version?: string; required: string }> {
    try {
      const result = await $`bun --version`.quiet();
      const version = result.stdout.toString().trim();
      return {
        installed: true,
        version,
        required: REQUIRED_VERSIONS.bun
      };
    } catch {
      return { installed: false, required: REQUIRED_VERSIONS.bun };
    }
  }

  private async checkTypeScript(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }> {
    try {
      const result = await $`bunx tsc --version`.quiet();
      const version = result.stdout.toString().trim().split(' ')[1];
      return {
        installed: true,
        version,
        required: REQUIRED_VERSIONS.typescript
      };
    } catch {
      return { installed: false, required: REQUIRED_VERSIONS.typescript };
    }
  }

  private async checkDocker(): Promise<{ installed: boolean; version?: string; required: string }> {
    try {
      const result = await $`docker --version`.quiet();
      const version = result.stdout.toString().match(/Docker version (\d+\.\d+\.\d+)/)?.[1];
      return {
        installed: !!version,
        version,
        required: REQUIRED_VERSIONS.docker
      };
    } catch {
      return { installed: false, required: REQUIRED_VERSIONS.docker };
    }
  }

  private async checkDockerCompose(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }> {
    try {
      const result = await $`docker compose version`.quiet();
      const version = result.stdout.toString().match(/v(\d+\.\d+\.\d+)/)?.[1];
      return {
        installed: !!version,
        version,
        required: REQUIRED_VERSIONS.dockerCompose
      };
    } catch {
      return { installed: false, required: REQUIRED_VERSIONS.dockerCompose };
    }
  }

  private async checkPostgreSQL(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }> {
    try {
      const result = await $`postgres --version`.quiet();
      const version = result.stdout.toString().match(/postgres \(PostgreSQL\) (\d+\.\d+)/)?.[1];
      return {
        installed: !!version,
        version: version ? `${version}.0` : undefined,
        required: REQUIRED_VERSIONS.postgresql
      };
    } catch {
      return { installed: false, required: REQUIRED_VERSIONS.postgresql };
    }
  }

  private async checkRedis(): Promise<{ installed: boolean; version?: string; required: string }> {
    try {
      const result = await $`redis-server --version`.quiet();
      const version = result.stdout.toString().match(/v=([\d.]+)/)?.[1];
      return {
        installed: !!version,
        version,
        required: REQUIRED_VERSIONS.redis
      };
    } catch {
      return { installed: false, required: REQUIRED_VERSIONS.redis };
    }
  }

  /**
   * Display current environment status
   */
  private displayStatus(status: EnvironmentStatus): void {
    console.log('\n📊 Environment Status:');
    console.log(`Platform: ${status.platform.os} (${status.platform.arch})`);

    console.log('\n📦 Dependencies:');
    Object.entries(status.dependencies).forEach(([name, info]) => {
      const statusIcon = info.installed ? '✅' : '❌';
      const versionInfo = info.version ? ` (${info.version})` : '';
      const requiredInfo = ` [required: ${info.required}]`;
      console.log(`  ${statusIcon} ${name}${versionInfo}${requiredInfo}`);
    });
  }

  /**
   * Install missing dependencies
   */
  private async installDependencies(status: EnvironmentStatus): Promise<void> {
    console.log('\n📦 Installing missing dependencies...');

    // Install Bun if missing
    if (!status.dependencies.bun?.installed) {
      await this.installBun();
    }

    // Install TypeScript if missing
    if (!status.dependencies.typescript?.installed) {
      await this.installTypeScript();
    }

    // Install Docker if missing (platform-specific)
    if (!status.dependencies.docker?.installed || !status.dependencies.dockerCompose?.installed) {
      await this.installDocker();
    }

    // Install PostgreSQL if missing
    if (!status.dependencies.postgresql?.installed) {
      await this.installPostgreSQL();
    }

    // Install Redis if missing
    if (!status.dependencies.redis?.installed) {
      await this.installRedis();
    }
  }

  private async installBun(): Promise<void> {
    console.log('  🔄 Installing Bun...');
    const installScript =
      this.platformInfo.os === 'windows'
        ? 'powershell -c "irm bun.sh/install.ps1 | iex"'
        : 'curl -fsSL https://bun.sh/install | bash';

    await $`${installScript}`.quiet();
    console.log('  ✅ Bun installed');
  }

  private async installTypeScript(): Promise<void> {
    console.log('  🔄 Installing TypeScript...');
    await $`bun add -D typescript`.quiet();
    console.log('  ✅ TypeScript installed');
  }

  private async installDocker(): Promise<void> {
    console.log('  📋 Docker installation required:');
    console.log(`    Please install Docker Desktop for ${this.platformInfo.os}:`);
    console.log('    https://www.docker.com/products/docker-desktop');
    console.log('    After installation, run this script again.');
    throw new Error('Docker requires manual installation');
  }

  private async installPostgreSQL(): Promise<void> {
    if (this.platformInfo.os === 'macos') {
      console.log('  🔄 Installing PostgreSQL via Homebrew...');
      await $`brew install postgresql@18`.quiet();
      await $`brew services start postgresql@18`.quiet();
    } else if (this.platformInfo.os === 'linux') {
      console.log('  🔄 Installing PostgreSQL via apt...');
      await $`sudo apt update && sudo apt install -y postgresql-18`.quiet();
      await $`sudo systemctl start postgresql`.quiet();
    } else {
      console.log('  📋 PostgreSQL installation required:');
      console.log(
        '    Download PostgreSQL 18.0 from: https://www.postgresql.org/download/windows/'
      );
      throw new Error('PostgreSQL requires manual installation on Windows');
    }
    console.log('  ✅ PostgreSQL installed');
  }

  private async installRedis(): Promise<void> {
    if (this.platformInfo.os === 'macos') {
      console.log('  🔄 Installing Redis via Homebrew...');
      await $`brew install redis`.quiet();
      await $`brew services start redis`.quiet();
    } else if (this.platformInfo.os === 'linux') {
      console.log('  🔄 Installing Redis via apt...');
      await $`sudo apt update && sudo apt install -y redis-server`.quiet();
      await $`sudo systemctl start redis-server`.quiet();
    } else {
      console.log('  📋 Redis installation required:');
      console.log('    Download Redis 8.2.2 from: https://redis.io/download');
      throw new Error('Redis requires manual installation on Windows');
    }
    console.log('  ✅ Redis installed');
  }

  /**
   * Configure environment variables
   */
  private async configureEnvironment(): Promise<void> {
    console.log('\n⚙️  Configuring environment variables...');

    const envContent = `# CC Wrapper Development Environment
# Generated automatically by setup script

# Database Configuration
DATABASE_URL="postgresql://localhost:5432/ccwrapper_dev"
REDIS_URL="redis://localhost:6379"

# Development Settings
NODE_ENV="development"
LOG_LEVEL="debug"

# Application Settings
PORT=3000
HOST=localhost

# Development Tools
BUN_VERSION="${REQUIRED_VERSIONS.bun}"
TYPESCRIPT_VERSION="${REQUIRED_VERSIONS.typescript}"

# Docker Configuration
COMPOSE_PROJECT_NAME="ccwrapper"
COMPOSE_FILE="docker-compose.dev.yml"
`;

    // Write to .env.local
    await fs.writeFile('.env.local', envContent);
    console.log('  ✅ Environment variables configured in .env.local');

    // Validate configuration
    await this.validateEnvironment();
  }

  private async validateEnvironment(): Promise<void> {
    console.log('  🔍 Validating environment configuration...');

    // Check if required directories exist
    const requiredDirs = ['apps', 'packages', 'services'];
    for (const dir of requiredDirs) {
      if (!(await fileExists(dir))) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`  📁 Created directory: ${dir}`);
      }
    }

    console.log('  ✅ Environment configuration validated');
  }

  /**
   * Setup and start development services
   */
  private async setupServices(): Promise<void> {
    console.log('\n🔄 Starting development services...');

    // Create docker-compose.dev.yml if it doesn't exist
    await this.createDockerComposeFile();

    // Start services
    if (await fileExists('docker-compose.dev.yml')) {
      console.log('  🔄 Starting Docker services...');
      await $`docker compose -f docker-compose.dev.yml up -d`.quiet();
      console.log('  ✅ Docker services started');
    }

    // Wait for services to be ready
    await this.waitForServices();
  }

  private async createDockerComposeFile(): Promise<void> {
    const composeContent = `version: '3.8'

services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_DB: ccwrapper_dev
      POSTGRES_USER: ccwrapper
      POSTGRES_PASSWORD: ccwrapper_dev_pass_2025
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ccwrapper"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:8.2.2-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;

    if (!(await fileExists('docker-compose.dev.yml'))) {
      await fs.writeFile('docker-compose.dev.yml', composeContent);
      console.log('  📄 Created docker-compose.dev.yml');
    }
  }

  private async waitForServices(): Promise<void> {
    console.log('  ⏳ Waiting for services to be healthy...');

    // Wait for PostgreSQL
    let attempts = 0;
    while (attempts < 10) {
      try {
        await $`docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U ccwrapper`.quiet();
        console.log('  ✅ PostgreSQL is ready');
        break;
      } catch {
        attempts++;
        await setTimeout(SERVICE_WAIT_TIMEOUT);
      }
    }

    // Wait for Redis
    attempts = 0;
    while (attempts < 10) {
      try {
        await $`docker compose -f docker-compose.dev.yml exec -T redis redis-cli ping`.quiet();
        console.log('  ✅ Redis is ready');
        break;
      } catch {
        attempts++;
        await setTimeout(SERVICE_WAIT_TIMEOUT);
      }
    }
  }

  /**
   * Setup VS Code integration
   */
  private async setupEditorIntegration(): Promise<void> {
    console.log('\n🛠️  Setting up editor integration...');

    // Create .vscode directory
    if (!(await fileExists('.vscode'))) {
      await fs.mkdir('.vscode');
    }

    // Create VS Code settings
    const settings = {
      'typescript.preferences.importModuleSpecifier': 'relative',
      'editor.formatOnSave': true,
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': 'explicit'
      },
      'files.exclude': {
        '**/node_modules': true,
        '**/dist': true,
        '**/.git': true
      },
      'search.exclude': {
        '**/node_modules': true,
        '**/dist': true,
        '**/.git': true
      }
    };

    await fs.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2));
    console.log('  ✅ VS Code settings configured');

    // Create extensions.json
    const extensions = {
      recommendations: [
        'esbenp.prettier-vscode',
        'dbaeumer.vscode-eslint',
        'ms-vscode.vscode-typescript-next',
        'bradlc.vscode-tailwindcss',
        'ms-vscode.vscode-json'
      ]
    };

    await fs.writeFile('.vscode/extensions.json', JSON.stringify(extensions, null, 2));
    console.log('  ✅ VS Code extensions configured');
  }
}

// Export for testing
export { SetupEnvironment };

// Run the setup
if (import.meta.main) {
  const setup = new SetupEnvironment();
  setup.run().catch(console.error);
}
