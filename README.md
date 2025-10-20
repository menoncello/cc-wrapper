# CC Wrapper - AI Productivity Optimization Platform

CC Wrapper is a comprehensive AI productivity optimization platform designed to minimize wait times and maximize developer efficiency when working with multiple AI tools.

## Quick Start

### Prerequisites

Before you begin, ensure you have the following basic tools:
- Git for cloning the repository
- Administrative access for installing development tools

### Automatic Setup (Recommended)

The automated setup script will configure your entire development environment in under 60 seconds:

```bash
# Clone the repository
git clone https://github.com/ccwrapper/cc-wrapper.git
cd cc-wrapper

# Run the automatic setup
bun run setup
```

That's it! The setup script will:
- ✅ Install and configure all required dependencies (Bun, TypeScript, Docker, PostgreSQL, Redis)
- ✅ Set up development services with health monitoring
- ✅ Configure VS Code extensions and settings
- ✅ Create and validate environment configuration
- ✅ Verify that everything is working correctly

### Manual Setup

If you prefer manual setup or encounter issues with the automated script:

#### 1. Install Runtime Dependencies

**macOS (using Homebrew):**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Install PostgreSQL and Redis
brew install postgresql@18 redis
brew services start postgresql@18
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Docker
# Follow instructions at: https://docs.docker.com/engine/install/ubuntu/

# Install PostgreSQL and Redis
sudo apt update
sudo apt install -y postgresql-18 redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server
```

**Windows:**
```bash
# Install Bun (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Install PostgreSQL and Redis
# Download from official sites:
# - PostgreSQL: https://www.postgresql.org/download/windows/
# - Redis: https://redis.io/download
```

#### 2. Install Project Dependencies

```bash
# Install Node.js dependencies
bun install

# Install TypeScript compiler
bun add -D typescript
```

#### 3. Configure Environment

Copy the environment template and configure as needed:

```bash
# The setup script creates this automatically, but you can customize it
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://localhost:5432/ccwrapper_dev"
REDIS_URL="redis://localhost:6379"

# Development Settings
NODE_ENV="development"
LOG_LEVEL="debug"

# Application Settings
PORT=3000
HOST=localhost
```

#### 4. Start Development Services

```bash
# Start PostgreSQL and Redis services
docker compose -f docker-compose.dev.yml up -d

# Or use local services if installed natively
```

#### 5. Verify Setup

```bash
# Run health check
bun run health

# Validate configuration
bun run scripts/validate-config.ts

# Run tests
bun test
```

## Development Workflow

### Available Scripts

- `bun run setup` - Run the complete environment setup
- `bun run dev` - Start development server with hot reload
- `bun run build` - Build the application for production
- `bun run test` - Run the test suite
- `bun run lint` - Run ESLint code quality checks
- `bun run lint:fix` - Auto-fix ESLint issues
- `bun run format` - Format code with Prettier
- `bun run type-check` - Run TypeScript type checking
- `bun run health` - Check development environment health
- `bun run services:up` - Start development services
- `bun run services:down` - Stop development services
- `bun run services:logs` - View service logs

### Project Structure

```
cc-wrapper/
├── apps/              # Application modules
├── packages/          # Shared packages and utilities
├── services/          # Backend services
├── src/              # Application source code
├── scripts/          # Utility scripts
│   ├── health-check.ts      # Service health monitoring
│   └── validate-config.ts   # Configuration validation
├── tests/            # Test files
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/         # End-to-end tests
├── .vscode/          # VS Code configuration
├── docker-compose.dev.yml  # Development services
└── .env.local        # Environment variables (local)
```

## Troubleshooting

### Common Issues

#### Docker Issues

**Problem:** Docker commands fail with permission errors
```bash
# Solution: Add your user to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and log back in
```

**Problem:** Docker Desktop won't start
```bash
# Solution: Check system requirements and restart Docker Desktop
# Ensure virtualization is enabled in BIOS
```

#### Database Issues

**Problem:** PostgreSQL connection fails
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql     # Linux

# Start PostgreSQL service
brew services start postgresql@18     # macOS
sudo systemctl start postgresql       # Linux
```

**Problem:** Database doesn't exist
```bash
# Create development database
createdb ccwrapper_dev

# Or connect to PostgreSQL and run:
CREATE DATABASE ccwrapper_dev;
```

#### Node.js/Bun Issues

**Problem:** Bun command not found
```bash
# Ensure Bun is in your PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
# or for Zsh:
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc

# Restart your terminal or source the file
source ~/.bashrc  # or ~/.zshrc
```

**Problem:** Permission denied during package installation
```bash
# Fix npm permissions (if using npm)
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# Or use bun which handles permissions better
```

#### Port Conflicts

**Problem:** Port 3000 is already in use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env.local
PORT=3001
```

### Getting Help

If you encounter issues not covered here:

1. **Check the health status**: `bun run health`
2. **Validate your configuration**: `bun run scripts/validate-config.ts`
3. **Check service logs**: `bun run services:logs`
4. **Review the debug output**: Look for detailed error messages in setup output

### Performance Tips

- **SSD Storage**: Use SSD storage for better Docker performance
- **Memory**: Ensure at least 8GB RAM for smooth development experience
- **Docker Resources**: Allocate sufficient CPU and memory to Docker Desktop
- **Network**: Use stable internet connection for package downloads

## Technology Stack

- **Runtime**: Bun 1.3.0 - High-performance JavaScript runtime
- **Language**: TypeScript 5.9.3 - Static typing and modern JavaScript
- **Containers**: Docker 28.5.1 - Containerized development environment
- **Database**: PostgreSQL 18.0 - Primary data storage
- **Cache**: Redis 8.2.2 - Caching and session storage
- **Testing**: Bun Test + Playwright - Unit and end-to-end testing
- **Code Quality**: ESLint + Prettier - Linting and formatting

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `bun test`
5. Run linting: `bun run lint`
6. Commit your changes: `git commit -m "Add feature"`
7. Push to branch: `git push origin feature-name`
8. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the health check output for specific error details