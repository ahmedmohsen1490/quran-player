

import React from 'react';
import { Surah, Reciter } from '../types';
import { StarIcon } from './icons/StarIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CancelIcon } from './icons/CancelIcon';
import { DownloadTafsirIcon } from './icons/DownloadTafsirIcon';


interface SurahListProps {
  surahs: Surah[];
  onSurahSelect: (surah: Surah) => void;
  currentSurahId: number | null;
  favoriteSurahs: number[];
  onToggleFavorite: (surahId: number) => void;
  bookmarks: { [key: number]: number };
  selectedReciter: Reciter | null;
  downloadedSurahs: Set<string>;
  downloadProgress: { [key: string]: number };
  onDownloadSurah: (surah: Surah) => void;
  onCancelDownload: (surah: Surah) => void;
  downloadedTafsir: Set<number>;
  tafsirDownloadProgress: { [key: number]: number };
  onDownloadTafsir: (surah: Surah) => void;
  onCancelTafsirDownload: (surah: Surah) => void;
}

const SurahList: React.FC<SurahListProps> = ({ 
  surahs, 
  onSurahSelect, 
  currentSurahId, 
  favoriteSurahs, 
  onToggleFavorite, 
  bookmarks,
  selectedReciter,
  downloadedSurahs,
  downloadProgress,
  onDownloadSurah,
  onCancelDownload,
  downloadedTafsir,
  tafsirDownloadProgress,
  onDownloadTafsir,
  onCancelTafsirDownload
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {surahs.map(surah => {
          const isFavorite = favoriteSurahs.includes(surah.id);
          const hasBookmark = !!bookmarks[surah.id];
          
          const audioKey = selectedReciter ? `${selectedReciter.identifier}-${surah.id}` : '';
          const isAudioDownloaded = downloadedSurahs.has(audioKey);
          const audioDownloadInfo = downloadProgress[audioKey];
          const isAudioDownloading = audioDownloadInfo !== undefined;

          const isTafsirDownloaded = downloadedTafsir.has(surah.id);
          const tafsirDownloadInfo = tafsirDownloadProgress[surah.id];
          const isTafsirDownloading = tafsirDownloadInfo !== undefined;

          const downloadAudioActionContent = () => {
            if (isAudioDownloaded) {
              return (
                <div className="p-2" aria-label="Audio downloaded">
                  <CheckCircleIcon className="w-6 h-6 text-primary" />
                </div>
              );
            }
            if (isAudioDownloading) {
              return (
                <div className="flex items-center">
                  <div className="w-8 text-center text-xs font-mono text-text-secondary" role="progressbar" aria-valuenow={audioDownloadInfo}>
                    {audioDownloadInfo}%
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancelDownload(surah); }}
                    className="p-1 rounded-full text-red-500 hover:bg-red-500/10"
                    aria-label="Cancel audio download"
                  >
                    <CancelIcon className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            return (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadSurah(surah); }}
                className="p-2 rounded-full text-text-secondary hover:text-primary"
                disabled={!selectedReciter}
                aria-label="Download audio for offline"
              >
                <DownloadIcon className="w-6 h-6" />
              </button>
            );
          };
          
          const downloadTafsirActionContent = () => {
            if (isTafsirDownloaded) {
              return (
                <div className="p-2" aria-label="Tafsir downloaded">
                  <CheckCircleIcon className="w-6 h-6 text-primary" />
                </div>
              );
            }
            if (isTafsirDownloading) {
              return (
                <div className="flex items-center">
                  <div className="w-8 text-center text-xs font-mono text-text-secondary" role="progressbar" aria-valuenow={tafsirDownloadInfo}>
                    {tafsirDownloadInfo}%
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancelTafsirDownload(surah); }}
                    className="p-1 rounded-full text-red-500 hover:bg-red-500/10"
                    aria-label="Cancel tafsir download"
                  >
                    <CancelIcon className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            return (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadTafsir(surah); }}
                className="p-2 rounded-full text-text-secondary hover:text-primary"
                aria-label="Download tafsir for offline"
              >
                <DownloadTafsirIcon className="w-6 h-6" />
              </button>
            );
          };

          return (
            <div
              key={surah.id}
              onClick={() => onSurahSelect(surah)}
              className={`p-4 rounded-lg shadow-md transition-all duration-200 text-left w-full flex items-center justify-between cursor-pointer ${
                currentSurahId === surah.id
                  ? 'bg-primary text-white transform scale-105'
                  : 'bg-card hover:bg-border-color'
              }`}
            >
              <div className="flex items-center">
                <span className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium ml-4 ${
                  currentSurahId === surah.id ? 'bg-white text-primary' : 'bg-background text-text-secondary'
                }`}>
                  {surah.id}
                </span>
                <div className="flex items-center">
                   <p className={`font-semibold font-amiri-quran text-xl ${currentSurahId === surah.id ? 'text-white' : 'text-text-primary'}`}>
                    {surah.name}
                  </p>
                  {hasBookmark && (
                     <BookmarkIcon isFilled className={`w-4 h-4 mr-2 ${currentSurahId === surah.id ? 'text-white' : 'text-primary' }`} />
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {downloadTafsirActionContent()}
                {downloadAudioActionContent()}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent surah selection when favoriting
                    onToggleFavorite(surah.id);
                  }}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    isFavorite 
                      ? 'text-primary' 
                      : 'text-text-secondary hover:text-primary'
                  }`}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <StarIcon className="w-6 h-6" isFilled={isFavorite} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SurahList;