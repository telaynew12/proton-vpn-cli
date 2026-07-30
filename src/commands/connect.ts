import ora from "ora";
import chalk from "chalk";
import { requireConfig, getPassword } from "../config";
import * as docker from "../docker";
import { GLUETUN_IMAGE, SOCKS5_IMAGE } from "../constants";
import * as system from "../utils/system";
import * as fmt from "../utils/format";
import { getCountryForIp } from "../utils/lookup";

export default async function connect(): Promise<void> {
  const config = await requireConfig();
  const password = await getPassword();
  if (!password) {
    throw new Error("OpenVPN password not found in secure storage.");
  }

  fmt.info("Starting connection...");

  const spinner = ora("Removing existing containers").start();
  await docker.removeContainers();
  spinner.succeed("Removed existing containers");

  const portSpinner = ora("Checking port availability").start();
  const portAvailable = await system.checkPortAvailable(config.port);
  if (!portAvailable) {
    portSpinner.fail(`Port ${config.port} is already in use.`);
    throw new Error(`Port ${config.port} is already in use`);
  }
  portSpinner.succeed(`Port ${config.port} is available`);

  const pullSpinner = ora("Pulling Docker images").start();
  await docker.pullImage(GLUETUN_IMAGE);
  await docker.pullImage(SOCKS5_IMAGE);
  pullSpinner.succeed("Docker images ready");

  const gluetunSpinner = ora("Starting Gluetun container").start();
  try {
    await docker.startGluetun(config.ovpn, config.username, password, config.port);
    gluetunSpinner.succeed("Gluetun container started");
  } catch (err: any) {
    gluetunSpinner.fail(`Failed to start Gluetun: ${err.message}`);
    throw err;
  }

  const waitSpinner = ora("Waiting for VPN tunnel initialization").start();
  try {
    await docker.waitForGluetun();
    waitSpinner.succeed("VPN tunnel initialized");
  } catch (err: any) {
    waitSpinner.fail(`VPN tunnel failed: ${err.message}`);
    throw err;
  }

  const socksSpinner = ora("Starting SOCKS5 proxy").start();
  try {
    await docker.startSocks5();
    socksSpinner.succeed(`SOCKS5 proxy started on localhost:${config.port}`);
  } catch (err: any) {
    socksSpinner.fail(`Failed to start SOCKS5: ${err.message}`);
    throw err;
  }

  const testSpinner = ora("Verifying VPN connection").start();
  const socks5Host = `localhost:${config.port}`;
  let publicIp: string | undefined;
  for (let i = 0; i < 3; i++) {
    publicIp = await system.getPublicIp(socks5Host);
    if (publicIp) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!publicIp) {
    testSpinner.fail("Could not verify public IP through SOCKS5 proxy.");
    throw new Error("VPN test failed");
  }
  testSpinner.succeed("VPN connection verified");

  const country = await getCountryForIp(publicIp);

  console.log(chalk.green.bold("\nConnected\n"));
  console.log(`${chalk.gray("Country:")}    ${country || "Unknown"}`);
  console.log(`${chalk.gray("Public IP:")}  ${fmt.formatIp(publicIp)}`);
  console.log(`${chalk.gray("SOCKS5:")}    ${socks5Host}`);
}
