/**
 * Base Wallet Connection Utilities
 * 
 * This module handles the connection to Base App wallets using the
 * wallet_connect method with SIWE (Sign In With Ethereum) support.
 */

// Base Mainnet chain ID
export const BASE_CHAIN_ID = "0x2105"; // 8453 in hex

interface BaseProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}

interface SIWEResult {
  address: string;
  message: string;
  signature: string;
}

interface ConnectResult {
  success: boolean;
  address?: string;
  message?: string;
  signature?: string;
  error?: string;
}

/**
 * Check if Base App wallet is available
 */
export function isBaseAppAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check for Base App provider
  const ethereum = (window as any).ethereum;
  if (!ethereum) return false;
  
  // Base App injects specific properties
  return ethereum.isBaseApp || ethereum.isCoinbaseWallet || false;
}

/**
 * Get the Base App provider
 */
function getBaseProvider(): BaseProvider | null {
  if (typeof window === "undefined") return null;
  
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;
  
  // Return the provider
  return ethereum as BaseProvider;
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Create a SIWE message for signing
 */
export function createSIWEMessage(
  address: string,
  nonce: string,
  domain: string = window.location.host,
  uri: string = window.location.origin
): string {
  const issuedAt = new Date().toISOString();
  
  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to SongChainn with your Base wallet.

URI: ${uri}
Version: 1
Chain ID: 8453
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/**
 * Connect to Base App wallet with SIWE authentication
 */
export async function connectWithBaseApp(nonce: string): Promise<ConnectResult> {
  const provider = getBaseProvider();
  
  if (!provider) {
    return {
      success: false,
      error: "Base App not detected. Please install Base App to continue.",
    };
  }

  try {
    // Switch to Base chain
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BASE_CHAIN_ID,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          }],
        });
      }
    }

    // Try wallet_connect with SIWE (Base App native method)
    try {
      const result = await provider.request({
        method: "wallet_connect",
        params: [{
          version: "1",
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: BASE_CHAIN_ID,
            },
          },
        }],
      });

      const { address } = result.accounts[0];
      const { message, signature } = result.accounts[0].capabilities.signInWithEthereum;

      return {
        success: true,
        address,
        message,
        signature,
      };
    } catch (walletConnectError: any) {
      // Fallback for wallets that don't support wallet_connect
      // Use eth_requestAccounts + personal_sign
      console.log("wallet_connect not supported, falling back to personal_sign");

      const accounts = await provider.request({
        method: "eth_requestAccounts",
        params: [],
      });

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: "No accounts returned from wallet",
        };
      }

      const address = accounts[0];
      const message = createSIWEMessage(address, nonce);

      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });

      return {
        success: true,
        address,
        message,
        signature,
      };
    }
  } catch (error: any) {
    console.error("Base App connection error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to Base App",
    };
  }
}

/**
 * Simulate Base App connection for Phase One
 * This generates a valid wallet address and simulated signature
 * to be replaced with real wallet connection in production
 */
export async function simulateBaseConnection(nonce: string): Promise<ConnectResult> {
  // Generate a deterministic wallet address for this session
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  const address = `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  
  // Create SIWE message
  const message = createSIWEMessage(address, nonce);
  
  // Generate simulated signature (65 bytes hex)
  const sigBytes = new Uint8Array(65);
  crypto.getRandomValues(sigBytes);
  const signature = `0x${Array.from(sigBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    address,
    message,
    signature,
  };
}
