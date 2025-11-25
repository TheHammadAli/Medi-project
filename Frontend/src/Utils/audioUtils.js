/**
 * Enhanced Audio Utilities for WebRTC Calls
 * Provides optimized audio constraints, Web Audio API processing, and debugging tools
 */

// Enhanced audio constraints for optimal call quality
export const getOptimalAudioConstraints = () => {
  return {
    echoCancellation: { ideal: true, exact: true },
    noiseSuppression: { ideal: true, exact: true },
    autoGainControl: { ideal: true, exact: true },
    sampleRate: { ideal: 48000, min: 44100 },
    channelCount: { ideal: 2, min: 1 },
    volume: { ideal: 1.0, max: 1.0 },
    latency: { ideal: 0.01, max: 0.1 },
    // Advanced constraints for better noise handling
    googEchoCancellation: { ideal: true },
    googNoiseSuppression: { ideal: true },
    googAutoGainControl: { ideal: true },
    googHighpassFilter: { ideal: true },
    googAudioMirroring: { ideal: false },
    // Additional constraints for professional audio quality
    advanced: [
      { echoCancellation: { exact: true } },
      { noiseSuppression: { exact: true } },
      { autoGainControl: { exact: true } },
      { googEchoCancellation: { exact: true } },
      { googNoiseSuppression: { exact: true } },
      { googAutoGainControl: { exact: true } }
    ]
  };
};

// Video constraints optimized for calls
export const getOptimalVideoConstraints = (isMobile = false) => {
  return {
    width: { ideal: isMobile ? 640 : 1280, min: 320 },
    height: { ideal: isMobile ? 480 : 720, min: 240 },
    frameRate: { ideal: 30, min: 15 },
    facingMode: { ideal: 'user' }
  };
};

// Web Audio API context for additional processing
class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.processor = null;
    this.highPassFilter = null;
    this.gainNode = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });

      // Create high-pass filter to remove low-frequency noise/hum
      this.highPassFilter = this.audioContext.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.setValueAtTime(80, this.audioContext.currentTime); // Remove frequencies below 80Hz
      this.highPassFilter.Q.setValueAtTime(1, this.audioContext.currentTime);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      // Connect nodes
      this.highPassFilter.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log('🎵 AudioProcessor initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AudioProcessor:', error);
      return false;
    }
  }

  async processStream(stream) {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('⚠️ AudioProcessor not initialized');
      return stream;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      const destination = this.audioContext.createMediaStreamDestination();

      // Connect through our processing chain
      source.connect(this.highPassFilter);
      this.gainNode.connect(destination);

      // Create new stream with processed audio
      const processedTracks = stream.getTracks().map(track => {
        if (track.kind === 'audio') {
          // Create new audio track from processed stream
          const processedStream = destination.stream;
          const processedTrack = processedStream.getAudioTracks()[0];
          return processedTrack;
        }
        return track;
      });

      // Create new MediaStream with processed tracks
      const processedStream = new MediaStream(processedTracks);

      // Stop original audio track to prevent conflicts
      stream.getAudioTracks().forEach(track => track.stop());

      console.log('🎵 Audio stream processed with high-pass filter');
      return processedStream;
    } catch (error) {
      console.error('❌ Error processing audio stream:', error);
      return stream;
    }
  }

  setVolume(volume) {
    if (this.gainNode && this.isInitialized) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.processor = null;
    this.highPassFilter = null;
    this.gainNode = null;
    this.isInitialized = false;
  }
}

// Global audio processor instance
export const audioProcessor = new AudioProcessor();

// Enhanced getUserMedia function with constraint verification
export const getUserMediaWithConstraints = async (type = 'audio', options = {}) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  try {
    const constraints = {
      audio: type === 'audio' ? getOptimalAudioConstraints() : false,
      video: type === 'video' ? getOptimalVideoConstraints(isMobile) : false
    };

    console.log('🎤 Requesting media with constraints:', constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Verify applied constraints
    const verifiedConstraints = await verifyAppliedConstraints(stream);
    console.log('✅ Applied constraints verification:', verifiedConstraints);

    // For WebRTC calls, return original stream without Web Audio API processing
    // to ensure compatibility with peer connections
    if (options.forWebRTC) {
      console.log('🎧 WebRTC mode: Skipping audio processing for compatibility');
      return stream;
    }

    // Process audio stream for local playback only (not for WebRTC)
    if (type === 'audio' && stream.getAudioTracks().length > 0) {
      await audioProcessor.initialize();
      const processedStream = await audioProcessor.processStream(stream);
      return processedStream;
    }

    return stream;
  } catch (error) {
    console.error('❌ Error getting user media:', error);

    // Fallback constraints if primary constraints fail
    if (error.name === 'OverconstrainedError' || error.name === 'NotSupportedError') {
      console.warn('⚠️ Primary constraints failed, trying fallback...');
      return await getUserMediaWithFallback(type, options);
    }

    throw error;
  }
};

// Fallback constraints for older browsers or restrictive devices
const getUserMediaWithFallback = async (type, options) => {
  const fallbackConstraints = {
    audio: type === 'audio' ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    } : false,
    video: type === 'video' ? {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 15 }
    } : false
  };

  console.log('🔄 Using fallback constraints:', fallbackConstraints);
  const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);

  if (type === 'audio' && stream.getAudioTracks().length > 0) {
    await audioProcessor.initialize();
    return await audioProcessor.processStream(stream);
  }

  return stream;
};

