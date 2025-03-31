import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGridIcon, BarChart3Icon, SettingsIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { language } = useApp();
  const t = useTranslation(language);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavItemStyles = (path: string) => {
    if (isActive(path)) {
      switch (path) {
        case '/':
          return 'text-primary border-t-2 border-primary';
        case '/stats':
          return 'text-whatsleft-green border-t-2 border-whatsleft-green';
        case '/settings':
          return 'text-whatsleft-orange border-t-2 border-whatsleft-orange';
        default:
          return 'text-primary border-t-2 border-primary';
      }
    }
    return 'text-muted-foreground hover:text-foreground hover:bg-muted/40';
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background shadow-[0_-1px_3px_rgba(0,0,0,0.1)] flex items-center justify-around z-50">
      <div className="max-w-md w-full mx-auto flex items-center justify-around">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-20 h-full py-1 ${getNavItemStyles('/')}`}
        >
          <LayoutGridIcon className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">{t('dashboard')}</span>
        </Link>
        
        <Link 
          to="/stats" 
          className={`flex flex-col items-center justify-center w-20 h-full py-1 ${getNavItemStyles('/stats')}`}
        >
          <BarChart3Icon className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">{t('stats')}</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`flex flex-col items-center justify-center w-20 h-full py-1 ${getNavItemStyles('/settings')}`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">{t('settings')}</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
