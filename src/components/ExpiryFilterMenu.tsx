
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarClock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const ExpiryFilterMenu: React.FC = () => {
  const { filter, setFilter, language } = useApp();
  const t = useTranslation(language);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={filter === 'Expiring' || filter === 'Expired' ? "text-primary" : ""}
        >
          <CalendarClock className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-1">
          <h3 className="font-medium">{t('expiryFilter')}</h3>
          <div className="space-y-1 pt-1">
            <Button
              variant={filter === 'Expiring' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('Expiring')}
            >
              {t('expiring')}
            </Button>
            <Button
              variant={filter === 'Expired' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('Expired')}
            >
              {t('expired')}
            </Button>
            <Button
              variant={filter !== 'Expiring' && filter !== 'Expired' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('All')}
            >
              {t('showAll')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExpiryFilterMenu;
