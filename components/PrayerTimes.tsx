import React, { useState, useEffect, useCallback } from 'react';
import { PrayerSettings, PrayerTimes as PrayerTimesType } from '../types';

interface PrayerTimesProps {
  prayerSettings: PrayerSettings | null;
  remindersEnabled: boolean;
}

const prayerNames: { [key: string]: string } = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const PrayerTimes: React.FC<PrayerTimesProps> = ({ prayerSettings, remindersEnabled }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesType | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleNotifications = useCallback((times: PrayerTimesType) => {
    if (typeof window.Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();
    
    Object.entries(times).forEach(([name, time]) => {
      if (prayerNames[name]) {
        const [hours, minutes] = time.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        if (prayerDate > now) {
          const timeout = prayerDate.getTime() - now.getTime();
          setTimeout(() => {
            new Notification('حي على الصلاة', {
              body: `حان الآن وقت صلاة ${prayerNames[name]}`,
              icon: 'https://i.imgur.com/1m8xN9N.png'
            });
          }, timeout);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (prayerSettings) {
      const fetchPrayerTimes = async () => {
        setIsLoading(true);
        setError(null);
        setPrayerTimes(null);
        try {
          const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${prayerSettings.region}&country=${prayerSettings.country}&method=${prayerSettings.method}`);
          if (!response.ok) {
            throw new Error('Could not find prayer times for this location.');
          }
          const data = await response.json();
          if (data.code === 200) {
            const timings: PrayerTimesType = data.data.timings;
            setPrayerTimes(timings);
            if (remindersEnabled) {
               scheduleNotifications(timings);
            }
          } else {
            throw new Error('An error occurred while fetching prayer times.');
          }
        } catch (err) {
          if(err instanceof Error) setError(err.message);
          else setError('An unknown error occurred.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPrayerTimes();
    }
  }, [prayerSettings, remindersEnabled, scheduleNotifications]);
  
  useEffect(() => {
    if (prayerTimes) {
      const now = new Date();
      let next: { name: string; time: string } | null = null;
      
      const sortedPrayers = Object.entries(prayerTimes)
        .filter(([name]) => prayerNames[name])
        .map(([name, time]) => {
            const [hours, minutes] = time.split(':').map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);
            return { name, time, date: prayerDate };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (const prayer of sortedPrayers) {
        if (prayer.date > now) {
          next = { name: prayerNames[prayer.name], time: prayer.time };
          break;
        }
      }
      
      if (!next && sortedPrayers.length > 0) {
          next = { name: prayerNames[sortedPrayers[0].name], time: sortedPrayers[0].time };
      }

      setNextPrayer(next);
    }
  }, [prayerTimes]);

  if (!prayerSettings) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="bg-card rounded-lg shadow-md p-4 animate-fade-in">
        <h3 className="text-lg font-semibold text-text-primary mb-3 text-center">أوقات الصلاة</h3>
        {isLoading && <p className="text-center">...جاري التحميل</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {prayerTimes && !isLoading && !error && (
          <div>
            {nextPrayer && (
                <div className="text-center mb-4">
                    <p className="text-sm text-text-secondary">الصلاة التالية</p>
                    <p className="text-2xl font-bold text-primary">
                        {nextPrayer.name} في {nextPrayer.time}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-5 gap-2 text-center border-t border-border-color pt-3">
              {Object.entries(prayerTimes)
                .filter(([key]) => prayerNames[key])
                .map(([key, value]) => (
                <div key={key}>
                  <p className="font-semibold text-text-primary">{prayerNames[key]}</p>
                  <p className="text-sm text-text-secondary">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerTimes;