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
import { ShoppingBag, Apple, CalendarIcon, Bell, PencilIcon, Trash2Icon, InfoIcon, CheckCircle, RotateCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { Item, calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from '@/lib/utils';

interface ItemModalProps {
  onEdit: () => void;
  onReAdd: (item: Item) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ onEdit, onReAdd }) => {
  const { selectedItem, setSelectedItem, deleteItem, markItemAsUsed, language } = useApp();
  const t = useTranslation(language);

  if (!selectedItem) return null;

  const isUsed = selectedItem.used;
  const dateUsedFormatted = isUsed && selectedItem.dateUsed 
    ? format(parseISO(selectedItem.dateUsed), 'MMM d, yyyy') 
    : null;

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
    if (isUsed) return;
    deleteItem(selectedItem.id);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    if (isUsed) return;
    onEdit();
    setSelectedItem(null);
  };

  const handleMarkAsUsed = () => {
    if (isUsed) return;
    markItemAsUsed(selectedItem.id);
    setSelectedItem(null);
  };

  const handleReAdd = () => {
    if (!selectedItem) return;
    markItemAsUsed(selectedItem.id);
    onReAdd(selectedItem);
    setSelectedItem(null);
  };

  return (
    <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
      <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
        {/* Header with colored background based on expiry status */}
        <div className={cn(
          `${getExpiryColor()} px-6 pt-6 pb-4 relative`,
           isUsed && "opacity-70"
         )}>
           {isUsed && dateUsedFormatted && (
             <Badge 
               variant="destructive" 
               className="absolute top-2 right-2 bg-gray-500 text-white border-none shadow-md"
             >
                Used: {dateUsedFormatted}
             </Badge>
           )}
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
        
        <div className={cn("p-6 space-y-4", isUsed && "opacity-70")}>
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
           {/* Optional: Display Date Used if applicable */} 
           {isUsed && dateUsedFormatted && (
             <div className="space-y-3">
               <h3 className="text-sm uppercase text-muted-foreground font-medium tracking-wide">Date Used</h3>
               <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                 <CheckCircle className="h-5 w-5 text-gray-500" />
                 <div className="font-medium text-gray-700">
                    {dateUsedFormatted}
                 </div>
               </div>
             </div>
           )}
        </div>
        
        <Separator />
        
        <div className="p-2 flex flex-col gap-2 items-center">
          <div className="w-[380px]"> 
            <Button 
              variant="default" 
              onClick={handleMarkAsUsed} 
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
              disabled={isUsed}
            >
              <CheckCircle className="h-4 w-4" />
              {t('markAsUsed')}
            </Button>
          </div>

          <div className="w-[380px] flex justify-between"> 
            <Button 
              variant="default" 
              onClick={handleReAdd} 
              className="w-[121px] gap-2 bg-whatsleft-yellow hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUsed}
            >
              <RotateCw className="h-4 w-4" />
              Re-add
            </Button>
            <Button 
              onClick={handleEdit} 
              className="w-[121px] gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUsed}
            >
              <PencilIcon className="h-4 w-4" />
              {t('edit')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              className="w-[121px] gap-2 hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUsed}
            >
              <Trash2Icon className="h-4 w-4" />
              {t('delete')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
