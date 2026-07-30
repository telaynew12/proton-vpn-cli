import * as docker from "../docker";
import * as fmt from "../utils/format";

export default async function disconnect(): Promise<void> {
  await docker.removeContainers();
  fmt.success("Disconnected and removed VPN containers.");
}
