import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '../ui/button';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [totalDuration, setTotalDuration] = useState('00:00:00');
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    // Initialize Wavesurfer instance
    const ws = WaveSurfer.create({
      container: waveformRef.current!,
      height: 65,
      waveColor: '#B794F4',
      progressColor: '#B871FF',
    });
    ws.load(audioUrl);
    setWavesurfer(ws);

    // Setup Wavesurfer events
    ws.on('ready', () => {
      setTotalDuration(formatTime(ws.getDuration()));
    });
    ws.on('audioprocess', () => {
      setCurrentTime(formatTime(ws.getCurrentTime()));
    });
    ws.on('finish', () => {
      setIsPlaying(false);
    });

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

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
    <div className="w-full max-w-4xl mx-auto bg-dark-3 rounded-lg shadow-lg p-2 sm:p-4 overflow-x-auto custom-scrollbar">
      <div className="flex flex-row items-center gap-2 xs:gap-4 min-w-[300px]">
        {/* Play/Pause Button */}
        <Button className="flex p-1 m-1.5  items-center justify-center sm:w-1/6 sm:h-auto">
          <img
            id="playButtonIcon"
            className="w-[60px] h-[60px] sm:w-[55px] sm:h-[55px]"
            src={
              isPlaying ? '/assets/icons/pause.svg' : '/assets/icons/play.svg'
            }
            alt="Play/Pause"
            onClick={togglePlayPause}
          />
        </Button>

        {/* Player Body */}
        <div className="flex flex-col w-full">
          {/* Waveform */}
          <div
            id="waveform"
            ref={waveformRef}
            className="w-full mt-1 sm:mt-2 bg-dark-4 rounded-md"
          ></div>

          {/* Controls */}
          <div className="flex flex-row items-start justify-between mt-2 sm:mt-4 gap-2 sm:gap-0">
            {/* Volume Control */}
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

            {/* Timecode */}
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
