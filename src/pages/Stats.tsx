import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Badge } from "@/components/ui/badge";
import { Layers, Flame, AlertCircle, CheckCircle, BookOpenCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Stats: React.FC = () => {
  const { items, language } = useApp();
  const t = useTranslation(language);
  
  // 計算已使用和已過期（無使用）物品
  const usedItems = items.filter(item => item.used);
  const expiredItems = items.filter(item => 
    !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0
  );
  
  // 按類別統計使用情況
  const foodItemsUsed = items.filter(item => item.used && item.category === 'Food').length;
  const householdItemsUsed = items.filter(item => item.used && item.category === 'Household').length;
  const foodItemsExpired = items.filter(item => 
    !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0 && item.category === 'Food'
  ).length;
  const householdItemsExpired = items.filter(item => 
    !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0 && item.category === 'Household'
  ).length;
  
  // 計算即將到期物品
  const expiringSoon = items.filter(item => {
    if (item.used) return false;
    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
    return daysLeft >= 0 && daysLeft <= 5;
  });
  
  // 收集實際使用情況數據
  interface UsageData {
    name: string;
    category: 'Food' | 'Household';
    used: number;
    wasted: number;
  }

  const itemUsageData: Record<string, UsageData> = {};
  
  usedItems.forEach(item => {
    if (!itemUsageData[item.name]) {
      itemUsageData[item.name] = {
        name: item.name,
        category: item.category,
        used: 0,
        wasted: 0
      };
    }
    itemUsageData[item.name].used++;
  });
  
  expiredItems.forEach(item => {
    if (!itemUsageData[item.name]) {
      itemUsageData[item.name] = {
        name: item.name,
        category: item.category,
        used: 0,
        wasted: 0
      };
    }
    itemUsageData[item.name].wasted++;
  });
  
  // 轉換為陣列並排序
  const usageStats = Object.values(itemUsageData)
    .sort((a, b) => (b.wasted - a.wasted) || (b.used - a.used));
  
  // 統計卡數據
  const statsCards = [
    { 
      title: t('itemsTracked'), 
      value: items.length, 
      icon: <Layers className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10'
    },
    { 
      title: t('itemsUsed'), 
      value: usedItems.length, 
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      color: 'bg-emerald-600/10' 
    },
    { 
      title: t('expiringSoon'), 
      value: expiringSoon.length, 
      icon: <Flame className="h-5 w-5 text-whatsleft-yellow" />,
      color: 'bg-whatsleft-yellow/10' 
    },
    { 
      title: t('expired'), 
      value: expiredItems.length, 
      icon: <AlertCircle className="h-5 w-5 text-whatsleft-red" />,
      color: 'bg-whatsleft-red/10' 
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-2 py-6 pb-16">
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
        {/* 使用與浪費統計 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-primary/5 pb-2">
            <CardTitle className="text-primary text-base">{t('usageStats')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead className="w-[100px] text-center">{t('used')}</TableHead>
                    <TableHead className="w-[100px] text-center">{t('wasted')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                        {t('noItems')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageStats.slice(0, 6).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {item.category === 'Food' ? (
                            <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600">
                              {t('food')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                              {t('household')}
                            </Badge>
                          )}
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.used > 0 && (
                            <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600">
                              {item.used}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.wasted > 0 && (
                            <Badge variant="outline" className="bg-whatsleft-red/10 text-whatsleft-red border-whatsleft-red">
                              {item.wasted}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* 即將到期物品列表 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-yellow/10 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-whatsleft-yellow text-base">{t('expiringSoon')}</CardTitle>
            <Badge variant="outline" className="bg-whatsleft-yellow/10 text-whatsleft-yellow border-whatsleft-yellow">
              {expiringSoon.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-3">
            {expiringSoon.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {t('noExpiringItems')}
              </div>
            ) : (
              <ul className="space-y-2">
                {expiringSoon.slice(0, 5).map((item, index) => {
                  const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                  return (
                    <li key={index} className="flex items-center justify-between py-1 px-2 rounded bg-muted/50">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(item.expiryDate), 'MMM d')}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-whatsleft-yellow/10 text-whatsleft-yellow border-whatsleft-yellow">
                        {daysLeft <= 0 ? t('today') : 
                         daysLeft === 1 ? t('tomorrow') : 
                         `${daysLeft} ${t('days')}`}
                      </Badge>
                    </li>
                  );
                })}
                {expiringSoon.length > 5 && (
                  <li className="text-center text-xs text-muted-foreground pt-2">
                    + {expiringSoon.length - 5} {t('more')}
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* 使用率統計 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-emerald-600/10 pb-2">
            <CardTitle className="text-emerald-600 text-base flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4" />
              {t('usageOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('food')}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600">{t('used')}: {foodItemsUsed}</span>
                  <span className="text-whatsleft-red">{t('wasted')}: {foodItemsExpired}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('household')}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600">{t('used')}: {householdItemsUsed}</span>
                  <span className="text-whatsleft-red">{t('wasted')}: {householdItemsExpired}</span>
                </div>
              </div>
              {(usedItems.length > 0 || expiredItems.length > 0) && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('total')}</span>
                    <div className="flex gap-4 text-sm font-medium">
                      <span className="text-emerald-600">{usedItems.length}</span>
                      <span className="text-whatsleft-red">{expiredItems.length}</span>
                    </div>
                  </div>
                  {(usedItems.length + expiredItems.length) > 0 && (
                    <div className="flex justify-end items-center mt-2">
                      <Badge className="bg-emerald-600 text-white">
                        {Math.round((usedItems.length / (usedItems.length + expiredItems.length)) * 100)}% {t('efficiency')}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
