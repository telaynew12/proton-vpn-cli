import chalk from "chalk";

export const success = (msg: string) => console.log(chalk.green("✓") + " " + msg);
export const error = (msg: string) => console.log(chalk.red("✗") + " " + msg);
export const info = (msg: string) => console.log(chalk.blue("ℹ") + " " + msg);
export const warn = (msg: string) => console.log(chalk.yellow("⚠") + " " + msg);

export function formatIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  return ip.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, (m) => {
    const parts = m.split(".");
    return parts.map((p, i) => (i === 0 ? p : "xxx")).join(".");
  });
}

export function maskSensitive(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "****" + value.slice(-2);
}
