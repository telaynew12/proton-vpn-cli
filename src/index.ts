#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import connect from "./commands/connect";
import disconnect from "./commands/disconnect";
import status from "./commands/status";
import logs from "./commands/logs";
import config from "./commands/config";
import test from "./commands/test";
import remove from "./commands/remove";
import doctor from "./commands/doctor";
import update from "./commands/update";
import { requireConfig } from "./config";
import * as fmt from "./utils/format";

async function main() {
  program
    .name("proton-local-vpn")
    .description("Local SOCKS5 proxy using Docker, Gluetun, and ProtonVPN")
    .version("1.0.0")
    .action(async () => {
      await requireConfig();
      await connect();
    });

  program
    .command("connect")
    .description("Connect to ProtonVPN via Gluetun and start SOCKS5 proxy")
    .action(async () => {
      await connect();
    });

  program
    .command("disconnect")
    .description("Disconnect and remove VPN containers")
    .action(async () => {
      await disconnect();
    });

  program
    .command("status")
    .description("Show VPN connection status")
    .action(async () => {
      await status();
    });

  program
    .command("logs")
    .description("Follow Gluetun container logs")
    .action(async () => {
      await logs();
    });

  program
    .command("config")
    .description("Update configuration")
    .action(async () => {
      await config();
    });

  program
    .command("test")
    .description("Test SOCKS5 and VPN connectivity")
    .action(async () => {
      await test();
    });

  program
    .command("remove")
    .description("Remove VPN containers")
    .action(async () => {
      await remove();
    });

  program
    .command("doctor")
    .description("Run a health check")
    .action(async () => {
      await doctor();
    });

  program
    .command("update")
    .description("Update Docker images")
    .action(async () => {
      await update();
    });

  try {
    await program.parseAsync(process.argv);
  } catch (err: any) {
    fmt.error(err.message || "An unexpected error occurred");
    process.exit(1);
  }
}

main();
