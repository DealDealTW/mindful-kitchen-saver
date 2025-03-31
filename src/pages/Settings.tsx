import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Paintbrush, 
  Info, 
  Moon, 
  Globe, 
  Sliders, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Clock,
  User,
  LogIn,
  LogOut,
  UserPlus,
  Mail,
  Cloud,
  FileDown,
  FileUp,
  ExternalLink,
  Users,
  ArrowRight,
  Bell,
  Lock,
  Save,
  FileInput
} from 'lucide-react';
import { useApp, ItemCategory } from '@/contexts/AppContext';
import { useTranslation, SupportedLanguage } from '@/utils/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { 
  saveDataToFile, 
  loadDataFromFile, 
  initGoogleDriveApi, 
  saveToGoogleDrive, 
  loadFromGoogleDrive,
  initOneDriveApi,
  saveToOneDrive,
  loadFromOneDrive,
  initDropboxApi,
  saveToDropbox,
  loadFromDropbox
} from '../utils/CloudStorage';

import { 
  createFamilyGroup,
  joinFamilyGroup,
  leaveFamilyGroup,
  FamilyGroup
} from '../utils/FirebaseConfig';

const Settings: React.FC = () => {
  const { 
    darkMode, 
    setDarkMode, 
    language, 
    setLanguage, 
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
    loadDataFromGroup
  } = useApp();
  const t = useTranslation(language);
  const [importValue, setImportValue] = useState<string>("");
  const [exportValue, setExportValue] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  
  // 用戶資料狀態
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); 
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [name, setName] = useState<string>("");
  
  // 雲端儲存狀態
  const [loadingApi, setLoadingApi] = useState<string | null>(null);
  const [cloudProvider, setCloudProvider] = useState<string>("");
  
  // 家庭群組狀態
  const [groupName, setGroupName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
  const [joiningGroup, setJoiningGroup] = useState<boolean>(false);
  const [showNewGroupSuccess, setShowNewGroupSuccess] = useState<boolean>(false);
  const [newGroupInviteCode, setNewGroupInviteCode] = useState<string>("");
  
  // 使用Firebase身份驗證登入狀態替代模擬狀態
  useEffect(() => {
    if (currentUser) {
      setIsLoggedIn(true);
      setName(currentUser.displayName || "用戶");
      setEmail(currentUser.email || "");
    } else {
      setIsLoggedIn(false);
      setName("");
      setEmail("");
    }
  }, [currentUser]);
  
  // 處理導出數據
  const handleExport = () => {
    const data = exportData();
    setExportValue(data);
  };
  
  // 處理導入數據
  const handleImport = () => {
    if (importValue) {
      const success = importData(importValue);
      if (success) {
        toast({
          title: t('importSuccess'),
          duration: 3000,
        });
        setImportValue("");
      } else {
        toast({
          title: t('importError'),
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };
  
  // 複製到剪貼板
  const copyToClipboard = () => {
    if (exportValue) {
      navigator.clipboard.writeText(exportValue);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  
  // 重置所有數據
  const resetData = () => {
    localStorage.clear();
    toast({
      title: t('resetSuccess'),
      duration: 3000,
    });
    setTimeout(() => window.location.reload(), 1500);
  };
  
  // 創建家庭群組
  const handleCreateFamilyGroup = async () => {
    if (!currentUser) return;
    
    if (!groupName) {
      toast({
        title: "請輸入群組名稱",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setCreatingGroup(true);
    
    try {
      const result = await createFamilyGroup(groupName, currentUser.uid);
      
      if (result.success) {
        setGroupName("");
        setShowNewGroupSuccess(true);
        setNewGroupInviteCode(result.inviteCode || "");
        
        toast({
          title: "家庭群組創建成功",
          duration: 3000,
        });
      } else {
        toast({
          title: "創建家庭群組失敗",
          description: result.error,
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("創建家庭群組時出錯:", error);
      toast({
        title: "創建家庭群組失敗",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setCreatingGroup(false);
    }
  };
  
  // 加入家庭群組
  const handleJoinFamilyGroup = async () => {
    if (!currentUser) return;
    
    if (!inviteCode) {
      toast({
        title: "請輸入邀請碼",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setJoiningGroup(true);
    
    try {
      const result = await joinFamilyGroup(inviteCode, currentUser.uid);
      
      if (result.success) {
        setInviteCode("");
        toast({
          title: "成功加入家庭群組",
          duration: 3000,
        });
      } else {
        toast({
          title: "加入家庭群組失敗",
          description: result.error,
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("加入家庭群組時出錯:", error);
      toast({
        title: "加入家庭群組失敗",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setJoiningGroup(false);
    }
  };
  
  // 退出家庭群組
  const handleLeaveFamilyGroup = async (groupId: string) => {
    if (!currentUser) return;
    
    try {
      const result = await leaveFamilyGroup(groupId, currentUser.uid);
      
      if (result.success) {
        toast({
          title: "已退出家庭群組",
          duration: 3000,
        });
        
        // 如果正在使用的是剛退出的群組，清除活動群組
        if (activeFamilyGroup && activeFamilyGroup.id === groupId) {
          setActiveFamilyGroup(null);
        }
      } else {
        toast({
          title: "退出家庭群組失敗",
          description: result.error,
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("退出家庭群組時出錯:", error);
      toast({
        title: "退出家庭群組失敗",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // 切換活動群組
  const handleSelectFamilyGroup = async (group: FamilyGroup | null) => {
    setActiveFamilyGroup(group);
    
    if (group) {
      // 從家庭群組載入數據
      const success = await loadDataFromGroup(group.id);
      
      if (success) {
        toast({
          title: `已切換到 ${group.name}`,
          duration: 3000,
        });
      } else {
        toast({
          title: "載入家庭群組數據失敗",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      toast({
        title: "已切換到個人模式",
        duration: 3000,
      });
    }
  };
  
  // 同步數據到當前群組
  const handleSyncWithCurrentGroup = async () => {
    if (!activeFamilyGroup) return;
    
    try {
      const success = await syncDataWithGroup(activeFamilyGroup.id);
      
      if (success) {
        toast({
          title: "數據已同步到家庭群組",
          duration: 3000,
        });
      } else {
        toast({
          title: "同步數據到家庭群組失敗",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("同步數據時出錯:", error);
      toast({
        title: "同步數據到家庭群組失敗",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // 處理雲端儲存
  const handleCloudStorage = async (provider: string) => {
    if (!provider) {
      setCloudProvider("");
      return;
    }
    
    setLoadingApi(provider);
    
    try {
      let apiInitialized = false;
      
      // 初始化API
      switch (provider) {
        case 'google':
          apiInitialized = await initGoogleDriveApi();
          break;
        case 'onedrive':
          apiInitialized = await initOneDriveApi();
          break;
        case 'dropbox':
          apiInitialized = await initDropboxApi();
          break;
        case 'apple':
          // 假設將來會實現 iCloud 整合
          apiInitialized = true;
          toast({
            title: "iCloud integration coming soon",
            description: "This feature is not yet implemented",
            duration: 3000,
          });
          break;
      }
      
      if (apiInitialized) {
        setCloudProvider(provider);
      } else {
        toast({
          title: `Failed to initialize ${provider}`,
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error(`Error initializing ${provider}:`, error);
    } finally {
      setLoadingApi(null);
    }
  };
  
  // 保存到雲端
  const handleSaveToCloud = async () => {
    if (!cloudProvider) {
      toast({
        title: t('chooseStorage'),
        duration: 3000,
      });
      return;
    }
    
    const data = exportData();
    let success = false;
    
    switch (cloudProvider) {
      case 'google':
        success = await saveToGoogleDrive(data, 'household-harbor-backup.json');
        break;
      case 'onedrive':
        success = await saveToOneDrive(data, 'household-harbor-backup.json');
        break;
      case 'dropbox':
        success = await saveToDropbox(data, 'household-harbor-backup.json');
        break;
      case 'apple':
        toast({
          title: "iCloud integration coming soon",
          description: "This feature is not yet implemented",
          duration: 3000,
        });
        return;
    }
    
    if (success) {
      toast({
        title: t('exportSuccess'),
        duration: 3000,
      });
    }
  };
  
  // 從雲端加載
  const handleLoadFromCloud = async () => {
    if (!cloudProvider) {
      toast({
        title: t('chooseStorage'),
        duration: 3000,
      });
      return;
    }
    
    let data = null;
    
    switch (cloudProvider) {
      case 'google':
        data = await loadFromGoogleDrive();
        break;
      case 'onedrive':
        data = await loadFromOneDrive();
        break;
      case 'dropbox':
        data = await loadFromDropbox();
        break;
      case 'apple':
        toast({
          title: "iCloud integration coming soon",
          description: "This feature is not yet implemented",
          duration: 3000,
        });
        return;
    }
    
    if (data) {
      const success = importData(data);
      if (success) {
        toast({
          title: t('importSuccess'),
          duration: 3000,
        });
      } else {
        toast({
          title: t('importError'),
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-16">
      <div className="space-y-6">
        {/* 外觀設定卡片 - 最常用的設置放在最上面 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-orange/10 pb-3">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-whatsleft-orange" />
              <div>
                <CardTitle className="text-whatsleft-orange">{t('appearance')}</CardTitle>
                <CardDescription className="text-whatsleft-orange/70">
                  {t('appearanceDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="dark-mode" className="font-medium cursor-pointer">{t('darkMode')}</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-whatsleft-orange"
              />
            </div>
            
            <div className="bg-muted/40 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="language-select" className="font-medium">{t('language')}</Label>
              </div>
              <Select 
                value={language} 
                onValueChange={(value) => setLanguage(value as SupportedLanguage)}
              >
                <SelectTrigger id="language-select">
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* 默認設置卡片 - 放在第二位，因為使用者經常設定默認值 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-green/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-whatsleft-green" />
              <div>
                <CardTitle className="text-whatsleft-green">{t('defaultSettings')}</CardTitle>
                <CardDescription className="text-whatsleft-green/70">
                  {t('defaultSettingsDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="bg-muted/40 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="default-expiry" className="font-medium">{t('defaultExpiryDays')}</Label>
              </div>
              <div className="flex items-center">
                <Input 
                  id="default-expiry"
                  type="number" 
                  min="1" 
                  max="365" 
                  value={settings.defaultExpiryDays.toString()} 
                  onChange={(e) => updateSettings({ defaultExpiryDays: parseInt(e.target.value) || 7 })}
                  className="w-full"
                />
                <span className="ml-2 text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
            
            <div className="bg-muted/40 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="default-notify" className="font-medium">{t('defaultNotifyDays')}</Label>
              </div>
              <div className="flex items-center">
                <Input 
                  id="default-notify"
                  type="number" 
                  min="0" 
                  max="30" 
                  value={settings.defaultNotifyDays.toString()} 
                  onChange={(e) => updateSettings({ defaultNotifyDays: parseInt(e.target.value) || 2 })}
                  className="w-full"
                />
                <span className="ml-2 text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 帳戶卡片 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-primary">{t('account')}</CardTitle>
                <CardDescription className="text-primary/70">
                  {t('accountDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {isLoggedIn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setIsLoggedIn(false);
                      toast({
                        title: t('logoutSuccess'),
                        duration: 3000,
                      });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Tabs defaultValue="login">
                  <TabsList className="w-full">
                    <TabsTrigger value="login" className="flex-1">{t('login')}</TabsTrigger>
                    <TabsTrigger value="signup" className="flex-1">{t('signup')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input id="email" type="email" placeholder="your.email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <Input id="password" type="password" />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setIsLoggedIn(true);
                        toast({
                          title: t('loginSuccess'),
                          duration: 3000,
                        });
                      }}
                    >
                      {t('login')}
                    </Button>
                    <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <Info className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {t('loginFeaturePrompt')}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t('yourName')}</Label>
                      <Input id="signup-name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('email')}</Label>
                      <Input id="signup-email" type="email" placeholder="your.email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('password')}</Label>
                      <Input id="signup-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setIsLoggedIn(true);
                        toast({
                          title: t('signupSuccess'),
                          duration: 3000,
                        });
                      }}
                    >
                      {t('signup')}
                    </Button>
                    <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <Info className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {t('loginFeaturePrompt')}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 雲端儲存和家庭共享（僅對已登入用戶顯示） */}
        {isLoggedIn && (
          <>
            {/* 家庭共享卡片 */}
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-whatsleft-blue/10 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-whatsleft-blue" />
                  <div>
                    <CardTitle className="text-whatsleft-blue">{t('familySharing')}</CardTitle>
                    <CardDescription className="text-whatsleft-blue/70">
                      {t('familySharingDescription')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* 當前活動群組 */}
                {familyGroups.length > 0 && (
                  <div className="bg-muted/40 p-3 rounded-lg space-y-3">
                    <h3 className="text-sm font-medium">當前使用的家庭群組</h3>
                    <div className="flex gap-2 items-center">
                      <Select 
                        value={activeFamilyGroup?.id || ""} 
                        onValueChange={(value) => {
                          const selectedGroup = value === "" 
                            ? null 
                            : familyGroups.find(g => g.id === value) || null;
                          handleSelectFamilyGroup(selectedGroup);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選擇家庭群組" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">個人模式</SelectItem>
                          {familyGroups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {activeFamilyGroup && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-whatsleft-blue/10 hover:text-whatsleft-blue transition-colors"
                          onClick={handleSyncWithCurrentGroup}
                        >
                          <ArrowRight className="h-4 w-4" />
                          同步數據
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 我的家庭群組列表 */}
                {familyGroups.length > 0 && (
                  <div className="bg-muted/40 p-3 rounded-lg space-y-3">
                    <h3 className="text-sm font-medium">我的家庭群組</h3>
                    <div className="space-y-2">
                      {familyGroups.map(group => (
                        <div key={group.id} className="flex justify-between items-center p-2 bg-background/50 rounded-md">
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              成員: {group.members.length} | 
                              {group.ownerId === currentUser?.uid ? ' 你是擁有者' : ' 成員'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      navigator.clipboard.writeText(group.inviteCode);
                                      toast({
                                        title: "邀請碼已複製",
                                        duration: 2000,
                                      });
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>複製邀請碼</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {group.ownerId !== currentUser?.uid && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="text-destructive hover:bg-destructive/10"
                                      onClick={() => handleLeaveFamilyGroup(group.id)}
                                    >
                                      <LogOut className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>退出群組</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 共享鏈接生成 */}
                <div className="bg-muted/40 p-3 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium">{t('createFamilyGroup')}</h3>
                  <p className="text-xs text-muted-foreground">{t('familyGroupDescription')}</p>
                  
                  <div className="space-y-2">
                    <Input 
                      placeholder="群組名稱" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 hover:bg-whatsleft-blue/10 hover:text-whatsleft-blue transition-colors"
                      onClick={handleCreateFamilyGroup}
                      disabled={creatingGroup}
                    >
                      {creatingGroup ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      {t('createFamilyGroup')}
                    </Button>
                  </div>
                  
                  {/* 新群組創建成功訊息 */}
                  {showNewGroupSuccess && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">群組已創建</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs">邀請碼: <span className="font-mono font-medium">{newGroupInviteCode}</span></p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(newGroupInviteCode);
                            toast({
                              title: "邀請碼已複製",
                              duration: 2000,
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 加入共享 */}
                <div className="bg-muted/40 p-3 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium">{t('joinFamilyGroup')}</h3>
                  <div className="flex gap-2">
                    <Input 
                      className="flex-1 bg-background/50" 
                      placeholder={t('enterInviteCode')}
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      className="flex items-center hover:bg-whatsleft-blue/10 hover:text-whatsleft-blue transition-colors"
                      onClick={handleJoinFamilyGroup}
                      disabled={joiningGroup}
                    >
                      {joiningGroup ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 雲端儲存卡片 */}
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-whatsleft-yellow/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-whatsleft-yellow" />
                  <div>
                    <CardTitle className="text-whatsleft-yellow">{t('cloudStorage')}</CardTitle>
                    <CardDescription className="text-whatsleft-yellow/70">
                      {t('cloudStorageDescription')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* 雲端儲存選項 */}
                <div className="bg-muted/40 p-3 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium">{t('chooseStorage')}</h3>
                  <Select 
                    value={cloudProvider} 
                    onValueChange={(value) => handleCloudStorage(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('chooseStorage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Drive</SelectItem>
                      <SelectItem value="onedrive">OneDrive</SelectItem>
                      <SelectItem value="dropbox">Dropbox</SelectItem>
                      <SelectItem value="apple">iCloud</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {loadingApi && (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin h-5 w-5 border-2 border-whatsleft-yellow border-t-transparent rounded-full" />
                    </div>
                  )}
                  
                  {cloudProvider && !loadingApi && (
                    <div className="flex justify-between gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-sm flex items-center justify-center gap-1 hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow transition-colors"
                        onClick={handleSaveToCloud}
                      >
                        <FileDown className="h-4 w-4" />
                        {t('backup')}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-sm flex items-center justify-center gap-1 hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow transition-colors"
                        onClick={handleLoadFromCloud}
                      >
                        <FileUp className="h-4 w-4" />
                        {t('restore')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* About卡片 - 最不常用的功能放在最底部 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-green/10 pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-whatsleft-green" />
              <CardTitle className="text-whatsleft-green">{t('about')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="bg-muted/40 p-3 rounded-lg">
              <p className="font-medium">WhatsLeft v1.0.0</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('aboutDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
