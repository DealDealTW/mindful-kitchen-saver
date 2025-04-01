import React, { createContext, useContext, useState, useEffect } from 'react';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';
import { FamilyGroup, onAuthStateChange, getCurrentUser, getUserFamilyGroups, syncDataWithFamilyGroup, getFamilyGroupData, onFamilyDataChange } from '../utils/FirebaseConfig';

// 擴展 User 類型，添加 isPremium 屬性
export interface User extends Partial<FirebaseUser> {
  isPremium?: boolean;
  id?: string;
  username?: string;
  email?: string;
}

export type ItemCategory = 'Food' | 'Household';
export type FilterType = 'All' | 'Food' | 'Household' | 'Expiring' | 'Expired';

export interface Item {
  id: string;
  name: string;
  quantity: string;
  category: ItemCategory;
  expiryDate: string;
  daysUntilExpiry: number;
  dateAdded: string;
  notifyDaysBefore: number;
  used?: boolean;
  dateUsed?: string;
  image?: string | null;
  timesRepurchased?: number;
  lastRepurchased?: string;
}

// 應用設置接口
export interface AppSettings {
  defaultExpiryDays: number | string;
  defaultNotifyDays: number | string;
}

interface AppContextType {
  items: Item[];
  addItem: (item: Omit<Item, 'id' | 'dateAdded'>) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  markItemAsUsed: (id: string) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  sort: 'name' | 'expiry' | 'added';
  setSort: (sort: 'name' | 'expiry' | 'added') => void;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  language: 'en' | 'zh-TW' | 'zh-CN';
  setLanguage: (language: 'en' | 'zh-TW' | 'zh-CN') => void;
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  // 家庭共享相關
  currentUser: User | null;
  familyGroups: FamilyGroup[];
  activeFamilyGroup: FamilyGroup | null;
  setActiveFamilyGroup: (group: FamilyGroup | null) => void;
  syncDataWithGroup: (groupId: string) => Promise<boolean>;
  loadDataFromGroup: (groupId: string) => Promise<boolean>;
  setCurrentUser: (user: User | null) => void;
  togglePremiumStatus: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseISO(expiryDate);
  return differenceInDays(expiry, today);
};

