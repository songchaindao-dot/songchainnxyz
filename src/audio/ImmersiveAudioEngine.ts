/**
 * Simple Surround Sound Audio Engine
 * Basic stereo widening without blocking audio playback
 */

// Keep Genre export for backward compatibility
export type Genre = 'trap' | 'kalind-rock' | 'kali-funk' | 'afro' | 'dancehall' | 'fusion';

export interface AudioAnalysis {
  bass: number;
  mids: number;
  highs: number;
  energy: number;
  tempo: number;
}

class ImmersiveAudioEngine {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private inputNode: GainNode | null = null;
  
  // Simple stereo widening
  private delayLeft: DelayNode | null = null;
  private delayRight: DelayNode | null = null;
  private channelSplitter: ChannelSplitterNode | null = null;
  private channelMerger: ChannelMergerNode | null = null;
  
  // Analysis
  private frequencyData: Uint8Array | null = null;
  private analysisCallbacks: Set<(analysis: AudioAnalysis) => void> = new Set();
  private animationFrameId: number | null = null;
  
  // Track connected elements to avoid double-connecting
  private connectedElements: WeakSet<HTMLAudioElement> = new WeakSet();
  private initialized = false;

  constructor() {}

  private createAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private initializeDSPChain(): void {
    if (this.initialized || !this.audioContext) return;
    
    try {
      const ctx = this.audioContext;

      // Create analyzer for visual feedback
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);

      // Shared input node
      this.inputNode = ctx.createGain();
      this.inputNode.gain.value = 1.0;

      // Master gain
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = 1.0;

      // Simple stereo widening with Haas effect
      this.channelSplitter = ctx.createChannelSplitter(2);
      this.channelMerger = ctx.createChannelMerger(2);

      this.delayLeft = ctx.createDelay(0.1);
      this.delayLeft.delayTime.value = 0.0003; // 0.3ms

      this.delayRight = ctx.createDelay(0.1);
      this.delayRight.delayTime.value = 0.0008; // 0.8ms for subtle width

      // Wire simple chain: input -> splitter -> delays -> merger -> gain -> analyzer -> output
      this.inputNode.connect(this.channelSplitter);
      this.channelSplitter.connect(this.delayLeft, 0);
      this.channelSplitter.connect(this.delayRight, 1);
      this.delayLeft.connect(this.channelMerger, 0, 0);
      this.delayRight.connect(this.channelMerger, 0, 1);
      this.channelMerger.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(ctx.destination);

      this.initialized = true;
      this.startAnalysisLoop();
    } catch (e) {
      console.warn('Failed to initialize audio DSP chain:', e);
      this.initialized = false;
    }
  }

  connectAudioElement(audioElement: HTMLAudioElement): void {
    // Already connected
    if (this.connectedElements.has(audioElement)) return;

    try {
      const ctx = this.createAudioContext();

      if (!this.initialized) {
        this.initializeDSPChain();
      }

      // Resume context if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Create source from audio element
      const sourceNode = ctx.createMediaElementSource(audioElement);
      this.connectedElements.add(audioElement);

      // Route into DSP if available, otherwise direct to output
      if (this.inputNode && this.initialized) {
        sourceNode.connect(this.inputNode);
      } else {
        // Fallback: direct connection ensures audio plays
        sourceNode.connect(ctx.destination);
      }
    } catch (e) {
      console.warn('Audio element connection failed, audio will play without enhancement:', e);
      // Don't block - audio will still play through default output
    }
  }

  // No-op for backward compatibility
  applyGenreProfile(_genre: string): void {}

  resumeContext(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  private startAnalysisLoop(): void {
    const analyze = () => {
      if (!this.analyserNode || !this.frequencyData) {
        this.animationFrameId = requestAnimationFrame(analyze);
        return;
      }
      
      this.analyserNode.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
      
      const bufferLength = this.frequencyData.length;
      const bassEnd = Math.floor(bufferLength * 0.15);
      const midEnd = Math.floor(bufferLength * 0.5);
      
      let bassSum = 0, midSum = 0, highSum = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const value = this.frequencyData[i] / 255;
        if (i < bassEnd) bassSum += value;
        else if (i < midEnd) midSum += value;
        else highSum += value;
      }
      
      const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
      const mids = (midEnd - bassEnd) > 0 ? midSum / (midEnd - bassEnd) : 0;
      const highs = (bufferLength - midEnd) > 0 ? highSum / (bufferLength - midEnd) : 0;
      const energy = (bass + mids + highs) / 3;
      const tempo = 60 + (energy * 80);
      
      const analysis: AudioAnalysis = { bass, mids, highs, energy, tempo };
      this.analysisCallbacks.forEach(cb => cb(analysis));
      
      this.animationFrameId = requestAnimationFrame(analyze);
    };
    
    this.animationFrameId = requestAnimationFrame(analyze);
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getAnalysis(): AudioAnalysis {
    if (!this.analyserNode || !this.frequencyData) {
      return { bass: 0, mids: 0, highs: 0, energy: 0, tempo: 0 };
    }
    
    this.analyserNode.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
    
    const bufferLength = this.frequencyData.length;
    const bassEnd = Math.floor(bufferLength * 0.15);
    const midEnd = Math.floor(bufferLength * 0.5);
    
    let bassSum = 0, midSum = 0, highSum = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const value = this.frequencyData[i] / 255;
      if (i < bassEnd) bassSum += value;
      else if (i < midEnd) midSum += value;
      else highSum += value;
    }
    
    const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
    const mids = (midEnd - bassEnd) > 0 ? midSum / (midEnd - bassEnd) : 0;
    const highs = (bufferLength - midEnd) > 0 ? highSum / (bufferLength - midEnd) : 0;
    const energy = (bass + mids + highs) / 3;
    const tempo = 60 + (energy * 80);
    
    return { bass, mids, highs, energy, tempo };
  }

  subscribeToAnalysis(callback: (analysis: AudioAnalysis) => void): () => void {
    this.analysisCallbacks.add(callback);
    return () => this.analysisCallbacks.delete(callback);
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.audioContext?.close();
    this.audioContext = null;
    this.initialized = false;
  }
}

// Singleton instance
export const immersiveEngine = new ImmersiveAudioEngine();
