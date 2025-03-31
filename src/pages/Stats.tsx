
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

const Stats: React.FC = () => {
  const { items, language } = useApp();
  const t = useTranslation(language);
  
  // For this demo, we'll simulate some stats
  // In a real app, you would track actual usage and waste
  
  const usedItems = 25;
  const wastedItems = 8;
  
  const pieData = [
    { name: t('itemsUsed'), value: usedItems, color: '#C1E1C1' },
    { name: t('itemsWasted'), value: wastedItems, color: '#F97316' },
  ];
  
  const categoryData = [
    { name: t('food'), used: 18, wasted: 5 },
    { name: t('household'), used: 7, wasted: 3 },
  ];
  
  const mostWastedItems = [
    { name: 'Milk', count: 3 },
    { name: 'Bread', count: 2 },
    { name: 'Lettuce', count: 2 },
    { name: 'Yogurt', count: 1 },
  ];
  
  // Calculate expiring soon items
  const expiringSoon = items.filter(item => {
    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
    return daysLeft >= 0 && daysLeft <= 5;
  }).length;
  
  const expired = items.filter(item => calculateDaysUntilExpiry(item.expiryDate) < 0).length;
  
  // Stats cards data
  const statsCards = [
    { title: t('itemsTracked'), value: items.length },
    { title: t('expiringSoon'), value: expiringSoon },
    { title: t('expired'), value: expired },
    { title: t('wastePercentage'), value: wastedItems ? `${Math.round((wastedItems / (usedItems + wastedItems)) * 100)}%` : '0%' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('wasteByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="used" fill="#C1E1C1" name={t('itemsUsed')} />
                  <Bar dataKey="wasted" fill="#F97316" name={t('itemsWasted')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('usageStats')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
          
          <Card>
            <CardHeader>
              <CardTitle>{t('mostWasted')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mostWastedItems.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.count}x</span>
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
