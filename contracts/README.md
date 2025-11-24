# Prophyt Protocol - Contracts

Prophyt is a decentralized prediction market protocol built on the Sui blockchain that integrates with multiple DeFi yield protocols to generate passive income from betting funds while markets are active.

## Overview

Prophyt combines prediction markets with automated yield farming, allowing users to:
- Create and participate in binary prediction markets
- Earn yield on deposited funds through integration with leading Sui DeFi protocols
- Receive commemorative NFTs as proof of participation and winnings
- Benefit from automated yield optimization through the Prophyt Agent
- Resolve markets using trusted oracle verification via Nautilus enclaves

## Architecture

### Core Components

#### Prediction Market (`prediction_market.move`)
The primary module for market lifecycle management.

**Market Creation**
- Users create markets with custom questions, descriptions, and durations
- Markets track Yes/No positions with separate pools
- Each market has an end time after which resolution is allowed

**Betting System**
- Users place bets on binary outcomes (Yes/No) with specified amounts
- Transaction fees are deducted from bet amounts (configurable, max 10%)
- Net amounts are automatically deposited to optimal yield protocols
- Bet proof NFTs are minted upon placing bets

**Market Resolution**
- Markets can be resolved after the end time by authorized users
- Supports standard resolution and Nautilus oracle-verified resolution
- Yield earned during market lifetime is calculated and distributed
- Protocol fees are deducted from yield (configurable, max 20%)

**Claim System**
- Winners claim their share of the losing pool plus proportional yield earnings
- Yield shares are calculated proportionally based on net bet amounts
- Winning proof NFTs are minted upon claiming
- Funds are automatically withdrawn from yield protocols

**State Management**
- Markets, bets, and user bet tracking stored in tables
- Fee tracking and recipient management
- Pausable functionality for emergency stops

#### Protocol Selector (`protocol_selector.move`)
Manages integration with multiple DeFi yield protocols.

**Protocol Registration**
- Registers available protocols (Suilend, Haedal, Volo)
- Tracks protocol state objects and metadata
- Maintains protocol information including APY, TVL, and risk levels

**Automatic Selection**
- Selects optimal protocol based on weighted scoring algorithm
- Scoring factors: APY (60% weight), TVL (20% weight), Risk (20% weight)
- Respects minimum APY thresholds and maximum risk tolerance
- Falls back to alternative protocols if primary selection fails

**Fund Management**
- Automatic deposits to selected protocol upon betting
- Automatic withdrawals across protocols when claiming
- Balance aggregation across all integrated protocols
- Event emission for deposit and withdrawal tracking

#### Prophyt Agent (`prophyt_agent.move`)
Automated rebalancing system for yield optimization.

**Rebalancing Analysis**
- Monitors APY differences between protocols
- Identifies rebalancing opportunities when APY difference exceeds threshold
- Respects minimum rebalance amounts and interval constraints
- Generates rebalancing proposals with expected gains

**Execution**
- Executes fund transfers from lower-yield to higher-yield protocols
- Tracks rebalancing history and statistics
- Configurable thresholds and intervals
- Can be enabled or disabled by owner

#### Nautilus Oracle (`nautilus_oracle.move`)
Trust oracle system for provable market resolution.

**Enclave Registration**
- Registers Nautilus enclaves with public keys and PCRs (Platform Configuration Registers)
- Tracks active enclaves and their attestation data
- Supports enclave activation and deactivation

**Resolution Verification**
- Verifies Ed25519 signatures from registered enclaves
- Validates resolution data including market ID, outcome, source data, and timestamps
- Enforces maximum resolution age (1 hour) to prevent replay attacks
- Emits events for verified resolutions

**Security**
- Signature verification ensures resolutions originate from trusted enclaves
- PCR validation provides code integrity guarantees
- Timestamp validation prevents stale resolutions

### Protocol Adapters

#### Suilend Adapter (`suilend_adapter.move`)
Integration with Suilend lending protocol.

**Features**
- Deposit and withdrawal operations
- User balance tracking
- APY and exchange rate management
- Total deposits and supplied amounts tracking

**State**
- Maintains user balances in table structure
- Tracks protocol-level metrics (APY, exchange rate, total deposits)

#### Haedal Adapter (`haedal_adapter.move`)
Integration with Haedal liquid staking protocol.

**Features**
- Deposit and withdrawal operations with staking simulation
- Whitelist functionality for access control
- User stake tracking
- Validator count and exchange rate management

**Access Control**
- Whitelist check before deposits
- Falls back to Suilend if user not whitelisted
- Owner-managed whitelist additions

#### Volo Adapter (`volo_adapter.move`)
Integration with Volo yield farming protocol.

**Features**
- Share-based accounting system
- Multiple yield strategy support
- Performance fee mechanism
- Compound tracking

**Accounting**
- Users receive shares proportional to deposits
- Withdrawals convert shares back to underlying amounts
- Share price calculated from total deposits and total shares

### Supporting Components

#### Walrus Proof NFTs (`walrus_proof_nft.move`)
Commemorative NFTs for market participation.

**Bet Proof NFTs**
- Minted when users place bets
- Contains market information, bet details, and metadata
- Includes blob addresses and image URLs for off-chain data

**Winning Proof NFTs**
- Minted when users claim winnings
- Contains market outcome, profit information, and yield shares
- Includes profit percentage calculations

