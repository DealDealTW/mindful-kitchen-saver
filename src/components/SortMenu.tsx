
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from 'lucide-react';
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
      <PopoverContent className="w-56" align="end">
        <div className="space-y-1">
          <h3 className="font-medium">{t('sortBy')}</h3>
          <div className="space-y-1 pt-1">
            <Button
              variant={sort === 'name' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSort('name')}
            >
              {t('name')}
            </Button>
            <Button
              variant={sort === 'expiry' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSort('expiry')}
            >
              {t('expiryDate')}
            </Button>
            <Button
              variant={sort === 'added' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSort('added')}
            >
              {t('recentlyAdded')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SortMenu;
