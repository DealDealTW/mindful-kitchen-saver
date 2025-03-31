
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Apple, CalendarIcon, Bell, PencilIcon, Trash2Icon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { Item, calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { cn } from '@/lib/utils';

interface ItemModalProps {
  onEdit: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ onEdit }) => {
  const { selectedItem, setSelectedItem, deleteItem, language } = useApp();
  const t = useTranslation(language);

  if (!selectedItem) return null;

  const daysRemaining = calculateDaysUntilExpiry(selectedItem.expiryDate);
  
  const getExpiryStatus = () => {
    if (daysRemaining < 0) return 'item-expired';
    if (daysRemaining <= 1) return 'item-expired';
    if (daysRemaining <= 4) return 'item-warning';
    return 'item-safe';
  };

  const handleDelete = () => {
    deleteItem(selectedItem.id);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    onEdit();
    setSelectedItem(null);
  };

  return (
    <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-semibold">{selectedItem.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-5">
          <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              {selectedItem.category === 'Food' ? (
                <Apple className="mr-3 h-6 w-6 text-primary" />
              ) : (
                <ShoppingBag className="mr-3 h-6 w-6 text-primary" />
              )}
            </div>
            <div className="text-2xl font-bold">{selectedItem.quantity}</div>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-4">
              <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">
                  {format(parseISO(selectedItem.expiryDate), 'MMM d, yyyy')}
                </div>
                <div className={cn(
                  "text-sm font-medium", 
                  daysRemaining < 0 ? "text-destructive" : 
                  daysRemaining <= 4 ? "text-amber-500" : 
                  "text-muted-foreground"
                )}>
                  {daysRemaining < 0 
                    ? t('expired') 
                    : `${daysRemaining} ${t('days')} ${t('remaining')}`}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Bell className="mr-3 h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">
                  {t('notifyBefore')}: {selectedItem.notifyDaysBefore} {t('days')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-center text-muted-foreground">
            {t('addedOn')}: {format(parseISO(selectedItem.dateAdded), 'MMM d, yyyy')}
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between pt-2">
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2Icon className="h-4 w-4" />
            {t('delete')}
          </Button>
          <Button onClick={handleEdit} className="gap-2">
            <PencilIcon className="h-4 w-4" />
            {t('edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