export const getExpiryDateFromDays = (days: number | string): string => {
  const daysNum = typeof days === 'string' ? parseInt(days) || 0 : days;
  const date = addDays(new Date(), daysNum);
  return format(date, 'yyyy-MM-dd');
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(() => {
    const savedItems = localStorage.getItem('whatsleftItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<'name' | 'expiry' | 'added'>('expiry');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedDarkMode = localStorage.getItem('whatsleftDarkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  const [language, setLanguage] = useState<'en' | 'zh-TW' | 'zh-CN'>(() => {
    const savedLanguage = localStorage.getItem('whatsleftLanguage');
    return savedLanguage ? JSON.parse(savedLanguage) : 'en';
  });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // 應用設置
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('whatsleftSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      defaultExpiryDays: 7,
      defaultNotifyDays: 2
    };
  });

  // 家庭共享相關狀態
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : {
      id: 'temp-user-id',
      username: 'User',
      email: 'user@example.com',
      isPremium: false
    };
  });
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [activeFamilyGroup, setActiveFamilyGroup] = useState<FamilyGroup | null>(null);

  // 切換高級會員狀態的函數
  const togglePremiumStatus = () => {
    console.log('切換高級會員狀態函數被調用');
    
    const updatedUser = currentUser ? {
      ...currentUser,
      isPremium: currentUser.isPremium ? false : true
    } : {
      id: 'temp-user-id',
      username: 'User',
      email: 'user@example.com',
      isPremium: true
    };
    
    console.log('更新後的用戶資料:', updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    localStorage.setItem('whatsleftItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('whatsleftDarkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('whatsleftLanguage', JSON.stringify(language));
  }, [language]);
  
  useEffect(() => {
    localStorage.setItem('whatsleftSettings', JSON.stringify(settings));
  }, [settings]);

  // 將用戶狀態保存到localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // 監聽用戶登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      
      // 如果用戶登出，清除家庭群組資料
      if (!user) {
        setFamilyGroups([]);
        setActiveFamilyGroup(null);
      } else {
        // 如果用戶登入，獲取他們的家庭群組
        loadUserFamilyGroups(user.uid);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // 當活動家庭群組變化時，監聽其數據變化
  useEffect(() => {
    if (!activeFamilyGroup) return;
    
    const unsubscribe = onFamilyDataChange(activeFamilyGroup.id, (data) => {
      if (data) {
        // 來自家庭群組的數據更新，更新本地狀態
        if (data.items) setItems(data.items);
      }
    });
    
    return () => unsubscribe();
  }, [activeFamilyGroup]);

  // 加載用戶的家庭群組
  const loadUserFamilyGroups = async (userId: string) => {
    const result = await getUserFamilyGroups(userId);
    if (result.success && result.groups) {
      setFamilyGroups(result.groups);
    }
  };

  // 同步數據到家庭群組
  const syncDataWithGroup = async (groupId: string): Promise<boolean> => {
    const data = {
      items,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.uid
    };
    
    const result = await syncDataWithFamilyGroup(groupId, data);
    return result.success;
  };

  // 從家庭群組加載數據
  const loadDataFromGroup = async (groupId: string): Promise<boolean> => {
    const result = await getFamilyGroupData(groupId);
    if (result.success && result.data) {
      if (result.data.items) {
        setItems(result.data.items);
      }
      return true;
    }
    return false;
  };

  const addItem = (item: Omit<Item, 'id' | 'dateAdded'>) => {
    const newItem: Item = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      dateAdded: new Date().toISOString(),
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // 如果有活動家庭群組，同步新數據
    if (activeFamilyGroup) {
      syncDataWithGroup(activeFamilyGroup.id);
    }
  };

  const updateItem = (id: string, updatedItem: Partial<Item>) => {
    const updatedItems = items.map((item) => 
      (item.id === id ? { ...item, ...updatedItem } : item)
    );
    
    setItems(updatedItems);
    
    // 如果有活動家庭群組，同步更新後的數據
    if (activeFamilyGroup) {
      syncDataWithGroup(activeFamilyGroup.id);
    }
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
    
    // 如果有活動家庭群組，同步更新後的數據
    if (activeFamilyGroup) {
      syncDataWithGroup(activeFamilyGroup.id);
    }
  };

  const markItemAsUsed = (id: string) => {
    const updatedItems = items.map((item) => 
      item.id === id 
        ? { ...item, used: true, dateUsed: new Date().toISOString() } 
        : item
    );
    
    setItems(updatedItems);
    
    // 如果有活動家庭群組，同步更新後的數據
    if (activeFamilyGroup) {
      syncDataWithGroup(activeFamilyGroup.id);
    }
  };
  
  // 更新設置
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    // 確保在保存到本地儲存之前轉換為正確的類型
    const updatedSettings = {
      ...settings,
      ...newSettings,
    };
    
    // 注意：我們不在此處強制轉換為數字，保留原始類型（可能是空字串）
    setSettings(updatedSettings);
  };
  
  // 導出數據
  const exportData = (): string => {
    const exportData = {
      items,
      settings,
      darkMode,
      language
    };
    return JSON.stringify(exportData);
  };
  
  // 導入數據
  const importData = (jsonData: string): boolean => {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (importedData.items) {
        setItems(importedData.items);
      }
      
      if (importedData.settings) {
        setSettings(importedData.settings);
      }
      
      if (importedData.darkMode !== undefined) {
        setDarkMode(importedData.darkMode);
      }
      
      if (importedData.language) {
        setLanguage(importedData.language);
      }
      
      // 如果有活動家庭群組，同步導入的數據
      if (activeFamilyGroup) {
        syncDataWithGroup(activeFamilyGroup.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        markItemAsUsed,
        filter,
        setFilter,
        sort,
        setSort,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        selectedItem,
        setSelectedItem,
        settings,
        updateSettings,
        exportData,
        importData,
        // 家庭共享相關
        currentUser,
        familyGroups,
        activeFamilyGroup,
        setActiveFamilyGroup,
        syncDataWithGroup,
        loadDataFromGroup,
        setCurrentUser,
        togglePremiumStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
