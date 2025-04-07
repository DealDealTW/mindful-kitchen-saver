import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  ArrowDownUp,
  Apple,
  ShoppingBag,
  PieChart,
  ChevronDown,
  ChevronUp,
  InfoIcon,
  PercentIcon
} from 'lucide-react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, isAfter } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Stats: React.FC = () => {
  const { items, language } = useApp();
  const t = useTranslation(language);
  const [timeframe, setTimeframe] = useState<string>("thisMonth");
  const [showAllItems, setShowAllItems] = useState<boolean>(false);
  
  // --- 計算時間範圍 --- 
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now; // 默認結束日期為現在

  switch (timeframe) {
    case 'lastMonth':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      break;
    case 'last3Months':
      startDate = startOfMonth(subMonths(now, 3)); // 從三個月前的第一天開始
      endDate = endOfMonth(subMonths(now, 1)); // 到上個月的最後一天結束
      break;
    case 'last6Months':
      startDate = startOfMonth(subMonths(now, 6)); // 從六個月前的第一天開始
      endDate = endOfMonth(subMonths(now, 1)); // 到上個月的最後一天結束
      break;
    default: // thisMonth
      startDate = startOfMonth(now);
      endDate = now; // 當前月份的結束就是現在
      break;
  }
  // 設定時間到午夜以確保包含邊界日期
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  const timeInterval = { start: startDate, end: endDate };
  // --- 時間範圍計算結束 ---
  
  // 計算 **所有** 有效使用和總浪費的物品 (用於潛在的全局統計，如果需要的話)
  const allEffectivelyUsedItems = items.filter(item => 
    item.used && item.dateUsed && !isAfter(parseISO(item.dateUsed), parseISO(item.expiryDate))
  );
  const allTotalWastedItems = items.filter(item => 
    (!item.used && calculateDaysUntilExpiry(item.expiryDate) < 0) ||
    (item.used && item.dateUsed && isAfter(parseISO(item.dateUsed), parseISO(item.expiryDate)))
  );

  // --- 計算 **時間範圍內** 的統計數據 ---
  const timeframedEffectivelyUsedItems = items.filter(item => {
    try {
      return item.used && item.dateUsed && 
             !isAfter(parseISO(item.dateUsed), parseISO(item.expiryDate)) &&
             isWithinInterval(parseISO(item.dateUsed), timeInterval);
    } catch { return false; }
  });

  const timeframedTotalWastedItems = items.filter(item => {
    try {
      const expiryDate = parseISO(item.expiryDate);
      // 檢查物品是否在時間範圍內過期，並且滿足浪費條件
      return isWithinInterval(expiryDate, timeInterval) && 
             ((!item.used && calculateDaysUntilExpiry(item.expiryDate) < 0) ||
              (item.used && item.dateUsed && isAfter(parseISO(item.dateUsed), expiryDate)));
    } catch { return false; }
  });
  // --- 時間範圍內統計計算結束 ---

  // --- 計算時間範圍內添加的物品 ---
  const timeframedAddedItems = items.filter(item => {
    try {
      return item.dateAdded && isWithinInterval(parseISO(item.dateAdded), timeInterval);
    } catch { return false; }
  });
  // --- 時間範圍內添加計算結束 ---

  // 按類別統計 (基於時間範圍內數據)
  const foodItemsUsed = timeframedEffectivelyUsedItems.filter(item => item.category === 'Food').length;
  const householdItemsUsed = timeframedEffectivelyUsedItems.filter(item => item.category === 'Household').length;
  const foodItemsExpired = timeframedTotalWastedItems.filter(item => item.category === 'Food').length;
  const householdItemsExpired = timeframedTotalWastedItems.filter(item => item.category === 'Household').length;
  
  // 收集浪費數據
  interface WasteData {
    name: string;
    category: 'Food' | 'Household';
    count: number;
  }
  
  const getWasteStats = () => {
    const wasteMap: Record<string, WasteData> = {};
    
    // 使用 timeframedTotalWastedItems 計算浪費統計
    timeframedTotalWastedItems.forEach(item => { 
      if (!wasteMap[item.name]) {
        wasteMap[item.name] = {
          name: item.name,
          category: item.category,
          count: 0
        };
      }
      wasteMap[item.name].count++;
    });
    
    return Object.values(wasteMap).sort((a, b) => b.count - a.count);
  };
  
  const wasteStats = getWasteStats();
  
  // 統計卡數據
  const statsCards = [
    { 
      title: t('itemsTracked'), 
      value: timeframedAddedItems.length, 
      icon: <Layers className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10'
    },
    { 
      title: t('efficiency'), 
      value: `${Math.round((timeframedEffectivelyUsedItems.length / (timeframedEffectivelyUsedItems.length + timeframedTotalWastedItems.length || 1)) * 100)}%`, 
      icon: <PercentIcon className="h-5 w-5 text-emerald-600" />,
      color: 'bg-emerald-600/10'
    },
    { 
      title: t('itemsUsed'), 
      value: timeframedEffectivelyUsedItems.length, 
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      color: 'bg-emerald-600/10' 
    },
    { 
      title: t('wasted'), 
      value: timeframedTotalWastedItems.length, 
      icon: <AlertCircle className="h-5 w-5 text-whatsleft-red" />,
      color: 'bg-whatsleft-red/10' 
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-2 py-6 pb-16">
      {/* 時間範圍選擇器 - 移至頂部 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDownUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t('timeframe')}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px]">
                <p className="text-xs">{t('timeframeDescription')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('thisMonth')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="thisMonth">{t('thisMonth')}</SelectItem>
              <SelectItem value="lastMonth">{t('lastMonth')}</SelectItem>
              <SelectItem value="last3Months">{t('last3Months')}</SelectItem>
              <SelectItem value="last6Months">{t('last6Months')}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statsCards.map((card, index) => (
          <Card key={index} className={`overflow-hidden border-none shadow-sm ${card.color}`}>
            <CardHeader className="py-3 px-4 flex flex-row items-center space-y-0 gap-2 pb-2">
              {card.icon}
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="space-y-6">
        {/* 最常浪費物品 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-red/10 pb-2">
            <CardTitle className="text-whatsleft-red text-base">
              {t('mostWastedItems')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {timeframedTotalWastedItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                {t('noItems')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead className="w-[100px] text-center">{t('category')}</TableHead>
                      <TableHead className="w-[80px] text-center">{t('wasted')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllItems ? wasteStats : wasteStats.slice(0, 5)).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">
                          {item.category === 'Food' ? (
                            <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600 flex items-center gap-1 justify-center">
                              <Apple className="h-3 w-3" />
                              {t('food')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary flex items-center gap-1 justify-center">
                              <ShoppingBag className="h-3 w-3" />
                              {t('household')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-whatsleft-red/10 text-whatsleft-red border-whatsleft-red">
                            {item.count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {wasteStats.length > 5 && (
                  <div className="flex justify-center py-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="text-xs text-muted-foreground flex items-center gap-1"
                      onClick={() => setShowAllItems(!showAllItems)}
                    >
                      {showAllItems ? (
                        <>
                          {t('showLess')} <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          {t('showMore')} ({wasteStats.length - 5}) <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
