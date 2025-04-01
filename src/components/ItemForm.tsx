import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Apple, ShoppingBag, Plus, Minus, Save, X, Bell } from 'lucide-react';
import { Item, useApp, calculateDaysUntilExpiry, getExpiryDateFromDays, ItemCategory } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

const ItemForm: React.FC<ItemFormProps> = ({ open, onOpenChange, editItem }) => {
  const { addItem, updateItem, language, setSelectedItem, settings } = useApp();
  const t = useTranslation(language);
  
  const [itemName, setItemName] = useState(editItem?.name || '');
  const [quantity, setQuantity] = useState(editItem?.quantity || '1');
  const [category, setCategory] = useState<ItemCategory>(editItem?.category || 'Food');
  const [expiryDate, setExpiryDate] = useState<Date>(
    editItem?.expiryDate ? new Date(editItem.expiryDate) : new Date(getExpiryDateFromDays(settings.defaultExpiryDays))
  );
  
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | string>(
    editItem?.daysUntilExpiry !== undefined 
    ? editItem.daysUntilExpiry 
    : settings.defaultExpiryDays
  );

  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number | string>(
    editItem?.notifyDaysBefore !== undefined 
    ? editItem.notifyDaysBefore 
    : settings.defaultNotifyDays
  );

  useEffect(() => {
    if (open && editItem) {
      setItemName(editItem.name || '');
      setQuantity(editItem.quantity || '1');
      setCategory(editItem.category || 'Food');
      setExpiryDate(editItem.expiryDate ? new Date(editItem.expiryDate) : new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
      setDaysUntilExpiry(editItem.daysUntilExpiry !== undefined ? editItem.daysUntilExpiry : settings.defaultExpiryDays);
      setNotifyDaysBefore(editItem.notifyDaysBefore !== undefined ? editItem.notifyDaysBefore : settings.defaultNotifyDays);
    } else if (open && !editItem) {
      resetForm();
    }
  }, [open, editItem, settings.defaultExpiryDays, settings.defaultNotifyDays]);

  // 預設天數選項
  const dayOptions = [1, 3, 7, 14, 30, 60, 90];

  const handleDaysChange = (days: number) => {
    setDaysUntilExpiry(days);
    const today = new Date();
    const newExpiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    setExpiryDate(newExpiryDate);
  };

  const handleDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
    
    if (typeof value === 'number') {
      const today = new Date();
      const newExpiryDate = new Date(today.getTime() + value * 24 * 60 * 60 * 1000);
      setExpiryDate(newExpiryDate);
    }
    
    setDaysUntilExpiry(value);
  };

  const handleNotifyDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
    setNotifyDaysBefore(value);
  };

  const increaseQuantity = () => {
    const currentQuantity = parseInt(quantity) || 0;
    setQuantity((currentQuantity + 1).toString());
  };

  const decreaseQuantity = () => {
    const currentQuantity = parseInt(quantity) || 0;
    if (currentQuantity > 1) {
      setQuantity((currentQuantity - 1).toString());
    }
  };

  const resetForm = () => {
    setItemName('');
    setQuantity('1');
    setCategory('Food');
    setExpiryDate(new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
    setDaysUntilExpiry(settings.defaultExpiryDays);
    setNotifyDaysBefore(settings.defaultNotifyDays);
  };

  const handleSubmit = () => {
    if (!itemName.trim()) return;

    const today = new Date();
    const formattedDate = expiryDate.toISOString().split('T')[0];
    
    // 確保提交時將空字串轉換為數字0
    const daysUntilExpiryValue = typeof daysUntilExpiry === 'string' ? 
      (daysUntilExpiry === '' ? 0 : parseInt(daysUntilExpiry)) : 
      daysUntilExpiry;
      
    const notifyDaysBeforeValue = typeof notifyDaysBefore === 'string' ? 
      (notifyDaysBefore === '' ? 0 : parseInt(notifyDaysBefore)) : 
      notifyDaysBefore;
    
    const item = {
      name: itemName,
      quantity,
      category,
      expiryDate: formattedDate,
      daysUntilExpiry: calculateDaysUntilExpiry(formattedDate),
      notifyDaysBefore: notifyDaysBeforeValue,
    };

    if (editItem) {
      updateItem(editItem.id, item);
      const updatedItem = { ...editItem, ...item };
      setSelectedItem(updatedItem);
    } else {
      addItem(item);
      setSelectedItem(null);
      resetForm();
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
        <div className="bg-primary/10 px-6 pt-6 pb-4">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
              {editItem ? (
                <>
                  <ShoppingBag className="h-5 w-5" /> {t('editItem')}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" /> {t('addItem')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm uppercase text-muted-foreground font-medium tracking-wide">{t('itemName')}</Label>
            <Input 
              id="name" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder="e.g., Milk, Bread..."
              className="border-muted bg-muted/50 rounded-lg"
              autoComplete="off"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">{t('category')}</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={category === 'Food' ? 'default' : 'outline'}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg ${category === 'Food' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}
                  onClick={() => setCategory('Food')}
                >
                  <Apple className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant={category === 'Household' ? 'default' : 'outline'}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg ${category === 'Household' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}
                  onClick={() => setCategory('Household')}
                >
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm uppercase text-muted-foreground font-medium tracking-wide">{t('quantity')}</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={decreaseQuantity}
                  className="rounded-lg bg-muted/50 hover:bg-muted/70"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input 
                  id="quantity" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="text-center border-muted bg-muted/50 rounded-lg"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  size="icon"
                  onClick={increaseQuantity}
                  className="rounded-lg bg-muted/50 hover:bg-muted/70"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">{t('daysUntilExpiry')}</Label>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Input 
                  type="number" 
                  value={daysUntilExpiry}
                  onChange={handleDaysInput}
                  min="0"
                  max="365"
                  className="border-muted bg-muted/50 rounded-lg flex-1"
                />
                <Badge variant="outline" className="font-medium border-primary text-primary whitespace-nowrap">
                  {t('days')}
                </Badge>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t('expiryDate')}: <span className="font-semibold">{format(expiryDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map(days => (
                    <Button 
                      key={days} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDaysChange(days)}
                      className={`text-xs px-2 py-0 h-6 ${daysUntilExpiry === days ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted/70'}`}
                    >
                      {days} {t('days')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">{t('notifyBefore')}</Label>
            <Input 
              type="number" 
              value={notifyDaysBefore}
              onChange={handleNotifyDaysInput}
              min="0"
              max="30"
              className="border-muted bg-muted/50 rounded-lg"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-muted-foreground">
                {t('notifyBeforeDescription')}
              </div>
              <div className="flex gap-2">
                {[0, 1, 3, 7].map(days => (
                  <Button 
                    key={days} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setNotifyDaysBefore(days)}
                    className={`text-xs rounded-full px-2 min-w-[40px] h-6 ${notifyDaysBefore === days ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted/70'}`}
                  >
                    {days}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <DialogFooter className="p-4 flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="gap-2 flex-1 rounded-lg hover:bg-muted/50">
            <X className="h-4 w-4" />
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} className="gap-2 flex-1 rounded-lg hover:bg-primary/90">
            <Save className="h-4 w-4" />
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemForm;
