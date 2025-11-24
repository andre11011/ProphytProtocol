import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export * from "./api.types";
export * from "./bet.types";
export * from "./chart.types";
export * from "./events.types";
export * from "./market.types";
export * from "./price.types";
export * from "./protocol.types";
export * from "./user.types";
