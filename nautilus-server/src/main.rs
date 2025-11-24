use anyhow::Result;
use axum::{
    extract::Json,
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{get, post},
    Router,
};
use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};
use hex;
use rand::rngs::OsRng;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

/// Market resolution request
#[derive(Debug, Deserialize)]
struct ResolutionRequest {
    market_id: u64,
    market_question: String,
    market_end_time: u64,
    /// Optional: external data source URL to verify against
    data_source_url: Option<String>,
    /// Optional: image URL for media provenance verification
    image_url: Option<String>,
}

/// Market resolution response with signature
#[derive(Debug, Serialize)]
struct ResolutionResponse {
    market_id: u64,
    outcome: bool,
    source_data: String,
    source_data_hash: String,
    resolution_timestamp: u64,
    media_hash: String,
    signature: String,
    public_key: String,
}

/// Server state containing the signing key and database connection
struct AppState {
    signing_key: SigningKey,
    verifying_key: VerifyingKey,
    db: PgPool,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Database connection string
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://koalaterbang:@localhost:5432/prophyt_indexer".to_string());
    
    println!("🔌 Connecting to database: {}", database_url.split('@').last().unwrap_or("***"));
    
    // Create database connection pool
    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;
    
    // Test database connection
    sqlx::query("SELECT 1").execute(&db).await?;
    println!("✅ Database connection established");

    // Initialize or load signing key from database
    let (signing_key, verifying_key) = initialize_or_load_signing_key(&db).await?;
    
    println!("🔑 Enclave signing key ready");
    println!("📝 Public key: {}", hex::encode(verifying_key.to_bytes()));

    // Initialize database schema if needed
    initialize_database_schema(&db).await?;

    let state = Arc::new(AppState {
        signing_key,
        verifying_key,
        db,
    });

    let app = Router::new()
        .route("/resolve", post(resolve_market))
        .route("/health", get(health_check))
        .route("/markets/pending", get(get_pending_markets))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    println!("🚀 Nautilus Truth Engine server running on port 8080");
    println!("📊 Database: Connected");
    println!("🔐 Ready to resolve markets with cryptographic proof");
    axum::serve(listener, app).await?;

    Ok(())
}

/// Initialize or load signing key from database
async fn initialize_or_load_signing_key(db: &PgPool) -> Result<(SigningKey, VerifyingKey)> {
    // Try to load existing key from database
    let result = sqlx::query_as::<_, (String,)>(
        "SELECT private_key FROM nautilus_keys WHERE id = 'enclave_signing_key' LIMIT 1"
    )
    .fetch_optional(db)
    .await?;

    if let Some((private_key_hex,)) = result {
        // Load existing key
        let private_key_bytes = hex::decode(private_key_hex)?;
        if private_key_bytes.len() == 32 {
            let key_array: [u8; 32] = private_key_bytes.try_into()
                .map_err(|_| anyhow::anyhow!("Invalid key length"))?;
            let signing_key = SigningKey::from_bytes(&key_array);
            let verifying_key = signing_key.verifying_key();
            println!("📂 Loaded existing signing key from database");
            return Ok((signing_key, verifying_key));
        }
    }

    // Generate new key
    println!("🆕 Generating new signing key");
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    
    // Store in database
    let private_key_hex = hex::encode(signing_key.to_bytes());
    let _public_key_hex = hex::encode(verifying_key.to_bytes());
    
    sqlx::query(
        "INSERT INTO nautilus_keys (id, private_key, public_key, created_at, updated_at)
         VALUES ('enclave_signing_key', $1, $2, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET private_key = $1, public_key = $2, updated_at = NOW()"
    )
    .bind(&private_key_hex)
    .bind(&_public_key_hex)
    .execute(db)
    .await?;
    
    println!("💾 Stored signing key in database");
    Ok((signing_key, verifying_key))
}

/// Initialize database schema for Nautilus
async fn initialize_database_schema(db: &PgPool) -> Result<()> {
    // Create nautilus_keys table for storing signing keys
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS nautilus_keys (
            id VARCHAR(255) PRIMARY KEY,
            private_key TEXT NOT NULL,
            public_key TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )"
    )
    .execute(db)
    .await?;

    // Create nautilus_resolutions table for storing resolution history
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS nautilus_resolutions (
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
        )"
    )
    .execute(db)
    .await?;

    // Create index for faster lookups
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_nautilus_resolutions_market_id 
         ON nautilus_resolutions(market_id)"
    )
    .execute(db)
    .await?;

    println!("✅ Database schema initialized");
    Ok(())
}

