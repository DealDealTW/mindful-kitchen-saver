import React from 'react';
import { Item, useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { Apple, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@/utils/translations';
import { format, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";

// 定義視圖模式類型
export type ViewMode = 'grid' | 'list' | 'photo';

interface ItemCardProps {
  item: Item;
  viewMode?: ViewMode; // 可選參數，默認為網格模式
}

const ItemCard: React.FC<ItemCardProps> = ({ item, viewMode = 'grid' }) => {
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

  // 照片模式卡片
  if (viewMode === 'photo') {
    return (
      <div 
        key={item.id}
        className="aspect-square rounded-xl overflow-hidden shadow-sm animate-fadeIn cursor-pointer relative"
        onClick={() => setSelectedItem(item)}
      >
        <img 
          src={item.image!} 
          alt={item.name} 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          {/* 第一行：類別圖標、物品名稱（左）和數量（右） */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.category === 'Food' ? (
                <Apple className="h-4 w-4 text-white" />
              ) : (
                <ShoppingBag className="h-4 w-4 text-white" />
              )}
              <h3 className="text-white font-medium truncate">{item.name}</h3>
            </div>
            <span className="text-xs text-white/80 font-medium px-2 py-1 bg-black/30 rounded-md">
              x{item.quantity}
            </span>
          </div>
          
          {/* 第二行：到期日期（左）和天數（右） */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-white/80">
              {format(parseISO(item.expiryDate), 'MMM d, yyyy')}
            </span>
            <Badge variant="outline" className={`text-xs border px-1.5 py-0.5 ${
              daysRemaining < 0 || daysRemaining <= 1 ? 'bg-whatsleft-red/30 border-whatsleft-red text-white' : 
              daysRemaining <= 4 ? 'bg-whatsleft-yellow/30 border-whatsleft-yellow text-white' : 
              'bg-whatsleft-green/30 border-whatsleft-green text-white'
            }`}>
              {getExpiryText()}
            </Badge>
          </div>
        </div>
        
        {/* 到期指示器 */}
        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
          daysRemaining < 0 || daysRemaining <= 1 ? 'bg-whatsleft-red text-white' : 
          daysRemaining <= 4 ? 'bg-whatsleft-yellow text-black' : 
          'bg-whatsleft-green text-white'
        }`}>
          {daysRemaining < 0 
            ? '!' 
            : daysRemaining <= 4 ? daysRemaining : ''}
        </div>
      </div>
    );
  }

  // 網格模式卡片
  if (viewMode === 'grid') {
    return (
      <div 
        className="relative rounded-xl overflow-hidden shadow-sm animate-fadeIn cursor-pointer transition-all duration-200 hover:shadow-md"
        onClick={() => setSelectedItem(item)}
      >
        <div className={`${getExpiryColor()} px-2 py-1.5 relative z-10`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {getCategoryIcon()}
              <h3 className="font-medium text-sm truncate">{item.name}</h3>
            </div>
            <span className="font-medium text-sm ml-1">x{item.quantity}</span>
          </div>
        </div>
        
        <div className="bg-card px-2 py-1.5 flex justify-between items-center relative z-10">
          <span className="text-xs text-muted-foreground">
            {format(parseISO(item.expiryDate), 'MMM d')}
          </span>
          <Badge variant="outline" className={`text-xs ${getExpiryColor()} border px-1.5 py-0.5`}>
            {getExpiryText()}
          </Badge>
        </div>
      </div>
    );
  }
  
  // 列表模式卡片
  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-sm animate-fadeIn cursor-pointer transition-all duration-200 hover:shadow-md bg-card"
      onClick={() => setSelectedItem(item)}
    >
      <div className="flex items-center p-3">
        <div className={`${getExpiryColor()} p-2 rounded-lg mr-3`}>
          {getCategoryIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate">{item.name}</h3>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {format(parseISO(item.expiryDate), 'MMM d, yyyy')}
            </span>
            <Badge variant="outline" className={`text-xs ${getExpiryColor()} border px-1.5 py-0.5`}>
              {getExpiryText()}
            </Badge>
          </div>
        </div>
        
        <span className="font-medium text-sm ml-2 bg-muted p-1 px-2 rounded-md">
          x{item.quantity}
        </span>
      </div>
    </div>
  );
};

export default ItemCard;
