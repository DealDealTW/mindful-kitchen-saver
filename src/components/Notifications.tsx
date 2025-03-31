
import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, X } from 'lucide-react';
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
        style: 'item-expired',
        text: t('expired')
      };
    } else if (daysUntil === 0) {
      return {
        style: 'item-expired',
        text: t('expiringToday')
      };
    } else if (daysUntil === 1) {
      return {
        style: 'item-warning',
        text: t('expiringTomorrow')
      };
    } else {
      return {
        style: 'item-warning',
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-lg">{t('items')}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator className="my-2" />
        
        {attentionItems.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            {t('noAttentionItems')}
          </div>
        ) : (
          <div className="max-h-[300px] overflow-auto space-y-2">
            {attentionItems.map(item => {
              const status = getItemStatus(item);
              
              return (
                <div 
                  key={item.id}
                  className="flex items-start p-2 rounded-md hover:bg-muted cursor-pointer border"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-sm ${status.style}`}>
                      {status.text}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(item.expiryDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="font-medium">{item.quantity}</div>
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
