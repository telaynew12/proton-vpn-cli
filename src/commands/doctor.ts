import chalk from "chalk";
import { loadConfig, getPassword } from "../config";
import * as docker from "../docker";
import * as system from "../utils/system";
import { GLUETUN_IMAGE, SOCKS5_IMAGE } from "../constants";

function render(name: string, ok: boolean, detail?: string) {
  const symbol = ok ? chalk.green("✓") : chalk.red("✗");
  const detailStr = detail ? chalk.gray(` — ${detail}`) : "";
  console.log(`  ${symbol} ${name}${detailStr}`);
}

export default async function doctor(): Promise<void> {
  console.log(chalk.bold("Health Report\n"));

  const dockerInstalled = await system.detectDocker();
  render("Docker installed", dockerInstalled);

  const dockerRunning = await system.detectDockerRunning();
  render("Docker daemon running", dockerRunning);

  const tunAvailable = await system.detectTun();
  render("TUN device available", tunAvailable);

  const internet = await system.checkInternet();
  render("Internet connectivity", internet);

  const config = await loadConfig();
  render("Config exists", !!config, config ? undefined : "Run setup first");

  let ovpnFileExists = false;
  let credentialsAvailable = false;
  let portAvailable = true;

  if (config) {
    try {
      const fs = (await import("fs-extra")).default;
      ovpnFileExists = await fs.pathExists(config.ovpn);
      render("OpenVPN file exists", ovpnFileExists, config.ovpn);
    } catch {
      render("OpenVPN file exists", false);
    }

    const password = await getPassword();
    credentialsAvailable = !!password;
    render("Credentials available", credentialsAvailable);

    portAvailable = await system.checkPortAvailable(config.port);
    render(`Port ${config.port} available`, portAvailable);
  }

  let gluetunImage = false;
  let socks5Image = false;
  if (dockerRunning) {
    try {
      gluetunImage = await docker.imageExists(GLUETUN_IMAGE);
      socks5Image = await docker.imageExists(SOCKS5_IMAGE);
    } catch {
      gluetunImage = false;
      socks5Image = false;
    }
  }
  render("Gluetun image downloaded", gluetunImage);
  render("SOCKS5 image downloaded", socks5Image);

  let vpnConnectivity = false;
  if (config && dockerRunning) {
    const running = await docker.listRunningContainers();
    if (running.length > 0) {
      const ip = await system.getPublicIp(`localhost:${config.port}`);
      vpnConnectivity = !!ip;
    }
  }
  render("VPN connectivity", vpnConnectivity, vpnConnectivity ? "SOCKS5 proxy returning public IP" : "Not connected");

  const allGood =
    dockerInstalled &&
    dockerRunning &&
    tunAvailable &&
    internet &&
    ovpnFileExists &&
    credentialsAvailable &&
    gluetunImage &&
    socks5Image &&
    portAvailable &&
    vpnConnectivity;

  console.log();
  if (allGood) {
    console.log(chalk.green.bold("All checks passed."));
  } else {
    console.log(chalk.red.bold("Some checks failed. Review the report above."));
  }
}
