import * as docker from "../docker";
import * as fmt from "../utils/format";

export default async function logs(): Promise<void> {
  try {
    await docker.followLogs();
  } catch (err: any) {
    fmt.error(`Could not follow logs: ${err.message}`);
    process.exit(1);
  }
}
