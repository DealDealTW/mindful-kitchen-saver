
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
  
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background px-4 border-b">
      <h1 className="text-xl font-medium">{getTitle()}</h1>
      {location.pathname === '/' && (
        <div className="flex items-center space-x-2">
          <ExpiryFilterMenu />
          <SortMenu />
          <Notifications />
        </div>
      )}
    </div>
  );
};

export default TopBar;
