import React from 'react';
import { Item, useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { Apple, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/utils/translations';
import { format, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";

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

  const getIconColorClass = () => {
    if (daysRemaining < 0 || daysRemaining <= 1) return 'text-whatsleft-red';
    if (daysRemaining <= 4) return 'text-whatsleft-yellow';
    return 'text-whatsleft-green';
  };

  const getExpiryColor = () => {
    if (daysRemaining < 0 || daysRemaining <= 1) return "bg-whatsleft-red/10 border-whatsleft-red text-whatsleft-red";
    if (daysRemaining <= 4) return "bg-whatsleft-yellow/10 border-whatsleft-yellow text-whatsleft-yellow";
    return "bg-whatsleft-green/10 border-whatsleft-green text-green-700";
  };

  const getCategoryIcon = () => {
    if (item.category === 'Food') {
      return <Apple className={`h-5 w-5 ${getIconColorClass()}`} />;
    } else {
      return <ShoppingBag className={`h-5 w-5 ${getIconColorClass()}`} />;
    }
  };

  const getExpiryText = () => {
    if (daysRemaining < 0) return t('expired');
    if (daysRemaining === 0) return t('today');
    if (daysRemaining === 1) return t('tomorrow');
    return `${daysRemaining} ${t('days')}`;
  };

  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-sm animate-fadeIn cursor-pointer transition-all duration-200 hover:shadow-md`}
      onClick={() => setSelectedItem(item)}
    >
      <div className={`${getExpiryColor()} px-2 py-1.5`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {getCategoryIcon()}
            <h3 className="font-medium text-sm truncate">{item.name}</h3>
          </div>
          <span className="font-medium text-sm ml-1">x{item.quantity}</span>
        </div>
      </div>
      
      <div className="bg-card px-2 py-1.5 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {format(parseISO(item.expiryDate), 'MMM d')}
        </span>
        <Badge variant="outline" className={`text-xs ${getExpiryColor()} border px-1.5 py-0.5`}>
          {getExpiryText()}
        </Badge>
      </div>
    </div>
  );
};

export default ItemCard;
