
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon, Apple, CalendarIcon, ClockIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { Item } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

interface ItemModalProps {
  onEdit: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ onEdit }) => {
  const { selectedItem, setSelectedItem, deleteItem, language } = useApp();
  const t = useTranslation(language);

  if (!selectedItem) return null;

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{selectedItem.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-muted-foreground">
              {selectedItem.category === 'Food' ? (
                <Apple className="mr-2 h-5 w-5" />
              ) : (
                <ShoppingBagIcon className="mr-2 h-5 w-5" />
              )}
              {t(selectedItem.category.toLowerCase() as any)}
            </span>
            <span className="font-medium">×{selectedItem.quantity}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <CalendarIcon className="mr-2 h-5 w-5" />
            <span>
              {format(parseISO(selectedItem.expiryDate), 'MMM d, yyyy')}
              {' '}
              ({selectedItem.daysUntilExpiry} {t('days')})
            </span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <ClockIcon className="mr-2 h-5 w-5" />
            <span>{t('notifyBefore')}: {selectedItem.notifyDaysBefore} {t('days')}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {t('addedOn')}: {format(parseISO(selectedItem.dateAdded), 'MMM d, yyyy')}
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2Icon className="mr-2 h-4 w-4" />
            {t('delete')}
          </Button>
          <Button onClick={handleEdit}>
            <PencilIcon className="mr-2 h-4 w-4" />
            {t('edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
