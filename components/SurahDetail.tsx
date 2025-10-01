

import React from 'react';
import { Surah, Ayah } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

interface SurahDetailProps {
  surah: Surah;
  currentAyah: Ayah | null;
  showTafsir: boolean;
  onToggleTafsir: () => void;
  tafsirText: string | null;
  isTafsirLoading: boolean;
  isTafsirError: boolean;
  bookmarks: { [key: number]: number };
  onToggleBookmark: (surahId: number, ayahNumber: number) => void;
  onCoachAyah: (ayah: Ayah) => void;
}

const SurahDetail: React.FC<SurahDetailProps> = ({
  surah,
  currentAyah,
  showTafsir,
  onToggleTafsir,
  tafsirText,
  isTafsirLoading,
  isTafsirError,
  bookmarks,
  onToggleBookmark,
  onCoachAyah,
}) => {
  const revelationPlace = surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';
  const isBookmarked = !!(currentAyah && bookmarks[surah.id] === currentAyah.numberInSurah);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="bg-card rounded-lg shadow-md p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-text-primary font-amiri-quran">{surah.name}</h2>
          <div className="flex items-center space-x-2">
             <button
              onClick={() => currentAyah && onCoachAyah(currentAyah)}
              disabled={!currentAyah}
              className="p-2 rounded-full text-text-secondary hover:bg-border-color"
              aria-label="Pronunciation Coach"
            >
              <MicrophoneIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => currentAyah && onToggleBookmark(surah.id, currentAyah.numberInSurah)}
              disabled={!currentAyah}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:bg-border-color'
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <BookmarkIcon className="w-6 h-6" isFilled={isBookmarked} />
            </button>
            <button
              onClick={onToggleTafsir}
              className={`p-2 rounded-full transition-colors ${showTafsir ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-border-color'}`}
              aria-label="Toggle Tafsir"
            >
              <BookOpenIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center border-t border-border-color py-4">
          <div>
            <p className="text-sm text-text-secondary">مكان النزول</p>
            <p className="font-semibold text-text-primary capitalize">{revelationPlace}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">رقم السورة</p>
            <p className="font-semibold text-text-primary">{surah.id}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">عدد الآيات</p>
            <p className="font-semibold text-text-primary">{surah.numberOfAyahs}</p>
          </div>
        </div>

        <div className="border-t border-border-color pt-4 mt-4">
          {currentAyah ? (
            <div className="min-h-[10rem] flex items-center justify-center p-4">
              <p className="text-2xl md:text-3xl font-amiri-quran text-text-primary leading-loose text-center">
                {currentAyah.text}
                <span className="font-sans text-base align-middle mx-2 p-1 bg-background rounded-full">
                  {currentAyah.numberInSurah}
                </span>
              </p>
            </div>
          ) : (
             <div className="min-h-[10rem] flex items-center justify-center">
              <p className="text-text-secondary">اختر سورة للبدء.</p>
            </div>
          )}
        </div>

        {showTafsir && (
          <div className="border-t border-border-color pt-4 mt-4">
            <h4 className="font-semibold mb-2 text-text-primary">التفسير الميسر</h4>
            <div className="min-h-[8rem] flex items-center justify-center p-4 rounded-lg bg-background">
              {isTafsirLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              ) : isTafsirError ? (
                <p className="text-red-500 text-center">{tafsirText}</p>
              ) : (
                tafsirText && <p className="text-text-secondary max-w-none leading-relaxed text-right">{tafsirText}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurahDetail;