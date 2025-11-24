# Prophyt Protocol

Prophyt is a decentralized prediction market protocol built on the Sui blockchain that integrates with multiple DeFi yield protocols to generate passive income from betting funds while markets are active.

## Overview

Prophyt combines prediction markets with automated yield farming, enabling users to:

- Create and participate in binary prediction markets
- Earn yield on deposited funds through integration with leading Sui DeFi protocols (Suilend, Haedal, Volo)
- Receive commemorative NFTs as proof of participation and winnings
- Benefit from automated yield optimization through the Prophyt Agent
- Resolve markets using trusted oracle verification via Nautilus enclaves

## Architecture

Prophyt consists of four main components:

### 1. Smart Contracts (`contracts/`)

Move smart contracts deployed on Sui blockchain.

**Core Modules:**
- **Prediction Market**: Market lifecycle management, betting, and claiming
- **Protocol Selector**: Automatic selection of optimal DeFi protocol
- **Prophyt Agent**: Automated rebalancing for yield optimization
- **Nautilus Oracle**: Trust oracle for provable market resolution
- **Protocol Adapters**: Suilend, Haedal, and Volo integrations

**Key Features:**
- Binary prediction markets (Yes/No)
- Automatic yield deposit on bet placement
- Proportional yield distribution on market resolution
- Configurable fees (protocol fee max 20%, transaction fee max 10%)
- Pausable contracts for emergency stops
- Owner-controlled critical functions

### 2. Indexer (`indexer/`)

TypeScript/Node.js service for event processing and REST API.

**Features:**
- Real-time blockchain event indexing
- PostgreSQL database for structured data storage
- REST API for frontend applications
- Dynamic NFT portfolio image generation
- Automated market resolution scheduling
- CoinGecko price feed integration
- Walrus decentralized storage integration

**API Endpoints:**
- Markets: Listing, details, statistics
- Bets: User portfolios, bet tracking
- Users: Analytics and statistics
- Oracle: Price feeds and market data
- Charts: Analytics and visualization data
- Nautilus: Trust oracle integration

### 3. Nautilus Server (`nautilus-server/`)

Rust-based trust oracle server running in AWS Nitro Enclave.

**Features:**
- Enclave-based security with Ed25519 signing
- External data source verification
- Intelligent outcome parsing from various API formats
- Media provenance verification via image hashing
- Resolution history and audit trails
- Cryptographic proof of authenticity

**API Endpoints:**
- `POST /resolve`: Request market resolution
- `GET /health`: Health check
- `GET /markets/pending`: Get pending markets

### 4. Frontend (`frontend/`)

Next.js web application for user interaction.

**Features:**
- Market creation and browsing
- Bet placement and management
- Portfolio tracking
- Real-time market data
- Wallet integration
- NFT display and management

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm package manager
- Rust 1.75+ (for Nautilus server)
- PostgreSQL database
- Sui CLI and wallet
- Access to Sui network (mainnet/testnet/devnet)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/andre11011/ProphytProtocol
cd prophyt
```

2. **Install dependencies**

```bash
# Contracts (no dependencies needed)
cd contracts

# Indexer
cd ../indexer
pnpm install

# Frontend
cd ../frontend
pnpm install

# Nautilus Server
cd ../nautilus-server
cargo build
```

3. **Configure environment**

```bash
# Indexer
cd indexer
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Setup database**

```bash
cd indexer
docker-compose up -d
pnpm db:setup:dev
pnpm db:generate
```

5. **Deploy contracts**

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
# Save package ID and object IDs for configuration
```

6. **Start services**

```bash
# Indexer API (terminal 1)
cd indexer
pnpm dev

# Indexer event processor (terminal 2)
cd indexer
pnpm indexer

# Nautilus Server (terminal 3, optional)
cd nautilus-server
cargo run

# Frontend (terminal 4)
cd frontend
pnpm dev
```

## Project Structure

```
prophyt/
├── contracts/          # Move smart contracts
│   ├── sources/        # Contract source code
│   │   ├── core/      # Core modules (prediction_market, protocol_selector, etc.)
│   │   ├── adapters/  # Protocol adapters (suilend, haedal, volo)
│   │   ├── utils/     # Utilities (access_control, constants)
│   │   └── walrus/    # NFT proof minting
│   ├── tests/         # Contract tests
│   └── scripts/       # Deployment scripts
│
├── indexer/            # Event indexer and REST API
│   ├── indexer/       # Event processing
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic services
│   ├── prisma/        # Database schema and migrations
│   └── scripts/       # Utility scripts
│
├── nautilus-server/   # Trust oracle server
│   └── src/           # Rust source code
│
└── frontend/          # Next.js web application
    ├── app/           # Next.js app router
    ├── components/    # React components
    ├── services/      # API service clients
    └── lib/           # Utilities and helpers
