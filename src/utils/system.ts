import { execa } from "execa";
import fs from "fs-extra";
import os from "os";
import path from "path";
import axios from "axios";

export async function commandExists(cmd: string): Promise<boolean> {
  try {
    await execa("which", [cmd]);
    return true;
  } catch {
    return false;
  }
}

export async function detectDocker(): Promise<boolean> {
  return commandExists("docker");
}

export async function detectDockerRunning(): Promise<boolean> {
  try {
    await execa("docker", ["info"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function detectTun(): Promise<boolean> {
  try {
    const files = await fs.readdir("/dev");
    return files.some((f) => f.toLowerCase().startsWith("tun"));
  } catch {
    return false;
  }
}

export async function checkInternet(): Promise<boolean> {
  try {
    await axios.get("https://1.1.1.1", { timeout: 5000 });
    return true;
  } catch {
    try {
      await axios.get("https://8.8.8.8", { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export async function getPublicIp(socks5Host?: string): Promise<string | undefined> {
  try {
    if (socks5Host) {
      const { stdout } = await execa("curl", ["--socks5-hostname", socks5Host, "https://ifconfig.me", "--max-time", "10"], {
        timeout: 15000,
      });
      return stdout.trim();
    }
    const { stdout } = await execa("curl", ["https://ifconfig.me", "--max-time", "10"], { timeout: 15000 });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

export async function checkPortAvailable(port: number): Promise<boolean> {
  try {
    const { stdout } = await execa("ss", ["-tlnp", `sport = :${port}`], { timeout: 3000 });
    return !stdout.includes(String(port));
  } catch {
    try {
      const { stdout } = await execa("netstat", ["-tlnp"], { timeout: 3000 });
      return !stdout.includes(`:${port}`);
    } catch {
      return true;
    }
  }
}

export async function searchOpenVpnProfiles(): Promise<string[]> {
  const dirs = [path.join(os.homedir(), "Downloads"), path.join(os.homedir(), "Desktop"), path.join(os.homedir(), "Documents")];
  const found: string[] = [];
  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith(".ovpn")) {
          found.push(path.join(dir, file));
        }
      }
    } catch {
      // ignore unreadable dirs
    }
  }
  return found;
}

export async function installDocker(): Promise<void> {
  const installCmd = `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`;
  const { stdout } = await execa("sh", ["-c", installCmd], { timeout: 120000 });
  return stdout as any;
}
