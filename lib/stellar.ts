/**
 * Stellar SDK helpers and client interaction layer
 */

export const HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
} as const;

export type StellarNetwork = keyof typeof HORIZON_URLS;

export interface StellarClient {
  getHorizonUrl: (network?: StellarNetwork) => string;
  getAccountBalance: (publicKey: string, network?: StellarNetwork) => Promise<number>;
  getAccountSequence: (publicKey: string, network?: StellarNetwork) => Promise<string>;
  signAndSubmitTransaction: (txXdr: string) => Promise<never>;
}

export const stellar: StellarClient = {
  getHorizonUrl(network: StellarNetwork = "testnet"): string {
    return HORIZON_URLS[network];
  },

  async getAccountBalance(publicKey: string, network: StellarNetwork = "testnet"): Promise<number> {
    try {
      const response = await fetch(
        `${HORIZON_URLS[network]}/accounts/${publicKey}`
      );
      if (!response.ok) return 0;
      const data = await response.json();
      const native = data.balances?.find(
        (b: { asset_type: string; balance?: string }) => b.asset_type === "native"
      )?.balance;
      return parseFloat(native ?? "0");
    } catch {
      return 0;
    }
  },

  async getAccountSequence(publicKey: string, network: StellarNetwork = "testnet"): Promise<string> {
    const response = await fetch(
      `${HORIZON_URLS[network]}/accounts/${publicKey}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch account sequence for ${publicKey}`);
    }
    const data = await response.json();
    return data.sequence ?? "0";
  },

  async signAndSubmitTransaction(_txXdr: string): Promise<never> {
    throw new Error("signAndSubmitTransaction is not implemented yet");
  },
};
