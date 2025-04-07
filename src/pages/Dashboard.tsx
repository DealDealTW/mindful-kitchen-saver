import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon, GridIcon, ListIcon, LayoutGrid, Images, Apple, ShoppingBag, LockIcon, Mic, Camera } from 'lucide-react';
import ItemCard from '@/components/ItemCard';
import ItemModal from '@/components/ItemModal';
import ItemForm from '@/components/ItemForm';
import { useApp, Item } from '@/contexts/AppContext';
import { calculateDaysUntilExpiry } from '@/contexts/AppContext';
import { useTranslation } from '@/utils/translations';
import CategoryFilterMenu from '@/components/CategoryFilterMenu';
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

// 視圖模式類型
type ViewMode = 'grid' | 'list' | 'photo';

const Dashboard: React.FC = () => {
  const { items, filter, sort, selectedItem, language, setSelectedItem, currentUser, togglePremiumStatus } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [reAddItem, setReAddItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const t = useTranslation(language);
  const navigate = useNavigate();
  
  const handleEdit = () => {
    if (!selectedItem) return;
    setEditItem(selectedItem);
    setReAddItem(null);
    setFormOpen(true);
  };
  
  const handleAddItem = () => {
    setEditItem(null);
    setReAddItem(null);
    setFormOpen(true);
  };

  const handleTriggerReAdd = (itemToReAdd: Item) => {
    setEditItem(null);
    setReAddItem(itemToReAdd);
    setFormOpen(true);
  };
  
  // 首先過濾掉已使用的物品
  const activeItems = items.filter(item => !item.used);

  const filteredItems = activeItems.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Food' || filter === 'Household') return item.category === filter;
    if (filter === 'Expiring') {
      const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntil >= 0 && daysUntil <= 4; // Items expiring in 4 days or less
    }
    if (filter === 'Expired') {
      const daysUntil = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntil < 0; // Already expired items
    }
    return true;
  });
  
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sort === 'expiry') {
      return calculateDaysUntilExpiry(a.expiryDate) - calculateDaysUntilExpiry(b.expiryDate);
    } else { // 'added'
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
  });
  
  // 檢查用戶是否為訂閱用戶
  const isSubscribed = currentUser?.isPremium || false;

  return (
    <div className="w-full max-w-md mx-auto px-2 py-4 pb-16">
      {/* 分類過濾器放在頂部 */}
      <CategoryFilterMenu />
      
      {/* 將高級會員開關和視圖選擇放在過濾器下方 */}
      <div className="flex justify-between items-center mb-4 mt-2">
        {/* 高級會員開關 */}
        <Button
          variant="outline"
          size="sm"
          className={`text-xs ${isSubscribed ? 'bg-whatsleft-yellow text-black' : 'bg-muted'}`}
          onClick={() => {
            console.log('Dashboard中點擊了高級會員按鈕');
            togglePremiumStatus();
          }}
        >
          {isSubscribed ? t('premiumActive') : t('premiumInactive')}
        </Button>
        
        <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-md">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setViewMode('grid')}
            title={t('gridView')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setViewMode('list')}
            title={t('listView')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'photo' ? 'default' : 'ghost'} 
            size="icon" 
            className="h-8 w-8 relative" 
            onClick={() => isSubscribed ? setViewMode('photo') : setViewMode('grid')}
            title={isSubscribed ? t('photoView') : t('premiumFeature')}
          >
            <Images className="h-4 w-4" />
            {!isSubscribed && <LockIcon className="h-3 w-3 absolute top-0 right-0 text-whatsleft-yellow" />}
          </Button>
        </div>
      </div>
      
      {sortedItems.length === 0 ? (
        <div className="rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center py-10 text-center px-4 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-primary">{t('welcomeMessage')}</h2>
          <div className="text-muted-foreground mb-6 max-w-md whitespace-pre-line">
            {t('welcomeSubtitle')}
          </div>
          <Button onClick={handleAddItem} size="lg" className="gap-2 px-6">
            <PlusIcon className="h-5 w-5" />
            {t('addYourFirst')}
          </Button>
        </div>
      ) : viewMode === 'photo' && isSubscribed ? (
        <div className="grid grid-cols-2 gap-3">
          {sortedItems.filter(item => item.image).length === 0 ? (
            <div className="col-span-2 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center py-8 text-center px-4">
              <h3 className="text-lg font-medium mb-2 text-primary">{t('noImagesTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('noImagesDescription')}</p>
              <Button onClick={handleAddItem} size="sm" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                {t('addItemWithPhoto')}
              </Button>
            </div>
          ) : (
            sortedItems.filter(item => item.image).map(item => (
              <ItemCard key={item.id} item={item} viewMode="photo" />
            ))
          )}
        </div>
      ) : viewMode === 'photo' && !isSubscribed ? (
        <div className="rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center py-12 text-center px-4">
          <LockIcon className="h-10 w-10 text-whatsleft-yellow mb-4" />
          <h3 className="text-xl font-bold mb-2 text-primary">{t('premiumFeatureTitle')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md whitespace-pre-line">
            {t('premiumFeatureDescription')}
          </p>
          <Button size="lg" className="gap-2 px-6" variant="default">
            {t('upgradeToPremium')}
          </Button>
        </div>
      ) : (
        <div className={`${viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-3"}`}>
          {sortedItems.map(item => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
      
      {/* 固定在屏幕右下角的添加按鈕 */}
      <div className="fixed bottom-16 right-4 z-20">
         <Button 
           size="icon" 
           className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all"
           onClick={handleAddItem}
           aria-label={t('addItem')}
         >
           <PlusIcon className="h-6 w-6" />
         </Button>
      </div>
      
      <ItemModal 
        onEdit={handleEdit} 
        onReAdd={handleTriggerReAdd} 
       />
      
      <ItemForm 
        open={formOpen} 
        onOpenChange={setFormOpen}
        editItem={editItem}
        reAddItem={reAddItem}
      />
    </div>
  );
};

export default Dashboard;
