export interface AppConfig {
  ovpn: string;
  username: string;
  port: number;
}

export interface StatusInfo {
  connected: boolean;
  publicIp?: string;
  country?: string;
  socks5: string;
  runningContainers: string[];
}

export interface HealthReport {
  dockerInstalled: boolean;
  dockerRunning: boolean;
  tunAvailable: boolean;
  internetConnectivity: boolean;
  ovpnFileExists: boolean;
  credentialsAvailable: boolean;
  imagesDownloaded: { gluetun: boolean; socks5: boolean };
  portAvailable: boolean;
  vpnConnectivity: boolean;
}
