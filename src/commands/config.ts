import fs from "fs-extra";
import { loadConfig, saveConfig, savePassword } from "../config";
import { promptInput, promptPassword, promptConfirm } from "../utils/prompts";
import * as fmt from "../utils/format";

export default async function configCmd(): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    fmt.error("No configuration found. Run `proton-local-vpn` or `proton-local-vpn connect` to set up.");
    return;
  }

  fmt.info("Current configuration:");
  console.log(`  OpenVPN file: ${config.ovpn}`);
  console.log(`  Username:     ${config.username}`);
  console.log(`  SOCKS5 Port:  ${config.port}`);

  const update = await promptConfirm("Would you like to update the configuration?");
  if (!update) {
    return;
  }

  const ovpn = await promptInput("OpenVPN file path:", config.ovpn);
  if (!(await fs.pathExists(ovpn))) {
    throw new Error(`OpenVPN profile not found: ${ovpn}`);
  }
  const username = await promptInput("OpenVPN Username:", config.username);

  const updatePassword = await promptConfirm("Update password?");
  if (updatePassword) {
    const password = await promptPassword("OpenVPN Password:");
    await savePassword(password);
  }

  const portInput = await promptInput("SOCKS5 Port", String(config.port));
  const port = parseInt(portInput, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error("Invalid port number");
  }

  await saveConfig({ ovpn, username, port });
  fmt.success("Configuration updated.");
}
