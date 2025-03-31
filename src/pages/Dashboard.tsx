
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon } from 'lucide-react';
import ItemCard from '@/components/ItemCard';
import ItemModal from '@/components/ItemModal';
import ItemForm from '@/components/ItemForm';
import { useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import FilterMenu from '@/components/FilterMenu';

const Dashboard: React.FC = () => {
  const { items, filter, sort, selectedItem, language } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<typeof selectedItem>(null);
  const t = useTranslation(language);
  
  const handleEdit = () => {
    setEditItem(selectedItem);
    setFormOpen(true);
  };
  
  const handleAddItem = () => {
    setEditItem(null);
    setFormOpen(true);
  };
  
  const filteredItems = items.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Food' || filter === 'Household') return item.category === filter;
    if (filter === 'Expiring') {
      const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntil >= 0 && daysUntil <= 4; // Items expiring in 4 days or less
    }
    if (filter === 'Expired') {
      const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntil < 0; // Already expired items
    }
    return true;
  });
  
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sort === 'expiry') {
      return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
    } else { // 'added'
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <FilterMenu />
      </div>
      
      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">{t('noItems')}</p>
          <Button onClick={handleAddItem}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('addYourFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sortedItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
      
      <div className="fixed bottom-20 right-4">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={handleAddItem}
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>
      
      <ItemModal onEdit={handleEdit} />
      
      <ItemForm 
        open={formOpen} 
        onOpenChange={setFormOpen}
        editItem={editItem}
      />
    </div>
  );
};

export default Dashboard;
