/**
 * SongChain Immersive™ Audio Engine
 * Mandatory immersive audio processing for all playback
 */

export type Genre = 'trap' | 'kalind-rock' | 'kali-funk' | 'afro' | 'dancehall' | 'fusion';

export interface GenreProfile {
  name: Genre;
  bass: { gain: number; frequency: number };
  mids: { gain: number; frequency: number; q: number };
  highs: { gain: number; frequency: number };
  spatialWidth: number;
  spatialDepth: number;
  harmonicExcitement: number;
  compressionRatio: number;
  attack: number;
  release: number;
}

export interface AudioAnalysis {
  bass: number;
  mids: number;
  highs: number;
  energy: number;
  tempo: number;
}

const GENRE_PROFILES: Record<Genre, GenreProfile> = {
  trap: {
    name: 'trap',
    bass: { gain: 4, frequency: 60 },
    mids: { gain: -1, frequency: 1000, q: 1 },
    highs: { gain: 2, frequency: 8000 },
    spatialWidth: 0.8,
    spatialDepth: 0.6,
    harmonicExcitement: 0.4,
    compressionRatio: 4,
    attack: 0.003,
    release: 0.15,
  },
  'kalind-rock': {
    name: 'kalind-rock',
    bass: { gain: 2, frequency: 80 },
    mids: { gain: 3, frequency: 2000, q: 0.8 },
    highs: { gain: 1, frequency: 6000 },
    spatialWidth: 0.9,
    spatialDepth: 0.7,
    harmonicExcitement: 0.5,
    compressionRatio: 3,
    attack: 0.005,
    release: 0.2,
  },
  'kali-funk': {
    name: 'kali-funk',
    bass: { gain: 3, frequency: 100 },
    mids: { gain: 2, frequency: 800, q: 1.2 },
    highs: { gain: 1, frequency: 5000 },
    spatialWidth: 0.7,
    spatialDepth: 0.5,
    harmonicExcitement: 0.35,
    compressionRatio: 3,
    attack: 0.008,
    release: 0.25,
  },
  afro: {
    name: 'afro',
    bass: { gain: 3.5, frequency: 80 },
    mids: { gain: 1, frequency: 1200, q: 1 },
    highs: { gain: 2, frequency: 7000 },
    spatialWidth: 0.85,
    spatialDepth: 0.8,
    harmonicExcitement: 0.3,
    compressionRatio: 2.5,
    attack: 0.01,
    release: 0.3,
  },
  dancehall: {
    name: 'dancehall',
    bass: { gain: 5, frequency: 70 },
    mids: { gain: 1.5, frequency: 2500, q: 0.9 },
    highs: { gain: 1, frequency: 6000 },
    spatialWidth: 0.6,
    spatialDepth: 0.4,
    harmonicExcitement: 0.45,
    compressionRatio: 4.5,
    attack: 0.002,
    release: 0.1,
  },
  fusion: {
    name: 'fusion',
    bass: { gain: 2.5, frequency: 90 },
    mids: { gain: 1.5, frequency: 1500, q: 1 },
    highs: { gain: 2.5, frequency: 8000 },
    spatialWidth: 0.75,
    spatialDepth: 0.65,
    harmonicExcitement: 0.35,
    compressionRatio: 3,
    attack: 0.006,
    release: 0.2,
  },
};

class ImmersiveAudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private inputNode: GainNode | null = null;
  
  // DSP Chain Nodes
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private stereoWidener: StereoPannerNode | null = null;
  private convolver: ConvolverNode | null = null;
  private delayLeft: DelayNode | null = null;
  private delayRight: DelayNode | null = null;
  private channelSplitter: ChannelSplitterNode | null = null;
  private channelMerger: ChannelMergerNode | null = null;
  private harmonicGain: GainNode | null = null;
  private harmonicDistortion: WaveShaperNode | null = null;
  
  // Analysis
  private frequencyData: Uint8Array | null = null;
  private currentGenre: Genre = 'afro';
  private analysisCallbacks: Set<(analysis: AudioAnalysis) => void> = new Set();
  private animationFrameId: number | null = null;
  
  // Connected audio elements - Map to store source nodes
  private connectedElements: Map<HTMLAudioElement, MediaElementAudioSourceNode> = new Map();

  constructor() {
    // Engine is created but not initialized until first audio
  }

  private createAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private initializeDSPChain(): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Create analyzer for visual feedback
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);

    // Shared input node (lets us mix multiple sources during crossfades)
    this.inputNode = ctx.createGain();
    this.inputNode.gain.value = 1.0;

    // Master gain
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;

    // EQ Section - 3-band parametric EQ
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 80;
    this.bassFilter.gain.value = 3;

    this.midFilter = ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1;
    this.midFilter.gain.value = 1;

    this.highFilter = ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 6000;
    this.highFilter.gain.value = 2;

    // Dynamics - Transparent compression
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.2;

    // Binaural Stereo Widening
    this.channelSplitter = ctx.createChannelSplitter(2);
    this.channelMerger = ctx.createChannelMerger(2);

    this.delayLeft = ctx.createDelay(0.1);
    this.delayLeft.delayTime.value = 0.0003; // 0.3ms Haas effect

    this.delayRight = ctx.createDelay(0.1);
    this.delayRight.delayTime.value = 0.0005; // 0.5ms for width

    // Stereo panner for additional width
    this.stereoWidener = ctx.createStereoPanner();
    this.stereoWidener.pan.value = 0;

    // Harmonic Enhancement - Subtle saturation
    this.harmonicDistortion = ctx.createWaveShaper();
    (this.harmonicDistortion as any).curve = this.createHarmonicCurve(0.3);
    this.harmonicDistortion.oversample = '2x';

    this.harmonicGain = ctx.createGain();
    this.harmonicGain.gain.value = 0.15; // Blend amount

    // Create spatial impulse for depth
    this.convolver = ctx.createConvolver();
    this.createSpatialImpulse();

    // Wire DSP chain ONCE (do not rebuild per element, it causes duplicate connections + slowdowns)
    if (
      this.inputNode &&
      this.bassFilter &&
      this.midFilter &&
      this.highFilter &&
      this.compressor &&
      this.channelSplitter &&
      this.delayLeft &&
      this.delayRight &&
      this.channelMerger &&
      this.convolver &&
      this.harmonicDistortion &&
      this.harmonicGain &&
      this.gainNode &&
      this.analyserNode
    ) {
      // Input -> EQ
      this.inputNode.connect(this.bassFilter);
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.highFilter);

      // EQ -> Compressor
      this.highFilter.connect(this.compressor);

      // Compressor -> Split (Haas micro-delays)
      this.compressor.connect(this.channelSplitter);
      this.channelSplitter.connect(this.delayLeft, 0);
      this.channelSplitter.connect(this.delayRight, 1);

      // Merge back
      this.delayLeft.connect(this.channelMerger, 0, 0);
      this.delayRight.connect(this.channelMerger, 0, 1);

      // Depth
      this.channelMerger.connect(this.convolver);

      // Parallel harmonic path
      this.compressor.connect(this.harmonicDistortion);
      this.harmonicDistortion.connect(this.harmonicGain);

      // Mix + output
      this.convolver.connect(this.gainNode);
      this.harmonicGain.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(ctx.destination);
    }

    // Apply initial genre profile
    this.applyGenreProfile(this.currentGenre);

    // Start analysis loop
    this.startAnalysisLoop();
  }

  private createHarmonicCurve(amount: number): Float32Array | null {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Soft clipping with harmonic generation
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  private createSpatialImpulse(): void {
    if (!this.audioContext || !this.convolver) return;
    
    const ctx = this.audioContext;
    const length = ctx.sampleRate * 0.15; // 150ms impulse
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-3 * i / length);
      // Subtle early reflections for depth, not reverb
      const reflection = (Math.random() * 2 - 1) * 0.08 * decay;
      leftChannel[i] = reflection;
      rightChannel[i] = reflection * 0.9; // Slight stereo variation
    }
    
    this.convolver.buffer = impulse;
  }

  connectAudioElement(audioElement: HTMLAudioElement): void {
    const ctx = this.createAudioContext();

    if (!this.analyserNode) {
      this.initializeDSPChain();
    }

    // Resume context if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Already connected
    if (this.connectedElements.has(audioElement)) return;

    // Create source from audio element
    let sourceNode: MediaElementAudioSourceNode;
    try {
      sourceNode = ctx.createMediaElementSource(audioElement);
      this.connectedElements.set(audioElement, sourceNode);
    } catch (e) {
      const existingSource = this.connectedElements.get(audioElement);
      if (existingSource) {
        sourceNode = existingSource;
      } else {
        console.warn('Audio element already connected to different context');
        return;
      }
    }

    // Route into shared DSP input (supports multiple simultaneous sources for crossfades)
    if (this.inputNode) {
      sourceNode.connect(this.inputNode);
    } else {
      // Fallback: still let audio play even if DSP isn't ready
      sourceNode.connect(ctx.destination);
    }
  }

  applyGenreProfile(genre: Genre): void {
    this.currentGenre = genre;
    const profile = GENRE_PROFILES[genre];
    
    if (!profile) return;
    
    const transitionTime = 0.5; // Smooth 500ms transition
    const now = this.audioContext?.currentTime ?? 0;

    // Apply EQ settings with smooth transition
    if (this.bassFilter) {
      this.bassFilter.frequency.linearRampToValueAtTime(profile.bass.frequency, now + transitionTime);
      this.bassFilter.gain.linearRampToValueAtTime(profile.bass.gain, now + transitionTime);
    }
    
    if (this.midFilter) {
      this.midFilter.frequency.linearRampToValueAtTime(profile.mids.frequency, now + transitionTime);
      this.midFilter.Q.linearRampToValueAtTime(profile.mids.q, now + transitionTime);
      this.midFilter.gain.linearRampToValueAtTime(profile.mids.gain, now + transitionTime);
    }
    
    if (this.highFilter) {
      this.highFilter.frequency.linearRampToValueAtTime(profile.highs.frequency, now + transitionTime);
      this.highFilter.gain.linearRampToValueAtTime(profile.highs.gain, now + transitionTime);
    }

    // Apply dynamics settings
    if (this.compressor) {
      this.compressor.ratio.linearRampToValueAtTime(profile.compressionRatio, now + transitionTime);
      this.compressor.attack.linearRampToValueAtTime(profile.attack, now + transitionTime);
      this.compressor.release.linearRampToValueAtTime(profile.release, now + transitionTime);
    }

    // Apply spatial settings via delay modulation
    if (this.delayLeft && this.delayRight) {
      const baseDelay = 0.0003;
      const widthDelay = baseDelay + (profile.spatialWidth * 0.0007);
      this.delayLeft.delayTime.linearRampToValueAtTime(baseDelay, now + transitionTime);
      this.delayRight.delayTime.linearRampToValueAtTime(widthDelay, now + transitionTime);
    }

    // Adjust harmonic excitement
    if (this.harmonicGain) {
      this.harmonicGain.gain.linearRampToValueAtTime(profile.harmonicExcitement * 0.3, now + transitionTime);
    }
    
    // Update harmonic curve for genre
    if (this.harmonicDistortion) {
      (this.harmonicDistortion as any).curve = this.createHarmonicCurve(profile.harmonicExcitement);
    }
  }

  private startAnalysisLoop(): void {
    const analyze = () => {
      if (!this.analyserNode || !this.frequencyData) return;
      
      (this.analyserNode as any).getByteFrequencyData(this.frequencyData);
      
      const bufferLength = this.frequencyData.length;
      
      // Calculate band energies
      const bassEnd = Math.floor(bufferLength * 0.15);
      const midEnd = Math.floor(bufferLength * 0.5);
      
      let bassSum = 0;
      let midSum = 0;
      let highSum = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const value = this.frequencyData[i] / 255;
        if (i < bassEnd) {
          bassSum += value;
        } else if (i < midEnd) {
          midSum += value;
        } else {
          highSum += value;
        }
      }
      
      const bass = bassSum / bassEnd;
      const mids = midSum / (midEnd - bassEnd);
      const highs = highSum / (bufferLength - midEnd);
      const energy = (bass + mids + highs) / 3;
      
      // Simple tempo estimation from energy variance
      const tempo = 60 + (energy * 80); // Rough approximation
      
      const analysis: AudioAnalysis = { bass, mids, highs, energy, tempo };
      
      // Adaptive mood processing
      this.adaptToMood(analysis);
      
      // Notify subscribers
      this.analysisCallbacks.forEach(cb => cb(analysis));
      
      this.animationFrameId = requestAnimationFrame(analyze);
    };
    
    this.animationFrameId = requestAnimationFrame(analyze);
  }

  private adaptToMood(analysis: AudioAnalysis): void {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const transitionTime = 0.1; // Fast 100ms adaptation
    
    // Calm tracks: enhance width and warmth
    if (analysis.energy < 0.3) {
      if (this.delayRight) {
        this.delayRight.delayTime.linearRampToValueAtTime(0.001, now + transitionTime);
      }
      if (this.bassFilter) {
        this.bassFilter.gain.linearRampToValueAtTime(
          GENRE_PROFILES[this.currentGenre].bass.gain + 1, 
          now + transitionTime
        );
      }
    }
    // Energetic tracks: tighten and punch
    else if (analysis.energy > 0.7) {
      if (this.compressor) {
        this.compressor.ratio.linearRampToValueAtTime(
          Math.min(6, GENRE_PROFILES[this.currentGenre].compressionRatio + 1),
          now + transitionTime
        );
      }
      if (this.harmonicGain) {
        this.harmonicGain.gain.linearRampToValueAtTime(0.25, now + transitionTime);
      }
    }
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
    
    (this.analyserNode as any).getByteFrequencyData(this.frequencyData);
    
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
    
    const bass = bassSum / bassEnd;
    const mids = midSum / (midEnd - bassEnd);
    const highs = highSum / (bufferLength - midEnd);
    const energy = (bass + mids + highs) / 3;
    const tempo = 60 + (energy * 80);
    
    return { bass, mids, highs, energy, tempo };
  }

  subscribeToAnalysis(callback: (analysis: AudioAnalysis) => void): () => void {
    this.analysisCallbacks.add(callback);
    return () => this.analysisCallbacks.delete(callback);
  }

  getFrequencyData(): Uint8Array | null {
    return this.frequencyData;
  }

  getCurrentGenre(): Genre {
    return this.currentGenre;
  }

  resumeContext(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.analysisCallbacks.clear();
    this.connectedElements.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.sourceNode = null;
    this.analyserNode = null;
  }
}

// Singleton instance - mandatory for all playback
export const immersiveEngine = new ImmersiveAudioEngine();

export default ImmersiveAudioEngine;
