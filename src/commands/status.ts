import chalk from "chalk";
import { loadConfig } from "../config";
import * as docker from "../docker";
import * as system from "../utils/system";
import { getCountryForIp } from "../utils/lookup";
import * as fmt from "../utils/format";

export default async function status(): Promise<void> {
  const config = await loadConfig();
  const running = await docker.listRunningContainers();
  const socks5Host = config ? `localhost:${config.port}` : undefined;
  let connected = false;
  let publicIp: string | undefined;
  let country: string | undefined;

  if (running.length > 0 && socks5Host) {
    publicIp = await system.getPublicIp(socks5Host);
    connected = !!publicIp;
    if (publicIp) {
      country = await getCountryForIp(publicIp);
    }
  }

  console.log(chalk.bold("Status"));
  console.log(`${chalk.gray("Connection:")} ${connected ? chalk.green("Connected") : chalk.red("Disconnected")}`);
  console.log(`${chalk.gray("Public IP:")}  ${fmt.formatIp(publicIp) || "N/A"}`);
  console.log(`${chalk.gray("Country:")}    ${country || "Unknown"}`);
  console.log(`${chalk.gray("SOCKS5:")}    ${socks5Host || "N/A"}`);
  console.log(`${chalk.gray("Containers:")} ${running.length ? running.join(", ") : "none"}`);
}
