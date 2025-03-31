
import React from 'react';
import { Item, useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { AppleIcon, UtensilsIcon, CookingPotIcon, ShoppingBasketIcon } from 'lucide-react';
import { useTranslation } from '@/utils/translations';

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const { setSelectedItem, language } = useApp();
  const t = useTranslation(language);
  const daysRemaining = calculateDaysUntilExpiry(item.expiryDate);
  
  const getExpiryStatus = () => {
    if (daysRemaining < 0) return 'item-expired';
    if (daysRemaining <= 1) return 'item-expired';
    if (daysRemaining <= 4) return 'item-warning';
    return 'item-safe';
  };

  const getCategoryIcon = () => {
    if (item.category === 'Food') {
      return <UtensilsIcon className="h-5 w-5" />;
    } else {
      return <ShoppingBasketIcon className="h-5 w-5" />;
    }
  };

  const getExpiryText = () => {
    if (daysRemaining < 0) return t('expired');
    if (daysRemaining === 0) return `${t('expired')} today`;
    if (daysRemaining === 1) return `${t('expiring')} tomorrow`;
    return `${daysRemaining} ${t('days')}`;
  };

  return (
    <div 
      className={`relative bg-card rounded-xl p-4 shadow-sm border-2 animate-fadeIn cursor-pointer transition-all duration-200 hover:shadow-md ${getExpiryStatus()}`}
      onClick={() => setSelectedItem(item)}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-lg truncate pr-1">{item.name}</h3>
        <span className="text-muted-foreground">{getCategoryIcon()}</span>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <span className="font-medium">{item.quantity}</span>
        <span className={`text-sm font-medium ${getExpiryStatus()}`}>
          {getExpiryText()}
        </span>
      </div>
    </div>
  );
};

export default ItemCard;
