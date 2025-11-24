import {
  createCanvas,
  loadImage,
  CanvasRenderingContext2D,
  registerFont,
} from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  registerFont(
    path.join(__dirname, '../fonts/StackSansNotch-VariableFont_wght.ttf'),
    {
      family: 'StackSans',
    }
  );
} catch (error) {
  console.warn('Could not load custom font, falling back to Arial:', error);
}

export interface BetPortfolioData {
  marketQuestion: string;
  position: boolean;
  betAmount: string;
  transactionFee: string;
  netAmount: string;
  timestamp: number;
  userAddress?: string;
}

export interface WinningPortfolioData {
  marketQuestion: string;
  position: boolean;
  originalBetAmount: string;
  winningAmount: string;
  yieldEarned: string;
  profitPercentage: number;
  resolutionTimestamp: number;
}

const CANVAS_SIZE = 1080;
const WALRUS_SIZE = 300;

const COLORS = {
  dark: '#1A1A1A',
  darkGray: '#2A2A2A',
  mediumGray: '#3A3A3A',
  lightGray: '#888888',
  white: '#FFFFFF',
  primary: '#6366F1',
  success: '#00FF88',
  danger: '#FF3366',
  orange: '#FF9500',
  yellow: '#FFD700',
};

function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num);
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function formatTimestamp(seconds: number): string {
  const timestamp =
    typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(timestamp) || timestamp <= 0) {
    console.log('timestamp invalid, returning N/A');
    return 'N/A';
  }
  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return formatted;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function drawWalrusCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  try {
    const walrusPath = path.join(__dirname, '../character/walrus.png');
    const walrusImage = await loadImage(walrusPath);

    const aspectRatio = walrusImage.width / walrusImage.height;
    const walrusHeight = size;
    const walrusWidth = walrusHeight * aspectRatio;

    ctx.save();
    ctx.drawImage(walrusImage, x, y, walrusWidth, walrusHeight);
    ctx.restore();
  } catch (error) {
    console.warn('Could not load walrus character:', error);
  }
}

async function drawBackground(ctx: CanvasRenderingContext2D) {
  try {
    const bgPath = path.join(__dirname, '../background/bg.jpg');
    const bgImage = await loadImage(bgPath);

    ctx.drawImage(bgImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } catch (error) {
    console.warn('Could not load background image, using fallback:', error);

    const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    gradient.addColorStop(0, '#6366F1');
    gradient.addColorStop(1, '#A855F7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

function drawTextWithBackdrop(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font: string;
    color: string;
    align?: CanvasTextAlign;
    backdropColor?: string;
    backdropPadding?: number;
    backdropRadius?: number;
  }
) {
  const {
    font,
    color,
    align = 'left',
    backdropColor = 'rgba(0, 0, 0, 0.7)',
    backdropPadding = 20,
    backdropRadius = 10,
  } = options;

  ctx.font = font;
  ctx.textAlign = align;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  let backdropX = x - backdropPadding;
  if (align === 'center') {
    backdropX = x - textWidth / 2 - backdropPadding;
  } else if (align === 'right') {
    backdropX = x - textWidth - backdropPadding;
  }

  ctx.fillStyle = backdropColor;
  ctx.beginPath();
  ctx.roundRect(
    backdropX,
    y - textHeight - backdropPadding,
    textWidth + backdropPadding * 2,
    textHeight + backdropPadding * 2,
    backdropRadius
  );
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export async function generateBetPortfolioImage(
  data: BetPortfolioData
): Promise<Buffer> {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  await drawBackground(ctx);

  drawTextWithBackdrop(ctx, 'PROPHYT', CANVAS_SIZE / 2, 100, {
    font: 'bold 48px StackSans, Arial',
    color: COLORS.white,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.8)',
    backdropPadding: 25,
    backdropRadius: 15,
  });

  const positionColor = data.position ? COLORS.success : COLORS.danger;
  const positionText = data.position ? 'YES' : 'NO';
  const amountText = `${formatNumber(data.betAmount)} SUI`;

  drawTextWithBackdrop(ctx, positionText, CANVAS_SIZE / 2, 300, {
    font: 'bold 140px StackSans, Arial',
    color: positionColor,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.85)',
    backdropPadding: 30,
    backdropRadius: 20,
  });

  drawTextWithBackdrop(ctx, amountText, CANVAS_SIZE / 2, 420, {
    font: 'bold 48px StackSans, Arial',
    color: COLORS.orange,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.8)',
    backdropPadding: 25,
    backdropRadius: 15,
  });

  const timeString = formatTimestamp(data.timestamp);
  drawTextWithBackdrop(ctx, `${timeString}`, CANVAS_SIZE / 2, 520, {
    font: '28px StackSans, Arial',
    color: COLORS.white,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.7)',
    backdropPadding: 20,
    backdropRadius: 12,
  });

  ctx.font = '24px StackSans, Arial';
  ctx.textAlign = 'center';
  const maxQuestionWidth = CANVAS_SIZE - 200;
  const questionLines = wrapText(ctx, data.marketQuestion, maxQuestionWidth);

  const questionStartY = 650;
  const lineHeight = 36;

  const totalQuestionHeight = Math.min(questionLines.length, 3) * lineHeight;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(
    100,
    questionStartY - 30,
    CANVAS_SIZE - 200,
    totalQuestionHeight + 40,
    15
  );
  ctx.fill();

  ctx.fillStyle = COLORS.white;
  let qY = questionStartY;
  for (const line of questionLines.slice(0, 3)) {
    ctx.fillText(line, CANVAS_SIZE / 2, qY);
    qY += lineHeight;
  }

  await drawWalrusCharacter(
    ctx,
    40,
    CANVAS_SIZE - WALRUS_SIZE - 40,
    WALRUS_SIZE
  );

  drawTextWithBackdrop(ctx, 'prophyt.fun', CANVAS_SIZE - 80, CANVAS_SIZE - 50, {
    font: 'bold 32px StackSans, Arial',
    color: COLORS.white,
    align: 'right',
    backdropColor: 'rgba(0, 0, 0, 0.8)',
    backdropPadding: 20,
    backdropRadius: 12,
  });

  return canvas.toBuffer('image/png');
}

export async function generateWinningPortfolioImage(
  data: WinningPortfolioData
): Promise<Buffer> {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  await drawBackground(ctx);

  drawTextWithBackdrop(ctx, 'PROPHYT 🏆', CANVAS_SIZE / 2, 100, {
    font: 'bold 48px StackSans, Arial',
    color: COLORS.white,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.8)',
    backdropPadding: 25,
    backdropRadius: 15,
  });

  drawTextWithBackdrop(
    ctx,
    `+${data.profitPercentage.toFixed(2)}%`,
    CANVAS_SIZE / 2,
    280,
    {
      font: 'bold 150px StackSans, Arial',
      color: COLORS.success,
      align: 'center',
      backdropColor: 'rgba(0, 0, 0, 0.85)',
      backdropPadding: 30,
      backdropRadius: 20,
    }
  );

  const amountText = `${formatNumber(data.winningAmount)} SUI`;
  drawTextWithBackdrop(ctx, amountText, CANVAS_SIZE / 2, 410, {
    font: 'bold 48px StackSans, Arial',
    color: COLORS.yellow,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.8)',
    backdropPadding: 25,
    backdropRadius: 15,
  });

  const positionText = data.position ? 'YES' : 'NO';
  drawTextWithBackdrop(ctx, positionText, CANVAS_SIZE / 2, 500, {
    font: 'bold 32px StackSans, Arial',
    color: COLORS.white,
    align: 'center',
    backdropColor: 'rgba(0, 0, 0, 0.7)',
    backdropPadding: 20,
    backdropRadius: 12,
  });

  const elapsed = Math.max(
    0,
    Math.floor(Date.now() / 1000) - data.resolutionTimestamp
  );
  drawTextWithBackdrop(
    ctx,
    `⏱ ${formatDuration(elapsed)}`,
    CANVAS_SIZE / 2,
    570,
    {
      font: '28px StackSans, Arial',
      color: COLORS.white,
      align: 'center',
      backdropColor: 'rgba(0, 0, 0, 0.7)',
      backdropPadding: 20,
      backdropRadius: 12,
    }
  );

  ctx.font = '24px StackSans, Arial';
  ctx.textAlign = 'center';
  const maxQuestionWidth = CANVAS_SIZE - 200;
  const questionLines = wrapText(ctx, data.marketQuestion, maxQuestionWidth);

  const questionStartY = 680;
  const lineHeight = 36;

  const totalQuestionHeight = Math.min(questionLines.length, 3) * lineHeight;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(
    100,
    questionStartY - 30,
    CANVAS_SIZE - 200,
    totalQuestionHeight + 40,
    15
  );
  ctx.fill();

  ctx.fillStyle = COLORS.white;
  let qY = questionStartY;
  for (const line of questionLines.slice(0, 3)) {
    ctx.fillText(line, CANVAS_SIZE / 2, qY);
    qY += lineHeight;
  }

  await drawWalrusCharacter(
    ctx,
    40,
    CANVAS_SIZE - WALRUS_SIZE - 40,
    WALRUS_SIZE
  );

  drawTextWithBackdrop(ctx, 'prophyt.fun', CANVAS_SIZE - 80, CANVAS_SIZE - 50, {
    font: 'bold 32px StackSans, Arial',
    color: COLORS.white,
    align: 'right',
    backdropColor: 'rgba(0, 0, 0, 0.8)',
    backdropPadding: 20,
    backdropRadius: 12,
  });

  return canvas.toBuffer('image/png');
}

export async function testGenerateImages() {
  const betData: BetPortfolioData = {
    marketQuestion: 'Will Bitcoin reach $100,000 by end of 2024?',
    position: true,
    betAmount: '1000',
    transactionFee: '10',
    netAmount: '990',
    timestamp: Math.floor(Date.now() / 1000) - 144,
  };

  const winningData: WinningPortfolioData = {
    marketQuestion: 'Will Bitcoin reach $100,000 by end of 2024?',
    position: true,
    originalBetAmount: '1000',
    winningAmount: '5331.60',
    yieldEarned: '4331.60',
    profitPercentage: 433.16,
    resolutionTimestamp: Math.floor(Date.now() / 1000) - 144,
  };

  try {
    const betImage = await generateBetPortfolioImage(betData);
    const winningImage = await generateWinningPortfolioImage(winningData);

    console.log('✅ Bet portfolio image generated:', betImage.length, 'bytes');
    console.log(
      '✅ Winning portfolio image generated:',
      winningImage.length,
      'bytes'
    );

    return { betImage, winningImage };
  } catch (error) {
    console.error('❌ Error generating images:', error);
    throw error;
  }
}
