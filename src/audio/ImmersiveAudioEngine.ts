/**
 * Audio types for backward compatibility
 * No audio processing - plain HTML5 audio playback
 */

// Keep Genre export for data compatibility
export type Genre = 'trap' | 'kalind-rock' | 'kali-funk' | 'afro' | 'dancehall' | 'fusion';

export interface AudioAnalysis {
  bass: number;
  mids: number;
  highs: number;
  energy: number;
  tempo: number;
}

// Stub engine that does nothing - audio plays through normal HTML5
class ImmersiveAudioEngine {
  connectAudioElement(_audioElement: HTMLAudioElement): void {}
  applyGenreProfile(_genre: string): void {}
  resumeContext(): void {}
  setVolume(_volume: number): void {}
  getAnalysis(): AudioAnalysis {
    return { bass: 0, mids: 0, highs: 0, energy: 0, tempo: 0 };
  }
  subscribeToAnalysis(_callback: (analysis: AudioAnalysis) => void): () => void {
    return () => {};
  }
  destroy(): void {}
}

export const immersiveEngine = new ImmersiveAudioEngine();
