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
 * Detect if we're running inside the Coinbase/Base in-app browser.
 * Useful as a fallback when injected provider flags aren't present.
 */
export function isCoinbaseInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /CoinbaseWallet|BaseApp/i.test(ua);
}

/**
 * Basic injected provider presence check.
 */
export function hasInjectedEthereum(): boolean {
  if (typeof window === "undefined") return false;
  const ethereum = (window as any).ethereum;
  return !!ethereum?.request;
}

/**
 * Check if Base App wallet environment is available.
 */
export function isBaseAppAvailable(): boolean {
  if (!hasInjectedEthereum()) return false;

  const ethereum = (window as any).ethereum;

  // Direct flags (most common)
  if (ethereum.isBaseApp || ethereum.isCoinbaseWallet) return true;

  // Multi-provider injection (e.g., multiple wallets installed)
  if (Array.isArray(ethereum.providers)) {
    if (ethereum.providers.some((p: any) => p?.isBaseApp || p?.isCoinbaseWallet)) return true;
  }

  // Fallback: in-app browser sometimes doesn't expose flags consistently
  return isCoinbaseInAppBrowser();
}

/**
 * Get the Base App provider - ONLY returns Base/Coinbase wallet, never MetaMask or others
 */
function getBaseProvider(): BaseProvider | null {
  if (!hasInjectedEthereum()) return null;

  const ethereum = (window as any).ethereum;
  const isProvider = (p: any) => p && typeof p.request === "function";
  const isBaseOrCoinbase = (p: any) => p?.isBaseApp || p?.isCoinbaseWallet;

  // If multiple wallets are injected, ONLY use Base/Coinbase provider
  if (Array.isArray(ethereum.providers)) {
    const baseProvider = ethereum.providers.find(
      (p: any) => isBaseOrCoinbase(p) && isProvider(p)
    );
    if (baseProvider) return baseProvider as BaseProvider;

    // If we're in Coinbase/Base in-app browser, the provider should work
    if (isCoinbaseInAppBrowser()) {
      const first = ethereum.providers.find((p: any) => isProvider(p));
      if (first) return first as BaseProvider;
    }
    
    // No Base wallet found in providers array
    return null;
  }

  // Single provider - only use if it's Base/Coinbase or we're in Base browser
  if (isBaseOrCoinbase(ethereum) || isCoinbaseInAppBrowser()) {
    return isProvider(ethereum) ? (ethereum as BaseProvider) : null;
  }

  // Not Base wallet (could be MetaMask etc.) - reject
  return null;
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
 * Try the new Base App wallet_connect method with SIWE capabilities
 * This is the preferred method for the new Base App (2024/2025)
 */
async function tryWalletConnect(provider: BaseProvider, nonce: string): Promise<ConnectResult | null> {
  try {
    const result = await provider.request({
      method: "wallet_connect",
      params: [{
        version: "1",
        capabilities: {
          signInWithEthereum: {
            nonce,
            chainId: BASE_CHAIN_ID
          }
        }
      }]
    });

    // New Base App returns accounts array with capabilities
    if (result?.accounts && result.accounts.length > 0) {
      const account = result.accounts[0];
      const address = account.address;
      const siweResult = account.capabilities?.signInWithEthereum;
      
      if (siweResult?.message && siweResult?.signature) {
        return {
          success: true,
          address,
          message: siweResult.message,
          signature: siweResult.signature,
        };
      }
    }
    
    return null;
  } catch (error: any) {
    // wallet_connect not supported, return null to try legacy flow
    console.log("wallet_connect not available, trying legacy flow");
    return null;
  }
}

/**
 * Legacy connection flow using eth_requestAccounts + personal_sign
 * Used for older Coinbase Wallet / Base Wallet versions
 */
async function tryLegacyConnect(provider: BaseProvider, nonce: string): Promise<ConnectResult> {
  // Request accounts first (permission-gated in most wallets)
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

  // Best-effort: switch to Base chain after permissions are granted
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (switchError: any) {
    // Chain not added, try to add it
    if (switchError?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_CHAIN_ID,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          },
        ],
      });
    }
    // Otherwise ignore: signing can still proceed in many wallet contexts.
  }

  // Create SIWE message with proper format
  const message = createSIWEMessage(address, nonce);

  // Sign the message
  let signature: string;
  try {
    // Most widely supported
    signature = await provider.request({
      method: "personal_sign",
      params: [message, address],
    });
  } catch (signError: any) {
    // Fallback used by some providers
    signature = await provider.request({
      method: "eth_sign",
      params: [address, message],
    });
  }

  return {
    success: true,
    address,
    message,
    signature,
  };
}

/**
 * Connect to Base App wallet with SIWE authentication
 * Supports both new Base App (wallet_connect) and legacy Coinbase Wallet (personal_sign)
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
    // First, try the new Base App wallet_connect method
    const walletConnectResult = await tryWalletConnect(provider, nonce);
    if (walletConnectResult) {
      return walletConnectResult;
    }

    // Fall back to legacy flow for older wallets
    return await tryLegacyConnect(provider, nonce);
  } catch (error: any) {
    // EIP-1193 user rejected request
    if (error?.code === 4001) {
      return { success: false, error: "Signature request was rejected in wallet." };
    }

    console.error("Base App connection error:", error);
    return {
      success: false,
      error: error?.message || "Failed to connect to Base App",
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
