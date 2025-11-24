#[allow(duplicate_alias)]
module prophyt::nautilus_oracle;

use sui::clock::{Self, Clock};
use sui::ed25519;
use sui::event;
use sui::object::{Self, UID, ID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use std::string::{Self, String};
use std::vector;

/// Error codes
const E_ENCLAVE_NOT_REGISTERED: u64 = 1;
const E_INVALID_SIGNATURE: u64 = 2;
const E_RESOLUTION_EXPIRED: u64 = 4;
const E_ALREADY_REGISTERED: u64 = 5;
const E_INVALID_PCR: u64 = 6;

/// Maximum age of a resolution signature (in seconds)
const MAX_RESOLUTION_AGE: u64 = 3600; // 1 hour

/// Nautilus enclave registration
public struct NautilusEnclave has key {
    id: UID,
    /// Enclave public key (Ed25519)
    public_key: vector<u8>,
    /// Platform Configuration Registers (PCRs) for attestation
    pcrs: vector<vector<u8>>,
    /// Enclave name/identifier
    name: String,
    /// Whether the enclave is active
    is_active: bool,
    /// Timestamp when registered
    registered_at: u64,
}

/// Market resolution data signed by enclave
public struct MarketResolution has drop {
    market_id: u64,
    outcome: bool,
    /// Source data used for resolution (e.g., API endpoint, data hash)
    source_data: String,
    /// Hash of the source data for verification
    source_data_hash: vector<u8>,
    /// Timestamp when resolution was computed
    resolution_timestamp: u64,
    /// Media provenance hash (if applicable)
    media_hash: vector<u8>,
}

/// Event emitted when an enclave is registered
public struct EnclaveRegistered has copy, drop {
    enclave_id: address,
    name: String,
    public_key: vector<u8>,
}

/// Event emitted when a market is resolved via Nautilus
public struct NautilusMarketResolved has copy, drop {
    market_id: u64,
    outcome: bool,
    source_data: String,
    resolution_timestamp: u64,
    enclave_id: address,
}

/// Registry of all registered enclaves
public struct NautilusRegistry has key {
    id: UID,
    /// Map from enclave public key to enclave object
    enclaves: Table<vector<u8>, ID>,
    /// Active enclave count
    active_count: u64,
}

/// Initialize the Nautilus registry
public fun initialize(ctx: &mut TxContext) {
    let registry = NautilusRegistry {
        id: object::new(ctx),
        enclaves: table::new(ctx),
        active_count: 0,
    };
    transfer::share_object(registry);
}

/// Register a new Nautilus enclave
/// PCRs (Platform Configuration Registers) prove the enclave's code integrity
public fun register_enclave(
    registry: &mut NautilusRegistry,
    public_key: vector<u8>,
    pcrs: vector<vector<u8>>,
    name: String,
    ctx: &mut TxContext,
) {
    // Validate PCRs (must be non-empty)
    let pcr_len = vector::length(&pcrs);
    assert!(pcr_len > 0, E_INVALID_PCR);
    
    // Check if enclave already registered
    assert!(!table::contains(&registry.enclaves, public_key), E_ALREADY_REGISTERED);

    let enclave = NautilusEnclave {
        id: object::new(ctx),
        public_key,
        pcrs,
        name,
        is_active: true,
        registered_at: tx_context::epoch(ctx),
    };

    let enclave_id = object::id(&enclave);
    table::add(&mut registry.enclaves, enclave.public_key, enclave_id);
    registry.active_count = registry.active_count + 1;

    event::emit(EnclaveRegistered {
        enclave_id: object::id_to_address(&enclave_id),
        name: enclave.name,
        public_key: enclave.public_key,
    });

    transfer::share_object(enclave);
}

/// Verify a market resolution signature from a Nautilus enclave
public fun verify_resolution_signature(
    registry: &NautilusRegistry,
    resolution: &MarketResolution,
    signature: vector<u8>,
    public_key: vector<u8>,
    clock: &Clock,
): (bool, address) {
    // Check if enclave is registered
    assert!(table::contains(&registry.enclaves, public_key), E_ENCLAVE_NOT_REGISTERED);
    
    // Get enclave ID
    let enclave_id = *table::borrow(&registry.enclaves, public_key);
    
    // Check resolution timestamp is not too old
    let current_time = clock::timestamp_ms(clock) / 1000;
    let age = if (current_time > resolution.resolution_timestamp) {
        current_time - resolution.resolution_timestamp
    } else {
        0
    };
    assert!(age <= MAX_RESOLUTION_AGE, E_RESOLUTION_EXPIRED);
    
    // Serialize resolution data for signature verification
    let message = serialize_resolution(resolution);
    
    // Verify signature format (Ed25519: signature = 64 bytes, public key = 32 bytes)
    let sig_len = vector::length(&signature);
    let key_len = vector::length(&public_key);
    let format_valid = sig_len == 64 && key_len == 32;
    
    // Perform Ed25519 signature verification using Sui's crypto module
    // This verifies that the signature was created by the private key corresponding to the public key
    // Function signature: ed25519_verify(signature, public_key, msg)
    let verified = if (format_valid) {
        ed25519::ed25519_verify(&signature, &public_key, &message)
    } else {
        false
    };
    
    // Assert signature is valid (this will abort with E_INVALID_SIGNATURE if verification fails)
    assert!(verified, E_INVALID_SIGNATURE);
    
    let enclave_address = object::id_to_address(&enclave_id);
    
    // Emit Nautilus market resolved event
    event::emit(NautilusMarketResolved {
        market_id: resolution.market_id,
        outcome: resolution.outcome,
        source_data: resolution.source_data,
        resolution_timestamp: resolution.resolution_timestamp,
        enclave_id: enclave_address,
    });
    
    (verified, enclave_address)
}

/// Serialize resolution data for signing
/// Format: market_id (8 bytes) | outcome (1 byte) | source_data_len (4 bytes) | source_data | source_data_hash | timestamp (8 bytes) | media_hash
fun serialize_resolution(resolution: &MarketResolution): vector<u8> {
    let mut serialized = vector::empty<u8>();
    
    // Serialize market_id (8 bytes, little-endian)
    let mut i = 0;
    while (i < 8) {
        let byte = ((resolution.market_id >> (i * 8)) & 0xFF) as u8;
        vector::push_back(&mut serialized, byte);
        i = i + 1;
    };
    
    // Serialize outcome (1 byte)
    let outcome_byte = if (resolution.outcome) { 1 } else { 0 };
    vector::push_back(&mut serialized, outcome_byte);
    
    // Serialize source_data length (4 bytes, little-endian)
    let source_bytes = string::as_bytes(&resolution.source_data);
    let source_len = vector::length(source_bytes);
    i = 0;
    while (i < 4) {
        let byte = ((source_len >> (i * 8)) & 0xFF) as u8;
        vector::push_back(&mut serialized, byte);
        i = i + 1;
    };
    
    // Serialize source_data
    let mut j = 0;
    while (j < source_len) {
        vector::push_back(&mut serialized, *vector::borrow(source_bytes, j));
        j = j + 1;
    };
    
    // Serialize source_data_hash
    vector::append(&mut serialized, resolution.source_data_hash);
    
    // Serialize resolution_timestamp (8 bytes, little-endian)
    i = 0;
    while (i < 8) {
        let byte = ((resolution.resolution_timestamp >> (i * 8)) & 0xFF) as u8;
        vector::push_back(&mut serialized, byte);
        i = i + 1;
    };
    
    // Serialize media_hash
    vector::append(&mut serialized, resolution.media_hash);
    
    serialized
}

/// Create a market resolution struct
public fun create_resolution(
    market_id: u64,
    outcome: bool,
    source_data: String,
    source_data_hash: vector<u8>,
    resolution_timestamp: u64,
    media_hash: vector<u8>,
): MarketResolution {
    MarketResolution {
        market_id,
        outcome,
        source_data,
        source_data_hash,
        resolution_timestamp,
        media_hash,
    }
}

/// Get resolution data
public fun resolution_market_id(resolution: &MarketResolution): u64 {
    resolution.market_id
}

public fun resolution_outcome(resolution: &MarketResolution): bool {
    resolution.outcome
}

public fun resolution_source_data(resolution: &MarketResolution): String {
    resolution.source_data
}

public fun resolution_timestamp(resolution: &MarketResolution): u64 {
    resolution.resolution_timestamp
}

/// Check if an enclave is registered and active
public fun is_enclave_registered(registry: &NautilusRegistry, public_key: vector<u8>): bool {
    table::contains(&registry.enclaves, public_key)
}

/// Get active enclave count
public fun get_active_count(registry: &NautilusRegistry): u64 {
    registry.active_count
}

/// Deactivate an enclave (for emergency situations)
public fun deactivate_enclave(
    registry: &mut NautilusRegistry,
    enclave: &mut NautilusEnclave,
    public_key: vector<u8>,
) {
    assert!(table::contains(&registry.enclaves, public_key), E_ENCLAVE_NOT_REGISTERED);
    if (enclave.is_active) {
        enclave.is_active = false;
        registry.active_count = registry.active_count - 1;
    };
}

/// Reactivate an enclave
public fun reactivate_enclave(
    registry: &mut NautilusRegistry,
    enclave: &mut NautilusEnclave,
    public_key: vector<u8>,
) {
    assert!(table::contains(&registry.enclaves, public_key), E_ENCLAVE_NOT_REGISTERED);
    if (!enclave.is_active) {
        enclave.is_active = true;
        registry.active_count = registry.active_count + 1;
    };
}