**Market Proof NFTs**
- General market participation proofs
- Contains outcome and performance metrics

**Note**: Walrus blob wrapping functionality is currently disabled. NFTs store blob addresses and image URLs instead.

#### Access Control (`access_control.move`)
Ownership and pausability management.

**Owner Capabilities**
- Owner-only functions for critical operations
- Transferable ownership
- Contract address validation

**Pausable Functionality**
- Emergency stop mechanism
- Prevents operations when paused
- Owner-controlled pause/unpause

#### Constants (`constants.move`)
Protocol-wide configuration values.

**Protocol Identifiers**
- Suilend: 1
- Haedal: 2
- Volo: 3

**Fee Limits**
- Maximum protocol fee: 20% (2000 basis points)
- Maximum transaction fee: 10% (1000 basis points)
- Basis points: 10000

**Risk Levels**
- Low: 1
- Medium: 5
- High: 10

**Scoring Weights**
- APY weight: 60
- TVL weight: 20
- Risk weight: 20

## Key Features

### Yield-Generating Prediction Markets
Funds deposited in prediction markets automatically earn yield through integration with DeFi protocols. Users receive their original bet amount plus a proportional share of generated yield when markets resolve.

### Intelligent Protocol Selection
Automated selection of optimal yield protocol based on weighted scoring of APY, TVL, and risk metrics. System automatically deposits funds to the best available protocol and handles withdrawals across protocols as needed.

### Automated Rebalancing
Prophyt Agent monitors APY differences between protocols and automatically rebalances funds to maximize yield when opportunities exceed configured thresholds.

### Trust Oracle Resolution
Nautilus oracle integration enables provable market resolution through trusted enclave signatures, ensuring authentic and verifiable outcomes.

### Commemorative NFTs
Proof of participation and winnings stored as NFTs with detailed metadata including bet information, outcomes, and performance metrics.

### Risk Management
Configurable risk tolerance levels, pausable contracts for emergency situations, and owner controls for critical functions.

## Technical Specifications

### Dependencies
- **Sui Framework**: Core blockchain functionality
- **Ed25519**: Cryptographic signature verification for Nautilus oracle

### Supported Protocols
1. **Suilend** (ID: 1) - Lending protocol with stable yields
2. **Haedal** (ID: 2) - Liquid staking with validator rewards and whitelist access control
3. **Volo** (ID: 3) - Yield farming with share-based accounting and strategy optimization

### Fee Structure
- **Protocol Fee**: Up to 20% of generated yield (configurable, deducted at resolution)
- **Transaction Fee**: Up to 10% of bet amount (configurable, deducted at bet placement)
- **Performance Fee**: Protocol-specific (Volo example)

### Market Lifecycle
1. **Market Creation**: `create_market()` with question, description, and duration
2. **Betting Phase**: `place_bet()` with position and amount (funds auto-deposited to yield protocol)
3. **Yield Generation**: Funds automatically deposited to optimal protocol, earning yield
4. **Market Resolution**: `resolve_market()` or `resolve_market_with_nautilus()` after end time
5. **Claim Winnings**: `claim_winnings()` to receive rewards and yield (funds auto-withdrawn)

### Yield Optimization
1. **Automatic Deposits**: Best protocol selected based on current metrics when bets are placed
2. **Rebalancing**: Agent monitors APY differences and triggers fund movements when thresholds exceeded
3. **Withdrawals**: Funds retrieved from protocols automatically when winnings are claimed

## Security Features

- **Access Controls**: Owner-only functions for critical operations (resolution, pause/unpause)
- **Pausable Contracts**: Emergency stop functionality to halt operations
- **Input Validation**: Comprehensive error checking for all operations
- **Time-Based Logic**: Proper market lifecycle enforcement (end time, resolution timing)
- **Balance Tracking**: Accurate accounting across all protocols
- **Signature Verification**: Ed25519 signature verification for Nautilus oracle resolutions
- **Replay Protection**: Timestamp validation prevents stale resolution signatures

## Development and Testing

### Test Coverage
- Unit tests for individual components
- Integration tests for cross-contract interactions
- Test fixtures for consistent testing environments

### Configuration
- Flexible parameter settings for different environments
- Configurable fees, thresholds, and risk levels
- Support for testnet and mainnet deployments

## Contract Structure

```
sources/
├── core/
│   ├── prediction_market.move      # Main market logic
│   ├── protocol_selector.move      # Protocol selection and management
│   ├── prophyt_agent.move          # Automated rebalancing
│   └── nautilus_oracle.move        # Trust oracle integration
├── adapters/
│   ├── suilend_adapter.move        # Suilend protocol integration
│   ├── haedal_adapter.move         # Haedal protocol integration
│   └── volo_adapter.move           # Volo protocol integration
├── interfaces/
│   └── staking_protocol.move       # Protocol information interface
├── utils/
│   ├── access_control.move         # Ownership and pausability
│   └── constants.move              # Protocol constants
└── walrus/
    └── walrus_proof_nft.move       # NFT minting and management
```

## Future Enhancements

- Additional DeFi protocol integrations
- Advanced yield strategies
- Multi-asset market support
- Governance token integration
- Enhanced analytics and reporting
- Walrus blob storage

---

**Version**: 1.0.0  
**Edition**: 2024.beta  
**Authors**: Prophyt Team
