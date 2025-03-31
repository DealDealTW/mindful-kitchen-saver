import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import { Badge } from "@/components/ui/badge";
import { Layers, Flame, AlertCircle, BarChart3, CheckCircle } from 'lucide-react';

const Stats: React.FC = () => {
  const { items, language } = useApp();
  const t = useTranslation(language);
  
  // 計算已使用和已過期（無使用）物品
  const usedItems = items.filter(item => item.used).length;
  const expiredItems = items.filter(item => 
    !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0
  ).length;
  
  // 按類別統計使用情況
  const foodItemsUsed = items.filter(item => item.used && item.category === 'Food').length;
  const householdItemsUsed = items.filter(item => item.used && item.category === 'Household').length;
  const foodItemsExpired = items.filter(item => 
    !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0 && item.category === 'Food'
  ).length;
  const householdItemsExpired = items.filter(item => 
    !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0 && item.category === 'Household'
  ).length;
  
  // 圓餅圖數據
  const pieData = [
    { name: t('itemsUsed'), value: usedItems, color: '#C1E1C1' },
    { name: t('itemsWasted'), value: expiredItems, color: '#F97316' },
  ];
  
  // 條形圖數據
  const categoryData = [
    { name: t('food'), used: foodItemsUsed, wasted: foodItemsExpired },
    { name: t('household'), used: householdItemsUsed, wasted: householdItemsExpired },
  ];
  
  // 最常浪費的物品
  // 在實際應用中，應該追蹤每個物品的浪費數量
  const mostWastedItems = [
    { name: 'Milk', count: 3 },
    { name: 'Bread', count: 2 },
    { name: 'Lettuce', count: 2 },
    { name: 'Yogurt', count: 1 },
  ];
  
  // 計算即將到期物品
  const expiringSoon = items.filter(item => {
    if (item.used) return false;
    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
    return daysLeft >= 0 && daysLeft <= 5;
  }).length;
  
  // 過期物品數
  const expired = items.filter(item => !item.used && calculateDaysUntilExpiry(item.expiryDate) < 0).length;
  
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
      value: usedItems, 
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      color: 'bg-emerald-600/10' 
    },
    { 
      title: t('expiringSoon'), 
      value: expiringSoon, 
      icon: <Flame className="h-5 w-5 text-whatsleft-yellow" />,
      color: 'bg-whatsleft-yellow/10' 
    },
    { 
      title: t('expired'), 
      value: expired, 
      icon: <AlertCircle className="h-5 w-5 text-whatsleft-red" />,
      color: 'bg-whatsleft-red/10' 
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-16">
      <div className="grid grid-cols-2 gap-4 mb-6">
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
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-primary/5 pb-2">
            <CardTitle className="text-primary text-base">{t('wasteByCategory')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="used" fill="#C1E1C1" name={t('itemsUsed')} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wasted" fill="#F97316" name={t('itemsWasted')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-whatsleft-green/10 pb-2">
              <CardTitle className="text-whatsleft-green text-base">{t('usageStats')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pt-4">
              <div className="h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-whatsleft-orange/10 pb-2">
              <CardTitle className="text-whatsleft-orange text-base">{t('mostWasted')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {mostWastedItems.map((item, index) => (
                  <li key={index} className="flex justify-between items-center py-1 px-2 rounded bg-muted/50">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className="bg-whatsleft-orange/10 text-whatsleft-orange border-whatsleft-orange">
                      x{item.count}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Stats;
