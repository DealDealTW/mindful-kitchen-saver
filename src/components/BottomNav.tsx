
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
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around z-50">
      <Link 
        to="/" 
        className={`flex flex-col items-center justify-center w-20 h-full ${
          isActive('/') 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <LayoutGridIcon className="h-5 w-5" />
        <span className="text-xs mt-1">{t('dashboard')}</span>
      </Link>
      
      <Link 
        to="/stats" 
        className={`flex flex-col items-center justify-center w-20 h-full ${
          isActive('/stats') 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <BarChart3Icon className="h-5 w-5" />
        <span className="text-xs mt-1">{t('stats')}</span>
      </Link>
      
      <Link 
        to="/settings" 
        className={`flex flex-col items-center justify-center w-20 h-full ${
          isActive('/settings') 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <SettingsIcon className="h-5 w-5" />
        <span className="text-xs mt-1">{t('settings')}</span>
      </Link>
    </div>
  );
};

export default BottomNav;
