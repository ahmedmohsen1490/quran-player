
import React, { useState } from 'react';
import { Theme } from '../types';
import { PREDEFINED_THEMES } from '../themes';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isCustomizing, setIsCustomizing] = useState(currentTheme.isCustom || false);
  const [customTheme, setCustomTheme] = useState<Theme>(currentTheme.isCustom ? currentTheme : PREDEFINED_THEMES[0]);

  const handleSelectPredefined = (theme: Theme) => {
    setIsCustomizing(false);
    onThemeChange(theme);
  };
  
  const handleStartCustomize = () => {
      // Start with the currently selected theme's colors
      const newCustomTheme = {
          ...currentTheme,
          name: 'Custom',
          isCustom: true,
      };
      setCustomTheme(newCustomTheme);
      setIsCustomizing(true);
      onThemeChange(newCustomTheme);
  };

  const handleCustomColorChange = (colorKey: string, value: string, mode: 'light' | 'dark') => {
    const newTheme = {
      ...customTheme,
      [mode]: {
        ...customTheme[mode],
        [colorKey]: value,
      }
    };
    setCustomTheme(newTheme);
    onThemeChange(newTheme);
  };

  return (
    <div className="p-3 bg-background rounded-lg space-y-3">
      <h3 className="font-medium text-text-primary">التصميم</h3>
      
      {/* Predefined Themes */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {PREDEFINED_THEMES.map(theme => (
          <div key={theme.name} className="flex flex-col items-center space-y-1">
            <button
              onClick={() => handleSelectPredefined(theme)}
              className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-card transition-all"
              // FIX: Cast style object to React.CSSProperties to allow for CSS custom properties.
              style={{ backgroundColor: theme.light.primary, '--tw-ring-color': !isCustomizing && currentTheme.name === theme.name ? theme.light.primary : 'transparent' } as React.CSSProperties}
              aria-label={`Select ${theme.name} theme`}
            >
             {!isCustomizing && currentTheme.name === theme.name && <CheckCircleIcon className="w-6 h-6 text-white" />}
            </button>
            <span className="text-xs text-text-secondary">{theme.name}</span>
          </div>
        ))}
        <div className="flex flex-col items-center space-y-1">
           <button
              onClick={handleStartCustomize}
              className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-card transition-all bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400"
              // FIX: Cast style object to React.CSSProperties to allow for CSS custom properties.
              style={{ '--tw-ring-color': isCustomizing ? customTheme.light.primary : 'transparent' } as React.CSSProperties}
              aria-label="Select custom theme"
            >
              {isCustomizing && <CheckCircleIcon className="w-6 h-6 text-white" />}
            </button>
            <span className="text-xs text-text-secondary">Custom</span>
        </div>
      </div>

      {/* Custom Theme Picker */}
      {isCustomizing && (
        <div className="border-t border-border-color pt-4 mt-4 space-y-2 animate-fade-in">
            <h4 className="text-sm font-semibold text-text-primary mb-2">تخصيص الألوان</h4>
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <h5 className='text-xs font-bold text-text-secondary mb-1'>الوضع العادي</h5>
                    {Object.entries(customTheme.light).map(([key, value]) => (
                        <div key={`light-${key}`} className="flex items-center justify-between mb-1">
                            <label htmlFor={`light-${key}`} className="text-xs text-text-secondary capitalize">{key}</label>
                            <input type="color" id={`light-${key}`} value={value} onChange={e => handleCustomColorChange(key, e.target.value, 'light')} className="w-8 h-6 p-0 border-none rounded bg-transparent" />
                        </div>
                    ))}
                </div>
                <div>
                     <h5 className='text-xs font-bold text-text-secondary mb-1'>الوضع الداكن</h5>
                    {Object.entries(customTheme.dark).map(([key, value]) => (
                        <div key={`dark-${key}`} className="flex items-center justify-between mb-1">
                            <label htmlFor={`dark-${key}`} className="text-xs text-text-secondary capitalize">{key}</label>
                            <input type="color" id={`dark-${key}`} value={value} onChange={e => handleCustomColorChange(key, e.target.value, 'dark')} className="w-8 h-6 p-0 border-none rounded bg-transparent" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
