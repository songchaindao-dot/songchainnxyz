/**
 * SongRegistry Smart Contract Integration
 * 
 * ERC-1155 contract for song ownership on Base blockchain.
 * Contract address: 0x39e8317fEEBE3129f3d876c1F6D35271849797F9
 */

import { getWalletProvider, switchToBaseChain, BASE_CHAIN_ID_HEX } from './baseWallet';

// Contract address on Base mainnet
export const SONG_REGISTRY_ADDRESS = "0x39e8317fEEBE3129f3d876c1F6D35271849797F9";

// Re-export for convenience
export { BASE_CHAIN_ID_HEX as BASE_CHAIN_ID };

// Minimal ABI for SongRegistry ERC-1155 contract
export const SONG_REGISTRY_ABI = [
  // Read functions
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getSongPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "songId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getSongArtist",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "songId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  },
  // Write functions
  {
    name: "buySong",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "songId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  }
] as const;

// Interface for on-chain song data
export interface OnChainSong {
  songId: number;
  tokenAddress: string;
  artistWallet: string;
  priceWei?: string;
}

// Map of app song IDs to on-chain song data
export const ON_CHAIN_SONGS: Record<string, OnChainSong> = {
  "7": {
    songId: 0,
    tokenAddress: SONG_REGISTRY_ADDRESS,
    artistWallet: "0x4440397b9E67A020bc96269F263817BE63184F3A"
  }
};

/**
 * Check if a song has on-chain integration
 */
export function isOnChainSong(songId: string): boolean {
  return songId in ON_CHAIN_SONGS;
}

/**
 * Get on-chain data for a song
 */
export function getOnChainSongData(songId: string): OnChainSong | null {
  return ON_CHAIN_SONGS[songId] || null;
}

/**
 * Offline plays storage keys
 */
const OFFLINE_PLAYS_PREFIX = "songchainn_offline_plays_";
const PREVIEW_USED_PREFIX = "songchainn_preview_used_";
const PREVIEW_TIME_PREFIX = "songchainn_preview_time_";
const PREVIEW_THRESHOLD_SECONDS = 5; // Lock after 5 seconds of preview playback

/**
 * Get remaining offline plays for a song
 */
export function getOfflinePlays(songId: string): number {
  const stored = localStorage.getItem(`${OFFLINE_PLAYS_PREFIX}${songId}`);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Set offline plays for a song (granted when user holds $1+ worth)
 */
export function setOfflinePlays(songId: string, plays: number): void {
  localStorage.setItem(`${OFFLINE_PLAYS_PREFIX}${songId}`, plays.toString());
}

/**
 * Decrement offline plays after each offline playback
 */
export function decrementOfflinePlays(songId: string): number {
  const current = getOfflinePlays(songId);
  if (current > 0) {
    const newCount = current - 1;
    setOfflinePlays(songId, newCount);
    return newCount;
  }
  return 0;
}

/**
 * Get accumulated preview time for a song
 */
export function getPreviewTime(songId: string, userAddress?: string): number {
  const key = `${PREVIEW_TIME_PREFIX}${songId}_${userAddress || "anonymous"}`;
  const stored = localStorage.getItem(key);
  return stored ? parseFloat(stored) : 0;
}

/**
 * Add to accumulated preview time for a song
 * Returns true if preview threshold has been reached
 */
export function addPreviewTime(songId: string, seconds: number, userAddress?: string): boolean {
  const key = `${PREVIEW_TIME_PREFIX}${songId}_${userAddress || "anonymous"}`;
  const current = getPreviewTime(songId, userAddress);
  const newTotal = current + seconds;
  localStorage.setItem(key, newTotal.toString());
  
  // If threshold reached, mark preview as permanently used
  if (newTotal >= PREVIEW_THRESHOLD_SECONDS) {
    markPreviewUsed(songId, userAddress);
    return true;
  }
  return false;
}

/**
 * Check if preview has been used for a song (exceeded threshold)
 */
export function hasUsedPreview(songId: string, userAddress?: string): boolean {
  const key = `${PREVIEW_USED_PREFIX}${songId}_${userAddress || "anonymous"}`;
  return localStorage.getItem(key) === "true";
}

/**
 * Mark preview as permanently used for a song (locked until purchased)
 */
export function markPreviewUsed(songId: string, userAddress?: string): void {
  const key = `${PREVIEW_USED_PREFIX}${songId}_${userAddress || "anonymous"}`;
  localStorage.setItem(key, "true");
}

/**
 * Clear preview data when song is purchased (for ownership reset)
 */
export function clearPreviewData(songId: string, userAddress?: string): void {
  const timeKey = `${PREVIEW_TIME_PREFIX}${songId}_${userAddress || "anonymous"}`;
  const usedKey = `${PREVIEW_USED_PREFIX}${songId}_${userAddress || "anonymous"}`;
  localStorage.removeItem(timeKey);
  localStorage.removeItem(usedKey);
}

/**
 * Get the preview threshold in seconds
 */
export function getPreviewThreshold(): number {
  return PREVIEW_THRESHOLD_SECONDS;
}

/**
 * Calculate keccak256 hash for function signature (simplified for known functions)
 * This is a lookup table for the function selectors we use
 */
const FUNCTION_SELECTORS: Record<string, string> = {
  // keccak256("balanceOf(address,uint256)") = 0x00fdd58e
  "balanceOf": "00fdd58e",
  // keccak256("buySong(uint256,uint256)") = 0x74a56eb6
  "buySong": "74a56eb6",
  // keccak256("getSongPrice(uint256)") = 0x8c8d98a0 
  "getSongPrice": "8c8d98a0",
  // keccak256("getSongArtist(uint256)") = 0x6c0360eb
  "getSongArtist": "6c0360eb"
};

/**
 * Encode function call data for contract interaction
 * Uses proper ABI encoding for EVM function calls
 */
function encodeFunctionCall(functionName: string, params: any[]): string {
  const selector = FUNCTION_SELECTORS[functionName];
  if (!selector) {
    console.error(`Unknown function: ${functionName}`);
    return "0x";
  }

  if (functionName === "balanceOf") {
    const [account, id] = params;
    // address is 20 bytes, padded to 32 bytes (64 hex chars)
    const addressPadded = account.slice(2).toLowerCase().padStart(64, "0");
    // uint256 is 32 bytes (64 hex chars)
    const idPadded = BigInt(id).toString(16).padStart(64, "0");
    return `0x${selector}${addressPadded}${idPadded}`;
  }
  
  if (functionName === "buySong") {
    const [songId, amount] = params;
    // Both are uint256, 32 bytes each
    const songIdPadded = BigInt(songId).toString(16).padStart(64, "0");
    const amountPadded = BigInt(amount).toString(16).padStart(64, "0");
    return `0x${selector}${songIdPadded}${amountPadded}`;
  }

  if (functionName === "getSongPrice") {
    const [songId] = params;
    const songIdPadded = BigInt(songId).toString(16).padStart(64, "0");
    return `0x${selector}${songIdPadded}`;
  }
  
  return "0x";
}

/**
 * Check user's token balance for a song
 */
export async function checkSongBalance(userAddress: string, songId: string): Promise<bigint> {
  const onChainData = getOnChainSongData(songId);
  if (!onChainData) return BigInt(0);
  
  const provider = getWalletProvider();
  if (!provider) {
    console.warn("No wallet provider available for balance check");
    return BigInt(0);
  }
  
  try {
    const data = encodeFunctionCall("balanceOf", [userAddress, onChainData.songId]);
    
    const result = await provider.request({
      method: "eth_call",
      params: [
        {
          to: SONG_REGISTRY_ADDRESS,
          data
        },
        "latest"
      ]
    });
    
    return BigInt(result || "0");
  } catch (error) {
    console.error("Error checking song balance:", error);
    return BigInt(0);
  }
}

/**
 * Get song price from the smart contract
 */
export async function getSongPriceFromContract(songId: string): Promise<bigint | null> {
  const onChainData = getOnChainSongData(songId);
  if (!onChainData) return null;
  
  const provider = getWalletProvider();
  if (!provider) return null;
  
  try {
    const data = encodeFunctionCall("getSongPrice", [onChainData.songId]);
    
    const result = await provider.request({
      method: "eth_call",
      params: [
        {
          to: SONG_REGISTRY_ADDRESS,
          data
        },
        "latest"
      ]
    });
    
    return result ? BigInt(result) : null;
  } catch (error) {
    console.error("Error fetching song price:", error);
    return null;
  }
}

/**
 * Wait for a transaction to be confirmed on the blockchain
 * Returns the transaction receipt once confirmed
 */
export async function waitForTransaction(
  txHash: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<{ confirmed: boolean; receipt?: any; error?: string }> {
  const provider = getWalletProvider();
  if (!provider) {
    return { confirmed: false, error: "No wallet provider" };
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const receipt = await provider.request({
        method: "eth_getTransactionReceipt",
        params: [txHash]
      });

      if (receipt) {
        // Check if transaction was successful (status = 0x1)
        const status = receipt.status;
        if (status === "0x1" || status === 1) {
          return { confirmed: true, receipt };
        } else {
          return { confirmed: false, error: "Transaction reverted on chain" };
        }
      }

      // Transaction not yet mined, wait and retry
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error("Error checking transaction receipt:", error);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return { confirmed: false, error: "Transaction confirmation timeout" };
}

/**
 * Buy/unlock a song by sending ETH to the contract
 * The contract automatically handles:
 * - 95% to artist wallet
 * - 5% to SongChainn treasury
 * - Minting ERC-1155 tokens to buyer
 * 
 * This function waits for blockchain confirmation before returning success
 */
export async function buySong(
  songId: string,
  amount: number = 1,
  priceWei: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const onChainData = getOnChainSongData(songId);
  if (!onChainData) {
    return { success: false, error: "Song not found on-chain" };
  }
  
  const provider = getWalletProvider();
  if (!provider) {
    return { success: false, error: "No wallet connected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet." };
  }
  
  try {
    // Get connected account
    onStatusUpdate?.("Connecting to wallet...");
    const accounts = await provider.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      // Try to request accounts if none connected
      try {
        const requestedAccounts = await provider.request({ method: "eth_requestAccounts" });
        if (!requestedAccounts || requestedAccounts.length === 0) {
          return { success: false, error: "No wallet connected" };
        }
      } catch (e) {
        return { success: false, error: "Please connect your wallet" };
      }
    }
    
    const currentAccounts = await provider.request({ method: "eth_accounts" });
    const from = currentAccounts[0];
    
    // Check current chain and switch if needed
    onStatusUpdate?.("Checking network...");
    try {
      const currentChainId = await provider.request({ method: "eth_chainId" });
      
      if (currentChainId !== BASE_CHAIN_ID_HEX) {
        onStatusUpdate?.("Switching to Base network...");
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_ID_HEX }]
          });
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            // Chain not added, add it
            onStatusUpdate?.("Adding Base network...");
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: BASE_CHAIN_ID_HEX,
                chainName: "Base",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"]
              }]
            });
          } else if (switchError?.code === 4001) {
            return { success: false, error: "Please switch to Base network to continue" };
          } else {
            throw switchError;
          }
        }
        
        // Wait a moment for chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (chainError: any) {
      console.error("Chain switch error:", chainError);
      // Continue anyway, wallet might handle it
    }
    
    // Encode buySong call with correct function selector
    onStatusUpdate?.("Preparing transaction...");
    const data = encodeFunctionCall("buySong", [onChainData.songId, amount]);
    
    if (data === "0x") {
      return { success: false, error: "Failed to encode transaction" };
    }
    
    // Prepare transaction - let wallet handle gas estimation for reliability
    const txParams: any = {
      from,
      to: SONG_REGISTRY_ADDRESS,
      value: `0x${BigInt(priceWei).toString(16)}`,
      data
    };

    // Send transaction - wallet will prompt user with current gas fees
    onStatusUpdate?.("Confirm transaction in wallet...");
    
    let txHash: string;
    try {
      txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [txParams]
      });
    } catch (sendError: any) {
      if (sendError?.code === 4001) {
        return { success: false, error: "Transaction cancelled" };
      }
      if (sendError?.message?.includes("insufficient") || sendError?.message?.includes("funds")) {
        return { success: false, error: "Insufficient ETH for transaction + gas fees" };
      }
      throw sendError;
    }
    
    if (!txHash) {
      return { success: false, error: "No transaction hash received" };
    }

    // Wait for transaction confirmation on blockchain
    onStatusUpdate?.("Transaction sent! Waiting for confirmation...");
    
    // Poll for confirmation with progress updates
    const maxAttempts = 90; // 3 minutes max
    const intervalMs = 2000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0 && attempt % 5 === 0) {
        onStatusUpdate?.(`Confirming on blockchain... (${Math.floor(attempt * intervalMs / 1000)}s)`);
      }
      
      try {
        const receipt = await provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash]
        });

        if (receipt) {
          const status = receipt.status;
          if (status === "0x1" || status === 1) {
            onStatusUpdate?.("Transaction confirmed!");
            return { success: true, txHash };
          } else {
            return { 
              success: false, 
              txHash,
              error: "Transaction failed on blockchain. The contract may have rejected it." 
            };
          }
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.error("Error checking receipt:", error);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    // Transaction was sent but not confirmed in time
    return { 
      success: false, 
      txHash,
      error: "Transaction pending. Check BaseScan for status." 
    };
    
  } catch (error: any) {
    console.error("Purchase error:", error);
    
    if (error?.code === 4001) {
      return { success: false, error: "Transaction cancelled" };
    }
    if (error?.code === -32603) {
      return { success: false, error: "Transaction failed. Please ensure you have enough ETH for gas." };
    }
    if (error?.code === -32000) {
      return { success: false, error: "Transaction underpriced. Network may be congested." };
    }
    if (error?.message?.includes("insufficient")) {
      return { success: false, error: "Insufficient ETH balance" };
    }
    if (error?.message?.includes("nonce")) {
      return { success: false, error: "Transaction error. Please refresh and try again." };
    }
    
    return { success: false, error: error?.message || "Transaction failed. Please try again." };
  }
}

/**
 * Format Wei to ETH string for display
 */
export function formatEthPrice(weiString: string): string {
  const wei = BigInt(weiString);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

/**
 * Parse ETH string to Wei
 */
export function parseEthToWei(ethAmount: string): string {
  const eth = parseFloat(ethAmount);
  const wei = BigInt(Math.floor(eth * 1e18));
  return wei.toString();
}
