import React from 'react';
import { ListeningStats } from '../types';

interface StatisticsProps {
  stats: ListeningStats;
}

const Statistics: React.FC<StatisticsProps> = ({ stats }) => {
  return (
    <div className="bg-card rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-3 text-center">إحصائيات الاستماع</h3>
      <div className="flex justify-around">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.hoursThisWeek.toFixed(1)}</p>
          <p className="text-sm text-text-secondary">ساعة هذا الأسبوع</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.surahsCompleted}</p>
          <p className="text-sm text-text-secondary">سورة مكتملة</p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;