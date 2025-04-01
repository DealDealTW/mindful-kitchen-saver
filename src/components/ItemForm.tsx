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
import { Apple, ShoppingBag, Plus, Minus, Save, X, Bell, Calendar, ChevronDown, Camera, Trash2, LockIcon } from 'lucide-react';
import { Item, useApp, calculateDaysUntilExpiry, getExpiryDateFromDays, ItemCategory } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

const ItemForm: React.FC<ItemFormProps> = ({ open, onOpenChange, editItem }) => {
  const { addItem, updateItem, language, setSelectedItem, settings, currentUser } = useApp();
  const t = useTranslation(language);
  const isSubscribed = currentUser?.isPremium || false;
  
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

  const [dateInputType, setDateInputType] = useState<'days' | 'date'>('days');
  const [image, setImage] = useState<string | null>(editItem?.image || null);

  useEffect(() => {
    if (open && editItem) {
      setItemName(editItem.name || '');
      setQuantity(editItem.quantity || '1');
      setCategory(editItem.category || 'Food');
      setExpiryDate(editItem.expiryDate ? new Date(editItem.expiryDate) : new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
      setDaysUntilExpiry(editItem.daysUntilExpiry !== undefined ? editItem.daysUntilExpiry : settings.defaultExpiryDays);
      setNotifyDaysBefore(editItem.notifyDaysBefore !== undefined ? editItem.notifyDaysBefore : settings.defaultNotifyDays);
      setImage(editItem.image || null);
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setExpiryDate(date);
      const today = new Date();
      const diffTime = Math.abs(date.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilExpiry(diffDays);
    }
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
    setImage(null);
  };

  const handleCameraCapture = async () => {
    if (!isSubscribed) {
      console.log("Premium feature not available");
      return; // 如果不是高級用戶，提前返回
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      
      // 建立臨時畫布捕捉影像
      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          // 停止攝像頭並取得圖片
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          
          // 轉換為 base64 並保存
          const imgData = canvas.toDataURL('image/jpeg');
          setImage(imgData);

          // 如果項目名稱為空，自動填入臨時項目名稱
          if (!itemName.trim()) {
            // 使用時間戳作為默認名稱
            const now = new Date();
            const defaultName = `${t('item')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            setItemName(defaultName);
          }
        }, 300);
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
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
      daysUntilExpiry: daysUntilExpiryValue,
      notifyDaysBefore: notifyDaysBeforeValue,
      image: image,
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
                  <ShoppingBag className="h-5 w-5" /> {t('reAddItem')}
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
            <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
              {t('itemImage')}
              {!isSubscribed && (
                <Badge variant="outline" className="ml-2 bg-whatsleft-yellow/10 text-whatsleft-yellow border-whatsleft-yellow text-xs font-normal py-0">
                  <LockIcon className="h-3 w-3 mr-1"/> {t('premiumFeature')}
                </Badge>
              )}
            </Label>
            <div className="flex flex-col items-center">
              {image ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2">
                  <img 
                    src={image} 
                    alt={itemName || t('itemImage')} 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full w-8 h-8"
                    onClick={() => setImage(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted/30 rounded-lg flex flex-col items-center justify-center mb-2">
                  <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noImageUploaded')}</p>
                  {!isSubscribed && (
                    <div className="mt-2 px-3 py-1 bg-whatsleft-yellow/10 rounded-md text-xs text-whatsleft-yellow flex items-center">
                      <LockIcon className="h-3 w-3 mr-1"/> {t('premiumFeature')}
                    </div>
                  )}
                </div>
              )}
              <Button 
                type="button" 
                variant="outline" 
                className={`w-full ${isSubscribed ? 'bg-muted/50 hover:bg-muted/70' : 'bg-muted/30 text-muted-foreground cursor-not-allowed opacity-70'}`}
                onClick={isSubscribed ? handleCameraCapture : undefined}
                disabled={!isSubscribed}
              >
                {isSubscribed ? (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {t('takePhoto')}
                  </>
                ) : (
                  <>
                    <LockIcon className="h-4 w-4 mr-2" />
                    {t('premiumFeature')}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm uppercase text-muted-foreground font-medium tracking-wide">{t('itemName')}</Label>
            <Input 
              id="name" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder={t('language') === 'en' ? "e.g., Milk, Bread..." : "例如：牛奶、麵包..."}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateInputType(dateInputType === 'days' ? 'date' : 'days')}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {dateInputType === 'days' ? t('switchToDate') : t('switchToDays')}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {dateInputType === 'days' ? (
                <>
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
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-muted bg-muted/50 rounded-lg",
                            !expiryDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {expiryDate ? format(expiryDate, "PPP") : <span>{t('pickDate')}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 absolute -top-2 left-0" align="start">
                        <DayPicker
                          mode="single"
                          selected={expiryDate}
                          onSelect={handleDateSelect}
                          initialFocus
                          className="rounded-md border shadow bg-background scale-90 origin-top-left"
                          fromMonth={new Date()}
                          classNames={{
                            months: "flex flex-col space-y-2",
                            month: "space-y-2",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                            row: "flex w-full mt-1",
                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('selectedDate')}: {format(expiryDate, "PPP")}
                  </div>
                </div>
              )}
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
