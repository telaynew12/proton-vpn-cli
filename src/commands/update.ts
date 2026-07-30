import ora from "ora";
import * as docker from "../docker";
import { GLUETUN_IMAGE, SOCKS5_IMAGE } from "../constants";

export default async function update(): Promise<void> {
  const spinner = ora("Pulling latest Docker images").start();
  try {
    await docker.pullImage(GLUETUN_IMAGE);
    await docker.pullImage(SOCKS5_IMAGE);
    spinner.succeed("Docker images updated.");
  } catch (err: any) {
    spinner.fail(`Failed to update images: ${err.message}`);
    throw err;
  }
}
