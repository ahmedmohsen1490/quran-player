import React from 'react';
import { Reciter, Surah } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { TrophyIcon } from './icons/TrophyIcon';

interface HeaderProps {
  reciters: Reciter[];
  selectedReciter: Reciter | null;
  onReciterChange: (reciter: Reciter) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentSurah: Surah | null;
  onSettingsClick: () => void;
  onChallengeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ reciters, selectedReciter, onReciterChange, isDarkMode, onToggleDarkMode, currentSurah, onSettingsClick, onChallengeClick }) => {
  const handleReciterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const reciterIdentifier = event.target.value;
    const reciter = reciters.find(r => r.identifier === reciterIdentifier);
    if (reciter) {
      onReciterChange(reciter);
    }
  };

  return (
    <header className="bg-card/70 dark:bg-card/70 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">مشغل القرآن</h1>
          </div>
          
          <div className="flex-1 text-center truncate">
            {currentSurah && (
              <div className="text-text-primary animate-fade-in">
                <span className="font-amiri-quran text-xl">{currentSurah.name}</span>
                <span className="text-sm mx-2">({currentSurah.id})</span>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
            <select
              value={selectedReciter?.identifier || ''}
              onChange={handleReciterChange}
              disabled={!selectedReciter || reciters.length === 0}
              className="bg-background dark:bg-card border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full max-w-[200px] sm:max-w-xs p-2.5"
            >
              {reciters.length === 0 && <option>Loading...</option>}
              {reciters.map(reciter => (
                <option key={reciter.identifier} value={reciter.identifier}>{reciter.name}</option>
              ))}
            </select>
            <button
              onClick={onChallengeClick}
              className="p-2 rounded-full text-text-secondary hover:bg-border-color focus:outline-none"
              aria-label="Quran Challenge"
            >
              <TrophyIcon className="w-6 h-6" />
            </button>
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-full text-text-secondary hover:bg-border-color focus:outline-none"
              aria-label="Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-text-secondary hover:bg-border-color focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;