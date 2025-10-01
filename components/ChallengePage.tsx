

import React, { useState, useMemo } from 'react';
import { QuranChallenge } from '../types';

interface ChallengePageProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: QuranChallenge | null;
  onUpdateChallenge: (challenge: QuranChallenge | null) => void;
}

const TOTAL_QURAN_AYAHS = 6236;

const getTodaysDateString = () => new Date().toISOString().split('T')[0];

const ChallengePage: React.FC<ChallengePageProps> = ({ isOpen, onClose, challenge, onUpdateChallenge }) => {
  const [duration, setDuration] = useState(30);

  const handleStartChallenge = () => {
    const newChallenge: QuranChallenge = {
      isActive: true,
      isPaused: false,
      startDate: new Date().toISOString(),
      durationDays: duration,
      progress: {},
      completedAyahs: {}, // Initialize the unique ayah tracker
    };
    onUpdateChallenge(newChallenge);
  };

  const handleResetChallenge = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين التحدي؟ سيتم حذف كل تقدمك.')) {
        onUpdateChallenge(null);
    }
  };

  const handlePauseToggle = () => {
    if (challenge) {
      onUpdateChallenge({ ...challenge, isPaused: !challenge.isPaused });
    }
  };

  const handleEditDuration = () => {
      const newDurationStr = window.prompt('أدخل المدة الجديدة بالأيام:', String(challenge?.durationDays || 30));
      if (newDurationStr) {
          const newDuration = parseInt(newDurationStr, 10);
          if (!isNaN(newDuration) && newDuration > 0 && challenge) {
              onUpdateChallenge({ ...challenge, durationDays: newDuration });
          }
      }
  };


  const stats = useMemo(() => {
    if (!challenge || !challenge.isActive) return null;

    // Calculate total from the unique ayahs record to prevent double counting
    const totalCompleted = Object.values(challenge.completedAyahs || {}).reduce((sum, ayahs) => sum + ayahs.length, 0);
    const ayahsRemaining = TOTAL_QURAN_AYAHS - totalCompleted;
    const overallProgress = Math.min(100, (totalCompleted / TOTAL_QURAN_AYAHS) * 100);

    const startDate = new Date(challenge.startDate);
    const today = new Date(getTodaysDateString());
    const timeDiff = today.getTime() - startDate.getTime();
    const daysElapsed = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
    const daysRemaining = Math.max(0, challenge.durationDays - daysElapsed);
    
    const requiredPace = daysRemaining > 0 ? Math.ceil(ayahsRemaining / daysRemaining) : ayahsRemaining;
    
    return {
      totalCompleted,
      ayahsRemaining,
      overallProgress,
      daysElapsed,
      daysRemaining,
      requiredPace,
    };
  }, [challenge]);

  if (!isOpen) return null;

  const renderSetupView = () => (
    <div className="text-center">
      <h3 className="text-xl font-bold text-text-primary mb-2">ابدأ تحدي ختم القرآن</h3>
      <p className="text-text-secondary mb-6">حدد المدة التي ترغب في إكمال القرآن خلالها.</p>
      <div className="flex items-center justify-center gap-4 mb-8">
        <label htmlFor="duration" className="font-medium text-text-primary">أريد أن أختم في</label>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-24 text-center bg-background border border-border-color rounded-md p-2 focus:ring-primary focus:border-primary"
        />
        <span className="font-medium text-text-primary">يومًا</span>
      </div>
      <button onClick={handleStartChallenge} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
        ابدأ التحدي
      </button>
    </div>
  );

  const renderDashboardView = () => {
    if (!challenge || !stats) return null;
    const { totalCompleted, ayahsRemaining, overallProgress, daysRemaining, requiredPace } = stats;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-text-primary">تقدمك في الختمة</h3>
                    <span className="text-sm font-mono text-primary">{overallProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-border-color rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-primary">{totalCompleted}</p>
                    <p className="text-sm text-text-secondary">آية تمت قراءتها</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-primary">{daysRemaining}</p>
                    <p className="text-sm text-text-secondary">يومًا متبقيًا</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <p className="text-2xl font-bold text-primary">{challenge.isPaused ? '-' : requiredPace}</p>
                    <p className="text-sm text-text-secondary">آية/يوم للمتابعة</p>
                </div>
            </div>

            {challenge.isPaused && (
                <div className="p-4 text-center bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-lg">
                    <p className="font-semibold">التحدي متوقف مؤقتًا. استأنف للمتابعة.</p>
                </div>
            )}
            
            <div className="border-t border-border-color pt-4">
                <h4 className="font-semibold text-text-primary mb-3">إدارة التحدي</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handlePauseToggle} className="bg-primary/20 text-primary font-semibold py-2 px-4 rounded-md hover:bg-primary/30">
                        {challenge.isPaused ? 'استئناف التحدي' : 'إيقاف مؤقت'}
                    </button>
                    <button onClick={handleEditDuration} className="bg-background text-text-primary font-semibold py-2 px-4 rounded-md hover:bg-border-color">
                        تعديل المدة
                    </button>
                    <button onClick={handleResetChallenge} className="col-span-2 bg-red-500/10 text-red-600 font-semibold py-2 px-4 rounded-md hover:bg-red-500/20">
                        إعادة تعيين التحدي
                    </button>
                </div>
            </div>

        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">تحدي ختم القرآن</h2>
          <button onClick={onClose} className="text-text-secondary text-3xl leading-none hover:text-text-primary">&times;</button>
        </div>
        
        {challenge && challenge.isActive ? renderDashboardView() : renderSetupView()}
        
      </div>
    </div>
  );
};

export default ChallengePage;
