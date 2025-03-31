import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, LayoutGrid, Filter, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const ExpiryFilterMenu: React.FC = () => {
  const { filter, setFilter, language } = useApp();
  const t = useTranslation(language);
  
  // We only handle expiry filters here
  const handleFilterChange = (newFilter: 'All' | 'Expiring' | 'Expired') => {
    setFilter(newFilter);
  };
  
  // Check if filter is related to expiry
  const isExpiryFilter = (filter === 'All' || filter === 'Expiring' || filter === 'Expired');
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted/50">
          <Filter className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="end">
        <div className="bg-primary/10 p-3 border-b">
          <h3 className="font-bold text-primary">{t('expiryFilter')}</h3>
        </div>
        <div className="p-2">
          <Button
            className="w-full justify-start font-normal mb-1 rounded-lg hover:bg-muted/50"
            variant="ghost"
            onClick={() => handleFilterChange('Expiring')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('expiring')}
              </div>
              {filter === 'Expiring' && <Check className="h-4 w-4" />}
            </div>
          </Button>
          <Button
            className="w-full justify-start font-normal mb-1 rounded-lg hover:bg-muted/50"
            variant="ghost"
            onClick={() => handleFilterChange('Expired')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('expired')}
              </div>
              {filter === 'Expired' && <Check className="h-4 w-4" />}
            </div>
          </Button>
          <Button
            className="w-full justify-start font-normal rounded-lg hover:bg-muted/50"
            variant="ghost"
            onClick={() => handleFilterChange('All')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                {t('showAll')}
              </div>
              {filter === 'All' && <Check className="h-4 w-4" />}
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExpiryFilterMenu;
