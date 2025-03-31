import React from 'react';
import { Button } from "@/components/ui/button";
import { Apple, ShoppingBag, LayoutGrid, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const CategoryFilterMenu: React.FC = () => {
  const { filter, setFilter, language } = useApp();
  const t = useTranslation(language);

  const handleFilter = (categoryFilter: 'All' | 'Food' | 'Household') => {
    // Only change to category filter if we're not in expiry filter mode
    if (filter !== 'Expiring' && filter !== 'Expired') {
      setFilter(categoryFilter);
    } else {
      // If we're in expiry mode, switch back to "All" first
      setFilter(categoryFilter);
    }
  };

  const isCategory = filter === 'All' || filter === 'Food' || filter === 'Household';

  return (
    <div className="flex justify-center space-x-2 mb-4 mt-2">
      <Button
        variant="outline"
        className={`flex-1 py-6 relative ${isCategory && filter === 'All' ? 'border-primary/50 bg-primary/5' : ''} hover:bg-muted/50`}
        onClick={() => handleFilter('All')}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          {t('all')}
        </div>
        {isCategory && filter === 'All' && (
          <span className="absolute top-1 right-2">
            <Check className="h-4 w-4 text-primary" />
          </span>
        )}
      </Button>
      <Button
        variant="outline"
        className={`flex-1 py-6 relative ${filter === 'Food' ? 'border-primary/50 bg-primary/5' : ''} hover:bg-muted/50`}
        onClick={() => handleFilter('Food')}
      >
        <div className="flex items-center gap-2">
          <Apple className="h-5 w-5" />
          {t('food')}
        </div>
        {filter === 'Food' && (
          <span className="absolute top-1 right-2">
            <Check className="h-4 w-4 text-primary" />
          </span>
        )}
      </Button>
      <Button
        variant="outline"
        className={`flex-1 py-6 relative ${filter === 'Household' ? 'border-primary/50 bg-primary/5' : ''} hover:bg-muted/50`}
        onClick={() => handleFilter('Household')}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          {t('household')}
        </div>
        {filter === 'Household' && (
          <span className="absolute top-1 right-2">
            <Check className="h-4 w-4 text-primary" />
          </span>
        )}
      </Button>
    </div>
  );
};

export default CategoryFilterMenu;
