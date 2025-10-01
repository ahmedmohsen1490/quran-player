

import React from 'react';
import { QuranChallenge } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';

interface ChallengeBannerProps {
  challenge: QuranChallenge | null;
}

const TOTAL_QURAN_AYAHS = 6236;

const getTodaysDateString = () => new Date().toISOString().split('T')[0];

const ChallengeBanner: React.FC<ChallengeBannerProps> = ({ challenge }) => {
  if (!challenge || !challenge.isActive) {
    return null; // Don't show if no active challenge
  }

  // Calculate total from the unique ayahs record to prevent double counting
  const totalCompleted = Object.values(challenge.completedAyahs || {}).reduce((sum, ayahs) => sum + ayahs.length, 0);

  if (totalCompleted >= TOTAL_QURAN_AYAHS) {
     return (
          <div className="bg-card rounded-lg shadow-md p-4 flex items-center gap-4 animate-fade-in">
              <TrophyIcon className="w-8 h-8 text-primary" />
              <div>
                  <h3 className="font-semibold text-text-primary">مبارك!</h3>
                  <p className="text-sm text-text-secondary">لقد أكملت تحدي ختم القرآن بنجاح.</p>
              </div>
          </div>
      );
  }

  if (challenge.isPaused) {
    return (
         <div className="bg-card rounded-lg shadow-md p-4 flex items-center gap-4 animate-fade-in">
            <TrophyIcon className="w-8 h-8 text-text-secondary" />
            <div>
                <h3 className="font-semibold text-text-primary">التحدي متوقف مؤقتًا</h3>
                <p className="text-sm text-text-secondary">استأنف التحدي من صفحة التحدي للمتابعة.</p>
            </div>
        </div>
    );
  }

  const todayStr = getTodaysDateString();
  const startDate = new Date(challenge.startDate);
  const today = new Date(todayStr);

  const timeDiff = today.getTime() - startDate.getTime();
  const daysElapsed = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
  
  const ayahsRemaining = TOTAL_QURAN_AYAHS - totalCompleted;
  const daysRemaining = Math.max(1, challenge.durationDays - daysElapsed);

  const requiredPace = Math.ceil(ayahsRemaining / daysRemaining);
  const todaysProgress = challenge.progress[todayStr] || 0;
  const ayahsLeftForToday = Math.max(0, requiredPace - todaysProgress);

  return (
    <div className="bg-card rounded-lg shadow-md p-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold text-text-primary">ورد اليوم</h3>
              <p className="text-sm text-text-secondary">هدف اليوم لإتمام ختم القرآن.</p>
            </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{ayahsLeftForToday}</p>
          <p className="text-sm text-text-secondary">آية متبقية</p>
        </div>
      </div>
    </div>
  );
};

export default ChallengeBanner;
