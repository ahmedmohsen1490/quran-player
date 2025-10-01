import React, { useRef, useState, useEffect } from 'react';
import { Surah, Reciter, Ayah } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { NextIcon } from './icons/NextIcon';
import { PrevIcon } from './icons/PrevIcon';

interface PlayerProps {
  surah: Surah | null;
  reciter: Reciter;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onEnded: () => void;
  audioSrc: string;
  currentAyah: Ayah | null;
  totalAyahs: number;
  onDurationChange: (duration: number) => void;
}

const Player: React.FC<PlayerProps> = ({
  surah,
  reciter,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onEnded,
  audioSrc,
  currentAyah,
  totalAyahs,
  onDurationChange,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioSrc) {
      if (audio.src !== audioSrc) {
        audio.src = audioSrc;
        setCurrentTime(0);
        setDuration(0);
        setProgress(0);
      }

      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Audio play failed", error);
            }
          });
        }
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [isPlaying, audioSrc]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
        setProgress(0);
        const audioDuration = audioRef.current.duration;
        if (isFinite(audioDuration)) {
          setDuration(audioDuration);
          onDurationChange(audioDuration);
        }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      audioRef.current.currentTime = (clickX / width) * duration;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!surah) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg shadow-t-lg z-20">
      <audio
        ref={audioRef}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          
          {/* Surah Info */}
          <div className="flex items-center min-w-0 w-1/4">
            <div className="mr-4 truncate">
              <p className="font-semibold text-text-primary font-amiri-quran text-lg truncate">{surah.name}</p>
              <p className="text-sm text-text-secondary truncate">{reciter.name}</p>
            </div>
          </div>

          {/* Player Controls & Progress */}
          <div className="flex flex-col items-center justify-center flex-grow mx-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                  <button
                      onClick={onPrev}
                      className="p-2 rounded-full text-text-primary hover:bg-border-color focus:outline-none"
                      aria-label="Previous Surah"
                  >
                      <PrevIcon className="w-6 h-6" />
                  </button>
                  <button
                      onClick={onPlayPause}
                      className="p-3 rounded-full bg-primary text-white shadow-lg hover:opacity-90 focus:outline-none"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                      {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
                  </button>
                  <button
                      onClick={onNext}
                      className="p-2 rounded-full text-text-primary hover:bg-border-color focus:outline-none"
                      aria-label="Next Surah"
                  >
                      <NextIcon className="w-6 h-6" />
                  </button>
              </div>
              <div className="w-full flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-text-secondary w-10 text-center">{formatTime(currentTime)}</span>
                  <div 
                      className="w-full bg-border-color rounded-full h-1.5 cursor-pointer group" 
                      onClick={handleProgressClick}
                      role="slider"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Audio progress"
                  >
                      <div className="bg-primary h-1.5 rounded-full relative" style={{ width: `${progress}%` }}>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow border-2 border-primary transition-transform group-hover:scale-110"></div>
                      </div>
                  </div>
                  <span className="text-xs font-mono text-text-secondary w-10 text-center">{formatTime(duration)}</span>
              </div>
          </div>

          {/* Ayah Count */}
          <div className="w-1/4 text-right">
            {totalAyahs > 0 && currentAyah && (
              <p className="text-sm text-text-secondary">
                الآية {currentAyah.numberInSurah} / {totalAyahs}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Player;