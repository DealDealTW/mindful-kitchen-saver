import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, MoreHorizontal, Apple, ShoppingBag } from 'lucide-react';
import { useApp, Item, calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { format, parseISO } from 'date-fns';

const Notifications: React.FC = () => {
  const { items, language, selectedItem, setSelectedItem } = useApp();
  const t = useTranslation(language);
  const [open, setOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const getAttentionItems = (): Item[] => {
    return items.filter(item => {
      const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
      // Include expired items and items expiring soon (based on notification preference)
      return daysUntil < 0 || (daysUntil >= 0 && daysUntil <= item.notifyDaysBefore);
    }).sort((a, b) => {
      return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
    });
  };
  
  const attentionItems = getAttentionItems();
  
  useEffect(() => {
    setNotificationCount(attentionItems.length);
  }, [items]);
  
  const getItemStatus = (item: Item) => {
    const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
    
    if (daysUntil < 0) {
      return {
        color: 'bg-whatsleft-red/10 border-whatsleft-red text-whatsleft-red',
        text: t('expired')
      };
    } else if (daysUntil === 0) {
      return {
        color: 'bg-whatsleft-red/10 border-whatsleft-red text-whatsleft-red',
        text: t('expiringToday')
      };
    } else if (daysUntil === 1) {
      return {
        color: 'bg-whatsleft-red/10 border-whatsleft-red text-whatsleft-red',
        text: t('expiringTomorrow')
      };
    } else {
      return {
        color: 'bg-whatsleft-yellow/10 border-whatsleft-yellow text-whatsleft-yellow',
        text: `${t('expiring')} ${t('in')} ${daysUntil} ${t('days')}`
      };
    }
  };
  
  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/50">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-whatsleft-red text-white">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl overflow-hidden" align="end">
        <div className="bg-primary/10 p-3 border-b">
          <h3 className="font-bold text-primary">{t('notifications')}</h3>
        </div>
        
        {attentionItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('noAttentionItems')}
          </div>
        ) : (
          <div className="max-h-[350px] overflow-auto divide-y">
            {attentionItems.map(item => {
              const status = getItemStatus(item);
              
              return (
                <div 
                  key={item.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.category === 'Food' ? (
                        <Apple className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                      )}
                      <div className="font-medium truncate">{item.name}</div>
                    </div>
                    <div className="text-sm font-medium bg-muted/50 px-2 py-0.5 rounded-md">
                      x{item.quantity}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(item.expiryDate), 'MMM d, yyyy')}
                    </div>
                    <Badge variant="outline" className={`text-xs ${status.color}`}>
                      {status.text}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
