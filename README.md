# proton-local-vpn

A cross-platform CLI that automates a local SOCKS5 proxy using Docker, Gluetun, and a ProtonVPN OpenVPN configuration.

Everything runs locally — no hosted backend, database, or cloud service is required.

---

## What it does

```
CLI
↓
Docker Engine
↓
Gluetun Container  ──▶  ProtonVPN tunnel
↓
SOCKS5 Container
↓
localhost:1088  (configurable)
```

Once connected, any application configured to use `localhost:<port>` as a SOCKS5 proxy routes its traffic through the ProtonVPN tunnel.

> **Note:** The SOCKS5 container shares the Gluetun container's network namespace (`network_mode: container:gluetun_proton`), so all proxy traffic goes through the VPN tunnel.

---

## Requirements

* Linux (tested on Ubuntu; macOS and Windows may work with adjustments)
* [Node.js](https://nodejs.org/) 18+ and npm
* [Docker](https://docs.docker.com/get-docker/) installed and running
* A ProtonVPN OpenVPN profile (`.ovpn` file)
* `/dev/net/tun` device available on the host

---

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd proton-local-vpn
npm install
```

Build the TypeScript sources:

```bash
npm run build
```

The compiled CLI is now at `dist/index.js`.

You can run it directly from the project directory:

```bash
node dist/index.js --help
# or
npm start -- --help
```

Or link it globally so the `proton-local-vpn` command is available everywhere:

```bash
npm link
proton-local-vpn --help
```

---

## Usage

### First run / setup

Run the default command from the project directory:

```bash
node dist/index.js
# or, if you ran `npm link`
proton-local-vpn
```

If no configuration exists, an interactive wizard will:

1. Check for Docker and offer to install it if missing.
2. Search `~/Downloads`, `~/Desktop`, and `~/Documents` for `.ovpn` files.
3. Prompt for your OpenVPN username and hidden password.
4. Ask for a SOCKS5 port (default: `1088`).
5. Save the configuration to `~/.config/proton-local-vpn/config.json` and store your password securely via your operating system's credential manager (Keytar).

Your config and credentials are kept locally:

```
~/.config/proton-local-vpn/config.json   # config (no password stored here)
Keytar / OS credential manager            # OpenVPN password
```

### Commands

| Command | Description |
| --- | --- |
| `proton-local-vpn` | Interactive setup and connect |
| `proton-local-vpn connect` | Start the VPN tunnel and SOCKS5 proxy |
| `proton-local-vpn disconnect` | Stop and remove the VPN containers |
| `proton-local-vpn status` | Show current connection status |
| `proton-local-vpn logs` | Follow Gluetun container logs |
| `proton-local-vpn config` | Update OpenVPN file, username, password, or port |
| `proton-local-vpn test` | Verify that the SOCKS5 proxy is reachable and the VPN tunnel is active |
| `proton-local-vpn remove` | Remove Gluetun and SOCKS5 containers after confirmation |
| `proton-local-vpn doctor` | Run a health check for Docker, TUN, credentials, images, and connectivity |
| `proton-local-vpn update` | Pull the latest Gluetun and SOCKS5 Docker images |

### Using the proxy

After a successful connection, the CLI prints:

```
Connected

Country:    Netherlands
Public IP:  169.xxx.xxx.xxx
SOCKS5:     localhost:1088
```

> **Wait a moment:** after the containers start, it may take a few seconds for the VPN tunnel to fully initialize.

Configure your application or system to use:

```
SOCKS5 host:     localhost
SOCKS5 port:     1088   (or the port you chose)
Authentication:  none
```

#### curl example

Use `--socks5-hostname` so DNS resolution also goes through the proxy:

```bash
curl --socks5-hostname localhost:1088 https://ifconfig.me
```

> **Tip:** `--socks5` sends only the TCP traffic through the proxy; DNS still resolves locally. Use `--socks5-hostname` to avoid DNS leaks.

Most browsers support SOCKS5 via extensions or command-line flags:

```bash
# Google Chrome on Linux
google-chrome --proxy-server="socks5://localhost:1088"

# Firefox
# Settings → Network Settings → Manual proxy configuration → SOCKS host: localhost, port: 1088
```

---

## Development

Run in development mode without building:

```bash
npm run dev
```

Rebuild after changes:

```bash
npm run build
```

Run the compiled binary:

```bash
npm start
```

## Updating the CLI

Pull the latest code, install any new dependencies, and rebuild:

```bash
git pull
npm install
npm run build
```

---

## Troubleshooting

### Docker is not installed or not running

The CLI checks for Docker on first run. If it is missing, the wizard can attempt to install it. If the daemon is not running, start it:

```bash
sudo systemctl start docker
```

### Permission denied when using Docker

Add your user to the `docker` group and re-login:

```bash
sudo usermod -aG docker $USER
# Log out and back in, or run:
newgrp docker
```

### TUN device not available

Make sure the TUN module is loaded:

```bash
sudo modprobe tun
ls /dev/net/tun
```

On some systems you may need to create it:

```bash
sudo mkdir -p /dev/net
sudo mknod /dev/net/tun c 10 200
sudo chmod 600 /dev/net/tun
```

### Port already in use

Choose a different port during setup, or free the port:

```bash
sudo lsof -i :1088
# kill the process or use a different port
```

### Gluetun does not initialize

Follow the Gluetun logs:

```bash
proton-local-vpn logs
```

Common causes:

* Invalid OpenVPN credentials
* Wrong or expired `.ovpn` profile
* Firewall blocking outbound connections
* Missing `NET_ADMIN` capability or TUN device

### Keytar / secure credential storage fails to build

Keytar requires native dependencies. Make sure build tools are installed:

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-dev build-essential

# macOS
xcode-select --install
```

### Public IP does not change when using the proxy

* Make sure the application is configured to use SOCKS5, not HTTP proxy.
* Use `curl --socks5-hostname localhost:1088` to verify.
* Run `proton-local-vpn doctor` to diagnose.
* Some applications perform DNS locally; use `socks5-hostname` style resolution when possible.

### Images fail to pull

Make sure Docker can reach Docker Hub:

```bash
docker pull qmcgaw/gluetun
docker pull xkuma/socks5
```

---

## Security notes

* Passwords are stored with the OS credential manager via Keytar, not in plain text.
* The CLI never prints your password.
* Public IP output is partially masked for privacy.
* The Gluetun container runs with `NET_ADMIN` and access to `/dev/net/tun` as required by OpenVPN.

---

## License

ISC