/// Health check endpoint
async fn health_check() -> StatusCode {
    StatusCode::OK
}

/// Get pending markets that need resolution
async fn get_pending_markets(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
) -> Result<ResponseJson<serde_json::Value>, StatusCode> {
    let markets = sqlx::query_as::<_, (String, String, chrono::DateTime<chrono::Utc>, Option<String>)>(
        "SELECT \"marketId\", question, \"endDate\", \"externalLink\"
         FROM \"Market\"
         WHERE status = 'active' 
           AND \"isResolved\" = false
           AND \"endDate\" <= NOW()
         ORDER BY \"endDate\" ASC
         LIMIT 10"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result: Vec<serde_json::Value> = markets
        .into_iter()
        .map(|(market_id, question, end_date, external_link)| {
            serde_json::json!({
                "market_id": market_id,
                "question": question,
                "end_date": end_date.to_rfc3339(),
                "external_link": external_link
            })
        })
        .collect();

    Ok(ResponseJson(serde_json::json!({ "markets": result })))
}

/// Resolve a market by verifying external data sources
async fn resolve_market(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Json(request): Json<ResolutionRequest>,
) -> Result<ResponseJson<ResolutionResponse>, StatusCode> {
    println!("📊 Resolving market {}: {}", request.market_id, request.market_question);

    // Check if market has ended
    let current_timestamp = chrono::Utc::now().timestamp() as u64;
    if current_timestamp < request.market_end_time {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Verify outcome from external data source
    let (outcome, source_data) = if let Some(data_source_url) = &request.data_source_url {
        verify_from_external_source(data_source_url, &request.market_question)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        // If no external source, use a default verification method
        // In production, this would query multiple oracles
        (false, "No external data source provided".to_string())
    };

    // Compute source data hash
    let source_data_hash = compute_hash(&source_data);

    // Verify media provenance if image URL provided
    let media_hash_hex = if let Some(image_url) = &request.image_url {
        verify_media_provenance(image_url)
            .await
            .unwrap_or_else(|_| "0".repeat(64))
    } else {
        "0".repeat(64)
    };
    
    // Convert hex string to bytes for serialization (Move contract expects vector<u8>)
    let media_hash_bytes = hex::decode(&media_hash_hex)
        .unwrap_or_else(|_| vec![0u8; 32]); // Default to 32 zero bytes if decode fails

    // Create resolution data
    let resolution_data = serialize_resolution(
        request.market_id,
        outcome,
        &source_data,
        &source_data_hash,
        current_timestamp,
        &media_hash_bytes,
    );

    // Sign the resolution
    let signature: Signature = state.signing_key.sign(&resolution_data);
    let signature_bytes = signature.to_bytes();
    let signature_hex = hex::encode(signature_bytes);

    // Get public key
    let public_key_bytes = state.verifying_key.to_bytes();
    let public_key_hex = hex::encode(public_key_bytes);

    println!("✅ Market {} resolved: outcome={}, signed", request.market_id, outcome);

    // Store resolution in database for audit trail
    let _ = sqlx::query(
        "INSERT INTO nautilus_resolutions 
         (market_id, outcome, source_data, source_data_hash, resolution_timestamp, media_hash, signature, public_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (market_id, resolution_timestamp) DO NOTHING"
    )
    .bind(request.market_id.to_string())
    .bind(outcome)
    .bind(&source_data)
    .bind(hex::encode(&source_data_hash))
    .bind(current_timestamp as i64)
    .bind(&media_hash_hex) // Store hex string in database for readability
    .bind(&signature_hex)
    .bind(&public_key_hex)
    .execute(&state.db)
    .await;

    Ok(ResponseJson(ResolutionResponse {
        market_id: request.market_id,
        outcome,
        source_data,
        source_data_hash: hex::encode(source_data_hash),
        resolution_timestamp: current_timestamp,
        media_hash: media_hash_hex, // Return hex string in response for readability
        signature: signature_hex,
        public_key: public_key_hex,
    }))
}

/// Verify market outcome from external data source
/// This function intelligently parses various API response formats to determine outcomes
async fn verify_from_external_source(
    url: &str,
    question: &str,
) -> Result<(bool, String)> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()?;
    
    let response = client.get(url).send().await?;
    
    if !response.status().is_success() {
        return Err(anyhow::anyhow!(
            "API returned error status: {}",
            response.status()
        ));
    }

    let data = response.text().await?;
    let data_lower = data.to_lowercase();

    // Try to parse as JSON first
    if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&data) {
        return parse_json_response(&json_value, question, &data);
    }

    // Handle text-based responses
    let outcome = determine_outcome_from_text(&data_lower, question);
    
    Ok((outcome, data))
}

/// Parse JSON API response to determine outcome
fn parse_json_response(
    json: &serde_json::Value,
    question: &str,
    raw_data: &str,
) -> Result<(bool, String)> {
    // Common patterns for different API types
    
    // Pattern 1: Boolean outcome field
    if let Some(outcome) = json.get("outcome")
        .or(json.get("result"))
        .or(json.get("resolved"))
        .or(json.get("answer"))
    {
        if let Some(bool_val) = outcome.as_bool() {
            return Ok((bool_val, raw_data.to_string()));
        }
        if let Some(str_val) = outcome.as_str() {
            let outcome_bool = str_val.to_lowercase() == "true" 
                || str_val.to_lowercase() == "yes"
                || str_val.to_lowercase() == "1";
            return Ok((outcome_bool, raw_data.to_string()));
        }
    }

    // Pattern 2: Price/Value comparison (for price prediction markets)
    if question.to_lowercase().contains("price") 
        || question.to_lowercase().contains("$")
        || question.to_lowercase().contains("reach")
    {
        // Look for price fields
        if let Some(price) = json.get("price")
            .or(json.get("current_price"))
            .or(json.get("value"))
            .or(json.get("usd"))
        {
            if let Some(price_num) = price.as_f64().or(price.as_u64().map(|v| v as f64)) {
                // Extract target from question (e.g., "Will BTC reach $100k?")
                if let Some(target) = extract_price_target(question) {
                    let outcome = price_num >= target;
                    return Ok((outcome, format!("Price: ${:.2}, Target: ${:.2}", price_num, target)));
                }
            }
        }
    }

    // Pattern 3: Status/State fields
    if let Some(status) = json.get("status")
        .or(json.get("state"))
        .or(json.get("condition"))
    {
        if let Some(status_str) = status.as_str() {
            let status_lower = status_str.to_lowercase();
            let outcome = status_lower.contains("active")
                || status_lower.contains("true")
                || status_lower.contains("yes")
                || status_lower.contains("completed")
                || status_lower.contains("success");
            return Ok((outcome, raw_data.to_string()));
        }
    }

    // Pattern 4: Numeric comparison (for threshold-based markets)
    if let Some(value) = json.get("value")
        .or(json.get("count"))
        .or(json.get("total"))
    {
        if let Some(num_val) = value.as_f64().or(value.as_u64().map(|v| v as f64)) {
            // Extract threshold from question
            if let Some(threshold) = extract_numeric_threshold(question) {
                let outcome = num_val >= threshold;
                return Ok((outcome, format!("Value: {:.2}, Threshold: {:.2}", num_val, threshold)));
            }
        }
    }

    // Fallback: check for common positive indicators in JSON
    let json_str = json.to_string().to_lowercase();
    let outcome = json_str.contains("true")
        || json_str.contains("\"yes\"")
        || json_str.contains("\"success\"")
        || json_str.contains("\"active\"");

    Ok((outcome, raw_data.to_string()))
}

/// Extract price target from question (e.g., "$100k" -> 100000.0)
fn extract_price_target(question: &str) -> Option<f64> {
    // Pattern: $100k, $100,000, $100K, etc.
    let re = Regex::new(r#"\$?([\d,]+)\s*([kmKM])?"#).ok()?;
    if let Some(caps) = re.captures(question) {
        let num_str = caps.get(1)?.as_str().replace(",", "");
        if let Ok(mut num) = num_str.parse::<f64>() {
            if let Some(multiplier) = caps.get(2) {
                match multiplier.as_str().to_uppercase().as_str() {
                    "K" => num *= 1000.0,
                    "M" => num *= 1000000.0,
                    _ => {}
                }
            }
            return Some(num);
        }
    }
    None
}

/// Extract numeric threshold from question
fn extract_numeric_threshold(question: &str) -> Option<f64> {
    // Pattern: "more than 100", "at least 50", "over 1000", etc.
    let re = Regex::new(r#"(?:more than|at least|over|above|greater than)\s+([\d,]+)"#).ok()?;
    if let Some(caps) = re.captures(question) {
        let num_str = caps.get(1)?.as_str().replace(",", "");
        return num_str.parse::<f64>().ok();
    }
    None
}

/// Determine outcome from plain text response
fn determine_outcome_from_text(text: &str, question: &str) -> bool {
    // Check for explicit yes/no indicators
    let positive_indicators = [
        "yes", "true", "1", "success", "active", "completed",
        "passed", "won", "achieved", "reached", "exceeded"
    ];
    
    let negative_indicators = [
        "no", "false", "0", "failed", "inactive", "cancelled",
        "rejected", "lost", "below", "under", "did not"
    ];

    let text_lower = text.to_lowercase();
    
    // Count positive vs negative indicators
    let positive_count = positive_indicators.iter()
        .filter(|indicator| text_lower.contains(*indicator))
        .count();
    
    let negative_count = negative_indicators.iter()
        .filter(|indicator| text_lower.contains(*indicator))
        .count();

    // If we have clear indicators, use them
    if positive_count > negative_count {
        return true;
    }
    if negative_count > positive_count {
        return false;
    }

    // For price-related questions, try to extract and compare
    if question.to_lowercase().contains("price") || question.to_lowercase().contains("$") {
        // Look for price patterns in text
        if let Ok(re) = Regex::new(r#"\$?([\d,]+\.?\d*)"#) {
            if let Some(caps) = re.captures(text) {
                if let Some(num_str) = caps.get(1) {
                    let price_str = num_str.as_str().replace(",", "");
                    if let Ok(price) = price_str.parse::<f64>() {
                        if let Some(target) = extract_price_target(question) {
                            return price >= target;
                        }
                    }
                }
            }
        }
    }

    // Default: check if text suggests positive outcome
    positive_count > 0 || text_lower.contains("yes") || text_lower.contains("true")
}

/// Verify media provenance by computing hash of image
async fn verify_media_provenance(image_url: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let response = client.get(image_url).send().await?;
    let image_data = response.bytes().await?;

    // Compute SHA256 hash of the image
    let mut hasher = Sha256::new();
    hasher.update(&image_data);
    let hash = hasher.finalize();

    Ok(hex::encode(hash))
}

/// Compute SHA256 hash
fn compute_hash(data: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    hasher.finalize().to_vec()
}

/// Serialize resolution data for signing
/// Format matches the Move contract serialization
/// IMPORTANT: This must match exactly with the Move contract's serialize_resolution function
fn serialize_resolution(
    market_id: u64,
    outcome: bool,
    source_data: &str,
    source_data_hash: &[u8],
    timestamp: u64,
    media_hash: &[u8], // Changed from &str to &[u8] to match Move contract's vector<u8>
) -> Vec<u8> {
    let mut serialized = Vec::new();

    // Serialize market_id (8 bytes, little-endian)
    serialized.extend_from_slice(&market_id.to_le_bytes());

    // Serialize outcome (1 byte)
    serialized.push(if outcome { 1 } else { 0 });

    // Serialize source_data length (4 bytes, little-endian)
    let source_bytes = source_data.as_bytes();
    let source_len = source_bytes.len() as u32;
    serialized.extend_from_slice(&source_len.to_le_bytes());

    // Serialize source_data
    serialized.extend_from_slice(source_bytes);

    // Serialize source_data_hash (raw bytes)
    serialized.extend_from_slice(source_data_hash);

    // Serialize timestamp (8 bytes, little-endian)
    serialized.extend_from_slice(&timestamp.to_le_bytes());

    // Serialize media_hash (raw bytes, not hex string)
    // Move contract expects vector<u8>, so we pass the raw hash bytes
    serialized.extend_from_slice(media_hash);

    serialized
}

