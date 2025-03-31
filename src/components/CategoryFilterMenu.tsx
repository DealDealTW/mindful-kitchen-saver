
import React from 'react';
import { Button } from "@/components/ui/button";
import { Apple, ShoppingBag, LayoutGrid } from 'lucide-react';
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
        variant={isCategory && filter === 'All' ? 'default' : 'outline'}
        className="flex-1 py-6"
        onClick={() => handleFilter('All')}
      >
        <LayoutGrid className="mr-2 h-5 w-5" />
        {t('all')}
      </Button>
      <Button
        variant={filter === 'Food' ? 'default' : 'outline'}
        className="flex-1 py-6"
        onClick={() => handleFilter('Food')}
      >
        <Apple className="mr-2 h-5 w-5" />
        {t('food')}
      </Button>
      <Button
        variant={filter === 'Household' ? 'default' : 'outline'}
        className="flex-1 py-6"
        onClick={() => handleFilter('Household')}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {t('household')}
      </Button>
    </div>
  );
};

export default CategoryFilterMenu;
