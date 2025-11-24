"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { SwatchIcon } from "@heroicons/react/24/outline";

interface MarketChartProps {
  marketId: string;
}

interface ChartDataPoint {
  timestamp: number;
  probability: number;
  volume: number;
}

export function MarketChart({ marketId }: MarketChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("24h");

  const generateMockData = () => {
    const points: ChartDataPoint[] = [];
    const now = Date.now();
    const intervals = timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : 7;
    const interval =
      timeRange === "1h" ? 60000 : timeRange === "24h" ? 3600000 : 86400000;

    let currentProb = 50 + (Math.random() - 0.5) * 20;

    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - i * interval;

      currentProb += (Math.random() - 0.5) * 5;
      currentProb = Math.max(5, Math.min(95, currentProb));

      points.push({
        timestamp,
        probability: currentProb,
        volume: Math.random() * 1000 + 100,
      });
    }

    return points;
  };

  const loadChartData = async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData = generateMockData();

      setChartData(mockData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load chart data";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (marketId) {
      loadChartData();
    }
  }, [marketId, timeRange]);

  const handleRefresh = () => {
    loadChartData();
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const minProb = Math.min(...chartData.map((d) => d.probability));
    const maxProb = Math.max(...chartData.map((d) => d.probability));
    const probRange = maxProb - minProb || 1;

    const minTime = Math.min(...chartData.map((d) => d.timestamp));
    const maxTime = Math.max(...chartData.map((d) => d.timestamp));
    const timeRange = maxTime - minTime || 1;

    const pathData = chartData
      .map((point, index) => {
        const x =
          padding + ((point.timestamp - minTime) / timeRange) * chartWidth;
        const y =
          padding +
          chartHeight -
          ((point.probability - minProb) / probRange) * chartHeight;

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return (
      <div className="w-full overflow-x-auto">
        <svg
          className="border rounded-lg bg-gray-50"
          height={height}
          width={width}
        >
          {[0, 25, 50, 75, 100].map((prob) => {
            const y =
              padding +
              chartHeight -
              ((prob - minProb) / probRange) * chartHeight;

            return (
              <g key={prob}>
                <line
                  stroke="#e5e7eb"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#6b7280"
                  fontSize="12"
                  textAnchor="end"
                  x={padding - 5}
                  y={y + 4}
                >
                  {prob}%
                </text>
              </g>
            );
          })}

          <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" />

          {chartData.map((point, index) => {
            const x =
              padding + ((point.timestamp - minTime) / timeRange) * chartWidth;
            const y =
              padding +
              chartHeight -
              ((point.probability - minProb) / probRange) * chartHeight;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                fill="#10b981"
                r="3"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          <line
            stroke="#374151"
            strokeWidth="1"
            x1={padding}
            x2={padding}
            y1={padding}
            y2={height - padding}
          />
          <line
            stroke="#374151"
            strokeWidth="1"
            x1={padding}
            x2={width - padding}
            y1={height - padding}
            y2={height - padding}
          />

          <text
            fill="#6b7280"
            fontSize="12"
            textAnchor="middle"
            x={width / 2}
            y={height - 10}
          >
            Time
          </text>
          <text
            fill="#6b7280"
            fontSize="12"
            textAnchor="middle"
            transform={`rotate(-90 15 ${height / 2})`}
            x={15}
            y={height / 2}
          >
            Probability (%)
          </text>
        </svg>
      </div>
    );
  };

  return (
    <Card className="border-2 border-default-200">
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
            Market Probability
          </h2>
          <div className="flex items-center gap-2">
            <Select
              className="min-w-[100px]"
              size="sm"
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
            >
              <SelectItem key="1h">1H</SelectItem>
              <SelectItem key="24h">24H</SelectItem>
              <SelectItem key="7d">7D</SelectItem>
            </Select>
            <Button
              isLoading={loading}
              size="sm"
              startContent={<SwatchIcon className="w-4 h-4" />}
              variant="flat"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 mb-2">Error loading chart</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button size="sm" variant="flat" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No chart data available</p>
            <p className="text-sm text-gray-500 mt-1">
              Chart data will appear once there&#39;s betting activity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderChart()}

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Current</div>
                <div className="font-semibold text-lg">
                  {chartData[chartData.length - 1]?.probability.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">High</div>
                <div className="font-semibold text-lg text-green-600">
                  {Math.max(...chartData.map((d) => d.probability)).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Low</div>
                <div className="font-semibold text-lg text-red-600">
                  {Math.min(...chartData.map((d) => d.probability)).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
