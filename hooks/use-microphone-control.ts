import { useState, useCallback, useRef, useEffect } from 'react';

export interface MicrophoneControlState {
  isMuted: boolean;
  isActive: boolean;
  audioLevel: number;
  error: string | null;
}

export const useMicrophoneControl = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context and analyzer for audio level monitoring
  const initializeAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      const source = audioContext.createMediaStreamSource(stream);
      analyserRef.current = audioContext.createAnalyser();
      micGainNodeRef.current = audioContext.createGain();
      
      // Set up analysis parameters
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Connect nodes: source -> gain -> analyser
      source.connect(micGainNodeRef.current);
      micGainNodeRef.current.connect(analyserRef.current);
      
      // Start monitoring audio levels
      const monitorAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      };
      
      monitorAudioLevel();
    } catch (err) {
      console.error('Error setting up audio analysis:', err);
      setError('Failed to initialize audio monitoring');
    }
  }, []);

  // Set the microphone stream (called from the main chat hook)
  const setMicrophoneStream = useCallback((stream: MediaStream | null) => {
    streamRef.current = stream;
    
    if (stream) {
      setIsActive(true);
      initializeAudioAnalysis(stream);
    } else {
      setIsActive(false);
      setAudioLevel(0);
      
      // Clean up audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [initializeAudioAnalysis]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    if (!streamRef.current) {
      setError('No active microphone stream');
      return;
    }

    try {
      const audioTracks = streamRef.current.getAudioTracks();
      const newMutedState = !isMuted;
      
      // Method 1: Use track enabled property
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
      
      // Method 2: Also use gain node if available
      if (micGainNodeRef.current) {
        micGainNodeRef.current.gain.setValueAtTime(
          newMutedState ? 0 : 1,
          audioContextRef.current?.currentTime || 0
        );
      }
      
      setIsMuted(newMutedState);
      setError(null);
    } catch (err) {
      console.error('Error toggling microphone mute:', err);
      setError('Failed to toggle microphone');
    }
  }, [isMuted]);

  // Mute microphone
  const muteMicrophone = useCallback(() => {
    if (isMuted) return;
    toggleMute();
  }, [isMuted, toggleMute]);

  // Unmute microphone
  const unmuteMicrophone = useCallback(() => {
    if (!isMuted) return;
    toggleMute();
  }, [isMuted, toggleMute]);

  // Get microphone state
  const getMicrophoneState = useCallback((): MicrophoneControlState => {
    return {
      isMuted,
      isActive,
      audioLevel,
      error
    };
  }, [isMuted, isActive, audioLevel, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isMuted,
    isActive,
    audioLevel,
    error,
    toggleMute,
    muteMicrophone,
    unmuteMicrophone,
    setMicrophoneStream,
    getMicrophoneState,
    setError
  };
};