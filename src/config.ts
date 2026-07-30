import fs from "fs-extra";
import path from "path";
import keytar from "keytar";
import { AppConfig } from "./types";
import { CONFIG_DIR, CONFIG_PATH, DEFAULT_PORT, KEYTAR_SERVICE, KEYTAR_ACCOUNT } from "./constants";
import { promptInput, promptPassword, promptList, promptConfirm } from "./utils/prompts";
import * as system from "./utils/system";
import * as fmt from "./utils/format";

export async function loadConfig(): Promise<AppConfig | null> {
  try {
    const exists = await fs.pathExists(CONFIG_PATH);
    if (!exists) return null;
    return (await fs.readJson(CONFIG_PATH)) as AppConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

export async function savePassword(password: string): Promise<void> {
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, password);
}

export async function getPassword(): Promise<string | null> {
  return keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
}

export async function configExists(): Promise<boolean> {
  return fs.pathExists(CONFIG_PATH);
}

export async function ensureDocker(): Promise<void> {
  const hasDocker = await system.detectDocker();
  if (!hasDocker) {
    fmt.error("Docker is not installed.");
    const install = await promptConfirm("Would you like to install it?", true);
    if (install) {
      await system.installDocker();
      fmt.success("Docker installed.");
    } else {
      throw new Error("Docker is required to continue.");
    }
  }
  const running = await system.detectDockerRunning();
  if (!running) {
    throw new Error("Docker daemon is not running.");
  }
}

export async function setupWizard(): Promise<AppConfig> {
  await ensureDocker();

  const profiles = await system.searchOpenVpnProfiles();
  let ovpn: string;
  if (profiles.length === 1) {
    ovpn = profiles[0];
    fmt.info(`Found OpenVPN profile: ${ovpn}`);
  } else if (profiles.length > 1) {
    ovpn = await promptList("Choose one:", profiles);
  } else {
    ovpn = await promptInput("OpenVPN profile path:");
  }

  if (!(await fs.pathExists(ovpn))) {
    throw new Error(`OpenVPN profile not found: ${ovpn}`);
  }

  const username = await promptInput("OpenVPN Username:");
  const password = await promptPassword("OpenVPN Password:");
  await savePassword(password);

  const portInput = await promptInput("SOCKS5 Port", String(DEFAULT_PORT));
  const port = parseInt(portInput, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error("Invalid port number");
  }

  const config: AppConfig = { ovpn: path.resolve(ovpn), username, port };
  await saveConfig(config);
  fmt.success("Configuration saved.");
  return config;
}

export async function requireConfig(): Promise<AppConfig> {
  const config = await loadConfig();
  if (!config) {
    fmt.info("No configuration found. Starting setup wizard.");
    return setupWizard();
  }
  return config;
}
