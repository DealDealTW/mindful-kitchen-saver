import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SortAsc, MoreHorizontal, Clock, CalendarRange, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const SortMenu: React.FC = () => {
  const { sort, setSort, language } = useApp();
  const t = useTranslation(language);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted/50">
          <SortAsc className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="end">
        <div className="bg-primary/10 p-3 border-b">
          <h3 className="font-bold text-primary">{t('sortBy')}</h3>
        </div>
        <div className="p-2">
          <Button
            className="w-full justify-start font-normal mb-1 rounded-lg hover:bg-muted/50"
            variant="ghost"
            onClick={() => setSort('name')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                {t('name')}
              </div>
              {sort === 'name' && <Check className="h-4 w-4" />}
            </div>
          </Button>
          <Button
            className="w-full justify-start font-normal mb-1 rounded-lg hover:bg-muted/50"
            variant="ghost"
            onClick={() => setSort('expiry')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                {t('expiryDate')}
              </div>
              {sort === 'expiry' && <Check className="h-4 w-4" />}
            </div>
          </Button>
          <Button
            className="w-full justify-start font-normal rounded-lg hover:bg-muted/50"
            variant="ghost"
            onClick={() => setSort('added')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('recentlyAdded')}
              </div>
              {sort === 'added' && <Check className="h-4 w-4" />}
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SortMenu;
