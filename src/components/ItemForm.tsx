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
import { Apple, ShoppingBag, Plus, Minus, Save, X, Bell, Calendar, ChevronDown, Camera, Trash2, LockIcon, Mic, MicOff, Check, Edit2 } from 'lucide-react';
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
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 在文件頂部添加擴展全局 Window 介面的類型定義
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
}

const ItemForm: React.FC<ItemFormProps> = ({ open, onOpenChange, editItem }) => {
  const { addItem, addMultipleItems, updateItem, language, setSelectedItem, settings, currentUser } = useApp();
  const t = useTranslation(language);
  const isSubscribed = currentUser?.isPremium || false;
  const { toast } = useToast();
  
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
  
  // 控制日期選擇器 Popover 的狀態
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
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
  
  // 批量語音輸入相關狀態
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
  
  // 使用 useEffect 來處理語音輸入實時監聽
  useEffect(() => {
    if (!transcript || editItem) return; // 如果是編輯模式或沒有語音文本，直接返回
    
    // 即時更新顯示的文本，以提供使用者反饋
    console.log('收到語音識別結果:', transcript);
    setProcessingText(transcript);
    
    // 檢查是否包含多個項目，並獲取名稱
    const possibleItems = processMultipleItems(transcript);
    
    if (possibleItems.length > 1) {
      // 如果檢測到多個項目，自動創建批量項目
      console.log('檢測到多個項目:', possibleItems);
      
      // 獲取所有項目名稱，包括已刪除的項目名稱
      // 使用 Set 來儲存所有已經存在（包括曾經存在但被刪除）的項目名稱
      const allProcessedItemNames = new Set(
        [...(window.__deletedItemsCache || []), ...batchItems].map(item => item.name.toLowerCase().trim())
      );
      
      // 過濾掉已存在的項目名稱
      const filteredItems = possibleItems.filter(name => 
        !allProcessedItemNames.has(name.toLowerCase().trim())
      );
      
      console.log('過濾後的新項目:', filteredItems);
      
      const newItems = filteredItems.map(name => ({
        id: Math.random().toString(36).substring(2, 9),
        name: name,
        quantity: '1',
        category: 'Food' as ItemCategory,
        daysUntilExpiry: typeof settings.defaultExpiryDays === 'string' 
          ? parseInt(settings.defaultExpiryDays) || 7 
          : settings.defaultExpiryDays,
        notifyDaysBefore: typeof settings.defaultNotifyDays === 'string' 
          ? parseInt(settings.defaultNotifyDays) || 2 
          : settings.defaultNotifyDays,
        isEditing: false
      }));
      
      // 確保有新項目才更新狀態
      if (newItems.length > 0) {
        setBatchItems(prev => [...prev, ...newItems]); // 合併而不是替換，保留用戶的刪除
        setMultipleItemsDetected(true);
        console.log('已設置批量項目:', newItems.length);
      }
    } else if (possibleItems.length === 1) {
      // 如果只有一個項目，設置為單個項目
      console.log('檢測到單個項目:', possibleItems[0]);
      setItemName(possibleItems[0]);
      setMultipleItemsDetected(false);
    } else {
      // 如果沒有識別出項目，直接設置為原始文本
      console.log('未識別到特定項目，使用原始文本:', transcript);
      setItemName(transcript);
      setMultipleItemsDetected(false);
    }
  }, [transcript, settings, editItem]);
  
  // 單獨監聽語音識別狀態變化
  useEffect(() => {
    console.log('語音識別狀態變化:', listening);
    // 當語音識別停止，但還有未處理的文本時
    if (!listening && transcript && !editItem) { // 僅在非編輯模式下處理
      console.log('語音識別已停止，處理最終結果:', transcript);
      // 延遲處理，確保最終的識別結果已被接收
      setTimeout(() => {
        const finalText = transcript;
        const possibleItems = processMultipleItems(finalText);
        
        if (possibleItems.length > 1) {
          console.log('停止聆聽後檢測到多個項目:', possibleItems);
          
          // 獲取所有項目名稱，包括已刪除的項目名稱
          const allProcessedItemNames = new Set(
            [...(window.__deletedItemsCache || []), ...batchItems].map(item => item.name.toLowerCase().trim())
          );
          
          // 過濾掉已存在的項目名稱
          const filteredItems = possibleItems.filter(name => 
            !allProcessedItemNames.has(name.toLowerCase().trim())
          );
          
          console.log('過濾後的新項目:', filteredItems);
          
          const newItems = filteredItems.map(name => ({
            id: Math.random().toString(36).substring(2, 9),
            name: name,
            quantity: '1',
            category: 'Food' as ItemCategory,
            daysUntilExpiry: typeof settings.defaultExpiryDays === 'string' 
              ? parseInt(settings.defaultExpiryDays) || 7 
              : settings.defaultExpiryDays,
            notifyDaysBefore: typeof settings.defaultNotifyDays === 'string' 
              ? parseInt(settings.defaultNotifyDays) || 2 
              : settings.defaultNotifyDays,
            isEditing: false
          }));
          
          if (newItems.length > 0) {
            // 合併現有項目和新項目，而不是替換
            setBatchItems(prev => [...prev, ...newItems]);
            setMultipleItemsDetected(true);
            console.log('已在語音識別停止後設置批量項目:', newItems.length);
          }
        }
      }, 500); // 短暫延遲確保處理最終結果
    }
  }, [listening, transcript, settings, batchItems, editItem]);
  
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
  
  // 語音按鈕處理
  const handleVoiceInput = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      console.log('停止語音識別');
      // 最終處理會在 useEffect 中處理
    } else {
      if (!browserSupportsSpeechRecognition) {
        alert(language === 'en' ? 
          'Your browser does not support speech recognition.' : 
          '您的瀏覽器不支援語音識別功能。');
        return;
      }
      
      try {
        console.log('開始語音識別');
        resetTranscript();
        setProcessingText('');
        // 不再重置批量項目，而是保持現有項目
        // setBatchItems([]); // 移除這一行
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
      } catch (error: any) { // Explicitly type error as any or specific DOMException
        console.error('相機錯誤:', error);
        // 使用 Toast 顯示錯誤，並提供更多指引
        toast({
          variant: "destructive",
          title: language === 'en' ? "Camera Error" : "相機錯誤",
          description: language === 'en' 
            ? `Cannot access camera (${error.name || 'Unknown Error'}). Please check your browser's site settings to ensure camera permission is granted for this website.`
            : `無法訪問相機 (${error.name || '未知錯誤'})。請檢查您瀏覽器的網站設置，確保已授予本網站的相機權限。`,
        });
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
  
  // 確認日期選擇並關閉彈出窗口
  const handleConfirmDate = () => {
    setIsDatePickerOpen(false);
    // 日期值已經在 handleDateSelect 中更新了，這裡只需關閉
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
  
  // 取消編輯模式，回到單項模式
  const handleCancelBatchMode = () => {
    setMultipleItemsDetected(false);
    setBatchItems([]);
    setProcessingText('');
  };
  
  // 分割多項輸入，只返回名稱列表
  const processMultipleItems = (text: string): string[] => {
    // 先進行基本清理
    let cleanedText = text.trim();
    if (!cleanedText) return [];

    console.log('原始文本進行分割處理:', cleanedText);

    // 定義常見的停用詞
    const stopWords = new Set(['a', 'an', 'the', 'some', 'few', 'of', '的', '個', '些', '和', '與', '這', '那', '這些', '那些']);

    // ---- 1. 先處理明確的分隔符 ----
    // 將明確的分隔符替換為標準分隔符(逗號)
    cleanedText = cleanedText
      .replace(/^[\s,，、]+|[\s,，、]+$/g, '') // 去除頭尾分隔符
      .replace(/\s*[,，、；;]\s*/g, ', ') // 將所有明確分隔符標準化為逗號
      .replace(/\s+(and|or|和|與|及)\s+/gi, ', '); // 將連接詞也換成逗號

    if (!cleanedText) {
      console.log('處理結果：沒有剩餘文本，返回空列表');
      return [];
    }
    
    // ---- 2. 找出已有明確分隔符的項目 ----
    let itemsWithDelimiters: string[] = [];
    if (cleanedText.includes(',')) {
      itemsWithDelimiters = cleanedText
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0 && !isDelimiter(item) && !/^[0-9]+$/.test(item));
      
      console.log('找到明確分隔符的項目:', itemsWithDelimiters);
      // 如果找到多個項目，直接返回
      if (itemsWithDelimiters.length > 1) {
        return processFinalItems(itemsWithDelimiters);
      }
    }
    
    // ---- 3. 沒有明確分隔符時的處理策略 ----
    console.log('嘗試基於單詞和模式識別多個項目:', cleanedText);
    
    // 分隔成單詞
    const words = cleanedText.split(/\s+/);
    
    // 如果只有一個單詞，可能是單個項目
    if (words.length <= 1) {
      return [cleanedText];
    }
    
    // 常見食品/雜貨項目詞典（用於更好地識別）
    const commonFoodItems = new Set([
      // 英文
      'apple', 'orange', 'banana', 'milk', 'bread', 'eggs', 'cheese', 'tomato', 
      'potato', 'carrot', 'onion', 'garlic', 'fish', 'beef', 'pork', 'chicken',
      'rice', 'pasta', 'noodle', 'yogurt', 'butter', 'sugar', 'salt', 'pepper',
      'juice', 'water', 'coffee', 'tea', 'cereal', 'cookie', 'cake', 'chocolate',
      // 中文
      '蘋果', '橙子', '香蕉', '牛奶', '麵包', '雞蛋', '奶酪', '番茄',
      '馬鈴薯', '胡蘿蔔', '洋蔥', '大蒜', '魚', '牛肉', '豬肉', '雞肉',
      '米飯', '麵條', '優格', '奶油', '糖', '鹽', '胡椒',
      '果汁', '水', '咖啡', '茶', '麥片', '餅乾', '蛋糕', '巧克力'
    ]);
    
    // 方法1：首先嘗試基於詞典進行匹配
    const potentialItems: string[] = [];
    let currentChunk: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      // 如果是常見食品項目詞典中的單詞，單獨作為一個項目
      if (commonFoodItems.has(word)) {
        // 如果有已積累的詞組，先添加為一個項目
        if (currentChunk.length > 0) {
          potentialItems.push(currentChunk.join(' '));
          currentChunk = [];
        }
        
        // 添加單詞為獨立項目
        potentialItems.push(words[i]);
      } 
      // 處理複合名詞，例如「綠茶」「橙汁」等
      else if (currentChunk.length === 1 && 
               (isColorWord(currentChunk[0]) || isFlavorWord(currentChunk[0]))) {
        currentChunk.push(words[i]);
      } 
      // 如果是數字後面跟著單位或非停用詞，開始新項目
      else if (/^\d+$/.test(word) && i + 1 < words.length) {
        if (currentChunk.length > 0) {
          potentialItems.push(currentChunk.join(' '));
        }
        currentChunk = [words[i]];
      }
      // 對於其他單詞，嘗試智能分組
      else {
        // 當前單詞不是停用詞，但前一個非停用詞累積長度已達到一定長度，開始新項目
        const isStopWord = isDelimiter(word) || stopWords.has(word);
        
        if (!isStopWord && currentChunk.length >= 1 && 
            !stopWords.has(currentChunk[currentChunk.length-1].toLowerCase())) {
          potentialItems.push(currentChunk.join(' '));
          currentChunk = [words[i]];
        } else {
          currentChunk.push(words[i]);
        }
      }
    }
    
    // 添加最後剩餘的詞組
    if (currentChunk.length > 0) {
      potentialItems.push(currentChunk.join(' '));
    }
    
    console.log('基於詞典和智能分割的結果:', potentialItems);
    
    // 如果方法1產生了多個項目，返回結果
    if (potentialItems.length > 1) {
      return processFinalItems(potentialItems);
    }
    
    // 方法2：更激進的單詞分割（每個實質性單詞作為一個項目）
    const aggressiveSplitItems = words
      .filter(word => !stopWords.has(word.toLowerCase()) && word.length >= 2)
      .map(word => word);
    
    console.log('激進單詞分割結果:', aggressiveSplitItems);
    
    // 如果方法2產生了多個項目，返回結果
    if (aggressiveSplitItems.length > 1) {
      return processFinalItems(aggressiveSplitItems);
    }
    
    // 如果以上方法都沒有產生多個項目，將整個文本作為一個項目返回
    return [cleanedText];
  };

  // 輔助函數：檢查是否為顏色詞
  const isColorWord = (word: string): boolean => {
    const colorWords = new Set([
      'red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 
      '紅', '綠', '藍', '黃', '黑', '白', '橙', '紫'
    ]);
    return colorWords.has(word.toLowerCase());
  };
  
  // 輔助函數：檢查是否為口味詞
  const isFlavorWord = (word: string): boolean => {
    const flavorWords = new Set([
      'sweet', 'sour', 'bitter', 'spicy', 'salty', 'fresh', 'frozen',
      '甜', '酸', '苦', '辣', '鹹', '新鮮', '冷凍'
    ]);
    return flavorWords.has(word.toLowerCase());
  };

  // 輔助函數：檢查字符串是否只包含分隔詞或連接詞
  const isDelimiter = (str: string): boolean => {
    return /^(and|or|和|還有|以及|與|及|、|，|,|;|；|\s+)$/i.test(str);
  };
  
  // 輔助函數：處理最終項目列表（去重和清理）
  const processFinalItems = (items: string[]): string[] => {
    // 過濾無效項目
    const validItems = items.filter(item => 
      item.length > 0 && 
      !isDelimiter(item) && 
      !/^[0-9]+$/.test(item) &&
      item.length >= 2 // 至少2個字元才可能是有效項目
    );
    
    // 去重
    const uniqueItemsMap = new Map<string, string>();
    validItems.forEach(item => {
      const key = item.toLowerCase().trim();
      if (!uniqueItemsMap.has(key)) {
        uniqueItemsMap.set(key, item);
      }
    });
    
    const result = Array.from(uniqueItemsMap.values());
    console.log('最終處理結果（項目名稱列表）:', result);
    return result;
  };

  // 處理批量項目
  const handleProcessBatchItems = () => {
    if (!processingText.trim()) return;
    
    const possibleItems = processMultipleItems(processingText);
    
    if (possibleItems.length > 0) {
      const newItems = possibleItems.map(name => ({
        id: Math.random().toString(36).substring(2, 9),
        name: name,
        quantity: '1',
        category: 'Food' as ItemCategory,
        daysUntilExpiry: typeof settings.defaultExpiryDays === 'string' 
          ? parseInt(settings.defaultExpiryDays) || 7 
          : settings.defaultExpiryDays,
        notifyDaysBefore: typeof settings.defaultNotifyDays === 'string' 
          ? parseInt(settings.defaultNotifyDays) || 2 
          : settings.defaultNotifyDays,
        isEditing: false
      }));
      
      setBatchItems(prev => [...prev, ...newItems]);
      setMultipleItemsDetected(true);
      setProcessingText('');
      resetTranscript();
    }
  };

  // 添加為單個項目
  const handleAddAsSingleItem = () => {
    if (!processingText.trim()) return;
    
    setBatchItems(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      name: processingText.trim(),
      quantity: '1',
      category: 'Food' as ItemCategory,
      daysUntilExpiry: typeof settings.defaultExpiryDays === 'string' 
        ? parseInt(settings.defaultExpiryDays) || 7 
        : settings.defaultExpiryDays,
      notifyDaysBefore: typeof settings.defaultNotifyDays === 'string' 
        ? parseInt(settings.defaultNotifyDays) || 2 
        : settings.defaultNotifyDays,
      isEditing: false
    }]);
    
    setProcessingText('');
    resetTranscript();
  };

  // 批量項目編輯函數
  const handleDeleteBatchItem = (id: string) => {
    // 找到要刪除的項目並將其添加到刪除快取中
    const itemToDelete = batchItems.find(item => item.id === id);
    if (itemToDelete) {
      // 將刪除的項目添加到全局快取
      if (typeof window !== 'undefined') {
        window.__deletedItemsCache = [
          ...(window.__deletedItemsCache || []),
          itemToDelete
        ];
      }
    }
    // 從當前列表中移除項目
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditBatchItem = (id: string) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, isEditing: !item.isEditing } : item
    ));
  };

  const handleUpdateBatchItemName = (id: string, name: string) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, name } : item
    ));
  };

  const handleUpdateBatchItemQuantity = (id: string, operation: 'increase' | 'decrease') => {
    setBatchItems(prev => prev.map(item => {
      if (item.id === id) {
        const currentQuantity = parseInt(item.quantity) || 1;
        const newQuantity = operation === 'increase' 
          ? currentQuantity + 1 
          : Math.max(1, currentQuantity - 1);
        return { ...item, quantity: newQuantity.toString() };
      }
      return item;
    }));
  };

  const handleUpdateBatchItemCategory = (id: string, category: ItemCategory) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, category } : item
    ));
  };

  const handleUpdateBatchItemExpiry = (id: string, operation: 'increase' | 'decrease') => {
    setBatchItems(prev => prev.map(item => {
      if (item.id === id) {
        const currentDays = item.daysUntilExpiry;
        const newDays = operation === 'increase' 
          ? currentDays + 1 
          : Math.max(1, currentDays - 1);
        return { ...item, daysUntilExpiry: newDays };
      }
      return item;
    }));
  };

  // 批量保存所有項目
  const handleSaveBatchItems = () => {
    console.log('正在保存批量項目:', batchItems);
    if (batchItems.length === 0) {
      console.error('沒有批量項目可保存');
      return;
    }
    
    // 複製一份批量項目以防回調問題
    const itemsToSave = [...batchItems];
    console.log('準備儲存的項目數量:', itemsToSave.length);
    
    // 將批量項目轉換為適合添加的格式
    const itemsToAdd = itemsToSave.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      daysUntilExpiry: item.daysUntilExpiry,
      notifyDaysBefore: item.notifyDaysBefore,
      expiryDate: getExpiryDateFromDays(item.daysUntilExpiry),
    }));
    
    // 使用批量添加函數一次性添加所有項目
    const numAdded = addMultipleItems(itemsToAdd);
    console.log(`已成功添加 ${numAdded} 個項目`);
    
    // 顯示成功消息
    toast({
      title: language === 'en' ? "Successfully Added" : "成功添加",
      description: language === 'en' 
        ? `Successfully added ${numAdded} items to your list` 
        : `已成功添加 ${numAdded} 個項目到清單中`,
    });
    
    // 清空項目列表
    setBatchItems([]);
    setMultipleItemsDetected(false);
    
    // 關閉表單
    onOpenChange(false);
  };
  
  // 初始化刪除項目的快取
  useEffect(() => {
    // 在全局範圍創建一個刪除項目的快取，用於跟踪已刪除的項目
    if (typeof window !== 'undefined' && !window.__deletedItemsCache) {
      window.__deletedItemsCache = [];
    }
  }, []);
  
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
            <DialogDescription className="text-sm text-muted-foreground pt-1 min-h-[20px]">
              {listening ? (
                <span className="flex items-center text-red-600 animate-pulse">
                  <Mic className="h-4 w-4 mr-1.5" />
                  {language === 'en' ? 'Listening... Speak now!' : '正在聆聽... 請說話！'}
                </span>
              ) : (
                language === 'en' ? 'Add item details or use voice/camera.' : '請輸入物品詳情，或使用語音/相機輸入。'
              )}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-5 max-h-[calc(80vh-180px)] overflow-y-auto">
          {/* 相機和語音按鈕 - 僅在添加模式下顯示 */}
          {!editItem && (
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
          )}
          
          {/* 顯示已拍攝的照片預覽 */} 
          {!showCamera && image && (
            <div className="relative w-40 h-40 mx-auto border rounded-lg overflow-hidden shadow-sm group">
              <img 
                src={image}
                alt={language === 'en' ? 'Captured item' : '拍攝的物品'}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => setImage(null)} // 清除照片
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* 相機區域 */}
          {showCamera && !multipleItemsDetected && (
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
          
          {/* 批量語音輸入模式 - 當檢測到多個項目時顯示 */}
          {multipleItemsDetected && (
            <div className="space-y-4 mt-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-700 font-medium">
                    {language === 'en' ? 'Multiple items detected!' : '檢測到多個項目！'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMultipleItemsDetected(false)}
                      className="text-xs text-primary hover:text-primary bg-white"
                    >
                      {language === 'en' ? 'Single Mode' : '單項模式'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelBatchMode}
                      className="text-xs text-amber-700 hover:text-red-600"
                    >
                      {language === 'en' ? 'Cancel' : '取消'}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  {language === 'en' 
                    ? 'Items have been automatically added to the list. You can edit them below.' 
                    : '已自動將項目添加到列表中。您可以在下方編輯它們。'}
                </p>
              </div>

              {/* 當正在聆聽時顯示實時識別結果 (視覺優化) */}
              {listening && (
                <div className="border p-3 rounded bg-muted/30 min-h-[60px]">
                  <div className="mt-1 border-muted bg-white rounded px-3 py-2 text-sm min-h-[40px] relative">
                    {processingText || (language === 'en' 
                      ? <span className="text-muted-foreground italic">Listening...</span> 
                      : <span className="text-muted-foreground italic">正在聆聽...</span>)}
                    {listening && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <div className="animate-pulse h-1.5 w-1.5 rounded-full bg-red-500"></div>
                        <div className="animate-pulse h-1.5 w-1.5 rounded-full bg-red-500" style={{ animationDelay: '0.15s' }}></div>
                        <div className="animate-pulse h-1.5 w-1.5 rounded-full bg-red-500" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 當正在處理但不再聆聽時顯示處理狀態 */}
              {!listening && processingText && !batchItems.length && (
                <div className="border p-3 rounded bg-blue-50/50 min-h-[60px]">
                  <div className="flex items-center text-blue-600">
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                    {language === 'en' ? 'Processing your input...' : '正在處理您的輸入...'}
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    {processingText}
                  </div>
                </div>
              )}
              
              {/* 已處理的批量項目 (樣式優化) */}
              {batchItems.length > 0 && (
                <div className="mt-4 border rounded-lg p-3 bg-muted/20">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">
                      {language === 'en' ? `Recognized Items (${batchItems.length})` : `已識別項目 (${batchItems.length})`}
                    </h3>
                    <Button 
                      onClick={() => setBatchItems([])}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {language === 'en' ? 'Clear All' : '清除全部'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {batchItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg px-3 py-2 bg-white flex flex-row items-center gap-3 shadow-sm hover:shadow transition-all ${index % 2 !== 0 ? 'bg-muted/30' : ''}`}
                      >
                        {/* Item Name Input - Takes up most space */}
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateBatchItemName(item.id, e.target.value)}
                          className="flex-1 h-8 text-sm font-medium border-muted/50 focus-visible:ring-primary/30"
                          placeholder={language === 'en' ? 'Item name' : '項目名稱'}
                          autoComplete="off"
                        />

                        <div className="flex items-center gap-3 shrink-0">
                          {/* 類別選擇器 - 只有圖標 */}
                          <div className="bg-muted/20 rounded-md p-0.5 flex gap-1">
                            <Button
                              type="button"
                              variant={item.category === 'Food' ? 'default' : 'ghost'}
                              size="icon"
                              onClick={() => handleUpdateBatchItemCategory(item.id, 'Food')}
                              className="h-7 w-7 rounded-md"
                              aria-label={t('food')}
                            >
                              <Apple className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant={item.category === 'Household' ? 'default' : 'ghost'}
                              size="icon"
                              onClick={() => handleUpdateBatchItemCategory(item.id, 'Household')}
                              className="h-7 w-7 rounded-md"
                              aria-label={t('household')}
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* 數量調整器 */}
                          <div className="flex items-center gap-0.5 bg-muted/20 rounded-md p-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateBatchItemQuantity(item.id, 'decrease')}
                              className="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 rounded-md"
                              disabled={parseInt(item.quantity) <= 1}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateBatchItemQuantity(item.id, 'increase')}
                              className="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* 刪除按鈕 */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteBatchItem(item.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                            aria-label={t('delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {batchItems.length > 0 && (
                    <Button 
                      onClick={handleSaveBatchItems}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 gap-2 font-medium"
                    >
                      <Save className="h-4 w-4" />
                      {language === 'en' 
                        ? `Save All ${batchItems.length} Items` 
                        : `保存所有 ${batchItems.length} 個項目`}
                    </Button>
                  )}
                </div>
              )}
              
              {/* 語音輸入提示 */}
              {listening && batchItems.length === 0 && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm text-primary flex items-center">
                    <Mic className="h-4 w-4 mr-2 animate-pulse" />
                    {language === 'en' ? 'Listening for multiple items...' : '正在聆聽多個項目...'}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {language === 'en' 
                      ? 'Try saying: "milk, bread and apples"' 
                      : '嘗試說：「牛奶、麵包和蘋果」'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!multipleItemsDetected && (
            <>
              {/* 顯示已拍攝的照片預覽 - 備用位置 (如果不在上面顯示) */} 
              {/* 
              {!showCamera && image && (
                <div className="relative w-32 h-32 mx-auto border rounded-lg overflow-hidden shadow-sm group mb-4">
                  <img src={image} alt={language === 'en' ? 'Captured item' : '拍攝的物品'} className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImage(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              */}
              {/* 手動添加項目表單 - 原始功能恢復 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itemName" className="text-right">
                  {t('itemName')}
                </Label>
                <Input
                  id="itemName"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="col-span-3"
                  placeholder={language === 'en' ? 'Enter item name' : '輸入項目名稱'}
                  autoComplete="off"
                />
              </div>
              
              {/* 類別和數量在同一行，類別標籤對齊 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t('category')}</Label>
                <div className="col-span-3 flex items-center gap-6">
                  {/* 類別選擇器 - 只有圖標 */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant={category === 'Food' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setCategory('Food')}
                      className="h-8 w-8 shrink-0"
                      aria-label={t('food')}
                    >
                      <Apple className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={category === 'Household' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setCategory('Household')}
                      className="h-8 w-8 shrink-0"
                      aria-label={t('household')}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* 數量調整器 - 帶標籤 */}
                  <div className="flex items-center gap-2">
                     <Label htmlFor="quantity" className="text-sm font-medium whitespace-nowrap">{t('quantity')}:</Label>
                     <div className="flex items-center gap-1">
                       <Button
                         type="button"
                         variant="outline"
                         size="icon"
                         onClick={decreaseQuantity}
                         className="h-8 w-8 shrink-0"
                         disabled={parseInt(quantity) <= 1}
                       >
                         <Minus className="h-4 w-4" />
                       </Button>
                       <Input
                         id="quantity"
                         value={quantity}
                         onChange={(e) => setQuantity(e.target.value)}
                         className="w-16 text-center"
                       />
                       <Button
                         type="button"
                         variant="outline"
                         size="icon"
                         onClick={increaseQuantity}
                         className="h-8 w-8 shrink-0"
                       >
                         <Plus className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 過期日期選擇 - 提供兩種輸入方式 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  {language === 'en' ? 'Expiry Option' : '過期選項'}
                </Label>
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={dateInputType === 'days' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateInputType('days')}
                      className="text-xs"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {language === 'en' ? 'Days until expiry' : '剩餘天數'}
                    </Button>
                    <Button
                      type="button"
                      variant={dateInputType === 'date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateInputType('date')}
                      className="text-xs"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {language === 'en' ? 'Select date' : '選擇日期'}
                    </Button>
                  </div>
                  
                  {dateInputType === 'days' ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="days-until-expiry"
                            value={daysUntilExpiry}
                            onChange={handleDaysInput}
                            type="number"
                            className="flex-1"
                            placeholder={language === 'en' ? 'Days' : '天數'}
                          />
                          <div className="flex gap-1 flex-wrap">
                            {[3, 7, 14, 30].map(day => (
                              <Button
                                key={day}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDaysChange(day)}
                                className={`text-xs px-2 h-7 ${daysUntilExpiry === day ? 'bg-primary/10 border-primary/30' : ''}`}
                              >
                                {day}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Expiry date: ' : '到期日期：'}
                          <span className="font-medium text-foreground">
                            {format(expiryDate, 'PPP')}
                          </span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <Popover onOpenChange={setIsDatePickerOpen} open={isDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !expiryDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {expiryDate ? format(expiryDate, 'PPP') : <span>{t('pickDate')}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                             <div className="p-0">
                              <DayPicker
                                mode="single"
                                selected={expiryDate}
                                onSelect={handleDateSelect} // 選擇日期時更新狀態
                                defaultMonth={expiryDate}
                                initialFocus
                              />
                              <div className="flex justify-end px-3 pb-3 border-t pt-2">
                                <Button 
                                  size="sm" 
                                  onClick={handleConfirmDate} // 點擊確認按鈕關閉
                                >
                                  {language === 'en' ? 'Confirm' : '確認'}
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Days until expiry: ' : '剩餘天數：'}
                          <span className="font-medium text-foreground">
                            {typeof daysUntilExpiry === 'number' ? daysUntilExpiry : parseInt(daysUntilExpiry as string) || 0}
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notify-days-before" className="text-right">
                  {t('notifyBefore')}
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="notify-days-before"
                    value={notifyDaysBefore}
                    onChange={handleNotifyDaysInput}
                    type="number"
                    className="flex-1"
                  />
                  <div className="flex gap-1 flex-wrap">
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
              
              {/* 批量模式切換按鈕 */}
              {batchItems.length > 0 && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setMultipleItemsDetected(true)}
                  >
                    {language === 'en' 
                      ? `Switch to Batch Mode (${batchItems.length} items)` 
                      : `切換到批量模式 (${batchItems.length} 個項目)`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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

