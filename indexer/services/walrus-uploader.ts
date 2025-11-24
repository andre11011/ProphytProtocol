import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fileTypeFromBuffer } from 'file-type';

dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WALRUS_CLI = process.env.WALRUS_CLI_PATH || 'walrus';
const WALRUS_CONFIG =
  process.env.WALRUS_CONFIG_PATH || '~/.config/walrus/client_config.yaml';
const WALRUS_EPOCHS = process.env.WALRUS_EPOCHS || '5';

export interface WalrusUploadResult {
  blobId: string;
  imageUrl: string;
  blobAddress: string;
}

/**
 * Upload a buffer to Walrus storage
 */
export async function uploadToWalrus(
  imageBuffer: Buffer,
  filename: string = 'portfolio-image.png'
): Promise<WalrusUploadResult> {
  const tempDir = path.join(__dirname, '../temp');
  await fs.mkdir(tempDir, { recursive: true });

  const tempFilePath = path.join(tempDir, filename);
  await fs.writeFile(tempFilePath, imageBuffer);

  try {
    const command = `${WALRUS_CLI} store --config ${WALRUS_CONFIG} --epochs ${WALRUS_EPOCHS} ${tempFilePath}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Walrus upload stderr:', stderr);
    }

    const blobIdMatch = stdout.match(/Blob ID:\s*([A-Za-z0-9\-_]+)/);
    const certifiedBlobMatch = stdout.match(
      /certified blob id:\s*([A-Za-z0-9\-_]+)/i
    );

    const blobId = blobIdMatch?.[1] || certifiedBlobMatch?.[1];

    if (!blobId) {
      throw new Error(
        `Could not extract blob ID from Walrus output: ${stdout}`
      );
    }

    const imageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;

    const blobAddress = blobId;

    return {
      blobId,
      imageUrl,
      blobAddress,
    };
  } finally {
    await fs.unlink(tempFilePath);
  }
}

/**
 * Alternative: Upload directly via HTTP API (if available)
 */
export async function uploadToWalrusHttp(
  imageBuffer: Buffer
): Promise<WalrusUploadResult> {
  const WALRUS_PUBLISHER =
    process.env.WALRUS_PUBLISHER_URL ||
    'https://publisher.walrus-testnet.walrus.space';
  const epochs = process.env.WALRUS_EPOCHS || '5';

  try {
    const response = await fetch(
      `${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`,
      {
        method: 'PUT',
        body: new Uint8Array(imageBuffer),
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Walrus HTTP upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    const blobId =
      result.newlyCreated?.blobObject?.blobId ||
      result.alreadyCertified?.blobId ||
      result.blobId;

    if (!blobId) {
      throw new Error('Could not extract blob ID from Walrus response');
    }

    const imageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;

    const blobAddress =
      result.newlyCreated?.blobObject?.id ||
      result.alreadyCertified?.blobObject?.id ||
      blobId;

    return {
      blobId,
      imageUrl,
      blobAddress,
    };
  } catch (error) {
    console.error('Walrus HTTP upload error:', error);
    throw error;
  }
}

/**
 * Smart upload - tries HTTP first, falls back to CLI
 * ✅ VALIDATES that buffer is actually an image before uploading
 */
export async function uploadPortfolioImage(
  imageBuffer: Buffer,
  filename: string = 'portfolio.png'
): Promise<WalrusUploadResult> {
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new Error('uploadPortfolioImage: Input is not a Buffer');
  }

  if (imageBuffer.length === 0) {
    throw new Error('uploadPortfolioImage: Buffer is empty');
  }

  const fileType = await fileTypeFromBuffer(imageBuffer);

  if (!fileType) {
    throw new Error(
      `uploadPortfolioImage: Cannot detect file type. Buffer size: ${imageBuffer.length} bytes. ` +
        `First bytes: ${imageBuffer.slice(0, 16).toString('hex')}`
    );
  }

  if (!fileType.mime.startsWith('image/')) {
    throw new Error(
      `uploadPortfolioImage: Buffer is not an image. Detected MIME type: ${fileType.mime}. ` +
        `This prevents JSON/text from being uploaded as PNG.`
    );
  }

  console.log(
    `✅ Validated image buffer: ${fileType.mime}, ${imageBuffer.length} bytes`
  );

  try {
    return await uploadToWalrusHttp(imageBuffer);
  } catch (httpError) {
    console.warn('HTTP upload failed, trying CLI:', httpError);

    try {
      return await uploadToWalrus(imageBuffer, filename);
    } catch (cliError) {
      console.error('CLI upload also failed:', cliError);
      throw new Error('Both Walrus upload methods failed');
    }
  }
}

/**
 * Generate mock Walrus data for testing (when Walrus is not available)
 */
export function generateMockWalrusData(
  prefix: string = 'mock'
): WalrusUploadResult {
  const mockBlobId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return {
    blobId: mockBlobId,
    imageUrl: `https://via.placeholder.com/1200x630.png?text=${encodeURIComponent('Portfolio Image')}`,
    blobAddress: `0x${mockBlobId.substring(0, 40).padEnd(40, '0')}`,
  };
}
