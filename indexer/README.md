# Prophyt Protocol - Indexer

The Prophyt Indexer is a comprehensive blockchain data indexing service and REST API for the Prophyt Protocol. It monitors Sui blockchain events, processes prediction market data, generates NFT portfolio images, integrates with the Nautilus Trust Oracle, and provides a complete API for frontend applications.

## Overview

The indexer serves as the critical infrastructure layer that:

- **Monitors Blockchain Events**: Real-time indexing of Prophyt contract events on Sui blockchain
- **Database Management**: Structured storage of markets, bets, users, protocols, and events
- **Image Generation**: Dynamic NFT portfolio image creation with Walrus storage integration
- **REST API**: Complete API endpoints for frontend applications
- **Market Resolution**: Automated market resolution using Nautilus Trust Oracle
- **Price Feeds**: CoinGecko integration for SUI/USD price data
- **Market Data Integration**: External market data from Adjacent API

## Architecture

### Core Components

#### Event Indexer (`indexer/event-indexer.ts`)

Real-time blockchain event monitoring and processing.

**Features:**
- Continuous polling of Sui blockchain events with configurable intervals
- Cursor-based tracking to prevent duplicate processing
- Concurrent processing of multiple event types with rate limiting
- Automatic error recovery with cursor reset on invalid transactions
- Event filtering for Prophyt-specific contract events

**Event Types Tracked:**
- MarketCreated: New market creation events
- BetPlaced: User bet placement events
- MarketResolved: Market resolution events
- WinningsClaimed: User claim events
- BetProofNFTMinted: Bet proof NFT minting
- WinningProofNFTMinted: Winning proof NFT minting
- YieldDeposited: Yield protocol deposit events

#### Event Handlers (`indexer/prophyt-handler.ts`)

Processes and stores blockchain events in the database.

**Processing:**
- Extracts event data from Sui event structures
- Validates and transforms event data
- Stores events in database with proper relationships
- Updates market statistics and user portfolios
- Handles NFT metadata and image references

#### REST API Server (`server.ts`)

Express.js server providing RESTful API endpoints.

**Features:**
- CORS-enabled for frontend integration
- JSON request/response handling
- Error handling middleware
- Automatic price feed updates
- Market resolution scheduler integration

**Background Services:**
- CoinGecko price updater (runs continuously)
- Market resolution scheduler (checks every 60 seconds)

### Data Services

#### Market Service (`services/market-service.ts`)

Market data management and operations.

**Features:**
- Market creation and seeding from external sources
- Market statistics tracking (volume, odds, participation)
- Resolution processing and outcome handling
- Blockchain to database synchronization
- Market status management

#### Market Resolution Service (`services/market-resolution-service.ts`)

Automated market resolution using Nautilus Trust Oracle.

**Features:**
- Automatic detection of expired markets
- Nautilus enclave integration for verified resolutions
- On-chain resolution submission
- Resolution history tracking
- Error handling and retry logic

#### Market Resolution Scheduler (`services/market-resolution-scheduler.ts`)

Periodic market resolution checking.

**Features:**
- Checks for expired markets every 60 seconds
- Automatically triggers resolution for eligible markets
- Configurable via environment variables
- Graceful error handling

#### Nautilus Service (`services/nautilus-service.ts`)

Integration with Nautilus Trust Oracle server.

**Features:**
- Communication with Nautilus enclave server
- Resolution request handling
- Health check monitoring
- Signature verification support

#### Image Generation (`services/portfolio-image-generator.ts`)

Dynamic NFT portfolio image creation.

**Features:**
- Canvas-based image rendering
- Custom fonts and branding (StackSans)
- Bet proof and winning proof templates
- Dynamic content based on market and bet data
- High-quality image output

#### Walrus Uploader (`services/walrus-uploader.ts`)

Decentralized blob storage integration.

**Features:**
- HTTP API and CLI upload methods
- Image validation before upload
- Retry mechanisms for failed uploads
- Blob address and ID tracking

#### CoinGecko Oracle (`services/coingecko-oracle.ts`)

Price feed integration.

**Features:**
- SUI/USD price fetching from CoinGecko
- Price caching with configurable duration
- Automatic price updates
- Market cap and volume data

#### Bet Service (`services/bet-service.ts`)

Bet data management and operations.

#### Chart Service (`services/chart-service.ts`)

Analytics and chart data generation.

#### Protocol Service (`services/protocol-service.ts`)

DeFi protocol integration management.

#### Adjacent Service (`services/adjacent.ts`)

External market data integration.

### Database Integration

#### Prisma ORM (`db.ts`)

Type-safe database access layer.

**Features:**
- Full TypeScript integration
- Optimized connection pooling
- Database schema versioning with migrations
- Efficient query patterns

#### Data Models

- **Markets**: Question, status, outcomes, statistics, protocol relationships
- **Bets**: User positions, amounts, claim status, NFT references
- **Events**: Complete blockchain event history with cursors
- **Users**: Portfolio tracking and analytics
- **Protocols**: DeFi integration metadata
- **Prices**: CoinGecko price data with caching
- **Cursors**: Event processing state tracking

