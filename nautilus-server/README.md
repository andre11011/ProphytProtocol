# Prophyt Nautilus Trust Oracle Server

The Nautilus server is a trust oracle service for the Prophyt Protocol that runs in an AWS Nitro Enclave to provide verifiable, authentic market resolutions with cryptographic proof.

## Overview

The Nautilus Trust Oracle Server:
- Verifies market outcomes from external data sources
- Signs resolution data with enclave-attested Ed25519 keys
- Verifies media provenance by computing hashes of market images
- Provides cryptographic proof of data authenticity
- Stores resolution history for audit trails

## Architecture

### Key Management
- Ed25519 signing keys are generated and stored securely in the database
- Keys persist across server restarts
- Public keys are registered on-chain for signature verification
- Private keys never leave the enclave environment

### Database Integration
- Connects to the Prophyt indexer PostgreSQL database
- Stores signing keys in `nautilus_keys` table
- Maintains resolution history in `nautilus_resolutions` table
- Queries pending markets from the `Market` table

### Resolution Process
1. Receives market resolution request with market details and optional data sources
2. Verifies market has ended (checks end time)
3. Queries external data sources to determine outcome
4. Computes source data hash for verification
5. Verifies media provenance by hashing images (if provided)
6. Serializes resolution data according to Move contract format
7. Signs resolution with Ed25519 private key
8. Stores resolution in database for audit trail
9. Returns signed resolution response

## Features

### Intelligent Outcome Verification
The server intelligently parses various API response formats:
- JSON responses with boolean, status, or numeric fields
- Price comparison for prediction markets (extracts targets from questions)
- Threshold-based comparisons for numeric markets
- Text-based responses with keyword detection
- Multiple fallback patterns for different API structures

### Media Provenance
- Downloads images from provided URLs
- Computes SHA256 hashes for verification
- Stores hash in resolution data for on-chain verification

### Cryptographic Signing
- Ed25519 signature scheme for fast, secure signing
- Serialization format matches Move contract exactly
- Signatures are verifiable on-chain using registered public keys

### Audit Trail
- All resolutions stored in database with full metadata
- Includes source data, hashes, signatures, and timestamps
- Enables historical verification and debugging

## API Endpoints

### POST /resolve
Resolve a market with verified outcome and cryptographic signature.

**Request Body:**
```json
{
  "market_id": 1,
  "market_question": "Will Bitcoin reach $100k by 2025?",
  "market_end_time": 1735689600,
  "data_source_url": "https://api.example.com/bitcoin-price",
  "image_url": "https://example.com/market-image.png"
}
```

**Response:**
```json
{
  "market_id": 1,
  "outcome": true,
  "source_data": "Bitcoin price: $105,000",
  "source_data_hash": "abc123...",
  "resolution_timestamp": 1735689600,
  "media_hash": "def456...",
  "signature": "sig123...",
  "public_key": "pubkey123..."
}
```

**Fields:**
- `market_id`: Unique market identifier
- `outcome`: Boolean outcome (true/false)
- `source_data`: Raw data from external source used for verification
- `source_data_hash`: SHA256 hash of source data (hex encoded)
- `resolution_timestamp`: Unix timestamp of resolution
- `media_hash`: SHA256 hash of market image (hex encoded, or 64 zeros if not provided)
- `signature`: Ed25519 signature of serialized resolution (hex encoded)
- `public_key`: Ed25519 public key for verification (hex encoded)

### GET /health
Health check endpoint. Returns 200 OK if server is running.

### GET /markets/pending
Retrieve pending markets that need resolution.

**Response:**
```json
{
  "markets": [
    {
      "market_id": "1",
      "question": "Will Bitcoin reach $100k?",
      "end_date": "2025-01-01T00:00:00Z",
      "external_link": "https://example.com/data"
    }
  ]
}
```

Returns up to 10 active markets that have passed their end date and are not yet resolved.

## Development

