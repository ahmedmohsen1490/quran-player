import React from 'react';
import { Surah, SearchAyah } from '../types';
import { PlayIcon } from './icons/PlayIcon';

interface SearchResultsProps {
  surahResults: Surah[];
  ayahResults: SearchAyah[];
  isSearching: boolean;
  searchError: string | null;
  onSurahSelect: (surah: Surah) => void;
  onPlayAyah: (ayah: SearchAyah) => void;
  currentSurahId: number | null;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  surahResults,
  ayahResults,
  isSearching,
  searchError,
  onSurahSelect,
  onPlayAyah,
  currentSurahId,
}) => {
  const hasAyahResultsSection = isSearching || ayahResults.length > 0 || searchError;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <div className="space-y-6">
        {/* Surah Results */}
        {surahResults.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-text-primary mb-3 px-2">السور المطابقة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {surahResults.map(surah => (
                <div
                  key={`surah-res-${surah.id}`}
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
                    <p className={`font-semibold font-amiri-quran text-xl ${currentSurahId === surah.id ? 'text-white' : 'text-text-primary'}`}>
                      {surah.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ayah Results */}
        {hasAyahResultsSection && (
           <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-text-primary mb-3 px-2">الآيات ذات الصلة</h2>
            {isSearching && (
              <div className="flex justify-center items-center p-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" role="status">
                    <span className="sr-only">Searching...</span>
                 </div>
              </div>
            )}
            {searchError && <p className="text-red-500 text-center bg-red-500/10 p-4 rounded-lg">{searchError}</p>}
            
            {!isSearching && ayahResults.length > 0 && (
              <div className="space-y-3">
                {ayahResults.map(ayah => (
                   <div key={`${ayah.surahId}-${ayah.ayahIdInSurah}`} className="bg-card p-4 rounded-lg shadow-md flex items-center justify-between gap-4">
                     <div className="flex-grow">
                        <p className="font-amiri-quran text-lg text-text-primary leading-relaxed">{ayah.text}</p>
                        <p className="text-xs text-text-secondary mt-2">{ayah.surahName} - الآية {ayah.ayahIdInSurah}</p>
                     </div>
                     <button 
                        onClick={() => onPlayAyah(ayah)}
                        className="p-3 rounded-full text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
                        aria-label={`Play Ayah ${ayah.ayahIdInSurah} from Surah ${ayah.surahName}`}
                     >
                        <PlayIcon className="w-6 h-6" />
                     </button>
                   </div>
                ))}
              </div>
            )}
            
            {!isSearching && !searchError && ayahResults.length === 0 && surahResults.length === 0 && (
                <div className="text-center text-text-secondary py-8">
                    <p className="font-semibold">لا توجد نتائج.</p>
                    <p className="text-sm">حاول البحث عن موضوع مثل "الصبر" أو "الجنة".</p>
                </div>
            )}

          </div>
        )}
        
      </div>
    </div>
  );
};