// Verify which constraints were actually applied
export const verifyAppliedConstraints = async (stream) => {
  const report = {
    audio: {},
    video: {},
    applied: {},
    notApplied: []
  };

  try {
    const track = stream.getAudioTracks()[0] || stream.getVideoTracks()[0];
    if (!track) return report;

    const constraints = track.getConstraints();
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    const settings = track.getSettings();

    console.log('🔍 Track constraints:', constraints);
    console.log('🔍 Track capabilities:', capabilities);
    console.log('🔍 Track settings:', settings);

    // Check audio constraints
    if (track.kind === 'audio') {
      const audioConstraints = [
        'echoCancellation', 'noiseSuppression', 'autoGainControl',
        'sampleRate', 'channelCount', 'volume', 'latency'
      ];

      audioConstraints.forEach(constraint => {
        if (constraints[constraint] !== undefined) {
          report.audio[constraint] = {
            requested: constraints[constraint],
            applied: settings[constraint],
            supported: capabilities[constraint] !== undefined
          };
          report.applied[constraint] = settings[constraint] !== undefined;
        } else {
          report.notApplied.push(constraint);
        }
      });
    }

    // Check video constraints
    if (track.kind === 'video') {
      const videoConstraints = ['width', 'height', 'frameRate', 'facingMode'];

      videoConstraints.forEach(constraint => {
        if (constraints[constraint] !== undefined) {
          report.video[constraint] = {
            requested: constraints[constraint],
            applied: settings[constraint],
            supported: capabilities[constraint] !== undefined
          };
          report.applied[constraint] = settings[constraint] !== undefined;
        } else {
          report.notApplied.push(constraint);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error verifying constraints:', error);
  }

  return report;
};

// Check if Opus codec is supported (WebRTC typically uses Opus by default)
export const checkOpusSupport = () => {
  const report = {
    isSupported: false,
    codecInfo: null,
    mimeTypes: []
  };

  try {
    // Check for Opus support in RTCRtpSender
    if (window.RTCRtpSender && RTCRtpSender.getCapabilities) {
      const capabilities = RTCRtpSender.getCapabilities('audio');
      if (capabilities && capabilities.codecs) {
        const opusCodec = capabilities.codecs.find(codec =>
          codec.mimeType.includes('opus')
        );

        if (opusCodec) {
          report.isSupported = true;
          report.codecInfo = opusCodec;
          console.log('🎵 Opus codec found:', opusCodec);
        }
      }
    }

    // Check MIME types
    if (navigator.mediaCapabilities) {
      navigator.mediaCapabilities.decodingInfo({
        type: 'file',
        audio: {
          contentType: 'audio/webm;codecs=opus'
        }
      }).then(info => {
        console.log('🎵 Opus decoding support:', info.supported);
      }).catch(err => {
        console.warn('⚠️ Could not check Opus decoding support:', err);
      });
    }

    // Check supported MIME types
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/opus',
      'audio/webm'
    ];

    mimeTypes.forEach(mimeType => {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        report.mimeTypes.push(mimeType);
      }
    });

  } catch (error) {
    console.error('❌ Error checking Opus support:', error);
  }

  return report;
};

// Audio quality monitoring
export const monitorAudioQuality = (stream) => {
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack) return null;

  const qualityMetrics = {
    sampleRate: null,
    channels: null,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    timestamp: Date.now()
  };

  try {
    const settings = audioTrack.getSettings();
    qualityMetrics.sampleRate = settings.sampleRate;
    qualityMetrics.channels = settings.channelCount;
    qualityMetrics.echoCancellation = settings.echoCancellation;
    qualityMetrics.noiseSuppression = settings.noiseSuppression;
    qualityMetrics.autoGainControl = settings.autoGainControl;

    console.log('📊 Audio quality metrics:', qualityMetrics);
  } catch (error) {
    console.error('❌ Error monitoring audio quality:', error);
  }

  return qualityMetrics;
};

// Cleanup function
export const cleanupAudioProcessor = () => {
  audioProcessor.cleanup();
};

// Debug function to log all audio devices and capabilities
export const debugAudioDevices = async () => {
  try {
    console.log('🔍 === AUDIO DEVICES DEBUG INFO ===');

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput');

    console.log('🎤 Audio input devices:', audioDevices);

    for (const device of audioDevices) {
      console.log(`  - ${device.label || 'Unnamed device'}:`, {
        deviceId: device.deviceId,
        groupId: device.groupId,
        kind: device.kind
      });
    }

    // Test constraints support
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    console.log('🎛️ Supported constraints:', supportedConstraints);

    // Check Opus support
    const opusSupport = checkOpusSupport();
    console.log('🎵 Opus codec support:', opusSupport);

    console.log('🔍 === END DEBUG INFO ===');
    return {
      devices: audioDevices,
      supportedConstraints,
      opusSupport
    };
  } catch (error) {
    console.error('❌ Error debugging audio devices:', error);
    return null;
  }
};

// Export all utilities
export default {
  getOptimalAudioConstraints,
  getOptimalVideoConstraints,
  getUserMediaWithConstraints,
  verifyAppliedConstraints,
  checkOpusSupport,
  monitorAudioQuality,
  cleanupAudioProcessor,
  debugAudioDevices,
  audioProcessor
};