### Prerequisites
- Rust 1.75+
- PostgreSQL database (shared with Prophyt indexer)
- AWS Nitro Enclaves SDK (for production deployment)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://koalaterbang:@localhost:5432/prophyt_indexer`)

### Running Locally

```bash
cd nautilus-server
cargo run
```

The server will start on `http://localhost:8080`.

### Building

```bash
cargo build --release
```

### Docker Build

```bash
docker build -t prophyt-nautilus-server .
```

## Database Schema

The server automatically initializes the following tables:

### nautilus_keys
Stores signing keys for the enclave.

```sql
CREATE TABLE nautilus_keys (
    id VARCHAR(255) PRIMARY KEY,
    private_key TEXT NOT NULL,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### nautilus_resolutions
Stores resolution history for audit trails.

```sql
CREATE TABLE nautilus_resolutions (
    id SERIAL PRIMARY KEY,
    market_id VARCHAR(255) NOT NULL,
    outcome BOOLEAN NOT NULL,
    source_data TEXT,
    source_data_hash VARCHAR(64),
    resolution_timestamp BIGINT NOT NULL,
    media_hash VARCHAR(128),
    signature TEXT NOT NULL,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(market_id, resolution_timestamp)
);
```

## Production Deployment

For production deployment in AWS Nitro Enclaves:

1. **Build Docker Image**
   ```bash
   docker build -t prophyt-nautilus-server .
   ```

2. **Create Enclave Image**
   ```bash
   nitro-cli build-enclave --docker-uri prophyt-nautilus-server:latest --output-file nautilus-server.eif
   ```

3. **Deploy Enclave**
   - Launch EC2 instance with Nitro Enclaves support
   - Configure network and storage
   - Run enclave with proper resource allocation

4. **Register on Chain**
   - Extract PCRs (Platform Configuration Registers) from enclave
   - Register enclave in Prophyt NautilusRegistry contract
   - Provide public key and PCRs for attestation

5. **Configure Database**
   - Ensure database is accessible from enclave
   - Configure connection string via environment variables
   - Verify database schema is initialized

## Security Considerations

### Enclave Isolation
- Signing keys are generated and stored within the enclave
- Private keys never leave the secure enclave environment
- All external API calls are made from within the enclave
- Resolution data is cryptographically signed before being returned

### Signature Verification
- Ed25519 signatures provide fast, secure verification
- Serialization format must match Move contract exactly
- Signatures are verifiable on-chain using registered public keys
- Timestamp validation prevents replay attacks (enforced on-chain)

### Data Integrity
- Source data hashes ensure data authenticity
- Media provenance hashes verify image integrity
- Resolution history provides audit trail
- Database stores all resolution metadata for verification

### Access Control
- Enclave registration required before signatures are accepted
- PCR validation provides code integrity guarantees
- Public key must match registered enclave
- Resolution age limits prevent stale signatures

## Integration with Prophyt Contracts

The server integrates with the Prophyt `nautilus_oracle` Move module:

1. **Enclave Registration**: Public key and PCRs registered on-chain
2. **Resolution Request**: Indexer or external service calls `/resolve` endpoint
3. **Signature Generation**: Server signs resolution data
4. **On-Chain Verification**: `resolve_market_with_nautilus()` verifies signature
5. **Market Resolution**: Market is resolved with verified outcome

The serialization format in `serialize_resolution()` must match exactly with the Move contract's `serialize_resolution()` function to ensure signature verification succeeds.

## Error Handling

- Invalid market end times return 400 Bad Request
- External API failures return 500 Internal Server Error
- Database connection errors are logged and handled gracefully
- Image download failures default to zero hash
- Signature generation failures abort the request

## Dependencies

- **axum**: Web framework for HTTP server
- **ed25519-dalek**: Ed25519 signature scheme implementation
- **reqwest**: HTTP client for external API calls
- **sqlx**: PostgreSQL database driver
- **sha2**: SHA256 hashing for data integrity
- **serde**: Serialization/deserialization
- **regex**: Pattern matching for outcome extraction

---

**Version**: 0.1.0  
**Authors**: Prophyt Team
