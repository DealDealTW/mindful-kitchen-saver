
import React from 'react';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowUpDownIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const SortFilterBar: React.FC = () => {
  const { filter, setFilter, sort, setSort, language } = useApp();
  const t = useTranslation(language);

  return (
    <div className="flex justify-between items-center mb-4 px-1">
      <Tabs 
        value={filter} 
        onValueChange={(value) => setFilter(value as any)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="All">{t('all')}</TabsTrigger>
          <TabsTrigger value="Food">{t('food')}</TabsTrigger>
          <TabsTrigger value="Household">{t('household')}</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-2">
            <ArrowUpDownIcon className="h-5 w-5" />
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
    </div>
  );
};

export default SortFilterBar;