## API Endpoints

### Market Endpoints

```
GET  /api/markets                    # List all markets with filters
GET  /api/markets/:marketId          # Get market details
POST /api/markets/seed               # Seed markets from external data
```

**Query Parameters:**
- `status`: Filter by market status (active, resolved, etc.)
- `protocolId`: Filter by protocol ID
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

### Betting Endpoints

```
GET  /api/bets/:betId                # Get bet details
GET  /api/bets/user/:address         # Get user's bets
GET  /api/bets/market/:marketId      # Get market bets
POST /api/bets/generate-bet-image    # Generate bet NFT image
POST /api/bets/generate-winning-image # Generate winning NFT image
```

### User Endpoints

```
GET  /api/users/:address/bets        # User portfolio
GET  /api/users/:address/stats       # User statistics
```

### Oracle Endpoints

```
GET  /api/oracle/price/latest        # Latest SUI/USD price data
GET  /api/oracle/markets             # Market data feed
```

### Chart Endpoints

```
GET  /api/charts/market/:id          # Market chart data
GET  /api/charts/volume              # Volume analytics
```

### Nautilus Endpoints

```
GET  /api/nautilus/health            # Check Nautilus server health
GET  /api/nautilus/pending-markets   # Get markets pending resolution
GET  /api/nautilus/resolutions       # Get resolution history
GET  /api/nautilus/stats             # Get Nautilus statistics
POST /api/nautilus/resolve/:marketId # Manually trigger market resolution
POST /api/nautilus/resolve-all       # Resolve all expired markets
```

**Nautilus Query Parameters:**
- `marketId`: Filter resolutions by market ID
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

## Features

### Real-time Event Processing

- Continuous monitoring of Sui blockchain events with 1-second polling interval
- Cursor-based tracking prevents duplicate processing
- Automatic error recovery with cursor reset on invalid transactions
- Concurrent processing of multiple event streams with rate limiting (1000 concurrent operations)
- Event filtering for Prophyt-specific contract events

### Automated Market Resolution

- Automatic detection of expired markets (checks every 60 seconds)
- Integration with Nautilus Trust Oracle for verified resolutions
- On-chain resolution submission with cryptographic proof
- Resolution history tracking in database
- Manual resolution triggers via API

### Dynamic NFT Generation

- Custom portfolio images for betting positions
- Winning celebration images with profit calculations
- Walrus integration for decentralized storage
- Professional branding with StackSans custom fonts
- Canvas-based high-quality rendering

### Market Data Integration

- External market seeding from Adjacent API
- Real-time odds calculation and updates
- Volume and participation tracking
- Performance analytics and statistics
- Blockchain to database synchronization

### Price Feed Integration

- CoinGecko API integration for SUI/USD prices
- Automatic price updates with caching
- Market cap and 24-hour volume data
- 24-hour price change tracking

### Comprehensive API

- RESTful endpoints for all platform functionality
- Pagination and filtering support
- Real-time data synchronization
- Error handling and validation
- CORS support for frontend integration

## Technology Stack

### Core Technologies

- **TypeScript**: Type-safe development environment
- **Node.js**: Server runtime with ES modules
- **Express.js**: REST API framework with middleware
- **Prisma ORM**: Type-safe database access layer
- **PostgreSQL**: Primary database for structured data

### Blockchain Integration

- **@mysten/sui**: Official Sui TypeScript SDK
- **Event Streaming**: Real-time blockchain event monitoring
- **Transaction Processing**: Sui transaction analysis
- **Event Filtering**: Contract-specific event subscriptions

### Image Processing

- **Canvas**: High-quality image generation
- **Custom Fonts**: Professional typography with StackSans
- **Dynamic Content**: Data-driven image composition
- **Buffer Management**: Efficient image data handling

### External Integrations

- **Walrus Network**: Decentralized blob storage
- **Adjacent API**: Market data and seeding
- **CoinGecko**: Price oracle integration
- **Nautilus Server**: Trust oracle for market resolution

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5433/data

# Sui Network
NETWORK=mainnet|testnet|devnet
PROPHYT_PACKAGE_ID=0x...

# Walrus Storage
WALRUS_CLI_PATH=/path/to/walrus
WALRUS_CONFIG_PATH=~/.config/walrus/client_config.yaml
WALRUS_EPOCHS=5
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# External APIs
ADJACENT_API_KEY=your_adjacent_api_key

# Nautilus Integration
NAUTILUS_SERVER_URL=http://localhost:8080
NAUTILUS_ENABLED=true

# Server
PORT=8000
DEBUG=false
```

### Indexer Configuration

The indexer uses the following configuration (from `config.ts`):

- **POLLING_INTERVAL_MS**: 1000ms (1 second between event queries)
- **CONCURRENCY_LIMIT**: 1000 (maximum concurrent operations)
- **DEFAULT_LIMIT**: 1000 (default event query limit)

### Docker Deployment

The indexer includes Docker Compose configuration for PostgreSQL:

```yaml
services:
  db:
    image: postgres
    environment:
      POSTGRES_USER: sandworm
      POSTGRES_PASSWORD: 44rfuG5D2
      POSTGRES_DB: data
    ports:
      - '5433:5432'
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm package manager
- PostgreSQL database
- Sui network access (mainnet/testnet/devnet)

