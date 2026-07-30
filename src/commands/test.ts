import { loadConfig, getPassword } from "../config";
import * as docker from "../docker";
import * as system from "../utils/system";
import * as fmt from "../utils/format";
import { getCountryForIp } from "../utils/lookup";

export default async function testCmd(): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    throw new Error("Configuration not found. Run setup first.");
  }

  const password = await getPassword();
  if (!password) {
    throw new Error("OpenVPN password not found.");
  }

  const running = await docker.listRunningContainers();
  if (running.length === 0) {
    throw new Error("VPN is not running. Run `proton-local-vpn connect` first.");
  }

  const socks5Host = `localhost:${config.port}`;
  const localIp = await system.getPublicIp();
  const vpnIp = await system.getPublicIp(socks5Host);

  console.log(`Local IP: ${localIp || "Unknown"}`);
  console.log(`VPN IP:   ${vpnIp || "Unknown"}`);

  if (!vpnIp) {
    fmt.error("SOCKS5 proxy is not reachable.");
    throw new Error("SOCKS5 test failed");
  }

  const country = await getCountryForIp(vpnIp);
  fmt.success(`VPN tunnel active${country ? ` (${country})` : ""}`);

  if (localIp && vpnIp && localIp === vpnIp) {
    fmt.warn("Public IP through VPN matches local connection.");
    throw new Error("VPN tunnel may not be active");
  } else {
    fmt.success("Public IP differs from local connection.");
  }
}
