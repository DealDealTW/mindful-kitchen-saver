import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, SortAsc, Clock, CalendarRange } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const SortMenu: React.FC = () => {
  const { sort, setSort, language } = useApp();
  const t = useTranslation(language);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <ArrowUpDown className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="end">
        <div className="bg-primary/10 p-3 border-b">
          <h3 className="font-bold text-primary">{t('sortBy')}</h3>
        </div>
        <div className="divide-y">
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-none px-3 py-2 h-auto text-left ${sort === 'name' ? 'bg-muted' : ''}`}
            onClick={() => setSort('name')}
          >
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-primary" />
              <span>{t('name')}</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-none px-3 py-2 h-auto text-left ${sort === 'expiry' ? 'bg-muted' : ''}`}
            onClick={() => setSort('expiry')}
          >
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-whatsleft-orange" />
              <span>{t('expiryDate')}</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-none px-3 py-2 h-auto text-left ${sort === 'added' ? 'bg-muted' : ''}`}
            onClick={() => setSort('added')}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-whatsleft-green" />
              <span>{t('recentlyAdded')}</span>
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SortMenu;
