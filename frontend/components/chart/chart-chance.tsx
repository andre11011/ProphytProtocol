"use client";

export default function ChartChance({
  probabilityValue,
  size,
}: {
  probabilityValue?: number;
  size?: "sm" | "md";
}) {
  const yesPercentage =
    probabilityValue !== undefined
      ? Math.round(probabilityValue * 100) / 100
      : 60;

  const sizeChart = size === "sm" ? 24 : 32;
  const strokeWidth = size === "sm" ? 3 : 4;
  const radius = (sizeChart - strokeWidth) / 2;

  const gapDegrees = 12;

  return (
    <div className="flex flex-col items-center justify-center w-auto h-full">
      <svg
        height={sizeChart}
        viewBox={`0 0 ${sizeChart} ${sizeChart / 2 + strokeWidth}`}
        width="100%"
      >
        <path
          d={`M ${strokeWidth / 2} ${sizeChart / 2} A ${radius} ${radius} 0 0 1 ${sizeChart - strokeWidth / 2} ${sizeChart / 2}`}
          fill="none"
          stroke=""
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />

        <path
          d={`M ${strokeWidth / 2} ${sizeChart / 2} A ${radius} ${radius} 0 0 1 ${sizeChart / 2 + radius * Math.cos(Math.PI * (1 - (yesPercentage - gapDegrees / 2) / 100))} ${sizeChart / 2 - radius * Math.sin(Math.PI * (1 - (yesPercentage - gapDegrees / 2) / 100))}`}
          fill="none"
          stroke="#22c55e"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />

        <path
          d={`M ${sizeChart / 2 + radius * Math.cos(Math.PI * (1 - (yesPercentage + gapDegrees / 2) / 100))} ${sizeChart / 2 - radius * Math.sin(Math.PI * (1 - (yesPercentage + gapDegrees / 2) / 100))} A ${radius} ${radius} 0 0 1 ${sizeChart - strokeWidth / 2} ${sizeChart / 2}`}
          fill="none"
          stroke="#ef4444"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />

        <text
          className={`fill-foreground font-medium ${size === "sm" ? "text-[5px]" : "text-[6px]"}`}
          textAnchor="middle"
          x={sizeChart / 2}
          y={sizeChart / 2}
        >
          {yesPercentage}%
        </text>
      </svg>
    </div>
  );
}
