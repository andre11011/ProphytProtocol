export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Prophyt Protocol",
  description: "Prediction markets with yield generation on Sui Blockchain",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://app.prophyt.fun",
  links: {
    github: "https://github.com/andre11011/ProphytProtocol",
    x: "https://x.com/prophyt_fun",
    mail: "mailto:support@prophyt.fun",
  },
};
