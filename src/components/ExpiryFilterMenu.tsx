import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarClock, AlertTriangle, AlertCircle, LayoutGrid } from 'lucide-react';
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
      <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="end">
        <div className="bg-primary/10 p-3 border-b">
          <h3 className="font-bold text-primary">{t('expiryFilter')}</h3>
        </div>
        <div className="divide-y">
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-none px-3 py-2 h-auto text-left ${filter === 'Expiring' ? 'bg-muted' : ''}`}
            onClick={() => setFilter('Expiring')}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-whatsleft-orange" />
              <span>{t('expiring')}</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-none px-3 py-2 h-auto text-left ${filter === 'Expired' ? 'bg-muted' : ''}`}
            onClick={() => setFilter('Expired')}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-whatsleft-red" />
              <span>{t('expired')}</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-none px-3 py-2 h-auto text-left ${filter !== 'Expiring' && filter !== 'Expired' ? 'bg-muted' : ''}`}
            onClick={() => setFilter('All')}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span>{t('showAll')}</span>
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExpiryFilterMenu;
