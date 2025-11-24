export interface TimeValueData {
  time: number;
  value: number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
  color?: string;
}

export interface MultiLineSeriesData {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color: string;
  visible?: boolean;
  lineWidth?: number;
  lineStyle?: "solid" | "dotted" | "dashed";
  lineType?: "simple" | "withSteps" | "curved";
}

export interface MultiLineChartData {
  probability?: {
    yes: TimeValueData[];
    no: TimeValueData[];
  };
  volume?: {
    yes: TimeValueData[];
    no: TimeValueData[];
    total: TimeValueData[];
  };
  odds?: {
    yes: TimeValueData[];
    no: TimeValueData[];
  };
  bets?: TimeValueData[];
}

export interface ChartMultiLineProps {
  data: MultiLineChartData;
  width?: number;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showCrosshair?: boolean;
  showTimeScale?: boolean;
  showPriceScale?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  theme?: "light" | "dark" | "auto";
  colors?: {
    probability?: {
      yes?: string;
      no?: string;
    };
    volume?: {
      yes?: string;
      no?: string;
      total?: string;
    };
    odds?: {
      yes?: string;
      no?: string;
    };
    bets?: string;
  };
  visibleSeries?: string[];
  onSeriesVisibilityChange?: (seriesId: string, visible: boolean) => void;
  onDataPointHover?: (
    seriesId: string,
    dataPoint: ChartDataPoint | null,
  ) => void;
  priceUsd?: number;
}

export interface ChartTheme {
  layout: {
    background: {
      color: string;
    };
    textColor: string;
  };
  grid: {
    vertLines: {
      color: string;
    };
    horzLines: {
      color: string;
    };
  };
  crosshair: {
    mode: number;
    vertLine: {
      color: string;
      labelBackgroundColor: string;
    };
    horzLine: {
      color: string;
      labelBackgroundColor: string;
    };
  };
  timeScale: {
    borderColor: string;
    timeVisible: boolean;
    secondsVisible: boolean;
  };
  watermark: {
    visible: boolean;
    fontSize: number;
    horzAlign: string;
    vertAlign: string;
    color: string;
  };
}
