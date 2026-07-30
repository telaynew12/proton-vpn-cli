import path from "path";
import os from "os";

export const APP_NAME = "proton-local-vpn";
export const CONFIG_DIR = path.join(os.homedir(), ".config", APP_NAME);
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
export const GLUETUN_IMAGE = "qmcgaw/gluetun";
export const SOCKS5_IMAGE = "xkuma/socks5";
export const GLUETUN_CONTAINER = "gluetun_proton";
export const SOCKS5_CONTAINER = "socks5_proxy";
export const DEFAULT_PORT = 1088;
export const KEYTAR_SERVICE = "proton-local-vpn";
export const KEYTAR_ACCOUNT = "openvpn-password";
