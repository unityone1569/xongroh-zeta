import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '../ui/button';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isInitialized = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [totalDuration, setTotalDuration] = useState('00:00:00');
  const [volume, setVolume] = useState(35);
  const [isLoading, setIsLoading] = useState(true);
  const lastPlayedPositionRef = useRef(0);

  useEffect(() => {
    if (!waveformRef.current || isInitialized.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 65,
      barWidth: 4,
      barGap: 6,
      barRadius: 16,
      waveColor: '#D4AAFF',
      progressColor: '#9C39FF',
      normalize: true,
    });

    wavesurferRef.current = ws;
    isInitialized.current = true;

    ws.on('ready', () => {
      setIsLoading(false);
      setTotalDuration(formatTime(ws.getDuration()));
      ws.setVolume(volume / 100);
      if (lastPlayedPositionRef.current > 0) {
        ws.seekTo(lastPlayedPositionRef.current / ws.getDuration());
      }
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      lastPlayedPositionRef.current = 0;
    });

    ws.on('audioprocess', () => {
      const currentTime = ws.getCurrentTime();
      lastPlayedPositionRef.current = currentTime;
      requestAnimationFrame(() => {
        setCurrentTime(formatTime(currentTime));
      });
    });

    ws.on('error', () => setIsLoading(false));

    setIsLoading(true);
    ws.load(audioUrl);

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []); // Empty dependency array - run once on mount

  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  };

  // Memoize handlers to prevent recreating on every render
  const handleVolumeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value) / 100;
    setVolume(Number(e.target.value));
    if (wavesurferRef.current) wavesurferRef.current.setVolume(newVolume);
  }, []);

  const toggleMute = React.useCallback(() => {
    if (wavesurferRef.current) {
      const isMuted = wavesurferRef.current.getMuted();
      wavesurferRef.current.setMuted(!isMuted);
      setVolume(!isMuted ? 0 : volume); // Reflect mute state
    }
  }, [volume]);

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto bg-dark-1 shadow-lg p-2 sm:p-4 overflow-x-auto custom-scrollbar border border-dark-3">
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

          {/* {isLoading && (
            <div className="w-full h-[65px] bg-dark-3 rounded-md animate-pulse absolute top-0 left-0" />
          )} */}

          <div className="flex flex-row items-start justify-between mt-2 sm:mt-4 gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <img
                id="volumeIcon"
                className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                src={
                  wavesurferRef.current?.getMuted()
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
