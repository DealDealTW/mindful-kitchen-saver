
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { format, addDays } from 'date-fns';
import { CalendarIcon, Apple, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Item, useApp, calculateDaysUntilExpiry, getExpiryDateFromDays } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

const ItemForm: React.FC<ItemFormProps> = ({ open, onOpenChange, editItem }) => {
  const { addItem, updateItem, language } = useApp();
  const t = useTranslation(language);
  
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<'Food' | 'Household'>('Food');
  const [expiryDate, setExpiryDate] = useState<Date>(addDays(new Date(), 6));
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(6);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(2);
  const [isUsingDays, setIsUsingDays] = useState(true);
  
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setQuantity(editItem.quantity);
      setCategory(editItem.category);
      setExpiryDate(new Date(editItem.expiryDate));
      setDaysUntilExpiry(editItem.daysUntilExpiry);
      setNotifyDaysBefore(editItem.notifyDaysBefore);
    } else {
      resetForm();
    }
  }, [editItem, open]);

  const resetForm = () => {
    setName('');
    setQuantity('1');
    setCategory('Food');
    setExpiryDate(addDays(new Date(), 6));
    setDaysUntilExpiry(6);
    setNotifyDaysBefore(2);
    setIsUsingDays(true);
  };

  const handleDaysChange = (days: number) => {
    setDaysUntilExpiry(days);
    setExpiryDate(addDays(new Date(), days));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setExpiryDate(date);
      const days = calculateDaysUntilExpiry(date.toISOString().split('T')[0]);
      setDaysUntilExpiry(days);
    }
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

  const handleSubmit = () => {
    if (!name.trim()) return;

    const formattedDate = expiryDate.toISOString().split('T')[0];
    
    const itemData = {
      name,
      quantity,
      category,
      expiryDate: formattedDate,
      daysUntilExpiry,
      notifyDaysBefore,
    };

    if (editItem) {
      updateItem(editItem.id, itemData);
    } else {
      addItem(itemData);
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? t('editItem') : t('addItem')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('itemName')}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Milk, Bread..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">{t('quantity')}</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={decreaseQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input 
                  id="quantity" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="text-center"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  size="icon"
                  onClick={increaseQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>{t('category')}</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={category === 'Food' ? 'default' : 'outline'}
                  className="flex-1 flex items-center justify-center"
                  onClick={() => setCategory('Food')}
                >
                  <Apple className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant={category === 'Household' ? 'default' : 'outline'}
                  className="flex-1 flex items-center justify-center"
                  onClick={() => setCategory('Household')}
                >
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label>{t('daysUntilExpiry')}</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsUsingDays(!isUsingDays)}
                className="text-xs"
              >
                {isUsingDays ? t('expiryDate') : t('daysUntilExpiry')}
              </Button>
            </div>
            
            {isUsingDays ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{daysUntilExpiry} {t('days')}</span>
                </div>
                <Slider
                  value={[daysUntilExpiry]}
                  min={0}
                  max={90}
                  step={1}
                  onValueChange={(value) => handleDaysChange(value[0])}
                />
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={handleDateChange}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={2023}
                    toYear={2030}
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <div className="text-sm text-muted-foreground">
              {isUsingDays ? (
                <span>{format(expiryDate, 'MMM d, yyyy')}</span>
              ) : (
                <span>{daysUntilExpiry} {t('days')}</span>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>{t('notifyBefore')}</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[notifyDaysBefore]}
                min={0}
                max={14}
                step={1}
                onValueChange={(value) => setNotifyDaysBefore(value[0])}
                className="flex-1"
              />
              <span className="w-20 text-center">{notifyDaysBefore} {t('days')}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('notifyBeforeDescription')}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemForm;
