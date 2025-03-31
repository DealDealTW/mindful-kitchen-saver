
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BellIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Item, useApp, calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

const Notifications: React.FC = () => {
  const { items, setSelectedItem, language } = useApp();
  const t = useTranslation(language);
  
  const expiringSoon = items.filter(item => {
    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
    return daysLeft <= item.notifyDaysBefore && daysLeft >= 0;
  });
  
  const expired = items.filter(item => {
    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
    return daysLeft < 0;
  });
  
  const totalNotifications = expiringSoon.length + expired.length;
  
  const NotificationItem = ({ item }: { item: Item }) => {
    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
    let statusText = '';
    let statusClass = '';
    
    if (daysLeft < 0) {
      statusText = `${Math.abs(daysLeft)} ${t('days')} ${t('expired')}`;
      statusClass = 'text-whatsleft-red';
    } else if (daysLeft === 0) {
      statusText = `${t('expiring')} today`;
      statusClass = 'text-whatsleft-red';
    } else if (daysLeft === 1) {
      statusText = `${t('expiring')} tomorrow`;
      statusClass = 'text-whatsleft-orange';
    } else {
      statusText = `${t('expiring')} in ${daysLeft} ${t('days')}`;
      statusClass = 'text-whatsleft-orange';
    }
    
    return (
      <div 
        className="py-2 px-1 border-b last:border-b-0 cursor-pointer hover:bg-muted/50" 
        onClick={() => setSelectedItem(item)}
      >
        <div className="flex justify-between">
          <span className="font-medium">{item.name}</span>
          <span>{item.quantity}</span>
        </div>
        <div className={`text-sm ${statusClass}`}>{statusText}</div>
      </div>
    );
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-whatsleft-orange text-white" 
              variant="outline"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h3 className="font-medium">{t('expiringItems')}</h3>
          
          {totalNotifications === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noExpiringItems')}</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {expired.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-whatsleft-red mb-1">{t('expired')}</h4>
                  {expired.map(item => (
                    <NotificationItem key={item.id} item={item} />
                  ))}
                </div>
              )}
              
              {expiringSoon.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-whatsleft-orange mb-1">{t('expiring')}</h4>
                  {expiringSoon.map(item => (
                    <NotificationItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
