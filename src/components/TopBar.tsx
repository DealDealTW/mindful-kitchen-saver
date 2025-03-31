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

  const getTitleColor = () => {
    switch (location.pathname) {
      case '/':
        return 'text-primary';
      case '/stats':
        return 'text-whatsleft-green';
      case '/settings':
        return 'text-whatsleft-orange';
      default:
        return 'text-primary';
    }
  };
  
  return (
    <div className="sticky top-0 z-30 bg-background shadow-sm">
      <div className="max-w-md mx-auto flex h-16 items-center justify-between px-4">
        <h1 className={`text-xl font-bold ${getTitleColor()}`}>{getTitle()}</h1>
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
