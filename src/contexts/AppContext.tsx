
import React, { createContext, useContext, useState, useEffect } from 'react';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';

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
}

interface AppContextType {
  items: Item[];
  addItem: (item: Omit<Item, 'id' | 'dateAdded'>) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
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

export const getExpiryDateFromDays = (days: number): string => {
  const date = addDays(new Date(), days);
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

  const addItem = (item: Omit<Item, 'id' | 'dateAdded'>) => {
    const newItem: Item = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      dateAdded: new Date().toISOString(),
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updatedItem: Partial<Item>) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
