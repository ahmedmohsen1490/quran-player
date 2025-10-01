import { Theme } from './types';

export const DEFAULT_THEME: Theme = {
  name: 'Default Blue',
  light: {
    primary: '#2563eb', // blue-600
    background: '#f9fafb', // gray-50
    card: '#ffffff', // white
    textPrimary: '#1f2937', // gray-800
    textSecondary: '#6b7280', // gray-500
    border: '#e5e7eb', // gray-200
  },
  dark: {
    primary: '#3b82f6', // blue-500
    background: '#111827', // gray-900
    card: '#1f2937', // gray-800
    textPrimary: '#f9fafb', // gray-100
    textSecondary: '#9ca3af', // gray-400
    border: '#374151', // gray-700
  },
};

export const PREDEFINED_THEMES: Theme[] = [
  DEFAULT_THEME,
  {
    name: 'Emerald Green',
    light: {
      primary: '#059669', // emerald-600
      background: '#f9fafb',
      card: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
    },
    dark: {
      primary: '#10b981', // emerald-500
      background: '#111827',
      card: '#1f2937',
      textPrimary: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
    },
  },
  {
    name: 'Crimson Red',
    light: {
      primary: '#dc2626', // red-600
      background: '#f9fafb',
      card: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
    },
    dark: {
      primary: '#ef4444', // red-500
      background: '#111827',
      card: '#1f2937',
      textPrimary: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
    },
  },
  {
    name: 'Royal Purple',
    light: {
      primary: '#7c3aed', // violet-600
      background: '#f9fafb',
      card: '#ffffff',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
    },
    dark: {
      primary: '#8b5cf6', // violet-500
      background: '#111827',
      card: '#1f2937',
      textPrimary: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
    },
  },
];
