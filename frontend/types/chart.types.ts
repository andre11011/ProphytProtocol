export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface MarketChartData {
  probability: {
    yes: ChartDataPoint[];
    no: ChartDataPoint[];
  };
  volume: {
    yes: ChartDataPoint[];
    no: ChartDataPoint[];
    total: ChartDataPoint[];
  };
  odds?: {
    yes: ChartDataPoint[];
    no: ChartDataPoint[];
  };
  bets?: ChartDataPoint[];
}

export interface PlatformChartData {
  totalVolume: ChartDataPoint[];
  activeMarkets: ChartDataPoint[];
  totalUsers: ChartDataPoint[];
  totalBets: ChartDataPoint[];
}
