import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ArrowUpDown,
  Bell,
  Clock,
  CalendarClock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import Notifications from './Notifications';
import SortMenu from './SortMenu';
import ExpiryFilterMenu from './ExpiryFilterMenu';
import '@fontsource/montserrat';

const TopBar: React.FC = () => {
  const location = useLocation();
  const { language } = useApp();
  const t = useTranslation(language);
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return t('appName');
      case '/stats':
        return t('stats');
      case '/settings':
        return t('settings');
      default:
        return t('appName');
    }
  };

  const getTitleColor = () => {
    switch (location.pathname) {
      case '/':
        return '#F97316'; // 橙色
      case '/stats':
        return '#22C55E'; // 綠色
      case '/settings':
        return '#F97316'; // 橙色，與首頁一致
      default:
        return '#F97316';
    }
  };
  
  return (
    <div className="sticky top-0 z-30 bg-background shadow-sm">
      <div className="max-w-md mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 
            className="text-2xl font-bold font-montserrat"
            style={{
              WebkitTextStroke: `1.5px ${getTitleColor()}`,
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {getTitle()}
          </h1>
        </div>
        {location.pathname === '/' && (
          <div className="flex items-center space-x-1">
            <ExpiryFilterMenu />
            <SortMenu />
            <Notifications />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
