



import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import SurahList from './components/SurahList';
import Player from './components/Player';
import SurahDetail from './components/SurahDetail';
import Statistics from './components/Statistics';
import SearchBar from './components/SearchBar';
import LocationSetup from './components/LocationSetup';
import Settings from './components/Settings';
import PrayerTimes from './components/PrayerTimes';
import ChallengeBanner from './components/ChallengeBanner';
import ChallengePage from './components/ChallengePage';
import PronunciationCoach from './components/PronunciationCoach';
import { SearchResults } from './components/SearchResults';
import { Surah, Reciter, Ayah, ListeningStats, PrayerSettings, Theme, QuranChallenge, SearchAyah, AzkarSettings } from './types';
import * as db from './db';
import { DEFAULT_THEME } from './themes';
import { GoogleGenAI, Type } from '@google/genai';
import { AZKAR_LIST } from './constants';

const App: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('quranPlayerTheme');
        return savedTheme ? JSON.parse(savedTheme) : DEFAULT_THEME;
      } catch (e) {
        return DEFAULT_THEME;
      }
    }
    return DEFAULT_THEME;
  });

  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [currentAyahs, setCurrentAyahs] = useState<Ayah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioSrc, setAudioSrc] = useState<string>('');
  
  const [favoriteSurahs, setFavoriteSurahs] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('favoriteSurahs');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    }
    return [];
  });

  const [bookmarks, setBookmarks] = useState<{ [key: number]: number }>(() => {
    if (typeof window !== 'undefined') {
      const savedBookmarks = localStorage.getItem('quranPlayerBookmarks');
      return savedBookmarks ? JSON.parse(savedBookmarks) : {};
    }
    return {};
  });
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stats, setStats] = useState<ListeningStats>({ hoursThisWeek: 0, surahsCompleted: 0 });
  const [currentAyahDuration, setCurrentAyahDuration] = useState<number>(0);

  const [showTafsir, setShowTafsir] = useState<boolean>(false);
  const [currentTafsir, setCurrentTafsir] = useState<string | null>(null);
  const [isTafsirLoading, setIsTafsirLoading] = useState<boolean>(false);
  const [isTafsirError, setIsTafsirError] = useState<boolean>(false);

  // New state for prayer times and settings
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings | null>(null);
  const [isLocationSetupNeeded, setIsLocationSetupNeeded] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [prayerRemindersEnabled, setPrayerRemindersEnabled] = useState<boolean>(false);

  // State for offline downloads
  const [downloadedSurahs, setDownloadedSurahs] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const currentBlobUrl = useRef<string | null>(null);
  const downloadControllers = useRef<{ [key: string]: AbortController }>({});
  const [downloadedTafsir, setDownloadedTafsir] = useState<Set<number>>(new Set());
  const [tafsirDownloadProgress, setTafsirDownloadProgress] = useState<{ [key: number]: number }>({});
  const tafsirDownloadControllers = useRef<{ [key: number]: AbortController }>({});


  // Quran Challenge State
  const [challenge, setChallenge] = useState<QuranChallenge | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  // Pronunciation Coach State
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachingAyah, setCoachingAyah] = useState<Ayah | null>(null);
  const [coachingSurah, setCoachingSurah] = useState<Surah | null>(null);

  // State for Smart Search
  const [ayahSearchResults, setAyahSearchResults] = useState<SearchAyah[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pendingPlay, setPendingPlay] = useState<{ surahId: number; ayahNumberInSurah: number } | null>(null);
  
  // Azkar Notifications State
  const [azkarSettings, setAzkarSettings] = useState<AzkarSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('azkarSettings');
      return saved ? JSON.parse(saved) : { isEnabled: false, frequency: 1 };
    }
    return { isEnabled: false, frequency: 1 };
  });
  const [notificationDhikr, setNotificationDhikr] = useState<string | null>(null);
  const azkarIntervalRef = useRef<number | null>(null);


  const ai = useRef<GoogleGenAI | null>(null);
  const searchTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }, []);

  const handleOpenCoach = (ayah: Ayah) => {
    setCoachingAyah(ayah);
    setCoachingSurah(currentSurah);
    setIsCoachOpen(true);
    // Pause player if it's playing
    if (isPlaying) {
      setIsPlaying(false);
    }
  };


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChallenge = localStorage.getItem('quranChallenge');
      if (savedChallenge) {
        const parsedChallenge = JSON.parse(savedChallenge);
        // Handle migration for old challenge structure by ensuring completedAyahs exists
        if (!parsedChallenge.completedAyahs) {
          parsedChallenge.completedAyahs = {};
        }
        setChallenge(parsedChallenge);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (challenge) {
        localStorage.setItem('quranChallenge', JSON.stringify(challenge));
      } else {
        localStorage.removeItem('quranChallenge');
      }
    }
  }, [challenge]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('prayerSettings');
      if (savedSettings) {
        setPrayerSettings(JSON.parse(savedSettings));
      } else {
        setIsLocationSetupNeeded(true);
      }
      const savedReminders = localStorage.getItem('prayerRemindersEnabled');
      setPrayerRemindersEnabled(savedReminders === 'true');
    }
  }, []);
  
  // Save Azkar settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('azkarSettings', JSON.stringify(azkarSettings));
    }
  }, [azkarSettings]);

  // Handle Azkar notification scheduling
  useEffect(() => {
    if (azkarIntervalRef.current) {
      clearInterval(azkarIntervalRef.current);
    }

    if (azkarSettings.isEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const showNotification = () => {
        const randomIndex = Math.floor(Math.random() * AZKAR_LIST.length);
        const dhikr = AZKAR_LIST[randomIndex];
        
        const notification = new Notification('تذكير أذكار', {
          body: dhikr,
          icon: 'https://i.imgur.com/1m8xN9N.png',
          tag: 'azkar-notification',
        });

        notification.onclick = () => {
          setNotificationDhikr(dhikr);
          window.focus();
        };
      };

      // Show first notification shortly after enabling, then start the interval
      setTimeout(showNotification, 2000); 

      const intervalMs = azkarSettings.frequency * 60 * 60 * 1000;
      azkarIntervalRef.current = window.setInterval(showNotification, intervalMs);
    }

    return () => {
      if (azkarIntervalRef.current) {
        clearInterval(azkarIntervalRef.current);
      }
    };
  }, [azkarSettings]);


  // Check for downloaded surahs on app load
  useEffect(() => {
    const checkAudioDownloads = async () => {
        await db.initDB();
        const allKeys = await db.getAllDownloadedKeys();
        const surahAyahCounts: { [key: string]: number } = {}; // key: "reciterId-surahId"

        allKeys.forEach(key => {
            const parts = key.split('-');
            if (parts.length === 3) {
                const mapKey = `${parts[0]}-${parts[1]}`;
                surahAyahCounts[mapKey] = (surahAyahCounts[mapKey] || 0) + 1;
            }
        });

        const downloadedSet = new Set<string>();
        if (surahs.length > 0) {
            for (const key in surahAyahCounts) {
                const [, surahIdStr] = key.split('-');
                const surahId = parseInt(surahIdStr, 10);
                const surahInfo = surahs.find(s => s.id === surahId);
                if (surahInfo && surahAyahCounts[key] >= surahInfo.numberOfAyahs) {
                    downloadedSet.add(key);
                }
            }
            setDownloadedSurahs(downloadedSet);
        }
    };

     const checkTafsirDownloads = async () => {
        await db.initDB();
        const downloadedSet = new Set<number>();
        await Promise.all(surahs.map(async (surah) => {
            const count = await db.getDownloadedTafsirCountForSurah(surah.id);
            if (count >= surah.numberOfAyahs) {
                downloadedSet.add(surah.id);
            }
        }));
        setDownloadedTafsir(downloadedSet);
    };

    if (surahs.length > 0) {
        checkAudioDownloads();
        checkTafsirDownloads();
    }
  }, [surahs]);
  
  const calculateStats = useCallback((): ListeningStats => {
    const history: { timestamp: number; duration: number }[] = JSON.parse(localStorage.getItem('listeningHistory') || '[]');
    const completed: number[] = JSON.parse(localStorage.getItem('completedSurahs') || '[]');
  
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const secondsThisWeek = history
      .filter(item => item.timestamp >= oneWeekAgo)
      .reduce((total, item) => total + (item.duration || 0), 0);
    
    const hoursThisWeek = secondsThisWeek / 3600;
    const surahsCompleted = new Set(completed).size;
  
    return { hoursThisWeek, surahsCompleted };
  }, []);

  useEffect(() => {
    setStats(calculateStats());
  }, [calculateStats]);
  
  const logListenedAyah = useCallback((duration: number) => {
    if (!duration || duration === Infinity) return;
    const history: { timestamp: number; duration: number }[] = JSON.parse(localStorage.getItem('listeningHistory') || '[]');
    history.push({ timestamp: Date.now(), duration });
    localStorage.setItem('listeningHistory', JSON.stringify(history));
    setStats(calculateStats());
  }, [calculateStats]);
  
  const logCompletedSurah = useCallback((surahId: number) => {
    const completed: number[] = JSON.parse(localStorage.getItem('completedSurahs') || '[]');
    const completedSet = new Set(completed);
    if (!completedSet.has(surahId)) {
      completedSet.add(surahId);
      localStorage.setItem('completedSurahs', JSON.stringify(Array.from(completedSet)));
      setStats(calculateStats());
    }
  }, [calculateStats]);

  const logChallengeProgress = useCallback((surah: Surah, ayah: Ayah) => {
    setChallenge(prevChallenge => {
      if (!prevChallenge || !prevChallenge.isActive || prevChallenge.isPaused || !surah || !ayah) {
        return prevChallenge;
      }
  
      const surahIdStr = String(surah.id);
      const completedInSurah = prevChallenge.completedAyahs[surahIdStr] || [];
  
      // Check if the ayah has already been completed for the challenge
      if (completedInSurah.includes(ayah.numberInSurah)) {
        return prevChallenge; // Already counted, do nothing
      }
      
      // Update daily progress count
      const todayStr = new Date().toISOString().split('T')[0];
      const newProgress = { ...prevChallenge.progress };
      newProgress[todayStr] = (newProgress[todayStr] || 0) + 1;
  
      // Add the newly completed ayah to the unique list
      const newCompletedAyahs = { ...prevChallenge.completedAyahs };
      newCompletedAyahs[surahIdStr] = [...completedInSurah, ayah.numberInSurah];
      
      return {
        ...prevChallenge,
        progress: newProgress,
        completedAyahs: newCompletedAyahs,
      };
    });
  }, []);


  useEffect(() => {
    localStorage.setItem('favoriteSurahs', JSON.stringify(favoriteSurahs));
  }, [favoriteSurahs]);
  
  useEffect(() => {
    localStorage.setItem('quranPlayerBookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('quranPlayerTheme', JSON.stringify(currentTheme));
    
    const root = document.documentElement;
    const themeColors = isDarkMode ? currentTheme.dark : currentTheme.light;
    
    root.style.setProperty('--color-primary', themeColors.primary);
    root.style.setProperty('--color-background', themeColors.background);
    root.style.setProperty('--color-card', themeColors.card);
    root.style.setProperty('--color-text-primary', themeColors.textPrimary);
    root.style.setProperty('--color-text-secondary', themeColors.textSecondary);
    root.style.setProperty('--color-border-color', themeColors.border);
  }, [currentTheme, isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [surahsResponse, recitersResponse] = await Promise.all([
          fetch('https://api.alquran.cloud/v1/surah'),
          fetch('https://api.alquran.cloud/v1/edition/format/audio')
        ]);

        if (!surahsResponse.ok) throw new Error('Failed to fetch surahs');
        if (!recitersResponse.ok) throw new Error('Failed to fetch reciters');

        const surahsData = await surahsResponse.json();
        const mappedSurahs: Surah[] = surahsData.data.map((s: any) => ({
          id: s.number,
          name: s.name,
          revelationType: s.revelationType,
          numberOfAyahs: s.numberOfAyahs,
        }));
        setSurahs(mappedSurahs);

        const recitersData = await recitersResponse.json();
        const mappedReciters: Reciter[] = recitersData.data
          .filter((r: any) => r.language === 'ar')
          .map((r: any) => ({
            identifier: r.identifier,
            name: r.name,
            englishName: r.englishName,
          }))
          .sort((a: Reciter, b: Reciter) => a.name.localeCompare(b.name, 'ar'));
        
        setReciters(mappedReciters);

        if (mappedReciters.length > 0) {
          const defaultReciter = mappedReciters.find(r => r.identifier.includes('alafasy')) || mappedReciters[0];
          setSelectedReciter(defaultReciter);
        }

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!currentSurah || !selectedReciter) return;

    const fetchAyahs = async () => {
      try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${currentSurah.id}/${selectedReciter.identifier}`);
        if (!response.ok) throw new Error('Failed to fetch ayahs');
        const data = await response.json();
        const ayahs: Ayah[] = data.data.ayahs;
        setCurrentAyahs(ayahs);
        
        // If there's no pending play action, default to bookmark or start
        if (!pendingPlay || pendingPlay.surahId !== currentSurah.id) {
            const bookmarkedAyahNumber = bookmarks[currentSurah.id];
            if (bookmarkedAyahNumber) {
              const bookmarkedIndex = ayahs.findIndex(ayah => ayah.numberInSurah === bookmarkedAyahNumber);
              setCurrentAyahIndex(bookmarkedIndex !== -1 ? bookmarkedIndex : 0);
            } else {
              setCurrentAyahIndex(0);
            }
        }
      } catch (error) {
        console.error("Error fetching ayahs:", error);
        setError('Failed to load Surah audio.');
        setCurrentAyahs([]);
      }
    };

    fetchAyahs();
  }, [currentSurah, selectedReciter, bookmarks]);
  
  // New useEffect to handle playing an ayah after its surah has been loaded from a search result
  useEffect(() => {
    if (pendingPlay && currentSurah?.id === pendingPlay.surahId && currentAyahs.length > 0) {
      const targetIndex = currentAyahs.findIndex(a => a.numberInSurah === pendingPlay.ayahNumberInSurah);
      if (targetIndex !== -1) {
        setCurrentAyahIndex(targetIndex);
        setIsPlaying(true);
      }
      setPendingPlay(null);
    }
  }, [currentAyahs, pendingPlay, currentSurah]);

  useEffect(() => {
    if (showTafsir && currentSurah && currentAyahs.length > currentAyahIndex) {
      const currentAyah = currentAyahs[currentAyahIndex];
      const fetchTafsir = async () => {
        setIsTafsirLoading(true);
        setIsTafsirError(false);
        setCurrentTafsir(null);
        
        const surahId = currentSurah.id;
        const ayahNumberInSurah = currentAyah.numberInSurah;
        
        try {
          // 1. Check local DB first
          const cachedTafsir = await db.getTafsir(surahId, ayahNumberInSurah);
          if (cachedTafsir) {
            console.log(`Tafsir for ${surahId}:${ayahNumberInSurah} loaded from local storage.`);
            setCurrentTafsir(cachedTafsir);
            setIsTafsirLoading(false);
            return;
          }

          // 2. If not found, fetch from API
          console.log(`Tafsir for ${surahId}:${ayahNumberInSurah} loaded from API.`);
          const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumberInSurah}/ar.muyassar`);

          if (!response.ok) {
            throw new Error('Failed to fetch Tafsir data from API.');
          }

          const data = await response.json();
          const tafsirText = data?.data?.text;
          
          if (tafsirText) {
            const originalAyahText = currentAyahs[currentAyahIndex].text;
            const cleanTafsir = tafsirText.replace(originalAyahText, '').trim();
            
            // 3. Save to local DB for future use
            await db.addTafsir(surahId, ayahNumberInSurah, cleanTafsir);
            
            setCurrentTafsir(cleanTafsir);
          } else {
            setCurrentTafsir("لا يوجد تفسير لهذه الآية");
          }
        } catch (err) {
          console.error("Failed to fetch/load tafsir", err);
          setCurrentTafsir("تعذر تحميل التفسير. يرجى المحاولة مرة أخرى.");
          setIsTafsirError(true);
        } finally {
          setIsTafsirLoading(false);
        }
      };
      fetchTafsir();
    }
  }, [currentSurah, currentAyahIndex, showTafsir, currentAyahs]);

  const setAudioSource = useCallback(async (ayah: Ayah | null) => {
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }

    if (!ayah || !selectedReciter || !currentSurah) {
      setAudioSrc('');
      return;
    }

    const surahKey = `${selectedReciter.identifier}-${currentSurah.id}`;
    if (downloadedSurahs.has(surahKey)) {
      try {
        const blob = await db.getAyah(selectedReciter.identifier, currentSurah.id, ayah.numberInSurah);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          currentBlobUrl.current = blobUrl;
          setAudioSrc(blobUrl);
        } else {
          setAudioSrc(ayah.audio); // Fallback to network if DB fails
        }
      } catch (e) {
         setAudioSrc(ayah.audio); // Fallback on error
      }
    } else {
      setAudioSrc(ayah.audio);
    }
  }, [selectedReciter, currentSurah, downloadedSurahs]);

  useEffect(() => {
    const ayah = currentAyahs.length > 0 && currentAyahIndex < currentAyahs.length
      ? currentAyahs[currentAyahIndex]
      : null;
    setAudioSource(ayah);
  }, [currentAyahs, currentAyahIndex, setAudioSource]);

  const updateMediaSession = useCallback(() => {
    if ('mediaSession' in navigator && currentSurah && selectedReciter && currentAyahs.length > 0) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `سورة ${currentSurah.name} (آية ${currentAyahs[currentAyahIndex]?.numberInSurah || currentAyahIndex + 1})`,
        artist: selectedReciter.name,
        album: 'مشغل القرآن',
        artwork: [
          { src: 'https://i.imgur.com/1m8xN9N.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'https://i.imgur.com/1m8xN9N.png', sizes: '128x128', type: 'image/png' },
          { src: 'https://i.imgur.com/1m8xN9N.png', sizes: '192x192', type: 'image/png' },
          { src: 'https://i.imgur.com/1m8xN9N.png', sizes: '256x256', type: 'image/png' },
          { src: 'https://i.imgur.com/1m8xN9N.png', sizes: '384x384', type: 'image/png' },
          { src: 'https://i.imgur.com/1m8xN9N.png', sizes: '512x512', type: 'image/png' },
        ]
      });
    }
  }, [currentSurah, selectedReciter, currentAyahs, currentAyahIndex]);

  useEffect(() => {
    updateMediaSession();
  }, [updateMediaSession]);
  
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (!currentSurah && surahs.length > 0) {
      setCurrentSurah(surahs[0]);
    }
    setIsPlaying(prev => !prev);
  }, [currentSurah, surahs]);

  const handleNextSurah = useCallback(() => {
    if (surahs.length === 0) return;
    const currentIdx = surahs.findIndex(s => s.id === currentSurah?.id);
    const nextIndex = currentIdx !== -1 ? (currentIdx + 1) % surahs.length : 0;
    setCurrentSurah(surahs[nextIndex]);
    setCurrentAyahs([]);
    setIsPlaying(true);
  }, [currentSurah, surahs]);

  const handlePrevSurah = useCallback(() => {
    if (surahs.length === 0) return;
    const currentIdx = surahs.findIndex(s => s.id === currentSurah?.id);
    const prevIndex = currentIdx !== -1 ? (currentIdx - 1 + surahs.length) % surahs.length : 0;
    setCurrentSurah(surahs[prevIndex]);
    setCurrentAyahs([]);
    setIsPlaying(true);
  }, [currentSurah, surahs]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handlePlayPause);
      navigator.mediaSession.setActionHandler('pause', handlePlayPause);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextSurah);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevSurah);
    }
  }, [handlePlayPause, handleNextSurah, handlePrevSurah]);

  const handleSurahSelect = (surah: Surah) => {
    if (currentSurah?.id === surah.id) {
        setIsPlaying(p => !p);
        return;
    }
    setCurrentSurah(surah);
    setCurrentAyahs([]);
    setIsPlaying(true);
  };

  const handleAyahEnded = () => {
    logListenedAyah(currentAyahDuration);

    const surahForChallenge = currentSurah;
    const ayahForChallenge = currentAyahs[currentAyahIndex];
    if (surahForChallenge && ayahForChallenge) {
      logChallengeProgress(surahForChallenge, ayahForChallenge);
    }

    if (currentAyahIndex < currentAyahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else {
      if (currentSurah) {
          logCompletedSurah(currentSurah.id);
      }
      handleNextSurah();
    }
  };

  const handleReciterChange = (reciter: Reciter) => {
    setSelectedReciter(reciter);
  };
  
  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleFavorite = (surahId: number) => {
    setFavoriteSurahs(prev => 
      prev.includes(surahId) 
        ? prev.filter(id => id !== surahId) 
        : [...prev, surahId]
    );
  };

  const toggleBookmark = (surahId: number, ayahNumber: number) => {
    setBookmarks(prev => {
      const newBookmarks = { ...prev };
      if (newBookmarks[surahId] === ayahNumber) {
        delete newBookmarks[surahId];
      } else {
        newBookmarks[surahId] = ayahNumber;
      }
      return newBookmarks;
    });
  };

  const handleDownloadSurah = async (surahToDownload: Surah) => {
    if (!selectedReciter) return;
    const key = `${selectedReciter.identifier}-${surahToDownload.id}`;
    if (downloadedSurahs.has(key) || downloadProgress[key] !== undefined) return;

    const controller = new AbortController();
    downloadControllers.current[key] = controller;

    setDownloadProgress(prev => ({ ...prev, [key]: 0 }));
    
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahToDownload.id}/${selectedReciter.identifier}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Failed to fetch ayahs for download');
      const data = await response.json();
      const ayahs: Ayah[] = data.data.ayahs;

      for (let i = 0; i < ayahs.length; i++) {
        if (controller.signal.aborted) {
          throw new DOMException('Download cancelled by user', 'AbortError');
        }

        const ayah = ayahs[i];
        // Use a CORS proxy to bypass potential cross-origin issues with fetch
        const proxiedAudioUrl = `https://corsproxy.io/?${ayah.audio}`;
        const audioResponse = await fetch(proxiedAudioUrl, { signal: controller.signal });
        if (!audioResponse.ok) throw new Error(`Failed to download audio for Ayah ${ayah.numberInSurah}`);
        const audioBlob = await audioResponse.blob();
        
        await db.addAyah(selectedReciter.identifier, surahToDownload.id, ayah.numberInSurah, audioBlob);
        
        const progress = Math.round(((i + 1) / ayahs.length) * 100);
        setDownloadProgress(prev => ({ ...prev, [key]: progress }));
      }
      setDownloadedSurahs(prev => new Set(prev).add(key));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`Download cancelled for Surah ${surahToDownload.name}.`);
        if (selectedReciter) {
          await db.deleteSurahAudio(selectedReciter.identifier, surahToDownload.id);
        }
      } else {
        console.error("Download failed:", err);
        let errorMessage = `Failed to download Surah ${surahToDownload.name}.`;
        if (err instanceof Error && err.message.toLowerCase().includes('failed to fetch')) {
          errorMessage += ' Please check your network connection.';
        }
        setError(errorMessage);
      }
    } finally {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[key];
        return newProgress;
      });
      delete downloadControllers.current[key];
    }
  };

  const handleCancelDownload = (surahToCancel: Surah) => {
    if (!selectedReciter) return;
    const key = `${selectedReciter.identifier}-${surahToCancel.id}`;
    const controller = downloadControllers.current[key];
    if (controller) {
      controller.abort();
    }
  };

  const handleDownloadTafsir = async (surahToDownload: Surah) => {
    const surahId = surahToDownload.id;
    if (downloadedTafsir.has(surahId) || tafsirDownloadProgress[surahId] !== undefined) return;

    const controller = new AbortController();
    tafsirDownloadControllers.current[surahId] = controller;
    setTafsirDownloadProgress(prev => ({ ...prev, [surahId]: 0 }));

    try {
        const totalAyahs = surahToDownload.numberOfAyahs;
        for (let i = 1; i <= totalAyahs; i++) {
            if (controller.signal.aborted) {
              throw new DOMException('Download cancelled by user', 'AbortError');
            }
            const existingTafsir = await db.getTafsir(surahId, i);
            if (!existingTafsir) {
              const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${i}/ar.muyassar`, { signal: controller.signal });
              if (!response.ok) throw new Error(`Failed to fetch Tafsir for Ayah ${i}`);
              const data = await response.json();
              if (data.code === 200 && data.data.text) {
                 await db.addTafsir(surahId, i, data.data.text);
              }
            }
            const progress = Math.round((i / totalAyahs) * 100);
            setTafsirDownloadProgress(prev => ({ ...prev, [surahId]: progress }));
        }
        setDownloadedTafsir(prev => new Set(prev).add(surahId));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`Tafsir download cancelled for Surah ${surahToDownload.name}.`);
        await db.deleteTafsirsForSurah(surahId);
      } else {
        console.error("Tafsir download failed:", err);
        setError(`Failed to download Tafsir for Surah ${surahToDownload.name}.`);
      }
    } finally {
        setTafsirDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[surahId];
            return newProgress;
        });
        delete tafsirDownloadControllers.current[surahId];
    }
  };

  const handleCancelTafsirDownload = (surahToCancel: Surah) => {
      const controller = tafsirDownloadControllers.current[surahToCancel.id];
      if (controller) {
        controller.abort();
      }
  };

  const handleDeleteTafsir = async (surahId: number) => {
      await db.deleteTafsirsForSurah(surahId);
      setDownloadedTafsir(prev => {
          const newSet = new Set(prev);
          newSet.delete(surahId);
          return newSet;
      });
  };
  
  const handleDeleteAudio = async (surahToDelete: Surah) => {
    if (!selectedReciter) return;
    const key = `${selectedReciter.identifier}-${surahToDelete.id}`;
    await db.deleteSurahAudio(selectedReciter.identifier, surahToDelete.id);
    setDownloadedSurahs(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
    });
  };

  const handlePrayerSettingsSave = (newSettings: PrayerSettings) => {
    setPrayerSettings(newSettings);
    localStorage.setItem('prayerSettings', JSON.stringify(newSettings));
    setIsLocationSetupNeeded(false);
    setIsSettingsModalOpen(false); // Close settings if open
  };

  const handleTogglePrayerReminders = () => {
    const newIsEnabled = !prayerRemindersEnabled;
    if (newIsEnabled && typeof window.Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setPrayerRemindersEnabled(true);
          localStorage.setItem('prayerRemindersEnabled', 'true');
        }
      });
    } else {
      setPrayerRemindersEnabled(newIsEnabled);
      localStorage.setItem('prayerRemindersEnabled', String(newIsEnabled));
    }
  };
  
  const performSmartSearch = useCallback(async (query: string) => {
    if (!ai.current) {
        setSearchError("Smart search is not available (API key may be missing).");
        return;
    }
    if (query.trim().length < 3) {
        setAyahSearchResults([]);
        return;
    }

    setIsSearching(true);
    setSearchError(null);
    setAyahSearchResults([]);

    try {
        const response = await ai.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find Quranic ayahs related to: "${query}"`,
            config: {
                systemInstruction: "You are an expert Quranic scholar. Your task is to find ayahs (verses) from the Quran that are relevant to the user's search query. The user is looking for topics, keywords, or concepts. Respond ONLY with a valid JSON array matching the provided schema. Do not include markdown backticks like ```json or any text outside the JSON. If no relevant ayahs are found, return an empty array `[]`. Limit results to a maximum of 10 ayahs.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            surahId: { type: Type.NUMBER, description: 'The chapter number of the Quran.' },
                            ayahIdInSurah: { type: Type.NUMBER, description: 'The verse number within the chapter.' },
                            text: { type: Type.STRING, description: 'The full Arabic text of the verse.' },
                            surahName: { type: Type.STRING, description: 'The Arabic name of the chapter.' },
                        },
                        required: ['surahId', 'ayahIdInSurah', 'text', 'surahName'],
                    },
                },
            },
        });

        const jsonString = response.text.trim();
        const results = JSON.parse(jsonString);
        setAyahSearchResults(results);
    } catch (err) {
        console.error("Smart search failed:", err);
        setSearchError("Failed to fetch smart search results. Please try again.");
        setAyahSearchResults([]);
    } finally {
        setIsSearching(false);
    }
  }, []);

  const handleSearchQueryChange = (query: string) => {
      setSearchQuery(query);
      if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
      }
      if (query.trim()) {
          searchTimeout.current = window.setTimeout(() => {
              performSmartSearch(query);
          }, 500); // 500ms debounce
      } else {
          setAyahSearchResults([]);
          setIsSearching(false);
          setSearchError(null);
      }
  };

  const handlePlayAyahFromSearch = (ayah: SearchAyah) => {
      const targetSurah = surahs.find(s => s.id === ayah.surahId);
      if (!targetSurah) return;

      if (currentSurah?.id === ayah.surahId) {
          const targetIndex = currentAyahs.findIndex(a => a.numberInSurah === ayah.ayahIdInSurah);
          if (targetIndex !== -1) {
              setCurrentAyahIndex(targetIndex);
              setIsPlaying(true);
          }
      } else {
          setIsPlaying(false);
          setCurrentAyahs([]);
          setPendingPlay({ surahId: ayah.surahId, ayahNumberInSurah: ayah.ayahIdInSurah });
          setCurrentSurah(targetSurah);
      }
  };

  const surahSearchResults = searchQuery.trim()
    ? surahs.filter(surah => 
        surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.id.toString().includes(searchQuery)
      )
    : [];

  const surahsForHomepage = showFavoritesOnly
    ? surahs.filter(surah => favoriteSurahs.includes(surah.id))
    : surahs;

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      {isLocationSetupNeeded && <LocationSetup onSave={handlePrayerSettingsSave} />}
      <Settings 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        remindersEnabled={prayerRemindersEnabled}
        onToggleReminders={handleTogglePrayerReminders}
        currentSettings={prayerSettings}
        onSaveSettings={handlePrayerSettingsSave}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        azkarSettings={azkarSettings}
        onAzkarSettingsChange={setAzkarSettings}
        surahs={surahs}
        downloadedAudio={downloadedSurahs}
        downloadedTafsir={downloadedTafsir}
        selectedReciter={selectedReciter}
        onDeleteAudio={handleDeleteAudio}
        onDeleteTafsir={handleDeleteTafsir}
      />
      <ChallengePage
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        challenge={challenge}
        onUpdateChallenge={setChallenge}
      />
      
      {isCoachOpen && coachingAyah && coachingSurah && (
        <PronunciationCoach
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          surah={coachingSurah}
          ayah={coachingAyah}
          onRecitationSuccess={logChallengeProgress}
        />
      )}

      {notificationDhikr && (
        <div 
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] animate-fade-in" 
          onClick={() => setNotificationDhikr(null)}
        >
          <div 
            className="bg-card rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4" 
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-text-primary mb-4 text-center">تذكير أذكار</h2>
            <p className="font-amiri-quran text-2xl text-text-primary leading-loose text-center mb-6">
              {notificationDhikr}
            </p>
            <div className="text-center">
              <button 
                onClick={() => setNotificationDhikr(null)} 
                className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:opacity-90"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}


      <Header
        reciters={reciters}
        selectedReciter={selectedReciter}
        onReciterChange={handleReciterChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        currentSurah={currentSurah}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onChallengeClick={() => setIsChallengeModalOpen(true)}
      />
      <main className="pb-24">
        {isLoading && <p className="text-center py-10">...جاري تحميل البيانات</p>}
        {error && <p className="text-center py-10 text-red-500">خطأ: {error}</p>}
        {!isLoading && !error && (
          <>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
               <ChallengeBanner challenge={challenge} />
               <Statistics stats={stats} />
               <PrayerTimes prayerSettings={prayerSettings} remindersEnabled={prayerRemindersEnabled} />
              <div className="flex items-center gap-2 sm:gap-4">
                 <div className="flex-grow">
                    <SearchBar query={searchQuery} onQueryChange={handleSearchQueryChange} />
                </div>
                <button
                  onClick={() => setShowFavoritesOnly(prev => !prev)}
                  className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    showFavoritesOnly
                      ? 'bg-primary text-white'
                      : 'bg-card text-text-primary hover:opacity-90'
                  }`}
                >
                  {showFavoritesOnly ? 'كل السور' : 'المفضلة'}
                </button>
              </div>
            </div>

            {currentSurah && (
              <SurahDetail
                surah={currentSurah}
                currentAyah={currentAyahs[currentAyahIndex] || null}
                showTafsir={showTafsir}
                onToggleTafsir={() => setShowTafsir(prev => !prev)}
                tafsirText={currentTafsir}
                isTafsirLoading={isTafsirLoading}
                isTafsirError={isTafsirError}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
                onCoachAyah={handleOpenCoach}
              />
            )}
            
            {searchQuery.trim().length > 0 ? (
                <SearchResults
                  surahResults={surahSearchResults}
                  ayahResults={ayahSearchResults}
                  isSearching={isSearching}
                  searchError={searchError}
                  onSurahSelect={handleSurahSelect}
                  onPlayAyah={handlePlayAyahFromSearch}
                  currentSurahId={currentSurah?.id || null}
                />
            ) : (
                <SurahList 
                  surahs={surahsForHomepage} 
                  onSurahSelect={handleSurahSelect} 
                  currentSurahId={currentSurah?.id || null} 
                  favoriteSurahs={favoriteSurahs}
                  onToggleFavorite={toggleFavorite}
                  bookmarks={bookmarks}
                  selectedReciter={selectedReciter}
                  downloadedSurahs={downloadedSurahs}
                  downloadProgress={downloadProgress}
                  onDownloadSurah={handleDownloadSurah}
                  onCancelDownload={handleCancelDownload}
                  downloadedTafsir={downloadedTafsir}
                  tafsirDownloadProgress={tafsirDownloadProgress}
                  onDownloadTafsir={handleDownloadTafsir}
                  onCancelTafsirDownload={handleCancelTafsirDownload}
                />
            )}
          </>
        )}
      </main>
      {selectedReciter && (
        <Player
          surah={currentSurah}
          reciter={selectedReciter}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNextSurah}
          onPrev={handlePrevSurah}
          onEnded={handleAyahEnded}
          audioSrc={audioSrc}
          currentAyah={currentAyahs[currentAyahIndex] || null}
          totalAyahs={currentAyahs.length}
          onDurationChange={setCurrentAyahDuration}
        />
      )}
    </div>
  );
};

export default App;