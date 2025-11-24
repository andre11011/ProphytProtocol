import type {
  MultiLineChartData,
  MultiLineSeriesData,
  TimeValueData,
  ChartDataPoint,
  ChartTheme,
} from "./types";

import { LineStyle, LineType } from "lightweight-charts";

export const DEFAULT_COLORS = {
  probability: {
    yes: "#3b82f6",
    no: "#ef4444",
  },
  volume: {
    yes: "#3b82f6",
    no: "#ef4444",
    total: "#000000",
  },
  odds: {
    yes: "#3b82f6",
    no: "#ef4444",
  },
  bets: "#000000",
};

export function normalizeVolumeValue(value: number): number {
  return value;
}

export function transformTimeValueData(
  data: TimeValueData[],
  color?: string,
  shouldNormalize: boolean = false,
): ChartDataPoint[] {
  return data.map((point) => ({
    time: point.time,
    value: shouldNormalize ? normalizeVolumeValue(point.value) : point.value,
    ...(color && { color }),
  }));
}

export function getLineStyle(style?: string): LineStyle {
  switch (style) {
    case "dotted":
      return LineStyle.Dotted;
    case "dashed":
      return LineStyle.Dashed;
    default:
      return LineStyle.Solid;
  }
}

export function getLineType(type?: string): LineType {
  switch (type) {
    case "withSteps":
      return LineType.WithSteps;
    case "curved":
      return LineType.Curved;
    default:
      return LineType.Simple;
  }
}

export function transformChartData(
  data: MultiLineChartData,
  colors = DEFAULT_COLORS,
  visibleSeries: string[] = [],
  priceUsd?: number,
): MultiLineSeriesData[] {
  const series: MultiLineSeriesData[] = [];
  const convertToUsd = (value: number) =>
    priceUsd ? (value / 1e9) * priceUsd : value;
  const currencyLabel = priceUsd ? "$" : "Sui";

  if (data.volume) {
    if (data.volume.yes.length > 0) {
      series.push({
        id: "volume-yes",
        name: `Yes (${currencyLabel})`,
        data: data.volume.yes.map((point) => ({
          time: point.time,
          value: convertToUsd(point.value),
        })),
        color: colors.volume.yes,
        visible: visibleSeries.includes("volume-yes"),
        lineWidth: 2,
        lineStyle: "solid",
      });
    }

    if (data.volume.no.length > 0) {
      series.push({
        id: "volume-no",
        name: `No (${currencyLabel})`,
        data: data.volume.no.map((point) => ({
          time: point.time,
          value: convertToUsd(point.value),
        })),
        color: colors.volume.no,
        visible: visibleSeries.includes("volume-no"),
        lineWidth: 2,
        lineStyle: "solid",
      });
    }

    if (data.volume.total.length > 0) {
      series.push({
        id: "volume-total",
        name: `Total (${currencyLabel})`,
        data: data.volume.total.map((point) => ({
          time: point.time,
          value: convertToUsd(point.value),
        })),
        color: colors.volume.total,
        visible: visibleSeries.includes("volume-total"),
        lineWidth: 3,
        lineStyle: "solid",
      });
    }
  }

  return series;
}

export const lightChartTheme: ChartTheme = {
  layout: {
    background: {
      color: "#ffffff",
    },
    textColor: "#191919",
  },
  grid: {
    vertLines: {
      color: "#f0f3fa",
    },
    horzLines: {
      color: "#f0f3fa",
    },
  },
  crosshair: {
    mode: 1,
    vertLine: {
      color: "#9598a1",
      labelBackgroundColor: "#9598a1",
    },
    horzLine: {
      color: "#9598a1",
      labelBackgroundColor: "#9598a1",
    },
  },
  timeScale: {
    borderColor: "#d1d4dc",
    timeVisible: true,
    secondsVisible: false,
  },
  watermark: {
    visible: false,
    fontSize: 24,
    horzAlign: "center",
    vertAlign: "center",
    color: "rgba(171, 71, 188, 0.5)",
  },
};

export const darkChartTheme: ChartTheme = {
  layout: {
    background: {
      color: "#0f172a",
    },
    textColor: "#f1f5f9",
  },
  grid: {
    vertLines: {
      color: "#1e293b",
    },
    horzLines: {
      color: "#1e293b",
    },
  },
  crosshair: {
    mode: 1,
    vertLine: {
      color: "#64748b",
      labelBackgroundColor: "#334155",
    },
    horzLine: {
      color: "#64748b",
      labelBackgroundColor: "#334155",
    },
  },
  timeScale: {
    borderColor: "#334155",
    timeVisible: true,
    secondsVisible: false,
  },
  watermark: {
    visible: false,
    fontSize: 24,
    horzAlign: "center",
    vertAlign: "center",
    color: "rgba(100, 116, 139, 0.5)",
  },
};

export function getChartTheme(
  theme: "light" | "dark" | "auto" = "light",
): ChartTheme {
  if (theme === "light") return lightChartTheme;
  if (theme === "dark") return darkChartTheme;

  if (typeof window !== "undefined") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return isDark ? darkChartTheme : lightChartTheme;
  }

  return lightChartTheme;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatValue(
  value: number | string,
  precision: number = 4,
  isUsd: boolean = false,
): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return isUsd ? "$0.00" : "0.00";
  }

  if (numValue > 0 && numValue < 1e-10) {
    return isUsd ? "$0.00" : "0.00";
  }

  const prefix = isUsd ? "$" : "";

  if (numValue < 1) {
    return prefix + numValue.toFixed(precision);
  } else if (numValue < 1000) {
    return prefix + numValue.toFixed(2);
  } else if (numValue < 1000000) {
    return `${prefix}${(numValue / 1000).toFixed(1)}K`;
  } else {
    return `${prefix}${(numValue / 1000000).toFixed(1)}M`;
  }
}
