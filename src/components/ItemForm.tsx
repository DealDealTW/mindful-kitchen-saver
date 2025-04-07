import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Apple, ShoppingBag, Plus, Minus, X, Bell, Calendar, ChevronDown, Camera, Trash2, LockIcon, Mic, MicOff, Check, Edit2, Repeat, CalendarIcon, Clock } from 'lucide-react';
import { Item, useApp, calculateDaysUntilExpiry, getExpiryDateFromDays, ItemCategory } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Separator } from "@/components/ui/separator";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera as CapacitorCamera, CameraResultType, CameraDirection, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Window {
    __deletedItemsCache?: {
      id: string;
      name: string;
      quantity: string;
      category: ItemCategory;
      daysUntilExpiry: number;
      notifyDaysBefore: number;
      isEditing: boolean;
    }[];
  }
}

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
  reAddItem?: Item;
}

const ItemForm: React.FC<ItemFormProps> = ({ open, onOpenChange, editItem, reAddItem }) => {
  const { addItem, addMultipleItems, updateItem, language, setSelectedItem, settings, currentUser } = useApp();
  const t = useTranslation(language);
  const isSubscribed = currentUser?.isPremium || false;
  const { toast } = useToast();
  
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
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const testBatchItems = [
    { id: uuidv4(), name: '固定測試項目一', quantity: '2', category: 'Food' as ItemCategory, daysUntilExpiry: 7, notifyDaysBefore: 2, isEditing: false },
    { id: uuidv4(), name: '���定測試項目二', quantity: '3', category: 'Household' as ItemCategory, daysUntilExpiry: 14, notifyDaysBefore: 3, isEditing: false }
  ];
  
  const [batchItems, setBatchItems] = useState<{
    id: string;
    name: string;
    quantity: string;
    category: ItemCategory;
    daysUntilExpiry: number;
    notifyDaysBefore: number;
    isEditing: boolean;
  }[]>([]);
  const [processingText, setProcessingText] = useState('');
  const [multipleItemsDetected, setMultipleItemsDetected] = useState(false);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  
  useEffect(() => {
    if (Capacitor.isNativePlatform() && open) {
      console.log('註冊Capacitor返回鍵事件');
      
      let backButtonListener: any = null;
      
      const registerBackButton = async () => {
        backButtonListener = await CapacitorApp.addListener('backButton', (e) => {
          console.log('返回鍵被按下，模態框打開狀態:', open);
          if (open) {
            console.log('模態框開啟，攔截返回事件');
            cleanupAndReset();
            onOpenChange(false);
          }
        });
      };
      
      registerBackButton();
      
      return () => {
        if (backButtonListener) {
          console.log('清理返回鍵監聽器');
          backButtonListener.remove();
        }
      };
    }
  }, [open, onOpenChange]);
  
  useEffect(() => {
    if (multipleItemsDetected && batchItems.length === 0) {
      setMultipleItemsDetected(false);
    }
  }, [batchItems, multipleItemsDetected]);
  
  useEffect(() => {
    if (open) {
      console.log('===> 模態框打開，初始化狀態');
      cleanupAndReset();
      
      setTimeout(() => {
        console.log('===> 強制開啟批量模式並設置測試數據 (setTimeout)');
        setMultipleItemsDetected(true);
        setBatchItems(testBatchItems);
        setForceUpdateKey(prev => prev + 1);
        console.log('===> 測試數據已設置:', testBatchItems);
      }, 0);
      
      if (editItem) {
        console.log('編輯模式，設置表單值');
        setItemName(editItem.name || '');
        setQuantity(editItem.quantity || '1');
        setCategory(editItem.category || 'Food');
        setExpiryDate(editItem.expiryDate ? new Date(editItem.expiryDate) : new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
        setDaysUntilExpiry(editItem.daysUntilExpiry !== undefined ? editItem.daysUntilExpiry : settings.defaultExpiryDays);
        setNotifyDaysBefore(editItem.notifyDaysBefore !== undefined ? editItem.notifyDaysBefore : settings.defaultNotifyDays);
        setImage(editItem.image || null);
        setDateInputType('days');
      } else if (reAddItem) {
        console.log('重新添加模式，設置名稱');
        setItemName(reAddItem.name);
      }
    }
  }, [open, editItem, reAddItem]);
  
  useEffect(() => {
    const cleanup = () => {
      stopCamera();
      if (listening) {
        SpeechRecognition.stopListening();
      }
      
      if (!open) {
        setBatchItems([]);
        setMultipleItemsDetected(false);
        setProcessingText('');
        if (typeof window !== 'undefined') {
          window.__deletedItemsCache = [];
        }
      }
    };
    
    if (!open) {
      cleanup();
    }
    
    return cleanup;
  }, [open, listening]);
  
  const dayOptions = [1, 3, 7, 14, 30, 60, 90];
  
  const handleVoiceInput = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      if (!browserSupportsSpeechRecognition) {
        alert(language === 'en' ? 
          'Your browser does not support speech recognition.' : 
          '您的瀏覽器不支援語音識別功能。');
        return;
      }
      
      try {
        resetTranscript();
        setProcessingText('');
        setMultipleItemsDetected(false);
        SpeechRecognition.startListening({
          continuous: true,
          language: language === 'zh-TW' || language === 'zh-CN' ? 'zh-CN' : 'en-US'
        });
      } catch (error) {
        console.error('語音識別錯誤:', error);
      }
    }
  };
  
  const handleCameraToggle = async () => {
    if (!isSubscribed) {
      toast({ title: t('premiumFeature'), description: t('premiumFeatureDescription') });
      return;
    }
    
    console.log('[相機] 相機按鈕被點擊');
    
    try {
      if (!Capacitor.isNativePlatform()) {
        toast({ title: "Camera functionality requires native app", description: "This feature only works on mobile devices" });
        return;
      }
      
      console.log('[相機] 請求權限');
      const permResult = await CapacitorCamera.checkPermissions();
      if (permResult.camera !== 'granted') {
        console.log('[相機] 請求相機權限');
        const permStatus = await CapacitorCamera.requestPermissions();
        if (permStatus.camera !== 'granted') {
          toast({ variant: "destructive", title: "Camera permission denied", description: "Please enable camera access in settings" });
          return;
        }
      }
      
      console.log('[相機] 調用相機');
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: CameraDirection.REAR,
        saveToGallery: true,
        correctOrientation: true,
        width: 1080,
        presentationStyle: 'fullscreen',
        promptLabelHeader: 'Take a photo',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Picture'
      });
      
      console.log('[相機] 獲取照片結果:', image);
      
      if (image && image.webPath) {
        console.log('[相機] 獲取到 webPath:', image.webPath);
        
        const imageUrl = Capacitor.convertFileSrc(image.webPath);
        console.log('[相機] 轉換後的 imageUrl:', imageUrl);
        
        setImage(imageUrl);
        
        toast({ title: "Photo captured successfully" });
        
        if (!itemName) {
          setItemName(`${t('item')} ${new Date().toLocaleTimeString()}`);
        }
      } else {
        console.error('[相機] 沒有獲取到 webPath');
        toast({ 
          variant: "destructive", 
          title: "Camera error", 
          description: "Failed to capture photo" 
        });
      }
    } catch (error: any) {
      console.error('[相機] 錯誤:', error);
      
      if (error.message && error.message.includes('cancel')) {
        console.log('[相機] 用戶取消');
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Camera error",
        description: error.message || "Unknown error occurred",
      });
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (showCamera) {
      setShowCamera(false);
    }
  };
  
  const cleanupAndReset = () => {
    stopCamera();
    if (listening) {
      SpeechRecognition.stopListening();
    }
    
    setMultipleItemsDetected(false);
    setBatchItems([]);
    setProcessingText('');
    resetTranscript();
    
    if (typeof window !== 'undefined') {
      window.__deletedItemsCache = [];
    }
    
    setItemName('');
    setQuantity('1');
    setCategory('Food');
    setExpiryDate(new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
    setDaysUntilExpiry(settings.defaultExpiryDays);
    setNotifyDaysBefore(settings.defaultNotifyDays);
    setImage(null);
    setDateInputType('days');
  };
  
  const resetForm = () => {
    setItemName('');
    setQuantity('1');
    setCategory('Food');
    setExpiryDate(new Date(getExpiryDateFromDays(settings.defaultExpiryDays)));
    setDaysUntilExpiry(settings.defaultExpiryDays);
    setNotifyDaysBefore(settings.defaultNotifyDays);
    setImage(null);
    setDateInputType('days');
    stopCamera();
  };
  
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
  
  const handleConfirmDate = () => {
    setIsDatePickerOpen(false);
  };
  
  const handleNotifyDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
    setNotifyDaysBefore(value);
  };
  
  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    setQuantity(prev => {
      const current = parseInt(String(prev));
      if (type === 'increase') {
        return String(current + 1);
      } else {
        return String(Math.max(1, current - 1));
      }
    });
  };
  
  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setQuantity(value);
    } else if (value === '0') {
      setQuantity('1');
    }
  };
  
  const handleDeleteBatchItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleSaveBatchItems = () => {
    console.log('保存批量項目:', batchItems);
    if (batchItems.length === 0) {
      return;
    }
    
    const itemsToAdd = batchItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category as ItemCategory,
      daysUntilExpiry: item.daysUntilExpiry,
      notifyDaysBefore: item.notifyDaysBefore,
      expiryDate: getExpiryDateFromDays(item.daysUntilExpiry),
    }));
    
    const numAdded = addMultipleItems(itemsToAdd);
    
    toast({
      title: language === 'en' ? "Successfully Added" : "成功添加",
      description: language === 'en' 
        ? `Successfully added ${numAdded} items to your list` 
        : `已成功添加 ${numAdded} 個項目到清單中`,
    });
    
    setBatchItems([]);
    setMultipleItemsDetected(false);
    onOpenChange(false);
  };
  
  const handleCancelBatchMode = () => {
    setMultipleItemsDetected(false);
    setBatchItems([]);
  };
  
  const handleSubmit = () => {
    if (!itemName.trim()) return;
    
    const formattedDate = expiryDate.toISOString().split('T')[0];
    
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
    <Dialog key={forceUpdateKey} open={open} onOpenChange={(isOpen) => { 
      if (!isOpen) {
        cleanupAndReset();
        onOpenChange(false);
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="bg-orange-50 p-4 rounded-t-lg">
          <DialogTitle className="text-orange-600 font-semibold">{editItem ? t('editItem') : t('addItem')}</DialogTitle>
          {browserSupportsSpeechRecognition && (
             <DialogDescription className="text-sm text-orange-500 mt-1 min-h-[20px]">
                 {!listening && !processingText && !multipleItemsDetected && (language === 'en' ? "(Optional) Press mic to speak item name(s)" : "(可選) 按麥克風說出項目名稱")}
                 {listening && <span className="text-blue-600 animate-pulse">{t('listening')}</span>}
                 {!listening && processingText && !multipleItemsDetected && 
                    <span className="italic text-muted-foreground">{language === 'en' ? 'Recognized' : '已識別'}: "{processingText}"</span>
                 }
             </DialogDescription>
           )}
        </DialogHeader>
        
        <div className="p-6">
          {listening && browserSupportsSpeechRecognition && (
            <div className="px-1 py-1 flex justify-center mb-4">
              <div className="flex items-center gap-1 h-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-8 bg-primary/60 rounded-full transform origin-bottom animate-pulse"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: `${Math.random() * 24 + 8}px`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
          
          {!multipleItemsDetected ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="item-name" className="text-right">
                    {t('itemName')}<span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="item-name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="flex-1 h-9"
                      placeholder={language === 'en' ? "e.g., Milk, Eggs" : "例如：牛奶、雞蛋"}
                      autoFocus
                    />
                    {browserSupportsSpeechRecognition && (
                      <Button type="button" variant="outline" size="icon" onClick={handleVoiceInput} className={`h-9 w-9 shrink-0 ${listening ? 'bg-primary/10 border-primary/30' : ''}`}>
                        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant={isSubscribed ? "secondary" : "outline"} 
                      size="icon" 
                      onClick={handleCameraToggle} 
                      className="h-9 w-9 shrink-0 relative"
                      disabled={!Capacitor.isNativePlatform()}
                    >
                      <Camera className="h-4 w-4" />
                      {!isSubscribed && <LockIcon className="h-3 w-3 absolute top-0 right-0 text-whatsleft-yellow" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label className="text-right">
                    {t('category')}
                  </Label>
                  <div className="col-span-3 flex items-center gap-x-6 gap-y-2 flex-wrap">
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant={category === 'Food' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setCategory('Food')}
                        className="h-9 w-9"
                        aria-label={language === 'en' ? 'Food' : '食品'}
                      >
                        <Apple className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={category === 'Household' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setCategory('Household')}
                        className="h-9 w-9"
                        aria-label={language === 'en' ? 'Household' : '家居'}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label htmlFor="quantity" className="text-sm font-medium">{t('quantity')}:</Label>
                      <div className="flex items-center border rounded-md">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-r-none"
                          onClick={() => handleQuantityChange('decrease')}
                          disabled={parseInt(String(quantity)) <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id="quantity"
                          value={quantity}
                          onChange={handleQuantityInput}
                          type="number"
                          min="1"
                          className="w-12 h-9 text-center border-l border-r rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          aria-label={language === 'en' ? 'Quantity' : '數量'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-l-none"
                          onClick={() => handleQuantityChange('increase')}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2">
                  <Label htmlFor="expiry-date" className="text-right pt-2">
                    {t('expiryDate')}
                  </Label>
                  <div className="col-span-3 flex flex-col gap-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {dateInputType === 'days' ? (
                          <div className="relative flex-1">
                            <Input
                              id="days-until-expiry"
                              value={daysUntilExpiry}
                              onChange={handleDaysInput}
                              type="number"
                              min="0"
                              className="pr-10 h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {language === 'en' ? 'days' : '天'}
                            </span>
                          </div>
                        ) : (
                          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex-1 justify-start text-left relative h-9"
                              >
                                <div className="flex items-center truncate">
                                  <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{expiryDate ? format(expiryDate, 'PPP') : (language === 'en' ? 'Pick a date' : '選擇日期')}</span>
                                </div>
                                <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                              <div className="p-0">
                                <DayPicker
                                  mode="single"
                                  selected={expiryDate}
                                  onSelect={handleDateSelect}
                                  defaultMonth={expiryDate}
                                  initialFocus
                                  fromDate={new Date()}
                                  modifiers={{
                                    soon: { 
                                      from: new Date(),
                                      to: new Date(new Date().setDate(new Date().getDate() + 7))
                                    }
                                  }}
                                  modifiersStyles={{
                                    soon: { 
                                      color: 'var(--warning)'
                                    } 
                                  }}
                                  footer={
                                    <div className="p-2 border-t text-center">
                                      {daysUntilExpiry} {daysUntilExpiry === 1 ? 
                                        (language === 'en' ? 'day' : '天') : 
                                        (language === 'en' ? 'days' : '天')}
                                      {language === 'en' ? 'from today' : '後到期'}
                                    </div>
                                  }
                                />
                                <div className="flex justify-end p-2 border-t">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setIsDatePickerOpen(false)}
                                  >
                                    {language === 'en' ? 'Done' : '完成'}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              aria-label="Show quick options"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-2 w-56" align="end">
                            <div className="grid grid-cols-2 gap-1">
                              {[1, 3, 5, 7, 14, 30, 60, 90].map(day => (
                                <Button
                                  key={day}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDaysChange(day)}
                                  className={`text-xs h-7 ${daysUntilExpiry === day ? 'bg-primary/10 border-primary/30' : ''}`}
                                >
                                  {day} {day === 1 ? 
                                    (language === 'en' ? 'day' : '天') : 
                                    (language === 'en' ? 'days' : '天')}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setDateInputType(dateInputType === 'days' ? 'date' : 'days')}
                        >
                          {dateInputType === 'days' ? (
                            <CalendarIcon className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {dateInputType === 'days' ? (
                          <>
                            <Calendar className="h-3 w-3" />
                            <span>{language === 'en' ? 'Will expire on: ' : '到期日期：'}</span>
                            <span className="font-medium text-foreground">{format(expiryDate, 'PPP')}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>{language === 'en' ? 'Days until expiry: ' : '��餘天數：'}</span>
                            <span className="font-medium text-foreground">
                              {typeof daysUntilExpiry === 'number' ? daysUntilExpiry : parseInt(daysUntilExpiry as string) || 0}{' '}
                              {daysUntilExpiry === 1 ? 
                                (language === 'en' ? 'day' : '天') : 
                                (language === 'en' ? 'days' : '天')}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="pt-0.5">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                          <div 
                            className={`h-full rounded-full ${
                              typeof daysUntilExpiry === 'number' && daysUntilExpiry <= 3 
                                ? 'bg-red-500' 
                                : typeof daysUntilExpiry === 'number' && daysUntilExpiry <= 7 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (typeof daysUntilExpiry === 'number' ? daysUntilExpiry : parseInt(String(daysUntilExpiry)) || 0) / 90 * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="notify-days-before" className="text-right">
                    {t('notifyBefore')}
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="notify-days-before"
                        value={notifyDaysBefore}
                        onChange={handleNotifyDaysInput}
                        type="number"
                        className="pr-10 h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {language === 'en' ? 'days' : '天'}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap shrink-0">
                      {[1, 2, 3, 5].map(day => (
                        <Button
                          key={day}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNotifyDaysBefore(day)}
                          className={`text-xs px-2 h-7 ${ 
                            (typeof notifyDaysBefore === 'number' ? notifyDaysBefore : parseInt(notifyDaysBefore as string)) === day 
                              ? 'bg-primary/10 border-primary/30' 
                              : ''
                          }`}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Separator className="my-4" />
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label className="text-right">{language === 'en' ? 'Image Preview' : '圖像預覽'}</Label>
                  <div className="col-span-3 relative">
                    <div className="border rounded p-2 bg-gray-50">
                      <img 
                        src={image} 
                        alt={language === 'en' ? "Item Preview" : "項目預覽"}
                        className="max-h-40 w-full rounded object-contain bg-white"
                        onLoad={() => console.log('[圖像預覽] 圖像加載成功', image)}
                        onError={(e) => {
                          console.error('[圖像預覽] 圖像加載錯誤', image);
                          toast({
                            variant: "destructive",
                            title: language === 'en' ? "Image Error" : "圖像錯誤",
                            description: language === 'en' ? "Failed to load image" : "無法加載圖像"
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 h-7 w-7 rounded-full p-0"
                        onClick={() => setImage(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-yellow-800">
                    {language === 'en' ? 'Batch Mode' : '批量模式'}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMultipleItemsDetected(false)}
                    className="h-8 text-xs"
                  >
                    {language === 'en' ? 'Switch to Single Mode' : '切換到單項模式'}
                  </Button>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  {language === 'en' 
                    ? 'You can add multiple items at once in this mode.' 
                    : '您可以在此模式下一次添加多個項目。'}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-sm text-blue-800">
                顯示固定測試數據：{batchItems.length} 個項目
                {(() => { console.log('===> 渲染批量模式，batchItems:', batchItems); return null; })()}
              </div>
              
              <div className="space-y-2">
                {batchItems.length > 0 ? batchItems.map((item) => (
                  <div key={item.id} className="border p-2 rounded bg-white">
                    <div>名稱: {item.name}</div>
                    <div>數量: {item.quantity}</div>
                    <div>類別: {item.category}</div>
                    <div>天數: {item.daysUntilExpiry}</div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 p-4">沒有測試項目可顯示</div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelBatchMode}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveBatchItems}
                  disabled={batchItems.length === 0}
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => { 
            cleanupAndReset();
            onOpenChange(false); 
          }}>
            {t('cancel')}
          </Button>
          {!multipleItemsDetected && (
            <Button type="submit" onClick={handleSubmit}>
              {editItem ? t('save') : t('addItem')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemForm;
