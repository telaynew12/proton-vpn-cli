import axios from "axios";

export async function getCountryForIp(ip: string): Promise<string | undefined> {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`, { timeout: 5000 });
    return response.data.country;
  } catch {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
      return response.data.country_name;
    } catch {
      return undefined;
    }
  }
}
