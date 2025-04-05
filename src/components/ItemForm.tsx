
import React, { useState, useEffect, useRef } from 'react';
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
import { Apple, ShoppingBag, Plus, Minus, Save, X, Bell, Calendar, ChevronDown, Camera, Trash2, LockIcon, Mic, MicOff } from 'lucide-react';
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
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

const ItemForm: React.FC<ItemFormProps> = ({ open, onOpenChange, editItem }) => {
  const { addItem, updateItem, language, setSelectedItem, settings, currentUser } = useApp();
  const t = useTranslation(language);
  const isSubscribed = currentUser?.isPremium || false;
  
  // 基本表單狀態
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
  
  // 相機相關
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // 語音相關
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  // 當組件打開時初始化數據
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
  }, [open, editItem, settings]);
  
  // 如果語音識別成功，更新項目名稱
  useEffect(() => {
    if (transcript) {
      setItemName(transcript);
    }
  }, [transcript]);
  
  // 組件卸載或對話框關閉時，清理資源
  useEffect(() => {
    const cleanup = () => {
      stopCamera();
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
    
    if (!open) {
      cleanup();
    }
    
    return cleanup;
  }, [open, listening]);
  
  // 預設天數選項
  const dayOptions = [1, 3, 7, 14, 30, 60, 90];
  
  // 處理語音輸入
  const handleVoiceInput = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      if (!browserSupportsSpeechRecognition) {
        alert(t('language') === 'en' ? 
          'Your browser does not support speech recognition.' : 
          '您的瀏覽器不支援語音識別功能。');
        return;
      }
      
      try {
        resetTranscript();
        SpeechRecognition.startListening({
          continuous: true,
          language: language === 'zh-TW' || language === 'zh-CN' ? 'zh-CN' : 'en-US'
        });
      } catch (error) {
        console.error('語音識別錯誤:', error);
      }
    }
  };
  
  // 開啟相機
  const handleCameraToggle = async () => {
    if (!isSubscribed) return;
    
    if (showCamera) {
      stopCamera();
    } else {
      try {
        // 先清理舊的相機流
        stopCamera();
        
        // 請求相機權限
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment'
          }
        });
        
        // 保存流並設置視頻元素
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setShowCamera(true);
      } catch (error) {
        console.error('相機錯誤:', error);
        alert(t('language') === 'en' ? 
          'Cannot access camera. Please check your permissions.' : 
          '無法訪問相機。請檢查您的權限設置。');
      }
    }
  };
  
  // 停止相機
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };
  
  // 手動拍照
  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      
      // 設置照片但不自動提交表單
      setImage(imageData);
      
      // 如果項目名稱為空，設置一個基於日期的默認名稱
      if (!itemName) {
        const now = new Date();
        const defaultName = `${t('item')} ${format(now, 'yyyy-MM-dd')}`;
        setItemName(defaultName);
      }
      
      // 拍照後關閉相機
      stopCamera();
    } catch (error) {
      console.error('拍照錯誤:', error);
    }
  };
  
  // 清除表單
  const resetForm = () => {
    setItemName('');
    setQuantity('1');
    setCategory('Food');
    setExpiryDate(new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
    setDaysUntilExpiry(settings.defaultExpiryDays);
    setNotifyDaysBefore(settings.defaultNotifyDays);
    setImage(null);
  };
  
  // 處理天數變更
  const handleDaysChange = (days: number) => {
    setDaysUntilExpiry(days);
    const today = new Date();
    const newExpiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    setExpiryDate(newExpiryDate);
  };
  
  // 處理日期選擇
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setExpiryDate(date);
      const today = new Date();
      const diffTime = Math.abs(date.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilExpiry(diffDays);
    }
  };
  
  // 處理天數輸入
  const handleDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
    
    if (typeof value === 'number') {
      const today = new Date();
      const newExpiryDate = new Date(today.getTime() + value * 24 * 60 * 60 * 1000);
      setExpiryDate(newExpiryDate);
    }
    
    setDaysUntilExpiry(value);
  };
  
  // 處理通知天數輸入
  const handleNotifyDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
    setNotifyDaysBefore(value);
  };
  
  // 增加數量
  const increaseQuantity = () => {
    const currentQuantity = parseInt(quantity) || 0;
    setQuantity((currentQuantity + 1).toString());
  };
  
  // 減少數量
  const decreaseQuantity = () => {
    const currentQuantity = parseInt(quantity) || 0;
    if (currentQuantity > 1) {
      setQuantity((currentQuantity - 1).toString());
    }
  };
  
  // 提交表單
  const handleSubmit = () => {
    if (!itemName.trim()) return;
    
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
      image,
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
        
        <div className="p-6 space-y-5 max-h-[calc(80vh-180px)] overflow-y-auto">
          {/* 相機和語音按鈕 */}
          <div className="flex justify-center gap-3">
            {/* 語音按鈕 */}
            <Button
              type="button"
              variant={listening ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={handleVoiceInput}
            >
              {listening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {t('voiceInput')}
            </Button>
            
            {/* 相機按鈕 */}
            {isSubscribed ? (
              <Button
                type="button"
                variant={showCamera ? "default" : "outline"}
                size="sm"
                className="rounded-lg"
                onClick={handleCameraToggle}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('cameraInput')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg opacity-70 cursor-not-allowed"
                disabled
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('cameraInput')}
                <LockIcon className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          
          {/* 相機區域 */}
          {showCamera && (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  type="button"
                  className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 shadow-md border-2 border-primary"
                  onClick={capturePhoto}
                >
                  <Camera className="h-6 w-6 text-primary" />
                </Button>
              </div>
            </div>
          )}
          
          {/* 已拍攝的圖片 */}
          {image && !showCamera && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4">
              <img 
                src={image} 
                alt={itemName} 
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full w-8 h-8 shadow-md"
                onClick={() => setImage(null)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* 語音輸入提示 */}
          {listening && (
            <div className="bg-primary/10 p-3 rounded-lg mb-3">
              <p className="text-sm text-primary flex items-center">
                <Mic className="h-4 w-4 mr-2 animate-pulse" />
                {t('listening')}...
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {transcript || (t('language') === 'en' ? 'Speak the name of your item...' : '請說出您的物品名稱...')}
              </p>
            </div>
          )}
          
          {/* 物品名稱 */}
          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
              {t('itemName')}
            </Label>
            <Input 
              id="itemName" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder={t('language') === 'en' ? "e.g., Milk, Bread..." : "例如：牛奶、麵包..."}
              className="border-muted bg-muted/50 rounded-lg"
              autoComplete="off"
            />
          </div>
          
          {/* 類別和數量 - 交換位置 */}
          <div className="grid grid-cols-2 gap-5">
            {/* 數量 - 現在在左邊 */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
                {t('quantity')}
              </Label>
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
            
            {/* 類別 - 現在在右邊 */}
            <div className="space-y-2">
              <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
                {t('category')}
              </Label>
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
          </div>
          
          {/* 到期天數/日期 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
                {t('daysUntilExpiry')}
              </Label>
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
          
          {/* 提前通知天數 */}
          <div className="space-y-2">
            <Label className="text-sm uppercase text-muted-foreground font-medium tracking-wide">
              {t('notifyBefore')}
            </Label>
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
        
        {/* 底部按鈕 - 固定在底部 */}
        <DialogFooter className="p-4 flex gap-2 bg-background sticky bottom-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="gap-2 flex-1 rounded-lg hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
            {t('cancel')}
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="gap-2 flex-1 rounded-lg hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemForm;
