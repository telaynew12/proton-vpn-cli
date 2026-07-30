import path from "path";
import { execa } from "execa";
import Docker from "dockerode";
import {
  GLUETUN_CONTAINER,
  GLUETUN_IMAGE,
  SOCKS5_CONTAINER,
  SOCKS5_IMAGE,
} from "./constants";

const docker = new Docker();

export async function removeContainer(name: string): Promise<void> {
  try {
    const container = docker.getContainer(name);
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop({ t: 10 });
    }
    await container.remove({ force: true });
  } catch {
    // ignore if container doesn't exist
  }
}

export async function removeContainers(): Promise<void> {
  await removeContainer(GLUETUN_CONTAINER);
  await removeContainer(SOCKS5_CONTAINER);
}

export async function startGluetun(
  ovpnPath: string,
  username: string,
  password: string,
  port: number
): Promise<void> {
  await removeContainer(GLUETUN_CONTAINER);

  const absPath = path.resolve(ovpnPath);
  const binds = [`${absPath}:/gluetun/config/config.ovpn:ro`];
  const env = [
    `OPENVPN_USER=${username}`,
    `OPENVPN_PASSWORD=${password}`,
    `OPENVPN_CUSTOM_CONFIG=/gluetun/config/config.ovpn`,
    `OPENVPN_MSSFIX=1300`,
    `FIREWALL_OUTBOUND_SUBNETS=172.17.0.0/16`,
    "VPN_SERVICE_PROVIDER=custom",
  ];

  // xkuma/socks5 always listens on 1080 inside the container, so we publish
  // the host's chosen port to container port 1080.
  await docker.createContainer({
    Image: GLUETUN_IMAGE,
    name: GLUETUN_CONTAINER,
    Env: env,
    ExposedPorts: { "1080/tcp": {} },
    HostConfig: {
      Binds: binds,
      CapAdd: ["NET_ADMIN"],
      Devices: [{ PathOnContainer: "/dev/net/tun", PathInContainer: "/dev/net/tun", CgroupPermissions: "rwm" }],
      NetworkMode: "bridge",
      PortBindings: { "1080/tcp": [{ HostPort: String(port) }] },
      RestartPolicy: { Name: "unless-stopped" },
    },
  });

  const container = docker.getContainer(GLUETUN_CONTAINER);
  await container.start();
}

export async function startSocks5(): Promise<void> {
  await removeContainer(SOCKS5_CONTAINER);

  // xkuma/socks5 hardcodes its listen port to 1080; the Gluetun container
  // already forwards the user's chosen host port to 1080 on the shared netns.
  await docker.createContainer({
    Image: SOCKS5_IMAGE,
    name: SOCKS5_CONTAINER,
    HostConfig: {
      NetworkMode: `container:${GLUETUN_CONTAINER}`,
      RestartPolicy: { Name: "unless-stopped" },
    },
  });

  const container = docker.getContainer(SOCKS5_CONTAINER);
  await container.start();
}

export async function waitForGluetun(timeout = 120000): Promise<void> {
  const container = docker.getContainer(GLUETUN_CONTAINER);
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const { stdout } = await execa("docker", ["logs", GLUETUN_CONTAINER], { timeout: 5000 });
        if (stdout.includes("Initialization Sequence Completed")) {
          clearInterval(interval);
          resolve();
        }
      } catch {
        // keep trying
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("Gluetun did not initialize in time"));
      }
    }, 2000);
  });
}

export async function followLogs(): Promise<void> {
  const { spawn } = await import("child_process");
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["logs", "-f", GLUETUN_CONTAINER], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`docker logs exited with code ${code}`));
      }
    });
  });
}

export async function listRunningContainers(): Promise<string[]> {
  try {
    const containers = await docker.listContainers();
    return containers
      .filter(
        (c) =>
          c.Names.some((n) => n.includes(GLUETUN_CONTAINER) || n.includes(SOCKS5_CONTAINER))
      )
      .map((c) => c.Names[0].replace(/^\//, ""));
  } catch {
    return [];
  }
}

export async function pullImage(image: string): Promise<void> {
  return new Promise((resolve, reject) => {
    docker.pull(image, {}, (err: any, stream: any) => {
      if (err) return reject(err);
      if (!stream) return resolve();
      stream.on("data", () => {});
      stream.on("end", () => resolve());
      stream.on("error", (e: any) => reject(e));
    });
  });
}

export async function imageExists(image: string): Promise<boolean> {
  try {
    await docker.getImage(image).inspect();
    return true;
  } catch {
    return false;
  }
}

export { docker };
