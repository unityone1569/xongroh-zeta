import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '../ui/button';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [totalDuration, setTotalDuration] = useState('00:00:00');
  const [volume, setVolume] = useState(35);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Wait for container to be ready
    const container = waveformRef.current;
    if (!container || !isVisible) return;

    let ws: WaveSurfer | null = null;
    
    try {
      // Create WaveSurfer instance
      ws = WaveSurfer.create({
        container,
        height: 65,
        barWidth: 4,
        barGap: 6,
        barRadius: 16,
        waveColor: '#D4AAFF',
        progressColor: '#9C39FF',
        normalize: true,
      });

      setWavesurfer(ws);
      setIsLoading(true);

      // Load audio
      ws.load(audioUrl);

      // Event handlers
      ws.on('ready', () => {
        setIsLoading(false);
        setTotalDuration(formatTime(ws!.getDuration()));
      });

      ws.on('error', () => {
        console.error('WaveSurfer error');
        setIsLoading(false);
      });

      ws.on('audioprocess', () => {
        setCurrentTime(formatTime(ws!.getCurrentTime()));
      });

    } catch (error) {
      console.error('WaveSurfer initialization failed:', error);
      setIsLoading(false);
    }

    return () => ws?.destroy();
  }, [audioUrl, isVisible]);

  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  };

  const togglePlayPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause();
      setIsPlaying(wavesurfer.isPlaying());
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value) / 100;
    setVolume(Number(e.target.value));
    if (wavesurfer) wavesurfer.setVolume(newVolume);
  };

  const toggleMute = () => {
    if (wavesurfer) {
      const isMuted = wavesurfer.getMuted();
      wavesurfer.setMuted(!isMuted);
      setVolume(!isMuted ? 0 : volume); // Reflect mute state
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto bg-dark-1 shadow-lg p-2 sm:p-4 overflow-x-auto custom-scrollbar">
      <div className="flex flex-row items-center gap-2 xs:gap-4 min-w-[300px]">
        <Button 
          className="flex p-1 m-1.5 items-center justify-center sm:w-1/6 sm:h-auto"
          disabled={isLoading}
          onClick={togglePlayPause}  // Move onClick here
        >
          <img
            id="playButtonIcon"
            className="w-[60px] h-[60px] sm:w-[55px] sm:h-[55px]"
            src={
              isPlaying ? '/assets/icons/pause.svg' : '/assets/icons/play.svg'
            }
            alt="Play/Pause"
          />
        </Button>

        <div className="flex flex-col w-full">
          <div
            id="waveform"
            ref={waveformRef}
            className="w-full h-[65px] mt-1 sm:mt-2 bg-dark-3 rounded-md"
          />
          {isLoading && (
            <div className="w-full h-[65px] bg-dark-3 rounded-md animate-pulse absolute top-0 left-0" />
          )}

          <div className="flex flex-row items-start justify-between mt-2 sm:mt-4 gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <img
                id="volumeIcon"
                className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                src={
                  wavesurfer?.getMuted()
                    ? '/assets/icons/mute.svg'
                    : '/assets/icons/volume.svg'
                }
                alt="Volume"
                onClick={toggleMute}
              />
              <input
                id="volumeSlider"
                className="volume-slider hidden xs:block"
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>

            <div className="flex items-center tiny-medium  gap-1 text-xs sm:text-sm text-light-3">
              <span id="currentTime">{currentTime}</span>
              <span>/</span>
              <span id="totalDuration">{totalDuration}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
