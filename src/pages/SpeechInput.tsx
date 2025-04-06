import React, { useState, useEffect } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Apple, ShoppingBag, Plus, Minus, Trash2, Edit2, Mic, MicOff, 
  Save, Check, Calendar, ArrowLeft 
} from 'lucide-react';
import { ItemCategory, useApp, getExpiryDateFromDays } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/utils/translations';

interface RecognizedItem {
  id: string;
  name: string;
  quantity: string;
  category: ItemCategory;
  daysUntilExpiry: number;
  notifyDaysBefore: number;
  isEditing: boolean;
}

const SpeechInput: React.FC = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const { addItem, settings, language } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useTranslation(language);

  const [items, setItems] = useState<RecognizedItem[]>([]);
  const [processingText, setProcessingText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setProcessingText(transcript);
  }, [transcript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">批量語音輸入</h1>
        </div>
        <div className="p-4 border rounded bg-red-50 text-red-600">
          您的瀏覽器不支持語音識別功能。請嘗試使用 Chrome 或 Edge 瀏覽器。
        </div>
      </div>
    );
  }

  const handleStartListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'zh-TW' });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
  };

  const processMultipleItems = (text: string): string[] => {
    // 先進行基本清理
    const cleanedText = text.trim();
    if (!cleanedText) return [];

    console.log('原始文本進行分割處理:', cleanedText);

    // 方法1: 使用自然語言模式進行分割
    const chinesePatterns = [
      /([^和還有以及與、，,;；]+)(和|還有|以及|與|、|，|,|;|；)/g,  // 尋找分隔詞前的內容
      /(和|還有|以及|與|、|，|,|;|；)([^和還有以及與、，,;；]+)/g   // 尋找分隔詞後的內容
    ];

    // 收集所有可能的項目
    let possibleItems = new Set<string>();
    
    // 方法1: 使用自然語言模式匹配
    chinesePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(cleanedText)) !== null) {
        // 提取不包含分隔詞的部分
        const item = match[1] !== undefined && !isDelimiter(match[1]) ? match[1].trim() : 
                     match[2] !== undefined && !isDelimiter(match[2]) ? match[2].trim() : '';
        if (item && !isDelimiter(item)) {
          possibleItems.add(item);
        }
      }
    });

    // 方法2: 使用所有可能的分隔詞進行直接分割
    const separators = /和|還有|以及|與|、|，|,|;|；|\s+/g;
    const directSplit = cleanedText
      .replace(separators, '###')
      .split('###')
      .map(item => item.trim())
      .filter(item => item.length > 0 && !isDelimiter(item));
    
    directSplit.forEach(item => possibleItems.add(item));

    // 方法3: 使用空格分割（適用於手動輸入的情況）
    if (cleanedText.includes(' ')) {
      const spaceSplit = cleanedText
        .split(' ')
        .map(item => item.trim())
        .filter(item => item.length > 0 && !isDelimiter(item));
      
      spaceSplit.forEach(item => possibleItems.add(item));
    }

    // 方法4: 使用漢字分組（如果上述方法都找不到項目）
    if (possibleItems.size <= 1 && cleanedText.length > 5) {
      const hanziGroups = cleanedText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
      hanziGroups.forEach(item => {
        if (item.length >= 2 && !isDelimiter(item)) {
          possibleItems.add(item);
        }
      });
    }

    // 轉換為數組並過濾空字符串和純分隔詞
    let items = Array.from(possibleItems)
      .filter(item => item.trim().length > 0 && !isDelimiter(item));

    // 如果仍然無法分割，但原始文本有內容，則將整個文本作為一個項目
    if (items.length === 0 && cleanedText.length > 0) {
      items = [cleanedText];
    }

    console.log('最終分割後的項目:', items);
    return items;
  };

  // 輔助函數：檢查字符串是否只包含分隔詞
  const isDelimiter = (str: string): boolean => {
    return /^(和|還有|以及|與|、|，|,|;|；|\s+)$/.test(str);
  };

  const handleProcessItems = () => {
    if (!processingText.trim()) return;
    
    setIsProcessing(true);
    console.log('準備處理的原始文本:', processingText);
    const processedItems = processMultipleItems(processingText);
    
    const newItems = processedItems.map(name => ({
      id: Math.random().toString(36).substring(2, 9),
      name,
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
    
    setItems(prev => [...prev, ...newItems]);
    setProcessingText('');
    resetTranscript();
    setIsProcessing(false);
  };

  const handleClearItems = () => {
    setItems([]);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isEditing: !item.isEditing } : item
    ));
  };

  const handleUpdateItemName = (id: string, name: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, name } : item
    ));
  };

  const handleUpdateItemQuantity = (id: string, operation: 'increase' | 'decrease') => {
    setItems(prev => prev.map(item => {
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

  const handleUpdateItemCategory = (id: string, category: ItemCategory) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, category } : item
    ));
  };

  const handleUpdateItemExpiry = (id: string, operation: 'increase' | 'decrease') => {
    setItems(prev => prev.map(item => {
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

  const handleSaveAll = () => {
    // 添加所有項目到主程序
    items.forEach(item => {
      addItem({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        daysUntilExpiry: item.daysUntilExpiry,
        notifyDaysBefore: item.notifyDaysBefore,
        expiryDate: getExpiryDateFromDays(item.daysUntilExpiry),
      });
    });
    
    // 顯示成功消息
    toast({
      title: "成功添加",
      description: `已成功添加 ${items.length} 個項目到清單中`,
    });
    
    // 清空項目列表
    setItems([]);
    
    // 導航到主頁查看添加的項目
    navigate('/');
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-16">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">批量語音輸入</h1>
      </div>
      
      <div className="mb-6 border rounded-lg p-4 bg-slate-50">
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={handleStartListening}
            className={`gap-2 ${listening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            disabled={listening}
          >
            <Mic className="h-4 w-4" />
            開始聆聽
          </Button>
          <Button 
            onClick={handleStopListening}
            variant="outline"
            className="gap-2"
            disabled={!listening}
          >
            <MicOff className="h-4 w-4" />
            停止聆聽
          </Button>
          <Button 
            onClick={resetTranscript}
            variant="ghost"
            className="gap-2"
          >
            清除
          </Button>
        </div>
        
        <div className="mb-4">
          <p className={`text-sm ${listening ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            聆聽狀態: {listening ? '聆聽中...' : '未聆聽'}
          </p>
          {listening && (
            <p className="text-xs text-blue-500 mt-1">
              提示：說出多個項目時，用「和」、「還有」或「、」分隔，或一次只說一個項目
            </p>
          )}
        </div>
        
        <div className="border p-3 rounded bg-white min-h-[60px] mb-4">
          <Label htmlFor="transcript" className="text-sm font-medium mb-1 block">識別結果：</Label>
          <Input
            id="transcript"
            value={processingText}
            onChange={(e) => setProcessingText(e.target.value)}
            placeholder="語音識別結果將顯示在這裡..."
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            如果多個項目未被正確分割，您可以手動輸入並使用空格、逗號或「和」來分隔項目
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleProcessItems}
            className="bg-green-600 hover:bg-green-700 gap-2"
            disabled={!processingText.trim()}
          >
            <Check className="h-4 w-4" />
            處理項目
          </Button>
          <Button
            onClick={() => {
              // 手動添加單個項目
              if (processingText.trim()) {
                setItems(prev => [...prev, {
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
              }
            }}
            variant="outline"
            className="gap-2"
            disabled={!processingText.trim()}
          >
            <Plus className="h-4 w-4" />
            作為單個項目添加
          </Button>
        </div>

        {/* 添加手動分割功能區塊 */}
        <div className="mt-4 border-t pt-2">
          <p className="text-sm font-medium text-blue-600 mb-2">🔍 手動分割輔助工具</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                if (processingText.trim()) {
                  setProcessingText(processingText + " 和 ");
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              添加「和」
            </Button>
            <Button
              onClick={() => {
                if (processingText.trim()) {
                  setProcessingText(processingText + " 還有 ");
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              添加「還有」
            </Button>
            <Button
              onClick={() => {
                if (processingText.trim()) {
                  // 嘗試基本分割 - 使用空格分隔
                  const items = processingText.split(/\s+/).filter(i => i.trim().length > 0);
                  if (items.length > 1) {
                    // 為每個項目創建一個新項目
                    const newItems = items.map(name => ({
                      id: Math.random().toString(36).substring(2, 9),
                      name: name.trim(),
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
                    
                    setItems(prev => [...prev, ...newItems]);
                    setProcessingText('');
                    resetTranscript();
                  } else {
                    // 提示用戶需要空格
                    toast({
                      title: "需要分隔符",
                      description: "請在項目之間添加空格，例如「蘋果 香蕉 橙子」",
                    });
                  }
                }
              }}
              variant="secondary"
              size="sm"
              className="text-xs font-medium"
            >
              按空格分割
            </Button>
            <Button
              onClick={() => {
                // 自動在每個漢字間添加空格
                if (processingText.trim()) {
                  const spaced = processingText.trim().split('').join(' ');
                  setProcessingText(spaced);
                }
              }}
              variant="secondary"
              size="sm"
              className="text-xs font-medium"
            >
              字符間添加空格
            </Button>
          </div>
        </div>
      </div>
      
      {items.length > 0 && (
        <div className="mb-6 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">已識別項目 ({items.length})</h2>
            <div className="flex gap-2">
              <Button 
                onClick={handleClearItems}
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                清除全部
              </Button>
              <Button 
                onClick={handleSaveAll}
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-1"
                disabled={items.length === 0}
              >
                <Save className="h-4 w-4" />
                批量添加
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border rounded-md p-3 bg-white">
                {item.isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={item.name}
                      onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                      className="font-medium"
                    />
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-gray-500 w-16">數量：</Label>
                      <div className="flex items-center">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleUpdateItemQuantity(item.id, 'decrease')}
                          className="h-8 w-8 rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          type="button" 
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateItemQuantity(item.id, 'increase')}
                          className="h-8 w-8 rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-gray-500 w-16">保存期：</Label>
                      <div className="flex items-center">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleUpdateItemExpiry(item.id, 'decrease')}
                          className="h-8 w-8 rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.daysUntilExpiry}</span>
                        <Button 
                          type="button" 
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateItemExpiry(item.id, 'increase')}
                          className="h-8 w-8 rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-gray-500 ml-1">天</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-gray-500 w-16">類別：</Label>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant={item.category === 'Food' ? 'default' : 'outline'}
                          size="sm"
                          className="gap-2"
                          onClick={() => handleUpdateItemCategory(item.id, 'Food')}
                        >
                          <Apple className="h-4 w-4" />
                          食物
                        </Button>
                        <Button
                          type="button"
                          variant={item.category === 'Household' ? 'default' : 'outline'}
                          size="sm"
                          className="gap-2"
                          onClick={() => handleUpdateItemCategory(item.id, 'Household')}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          家居
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleEditItem(item.id)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        完成
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${item.category === 'Food' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.category === 'Food' ? (
                          <Apple className="h-4 w-4" />
                        ) : (
                          <ShoppingBag className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex items-center text-sm text-gray-500 gap-2">
                          <span>數量: {item.quantity}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.daysUntilExpiry} 天
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditItem(item.id)}
                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500 bg-yellow-50 p-3 rounded-md border border-yellow-200">
        <p className="font-medium text-yellow-700 mb-1">使用提示：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>點擊「開始聆聽」然後說出您想添加的項目</li>
          <li>
            <strong>如何輸入多個項目：</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>方式一：在語音中明確使用分隔詞，如「<u>牛奶</u> 和 <u>麵包</u> 還有 <u>蘋果</u>」</li>
              <li>方式二：每個項目之間停頓明顯，一個項目說完後稍微暫停</li>
              <li>方式三：使用手動分割輔助工具中的「按空格分割」功能</li>
              <li>方式四：在識別結果中手動編輯，在項目間添加空格或「和」</li>
            </ul>
          </li>
          <li>
            <strong>分割問題解決方法：</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>如果自動分割不成功，請使用「作為單個項目添加」按鈕一次添加一個項目</li>
              <li>或使用「手動分割輔助工具」中的按鈕來添加分隔符和進行分割</li>
              <li>您也可以嘗試說得更慢，每個項目之間停頓更長時間</li>
            </ul>
          </li>
          <li>您可以點擊每個項目的編輯按鈕調整數量、類別和保存期</li>
          <li>完成後點擊「批量添加」一次性添加全部項目</li>
        </ul>
        
        <div className="mt-3 bg-blue-50 p-2 rounded border border-blue-100">
          <p className="font-medium text-blue-700 text-xs">⚠️ 語音識別提示：</p>
          <p className="text-xs text-blue-700 mt-1">語音識別在某些瀏覽器或語言環境中可能不是完美的。如果您發現識別不精確，請使用手動輸入或手動分割功能。</p>
        </div>
      </div>
    </div>
  );
};

export default SpeechInput; 