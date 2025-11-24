"use client";

import type { ChartMultiLineProps, MultiLineSeriesData } from "./types";

import {
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  LineStyle,
  LineType,
  MouseEventParams,
} from "lightweight-charts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/button";

import { DEFAULT_COLORS, formatValue, transformChartData } from "./utils";

const getChartTheme = (isDark: boolean = false) => ({
  layout: {
    background: { color: "transparent" },
    textColor: isDark ? "#a3a3a3" : "#525252",
  },
  grid: {
    vertLines: { visible: false },
    horzLines: { color: isDark ? "#262626" : "#e5e5e5" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: isDark ? "#525252" : "#a3a3a3",
      labelBackgroundColor: isDark ? "#171717" : "#f5f5f5",
    },
    horzLine: {
      color: isDark ? "#525252" : "#a3a3a3",
      labelBackgroundColor: isDark ? "#171717" : "#f5f5f5",
    },
  },
  timeScale: {
    borderColor: isDark ? "#262626" : "#e5e5e5",
    timeVisible: true,
    secondsVisible: false,
  },
});

export function ChartMultiLine({
  data,
  width,
  height = 400,
  className,
  showLegend = true,
  showCrosshair = true,
  showTimeScale = true,
  showPriceScale = true,
  enableZoom = true,
  enablePan = true,
  colors = DEFAULT_COLORS,
  visibleSeries = [],
  onSeriesVisibilityChange,
  onDataPointHover,
  priceUsd,
}: ChartMultiLineProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const [isChartReady, setIsChartReady] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const initialRangeRef = useRef<{ from: number; to: number } | null>(null);

  const effectiveVisibleSeries = useMemo(() => {
    if (visibleSeries.length > 0) {
      return visibleSeries;
    }

    if (data) {
      const defaultSeries = [];

      const hasOldVolumeFormat = "totalVolume" in data || "yesVolume" in data;
      const hasNewVolumeFormat =
        data.volume &&
        (data.volume.total?.length > 0 || data.volume.yes?.length > 0);

      if (hasOldVolumeFormat || hasNewVolumeFormat) {
        defaultSeries.push("volume-total");
      }

      const hasOldOddsFormat = "yesOdds" in data || "noOdds" in data;
      const hasNewOddsFormat =
        data.odds && (data.odds.yes?.length > 0 || data.odds.no?.length > 0);

      if (hasOldOddsFormat || hasNewOddsFormat) {
        defaultSeries.push("odds-yes", "odds-no");
      }

      const hasOldBetsFormat = "betCount" in data;
      const hasNewBetsFormat = data.bets && data.bets.length > 0;

      if (hasOldBetsFormat || hasNewBetsFormat) {
        defaultSeries.push("bets");
      }

      if (defaultSeries.length > 0) {
        return defaultSeries;
      }
    }

    return [];
  }, [visibleSeries, data]);

  const isDarkTheme = useMemo(() => {
    return false;
  }, []);

  const seriesData = useMemo(() => {
    if (!data) {
      return [];
    }

    let normalizedData;

    if ("yesProbability" in data || "noProbability" in data) {
      normalizedData = {
        probability: {
          yes: (data as any).yesProbability || [],
          no: (data as any).noProbability || [],
        },
        volume: {
          yes: (data as any).yesVolume || [],
          no: (data as any).noVolume || [],
          total: (data as any).totalVolume || [],
        },
        odds: {
          yes: (data as any).yesOdds || [],
          no: (data as any).noOdds || [],
        },
        bets: (data as any).betCount || [],
      };
    } else {
      normalizedData = data;
    }

    const mergedColors = {
      probability: {
        yes: colors.probability?.yes || DEFAULT_COLORS.probability.yes,
        no: colors.probability?.no || DEFAULT_COLORS.probability.no,
      },
      volume: {
        yes: colors.volume?.yes || DEFAULT_COLORS.volume.yes,
        no: colors.volume?.no || DEFAULT_COLORS.volume.no,
        total: colors.volume?.total || DEFAULT_COLORS.volume.total,
      },
      odds: {
        yes: colors.odds?.yes || DEFAULT_COLORS.odds.yes,
        no: colors.odds?.no || DEFAULT_COLORS.odds.no,
      },
      bets: colors.bets || DEFAULT_COLORS.bets,
    };

    const result = transformChartData(
      normalizedData,
      mergedColors,
      effectiveVisibleSeries,
      priceUsd,
    );

    return result;
  }, [data, colors, effectiveVisibleSeries, priceUsd]);

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) {
      return;
    }

    if (chartRef.current) {
      return;
    }

    const container = chartContainerRef.current;

    const containerWidth =
      width || container.clientWidth || container.offsetWidth || 800;
    const containerHeight = height;

    if (containerWidth === 0) {
      setTimeout(initializeChart, 100);

      return;
    }

    try {
      const chartTheme = getChartTheme(isDarkTheme);

      const chart = createChart(container, {
        width: containerWidth,
        height: containerHeight,
        layout: chartTheme.layout,
        grid: chartTheme.grid,
        crosshair: showCrosshair
          ? {
              mode: chartTheme.crosshair.mode,
              vertLine: {
                color: chartTheme.crosshair.vertLine.color,
                labelBackgroundColor:
                  chartTheme.crosshair.vertLine.labelBackgroundColor,
                width: 1,
                style: 0,
              },
              horzLine: {
                color: chartTheme.crosshair.horzLine.color,
                labelBackgroundColor:
                  chartTheme.crosshair.horzLine.labelBackgroundColor,
                width: 1,
                style: 0,
              },
            }
          : {
              mode: CrosshairMode.Hidden,
            },
        timeScale: {
          visible: showTimeScale,
          borderColor: chartTheme.timeScale.borderColor,
          timeVisible: chartTheme.timeScale.timeVisible,
          secondsVisible: chartTheme.timeScale.secondsVisible,
        },
        rightPriceScale: {
          visible: showPriceScale,
          borderColor: chartTheme.timeScale.borderColor,
        },
        handleScroll: enablePan,
        handleScale: enableZoom,
      });

      chartRef.current = chart;
      setIsChartReady(true);

      if (!tooltipRef.current) {
        const tooltip = document.createElement("div");

        tooltip.className =
          "absolute shadow-xl px-3 py-2.5 text-xs rounded-xl pointer-events-none hidden z-10 backdrop-blur-md border";
        tooltip.style.background = "rgba(255, 255, 255, 0.98)";
        tooltip.style.borderColor = "rgba(212, 212, 212, 0.8)";
        tooltip.style.color = "rgb(23, 23, 23)";
        tooltip.style.whiteSpace = "normal";
        tooltip.style.transition = "opacity 0.2s ease-in-out";
        chartContainerRef.current!.appendChild(tooltip);
        tooltipRef.current = tooltip;
      }

      chart.subscribeCrosshairMove((param: MouseEventParams) => {
        const tooltip = tooltipRef.current!;

        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.y < 0
        ) {
          tooltip.style.opacity = "0";
          setTimeout(() => {
            tooltip.style.display = "none";
          }, 150);
          onDataPointHover?.("", null);

          return;
        }

        const allSeriesData: Array<{
          name: string;
          value: number;
          color: string;
        }> = [];
        let hasData = false;

        for (const [series, data] of param.seriesData.entries()) {
          if (data && "value" in data) {
            const seriesEntry = Array.from(seriesRef.current.entries()).find(
              ([, seriesApi]) => seriesApi === series,
            );

            if (seriesEntry) {
              const seriesInfo = seriesData.find(
                (s) => s.id === seriesEntry[0],
              );

              if (seriesInfo) {
                allSeriesData.push({
                  name: seriesInfo.name,
                  value: (data as LineData).value,
                  color: seriesInfo.color,
                });
                hasData = true;
              }
            }
          }
        }

        if (hasData) {
          const timestamp = param.time as number;

          const date = new Date(timestamp * 1000);
          const width = window.innerWidth;

          let dateStr: string;
          let timeStr: string;

          if (width < 640) {
            dateStr = date.toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
            });
            timeStr =
              date.toLocaleTimeString(undefined, {
                timeZone: "UTC",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }) + " UTC";
          } else {
            dateStr = date
              .toLocaleDateString("en-GB", {
                timeZone: "UTC",
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
              .replace(",", "");
            timeStr = `${date.toLocaleTimeString(undefined, {
              timeZone: "UTC",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })} UTC`;
          }

          const sortedData = allSeriesData.sort((a, b) => b.value - a.value);

          const isUsd = !!priceUsd;
          const seriesHTML = sortedData
            .map(
              (item) => `
                <div class="flex items-center justify-between gap-4 py-1">
                  <div class="flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${item.color}"></div>
                    <span class="text-neutral-600 text-xs font-medium">${item.name}</span>
                  </div>
                  <span class="text-neutral-900 font-semibold text-xs font-mono">${formatValue(item.value, 4, isUsd)}</span>
                </div>
              `,
            )
            .join("");

          tooltip.innerHTML = `
            <div class="flex flex-col gap-2.5 min-w-44">
              <div class="text-[10px] text-neutral-500 border-b border-neutral-200 pb-2">
                <div class="font-medium">${dateStr}</div>
                <div class="opacity-75">${timeStr}</div>
              </div>
              <div class="space-y-0.5">
                ${seriesHTML}
              </div>
            </div>
          `;

          const chartWidth = chartContainerRef.current!.clientWidth;
          const chartHeight = chartContainerRef.current!.clientHeight;
          const tooltipWidth = width < 640 ? 180 : 220;
          const tooltipHeight = 80 + sortedData.length * 20;

          let left = param.point.x + 15;
          let top = param.point.y + 15;

          if (left + tooltipWidth > chartWidth) {
            left = param.point.x - tooltipWidth - 15;
          }
          if (top + tooltipHeight > chartHeight) {
            top = param.point.y - tooltipHeight - 15;
          }

          tooltip.style.left = left + "px";
          tooltip.style.top = top + "px";
          tooltip.style.display = "block";
          tooltip.style.opacity = "1";

          if (onDataPointHover && sortedData.length > 0) {
            onDataPointHover(sortedData[0].name, {
              time: param.time as number,
              value: sortedData[0].value,
            });
          }
        } else {
          tooltip.style.opacity = "0";
          setTimeout(() => {
            tooltip.style.display = "none";
          }, 150);
        }
      });

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          const newWidth =
            width || chartContainerRef.current.clientWidth || 800;

          chartRef.current.applyOptions({
            width: newWidth,
            height: containerHeight,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current.clear();
          setIsChartReady(false);
        }

        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
      };
    } catch {
      setIsChartReady(false);
    }
  }, [
    width,
    height,
    isDarkTheme,
    showCrosshair,
    showTimeScale,
    showPriceScale,
    enableZoom,
    enablePan,
    onDataPointHover,
    seriesData,
  ]);

  const updateChartData = useCallback(() => {
    if (!chartRef.current || !isChartReady) {
      return;
    }

    seriesRef.current.forEach((series) => {
      chartRef.current?.removeSeries(series);
    });
    seriesRef.current.clear();

    let seriesCount = 0;

    seriesData.forEach((series: MultiLineSeriesData) => {
      if (series.visible && series.data.length > 0) {
        const lineSeriesApi = chartRef.current!.addSeries(LineSeries, {
          color: series.color,
          lineWidth: (series.lineWidth as 1 | 2 | 3 | 4) || 2,
          lineStyle:
            series.lineStyle === "dashed"
              ? LineStyle.Dashed
              : series.lineStyle === "dotted"
                ? LineStyle.Dotted
                : LineStyle.Solid,
          lineType:
            series.lineType === "withSteps"
              ? LineType.WithSteps
              : series.lineType === "curved"
                ? LineType.Curved
                : LineType.Simple,
          title: series.name,
          visible: true,
          crosshairMarkerVisible: showCrosshair,
          crosshairMarkerRadius: 4,
          crosshairMarkerBorderColor: series.color,
          crosshairMarkerBackgroundColor: series.color,
          lastPriceAnimation: 0,
        });

        const chartData: LineData[] = series.data.map((point) => ({
          time: point.time as any,
          value: point.value,
        }));

        lineSeriesApi.setData(chartData);
        seriesRef.current.set(series.id, lineSeriesApi);
        seriesCount++;
      }
    });

    if (seriesCount > 0) {
      chartRef.current.timeScale().fitContent();

      setTimeout(() => {
        if (chartRef.current) {
          const timeScale = chartRef.current.timeScale();
          const visibleRange = timeScale.getVisibleRange();

          if (visibleRange && !initialRangeRef.current) {
            initialRangeRef.current = {
              from: visibleRange.from as number,
              to: visibleRange.to as number,
            };
          }
        }
      }, 100);

      if (chartRef.current) {
        const timeScale = chartRef.current.timeScale();

        timeScale.subscribeVisibleLogicalRangeChange(() => {
          if (!initialRangeRef.current) return;

          const currentRange = timeScale.getVisibleRange();

          if (!currentRange) return;

          let from = currentRange.from as number;
          let to = currentRange.to as number;
          const initialFrom = initialRangeRef.current.from;
          const initialTo = initialRangeRef.current.to;

          let needsAdjustment = false;

          if (from <= initialFrom && to >= initialTo) {
            from = initialFrom;
            to = initialTo;
            needsAdjustment = true;
          } else {
            if (from < initialFrom) {
              const diff = to - from;

              from = initialFrom;
              to = from + diff;
              needsAdjustment = true;
            }

            if (to > initialTo) {
              const diff = to - from;

              to = initialTo;
              from = to - diff;
              needsAdjustment = true;
            }
          }

          if (needsAdjustment) {
            timeScale.setVisibleRange({ from: from as any, to: to as any });
          }
        });
      }
    }
  }, [seriesData, isChartReady, showCrosshair]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const cleanup = initializeChart();

      return cleanup;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initializeChart]);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      initializeChart();
    }
  }, [chartContainerRef.current, initializeChart]);

  useEffect(() => {
    if (isChartReady) {
      updateChartData();
    }
  }, [updateChartData, isChartReady]);

  const toggleSeriesVisibility = useCallback(
    (seriesId: string) => {
      const isCurrentlyVisible = effectiveVisibleSeries.includes(seriesId);

      onSeriesVisibilityChange?.(seriesId, !isCurrentlyVisible);
    },
    [onSeriesVisibilityChange, effectiveVisibleSeries],
  );

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`relative ${className || ""}`}>
        <div
          className="w-full flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-neutral-500 text-sm font-medium">
            No chart data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative z-0 ${className || ""}`}>
      {showLegend && seriesData.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 mb-5">
          {seriesData.map((series) => (
            <Button
              key={series.id}
              color="primary"
              variant={series.visible ? "solid" : "bordered"}
              onClick={() => toggleSeriesVisibility(series.id)}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  series.visible ? "opacity-100" : "opacity-40"
                }`}
                style={{ backgroundColor: series.color }}
              />
              <span>{series.name}</span>
              {series.lineStyle === "dashed" && (
                <span className="text-[10px] opacity-60">- -</span>
              )}
              {series.lineStyle === "dotted" && (
                <span className="text-[10px] opacity-60">••</span>
              )}
            </Button>
          ))}
        </div>
      )}
      <div
        ref={chartContainerRef}
        className="w-full relative z-0"
        style={{ height, minHeight: height }}
      />

      {!isChartReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm text-neutral-600 flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Loading chart...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChartMultiLine;