### Installation

```bash
# Install dependencies
pnpm install

# Set up database
npx prisma migrate dev --name init
npx prisma generate

# Start development server
pnpm dev

# Start indexer (in separate terminal)
pnpm indexer
```

### Available Scripts

```bash
# Development
pnpm dev                    # Start API server
pnpm indexer               # Start event indexer

# Database
pnpm db:setup:dev          # Initialize database
pnpm db:reset:dev          # Reset database
pnpm db:studio            # Open Prisma Studio
pnpm db:generate          # Generate Prisma client

# Data Management
pnpm sync:markets          # Sync markets from blockchain
pnpm sync:markets:dry-run  # Test market sync (dry run)
pnpm sync:resolutions      # Sync resolutions only
pnpm backfill:live         # Backfill historical events
pnpm backfill:dry-run      # Test event backfill (dry run)

# Code Quality
pnpm lint                  # ESLint checking
pnpm lint:fix             # ESLint with auto-fix
pnpm format               # Prettier formatting
```

### Testing and Validation

```bash
# Dry run operations
pnpm sync:markets:dry-run  # Test market sync
pnpm backfill:dry-run     # Test event backfill

# Image generation testing
npx tsx test-image-gen.ts  # Test NFT image generation
```

## Deployment

### Production Setup

1. **Database Configuration**: Set up PostgreSQL with proper credentials and connection pooling
2. **Environment Variables**: Configure all required environment variables
3. **Walrus Setup**: Install and configure Walrus CLI or use HTTP API
4. **API Keys**: Set up Adjacent API and other external service keys
5. **Nautilus Server**: Deploy and configure Nautilus Trust Oracle server
6. **Process Management**: Use PM2 or similar for process management
7. **Monitoring**: Set up logging and monitoring for event processing and API performance

### Running in Production

```bash
# Build TypeScript
pnpm build

# Run API server
node dist/server.js

# Run indexer (separate process)
node dist/indexer.js
```

### Monitoring

- **Event Processing**: Monitor cursor advancement and error rates
- **API Performance**: Track response times and error rates
- **Database Health**: Monitor connection pool and query performance
- **Image Generation**: Track Walrus upload success rates
- **Market Resolution**: Monitor resolution success rates and Nautilus health
- **Price Feeds**: Verify CoinGecko price update frequency

## Security Considerations

- **Input Validation**: Comprehensive validation of all API inputs
- **Rate Limiting**: Protection against API abuse (consider adding middleware)
- **Error Handling**: Secure error messages without sensitive data exposure
- **Database Security**: Parameterized queries and connection security
- **Image Validation**: Content verification before Walrus upload
- **Nautilus Integration**: Secure communication with enclave server
- **Environment Variables**: Sensitive data stored in environment variables, not code

## Performance Optimization

- **Connection Pooling**: Efficient database connection management via Prisma
- **Concurrent Processing**: Parallel event stream processing with rate limiting
- **Caching Strategy**: Price data caching with configurable duration
- **Image Optimization**: Efficient canvas rendering and buffer management
- **Pagination**: Large dataset handling with proper pagination
- **Event Cursor Management**: Efficient cursor tracking prevents reprocessing

## Database Schema

The indexer uses Prisma for database schema management. Key tables include:

- **Market**: Market data with questions, status, outcomes, and statistics
- **Bet**: User bets with positions, amounts, and claim status
- **Event**: Blockchain event history
- **User**: User portfolio and analytics
- **Protocol**: DeFi protocol metadata
- **Price**: CoinGecko price data with timestamps
- **Cursor**: Event processing state for each event type
- **nautilus_resolutions**: Nautilus resolution history (managed by Nautilus server)

## Integration Points

### With Prophyt Contracts

- Monitors contract events on Sui blockchain
- Processes market creation, betting, and resolution events
- Tracks NFT minting events
- Synchronizes on-chain state with database

### With Nautilus Server

- Requests market resolutions from Nautilus enclave
- Submits signed resolutions to blockchain
- Monitors Nautilus server health
- Tracks resolution history

### With Frontend

- Provides REST API for all frontend data needs
- Real-time market and bet data
- User portfolio and statistics
- Chart and analytics data

## Future Enhancements

- **WebSocket Support**: Real-time event streaming to clients
- **Advanced Analytics**: Machine learning-powered market insights
- **Enhanced NFTs**: More sophisticated image generation templates
- **Performance Monitoring**: Comprehensive observability and alerting
- **Caching Layer**: Redis integration for frequently accessed data
- **GraphQL API**: Alternative API interface for complex queries

---

**Version**: 1.0.10  
**License**: Apache-2.0  
**Node.js**: >=18.0.0
