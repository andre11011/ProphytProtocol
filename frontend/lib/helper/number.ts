export interface FormatNumberOptions {
  decimals?: number;
  thousandSeparator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
  minDecimals?: number;
  maxDecimals?: number;
  compact?: boolean;
}

export function formatNumber(
  value: number | string,
  options: FormatNumberOptions = {},
): string {
  const {
    decimals,
    thousandSeparator = ",",
    decimalSeparator = ".",
    prefix = "",
    suffix = "",
    minDecimals,
    maxDecimals,
    compact = false,
  } = options;

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0";

  if (compact) {
    let newValue = num;
    let suffixCompact = "";

    if (Math.abs(num) >= 1_000_000_000) {
      newValue = num / 1_000_000_000;
      suffixCompact = "B";
    } else if (Math.abs(num) >= 1_000_000) {
      newValue = num / 1_000_000;
      suffixCompact = "M";
    } else if (Math.abs(num) >= 1_000) {
      newValue = num / 1_000;
      suffixCompact = "K";
    }

    const decimalPlaces = decimals ?? 2;

    return (
      prefix +
      newValue
        .toFixed(decimalPlaces)
        .replace(/\.0+$/, "")
        .replace(/(\.\d*[1-9])0+$/, "$1") +
      suffixCompact +
      suffix
    );
  }

  let decimalPlaces = decimals;

  if (decimalPlaces === undefined) {
    if (maxDecimals !== undefined) {
      const str = num.toString();
      const decimalIndex = str.indexOf(".");

      if (decimalIndex === -1) {
        decimalPlaces = minDecimals || 0;
      } else {
        const currentDecimals = str.length - decimalIndex - 1;

        decimalPlaces = Math.min(currentDecimals, maxDecimals);
        if (minDecimals !== undefined) {
          decimalPlaces = Math.max(decimalPlaces, minDecimals);
        }
      }
    } else {
      decimalPlaces = 2;
    }
  }

  const formatted = num.toFixed(decimalPlaces);
  const [whole, fraction] = formatted.split(".");

  const wholeFormatted = whole.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandSeparator,
  );

  let result = wholeFormatted;

  if (fraction && decimalPlaces > 0) {
    result += decimalSeparator + fraction;
  }

  return prefix + result + suffix;
}
