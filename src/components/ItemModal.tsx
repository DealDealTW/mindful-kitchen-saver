import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Apple, CalendarIcon, Bell, PencilIcon, Trash2Icon, InfoIcon, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { Item, calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from '@/lib/utils';

interface ItemModalProps {
  onEdit: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ onEdit }) => {
  const { selectedItem, setSelectedItem, deleteItem, markItemAsUsed, language } = useApp();
  const t = useTranslation(language);

  if (!selectedItem) return null;

  const daysRemaining = calculateDaysUntilExpiry(selectedItem.expiryDate);
  
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

  const getExpiryStatusText = () => {
    if (daysRemaining < 0) return t('expired');
    if (daysRemaining === 0) return t('today');
    if (daysRemaining === 1) return t('tomorrow');
    return `${daysRemaining} ${t('days')} ${t('remaining')}`;
  };

  const getExpiryColor = () => {
    if (daysRemaining < 0 || daysRemaining <= 1) return "bg-whatsleft-red/10 border-whatsleft-red text-whatsleft-red";
    if (daysRemaining <= 4) return "bg-whatsleft-yellow/10 border-whatsleft-yellow text-whatsleft-yellow";
    return "bg-whatsleft-green/10 border-whatsleft-green text-green-700";
  };

  const handleDelete = () => {
    deleteItem(selectedItem.id);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    onEdit();
    setSelectedItem(null);
  };

  const handleMarkAsUsed = () => {
    markItemAsUsed(selectedItem.id);
    setSelectedItem(null);
  };

  // 如果物品已經標記為"已使用"，則不顯示模態窗口
  if (selectedItem.used) {
    setSelectedItem(null);
    return null;
  }

  return (
    <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
      <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
        {/* Header with colored background based on expiry status */}
        <div className={`${getExpiryColor()} px-6 pt-6 pb-4`}>
          {/* First row: item name (left), quantity (right) */}
          <div className="flex justify-between items-center mb-2">
            <DialogTitle className="text-xl font-bold">{selectedItem.name}</DialogTitle>
            <div className="text-xl font-bold">x{selectedItem.quantity}</div>
          </div>
          
          {/* Second row: category icon (left), expiry countdown (right) */}
          <div className="flex justify-between items-center">
            <div>
              {selectedItem.category === 'Food' ? (
                <Apple className="h-6 w-6" />
              ) : (
                <ShoppingBag className="h-6 w-6" />
              )}
            </div>
            <Badge variant="outline" className={`${getExpiryColor()} border font-medium`}>
              {getExpiryStatusText()}
            </Badge>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Expiry Section */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
              {t('expiryDate')}
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CalendarIcon className={`h-5 w-5 ${getIconColorClass()}`} />
              <div className="font-medium">
                {format(parseISO(selectedItem.expiryDate), 'MMMM d, yyyy')}
              </div>
            </div>
          </div>
          
          {/* Notification Section */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
              {t('notifications')}
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
              <div className="font-medium">
                {t('notifyBefore')}: {selectedItem.notifyDaysBefore} {t('days')}
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <DialogFooter className="p-4 flex flex-col gap-2">
          <Button variant="default" onClick={handleMarkAsUsed} className="gap-2 w-full bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle className="h-4 w-4" />
            {t('markAsUsed')}
          </Button>
          <div className="flex gap-2 w-full">
            <Button variant="destructive" onClick={handleDelete} className="gap-2 flex-1 hover:bg-destructive/90">
              <Trash2Icon className="h-4 w-4" />
              {t('delete')}
            </Button>
            <Button onClick={handleEdit} className="gap-2 flex-1 hover:bg-primary/90">
              <PencilIcon className="h-4 w-4" />
              {t('edit')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
