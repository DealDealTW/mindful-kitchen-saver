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
import { format } from 'date-fns';
import { CalendarIcon, Apple, ShoppingBag, Plus, Minus, Save, X, Bell } from 'lucide-react';
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
  const [useExpiryDate, setUseExpiryDate] = useState(!!editItem?.expiryDate);
  
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(
    editItem?.daysUntilExpiry !== undefined 
    ? editItem.daysUntilExpiry 
    : settings.defaultExpiryDays
  );

  const [notifyDaysBefore, setNotifyDaysBefore] = useState(
    editItem?.notifyDaysBefore !== undefined 
    ? editItem.notifyDaysBefore 
    : settings.defaultNotifyDays
  );

  const handleDaysChange = (days: number) => {
    setDaysUntilExpiry(days);
    const today = new Date();
    const newExpiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    setExpiryDate(newExpiryDate);
  };

  const handleDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    handleDaysChange(value);
  };

  const handleNotifyDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setNotifyDaysBefore(value);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setExpiryDate(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(date);
      expiry.setHours(0, 0, 0, 0);
      const days = Math.round((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
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
    if (!itemName.trim()) return;

    const today = new Date();
    const formattedDate = expiryDate.toISOString().split('T')[0];
    
    const item = {
      name: itemName,
      quantity,
      category,
      expiryDate: formattedDate,
      daysUntilExpiry: calculateDaysUntilExpiry(formattedDate),
      notifyDaysBefore,
    };

    if (editItem) {
      updateItem(editItem.id, item);
      const updatedItem = { ...editItem, ...item };
      setSelectedItem(updatedItem);
    } else {
      addItem(item);
      setSelectedItem(null);
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setUseExpiryDate(!useExpiryDate)}
                className="text-xs flex items-center gap-1"
              >
                <CalendarIcon className="h-3 w-3" />
                {useExpiryDate ? t('expiryDate') : t('daysUntilExpiry')}
              </Button>
            </div>
            
            {useExpiryDate ? (
              <div className="space-y-4">
                <Input 
                  type="number" 
                  value={daysUntilExpiry}
                  onChange={handleDaysInput}
                  min="0"
                  max="365"
                  className="border-muted bg-muted/50 rounded-lg"
                />
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="font-medium border-primary text-primary">
                    {format(expiryDate, 'MMM d, yyyy')}
                  </Badge>
                  <div className="flex gap-2">
                    {[1, 3, 7, 14, 30].map(days => (
                      <Button 
                        key={days} 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDaysChange(days)}
                        className={`text-xs rounded-full px-2 min-w-[40px] h-6 ${daysUntilExpiry === days ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted/70'}`}
                      >
                        {days}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal border-muted bg-muted/50 rounded-lg">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-lg border-muted" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={handleDateChange}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={2023}
                      toYear={2030}
                      className="p-3 rounded-lg"
                    />
                  </PopoverContent>
                </Popover>
                <Badge variant="outline" className="font-medium border-primary text-primary">
                  {daysUntilExpiry} {t('days')}
                </Badge>
              </div>
            )}
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
