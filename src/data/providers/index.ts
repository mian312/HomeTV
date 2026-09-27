import type { IptvProvider } from './provider';
import { IptvOrgProvider } from './iptv-org';

export * from './provider';

// Default provider instance (in the future this could be dynamically chosen or multiple providers could exist)
export const defaultProvider: IptvProvider = new IptvOrgProvider();