```

## Development

### Contracts

```bash
cd contracts

# Build contracts
sui move build

# Run tests
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000 --network testnet
```

### Indexer

```bash
cd indexer

# Development server
pnpm dev

# Event indexer
pnpm indexer

# Database operations
pnpm db:setup:dev      # Setup database
pnpm db:studio         # Open Prisma Studio
pnpm sync:markets      # Sync markets from blockchain
pnpm backfill:live     # Backfill historical events
```

### Nautilus Server

```bash
cd nautilus-server

# Development
cargo run

# Build for production
cargo build --release

# Docker build
docker build -t prophyt-nautilus-server .
```

### Frontend

```bash
cd frontend

# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Configuration

### Environment Variables

**Indexer:**
- `DATABASE_URL`: PostgreSQL connection string
- `NETWORK`: Sui network (mainnet/testnet/devnet)
- `PROPHYT_PACKAGE_ID`: Deployed contract package ID
- `NAUTILUS_SERVER_URL`: Nautilus server URL
- `WALRUS_CLI_PATH`: Path to Walrus CLI
- `ADJACENT_API_KEY`: Adjacent API key for market seeding

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Indexer API URL
- `NEXT_PUBLIC_NETWORK`: Sui network
- `NEXT_PUBLIC_PROPHYT_PACKAGE_ID`: Contract package ID

**Nautilus Server:**
- `DATABASE_URL`: PostgreSQL connection string (shared with indexer)

## Key Features

### Yield-Generating Prediction Markets

Funds deposited in prediction markets automatically earn yield through integration with DeFi protocols. Users receive their original bet amount plus a proportional share of generated yield when markets resolve.

### Intelligent Protocol Selection

Automated selection of optimal yield protocol based on weighted scoring of APY (60%), TVL (20%), and risk (20%). System automatically deposits funds to the best available protocol and handles withdrawals across protocols as needed.

### Automated Rebalancing

Prophyt Agent monitors APY differences between protocols and automatically rebalances funds to maximize yield when opportunities exceed configured thresholds.

### Trust Oracle Resolution

Nautilus oracle integration enables provable market resolution through trusted enclave signatures, ensuring authentic and verifiable outcomes.

### Commemorative NFTs

Proof of participation and winnings stored as NFTs with detailed metadata including bet information, outcomes, and performance metrics.

## Supported DeFi Protocols

1. **Suilend** (ID: 1): Lending protocol with stable yields
2. **Haedal** (ID: 2): Liquid staking with validator rewards and whitelist access control
3. **Volo** (ID: 3): Yield farming with share-based accounting and strategy optimization

## Security

- **Access Controls**: Owner-only functions for critical operations
- **Pausable Contracts**: Emergency stop functionality
- **Input Validation**: Comprehensive error checking
- **Time-Based Logic**: Proper market lifecycle enforcement
- **Signature Verification**: Ed25519 for Nautilus resolutions
- **Enclave Isolation**: Nautilus keys never leave secure enclave

## Testing

### Contracts

```bash
cd contracts
sui move test
```

### Indexer

```bash
cd indexer
pnpm test  # If tests are configured
```

### Integration Testing

Test the complete flow:
1. Deploy contracts to testnet
2. Start indexer and connect to testnet
3. Create markets via frontend or contracts
4. Place bets and verify yield deposits
5. Resolve markets and claim winnings

## Deployment

See component-specific READMEs for detailed deployment instructions:

- [Contracts README](contracts/README.md)
- [Indexer README](indexer/README.md)
- [Nautilus Server README](nautilus-server/README.md)

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the Apache-2.0 License.

## Resources

- [Documentation](https://docs.prophyt.fun/) - Complete documentation
- [GitHub](https://github.com/andre11011/ProphytProtocol) - Source code
- [X](https://x.com/prophyt_fun) - Latest updates

## Support

For questions and support:

- Open an issue on [GitHub](https://github.com/andre11011/ProphytProtocol/issues)
- Follow us on [X](https://x.com/prophyt_fun) for updates
- Check the [documentation](https://docs.prophyt.fun)

---

**Version**: 1.0.0  
**Authors**: Prophyt Team

