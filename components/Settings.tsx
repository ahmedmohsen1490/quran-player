import React, { useState, useEffect } from 'react';
import { PrayerSettings, Theme, AzkarSettings, Surah, Reciter } from '../types';
import { CALCULATION_METHODS } from '../constants';
import ThemeSelector from './ThemeSelector';
import { InfoIcon } from './icons/InfoIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    remindersEnabled: boolean;
    onToggleReminders: () => void;
    currentSettings: PrayerSettings | null;
    onSaveSettings: (settings: PrayerSettings) => void;
    currentTheme: Theme;
    onThemeChange: (theme: Theme) => void;
    azkarSettings: AzkarSettings;
    onAzkarSettingsChange: (settings: AzkarSettings) => void;
    surahs: Surah[];
    downloadedAudio: Set<string>;
    downloadedTafsir: Set<number>;
    selectedReciter: Reciter | null;
    onDeleteAudio: (surah: Surah) => void;
    onDeleteTafsir: (surahId: number) => void;
}

interface Country {
    name: string;
    iso3: string;
    states: { name: string; state_code: string; }[];
}


const Settings: React.FC<SettingsProps> = ({ 
    isOpen, onClose, remindersEnabled, onToggleReminders, 
    currentSettings, onSaveSettings, currentTheme, onThemeChange, 
    azkarSettings, onAzkarSettingsChange, surahs, downloadedAudio,
    downloadedTafsir, selectedReciter, onDeleteAudio, onDeleteTafsir
}) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [regions, setRegions] = useState<{ name: string }[]>([]);
    
    const [selectedCountry, setSelectedCountry] = useState(currentSettings?.country || '');
    const [selectedRegion, setSelectedRegion] = useState(currentSettings?.region || '');
    const [selectedMethod, setSelectedMethod] = useState<number>(currentSettings?.method || CALCULATION_METHODS[0].id);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showBatteryInfo, setShowBatteryInfo] = useState(false);
    
    useEffect(() => {
      if (isOpen) {
        setSelectedCountry(currentSettings?.country || '');
        setSelectedRegion(currentSettings?.region || '');
        setSelectedMethod(currentSettings?.method || CALCULATION_METHODS[0].id);
      }
    }, [isOpen, currentSettings]);

    useEffect(() => {
      if (!isOpen) return;

      const fetchCountries = async () => {
          setIsLoading(true);
          setError('');
          try {
              const response = await fetch('https://countriesnow.space/api/v0.1/countries/states');
              if (!response.ok) throw new Error('Failed to fetch country data.');
              const data = await response.json();
              if (data.error) throw new Error(data.msg);
              const sortedCountries = data.data.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
              setCountries(sortedCountries);
              
              if (currentSettings?.country) {
                const countryData = sortedCountries.find((c: Country) => c.name === currentSettings.country);
                if (countryData?.states) {
                  setRegions(countryData.states.sort((a, b) => a.name.localeCompare(b.name)));
                }
              }
          } catch (err) {
              if (err instanceof Error) setError(err.message);
              else setError('An unknown error occurred while fetching countries.');
          } finally {
              setIsLoading(false);
          }
      };
      fetchCountries();
    }, [isOpen, currentSettings]);

    useEffect(() => {
        if (selectedCountry) {
            const countryData = countries.find(c => c.name === selectedCountry);
            if (countryData && countryData.states) {
                setRegions(countryData.states.sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                setRegions([]);
            }
            if (selectedCountry !== currentSettings?.country) {
                setSelectedRegion('');
            }
        }
    }, [selectedCountry, countries, currentSettings]);

    const handleSave = () => {
        if (!selectedCountry || !selectedRegion || !selectedMethod) {
            setError('Please complete all location and calculation selections.');
            return;
        }
        setError('');
        onSaveSettings({ country: selectedCountry, region: selectedRegion, method: selectedMethod });
    };

    const handleToggleAzkarReminders = () => {
        const newIsEnabled = !azkarSettings.isEnabled;
        if (newIsEnabled) {
            if (typeof Notification === 'undefined') {
                alert('هذا المتصفح لا يدعم الإشعارات.');
                return;
            }
            if (Notification.permission === 'granted') {
                onAzkarSettingsChange({ ...azkarSettings, isEnabled: true });
                setShowBatteryInfo(true);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        onAzkarSettingsChange({ ...azkarSettings, isEnabled: true });
                        setShowBatteryInfo(true);
                    } else {
                        alert('لتمكين الإشعارات، يرجى منح الإذن.');
                    }
                });
            } else {
                alert('تم حظر الإشعارات. يرجى تفعيلها من إعدادات المتصفح.');
            }
        } else {
            onAzkarSettingsChange({ ...azkarSettings, isEnabled: false });
        }
    };
    
    const downloadedContentSurahs = surahs.filter(surah => {
        const audioKey = selectedReciter ? `${selectedReciter.identifier}-${surah.id}` : '';
        return downloadedAudio.has(audioKey) || downloadedTafsir.has(surah.id);
    });

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
                <div className="bg-card rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-text-primary">الإعدادات</h2>
                        <button onClick={onClose} className="text-text-secondary text-3xl leading-none hover:text-text-primary">&times;</button>
                    </div>
                    
                    {error && <p className="text-red-500 text-center mb-4 text-sm">{error}</p>}

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />

                        <div className="p-3 bg-background rounded-lg space-y-3">
                            <h3 className="font-medium text-text-primary">إعدادات التنبيهات</h3>
                            <div className="flex items-center justify-between">
                                <label htmlFor="reminders-toggle" className="text-sm text-text-primary">تنبيهات الصلاة</label>
                                <button
                                    role="switch"
                                    aria-checked={remindersEnabled}
                                    onClick={onToggleReminders}
                                    className={`${remindersEnabled ? 'bg-primary' : 'bg-border-color'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                                >
                                    <span className={`${remindersEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="azkar-toggle" className="text-sm text-text-primary">تنبيهات الأذكار</label>
                                <button
                                    role="switch"
                                    aria-checked={azkarSettings.isEnabled}
                                    onClick={handleToggleAzkarReminders}
                                    className={`${azkarSettings.isEnabled ? 'bg-primary' : 'bg-border-color'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                                >
                                    <span className={`${azkarSettings.isEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                </button>
                            </div>
                            {azkarSettings.isEnabled && (
                                <div className="flex items-center justify-between animate-fade-in pl-2">
                                    <label htmlFor="azkar-frequency" className="text-xs text-text-secondary">التكرار</label>
                                    <select 
                                        id="azkar-frequency"
                                        value={azkarSettings.frequency}
                                        onChange={(e) => onAzkarSettingsChange({ ...azkarSettings, frequency: Number(e.target.value)})}
                                        className="bg-card border border-border-color text-text-primary text-xs rounded-md focus:ring-primary focus:border-primary block p-1"
                                    >
                                        <option value={1}>كل ساعة</option>
                                        <option value={3}>كل 3 ساعات</option>
                                        <option value={12}>مرتين يوميًا</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-3 bg-background rounded-lg space-y-3">
                            <h3 className="font-medium text-text-primary">إدارة المحتوى المحمّل</h3>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {downloadedContentSurahs.length > 0 ? downloadedContentSurahs.map(surah => {
                                    const audioKey = selectedReciter ? `${selectedReciter.identifier}-${surah.id}` : '';
                                    const isAudioDownloaded = downloadedAudio.has(audioKey);
                                    const isTafsirDownloaded = downloadedTafsir.has(surah.id);
                                    return (
                                        <div key={surah.id} className="flex items-center justify-between p-2 bg-card rounded">
                                            <span className="text-sm font-amiri-quran">{surah.name}</span>
                                            <div className="flex items-center gap-3">
                                                {isAudioDownloaded && (
                                                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                                                        <span>صوت</span>
                                                        <button 
                                                            onClick={() => onDeleteAudio(surah)} 
                                                            className="text-red-500 hover:text-red-700"
                                                            aria-label={`Delete audio for ${surah.name}`}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {isTafsirDownloaded && (
                                                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                                                        <span>تفسير</span>
                                                        <button 
                                                            onClick={() => onDeleteTafsir(surah.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            aria-label={`Delete tafsir for ${surah.name}`}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-xs text-text-secondary text-center p-4">لا يوجد محتوى محمّل.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-background rounded-lg space-y-3">
                            <h3 className="font-medium text-text-primary">الموقع والحساب</h3>
                            {isLoading && <p className="text-sm text-center">...جاري تحميل البيانات</p>}
                            <div className='space-y-2'>
                            <div>
                                <label htmlFor="settings-country" className="block text-xs font-medium text-text-secondary">الدولة</label>
                                <select id="settings-country" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} disabled={isLoading}
                                    className="mt-1 block w-full bg-card border border-border-color rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                                    <option value="">اختر الدولة</option>
                                    {countries.map(c => <option key={c.iso3} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="settings-region" className="block text-xs font-medium text-text-secondary">الولاية/المنطقة</label>
                                <select id="settings-region" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} disabled={!selectedCountry || regions.length === 0}
                                    className="mt-1 block w-full bg-card border border-border-color rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                                    <option value="">اختر الولاية/المنطقة</option>
                                    {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="settings-method" className="block text-xs font-medium text-text-secondary">طريقة الحساب</label>
                                <select id="settings-method" value={selectedMethod} onChange={(e) => setSelectedMethod(Number(e.target.value))}
                                    className="mt-1 block w-full bg-card border border-border-color rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                                    {CALCULATION_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleSave}
                                className="w-full mt-2 bg-primary/20 text-primary font-bold py-1.5 px-4 rounded-md hover:bg-primary/30 focus:outline-none"
                            >حفظ إعدادات الصلاة</button>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:opacity-90 focus:outline-none"
                        >
                            تم
                        </button>
                    </div>
                </div>
            </div>
            {showBatteryInfo && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60]" onClick={() => setShowBatteryInfo(false)}>
                    <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-sm m-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <InfoIcon className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-3">تنبيه هام</h3>
                        <p className="text-sm text-text-secondary mb-5">
                            لضمان وصول إشعارات الأذكار بانتظام، قد تحتاج إلى استثناء التطبيق من إعدادات توفير البطارية على جهازك.
                        </p>
                        <button
                            onClick={() => setShowBatteryInfo(false)}
                            className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:opacity-90 w-full"
                        >
                            حسنًا، فهمت
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Settings;