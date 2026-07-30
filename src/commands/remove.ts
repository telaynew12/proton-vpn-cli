import * as docker from "../docker";
import { promptConfirm } from "../utils/prompts";
import * as fmt from "../utils/format";

export default async function remove(): Promise<void> {
  const confirmed = await promptConfirm(
    "This will remove the gluetun_proton and socks5_proxy containers. Continue?",
    true
  );
  if (!confirmed) {
    fmt.info("Cancelled.");
    return;
  }

  await docker.removeContainers();
  fmt.success("Containers removed.");
}
