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
 * Encode function call data for contract interaction
 */
function encodeFunctionCall(functionName: string, params: any[]): string {
  if (functionName === "balanceOf") {
    const [account, id] = params;
    const selector = "00fdd58e"; // keccak256("balanceOf(address,uint256)").slice(0,8)
    const addressPadded = account.slice(2).toLowerCase().padStart(64, "0");
    const idPadded = BigInt(id).toString(16).padStart(64, "0");
    return `0x${selector}${addressPadded}${idPadded}`;
  }
  
  if (functionName === "buySong") {
    const [songId, amount] = params;
    const selector = "d96a094a"; // Placeholder - actual selector depends on contract
    const songIdPadded = BigInt(songId).toString(16).padStart(64, "0");
    const amountPadded = BigInt(amount).toString(16).padStart(64, "0");
    return `0x${selector}${songIdPadded}${amountPadded}`;
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
 * Buy/unlock a song by sending ETH to the contract
 * The contract automatically handles:
 * - 95% to artist wallet
 * - 5% to SongChainn treasury
 * - Minting ERC-1155 tokens to buyer
 */
export async function buySong(
  songId: string,
  amount: number = 1,
  priceWei: string
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
    const accounts = await provider.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "No wallet connected" };
    }
    
    const from = accounts[0];
    
    // Ensure on Base chain
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID_HEX }]
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
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
      }
    }
    
    // Encode buySong call
    const data = encodeFunctionCall("buySong", [onChainData.songId, amount]);
    
    // Send transaction
    const txHash = await provider.request({
      method: "eth_sendTransaction",
      params: [{
        from,
        to: SONG_REGISTRY_ADDRESS,
        value: `0x${BigInt(priceWei).toString(16)}`,
        data
      }]
    });
    
    return { success: true, txHash };
  } catch (error: any) {
    if (error?.code === 4001) {
      return { success: false, error: "Transaction rejected" };
    }
    console.error("Error buying song:", error);
    return { success: false, error: error?.message || "Transaction failed" };
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
