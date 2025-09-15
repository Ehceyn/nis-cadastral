import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import proj4 from "proj4";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// UTM Zone 32N to WGS84 conversion function
export function utmToWgs84(easting: number, northing: number) {
  const utm32n = "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs";
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
  const [lon, lat] = proj4(utm32n, wgs84, [easting, northing]);
  return { latitude: lat, longitude: lon };
}
