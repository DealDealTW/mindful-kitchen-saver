import React, { useState } from 'react';
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
  ExternalLink
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

const Settings: React.FC = () => {
  const { darkMode, setDarkMode, language, setLanguage, settings, updateSettings, exportData, importData } = useApp();
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
  
  // 登入函數 - 這只是模擬，實際應用需要連接後端
  const handleLogin = () => {
    if (email && password) {
      // 這裡應該是實際的登入邏輯
      setIsLoggedIn(true);
      setName("測試用戶");
      toast({
        title: t('loginSuccess'),
        duration: 3000,
      });
    }
  };
  
  // 註冊函數 - 這只是模擬，實際應用需要連接後端
  const handleSignup = () => {
    if (email && password && password === passwordConfirm) {
      // 這裡應該是實際的註冊邏輯
      setIsLoggedIn(true);
      setName("測試用戶");
      toast({
        title: t('signupSuccess'),
        duration: 3000,
      });
    } else if (password !== passwordConfirm) {
      toast({
        title: t('passwordMismatch'),
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // 登出函數
  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    toast({
      title: t('logoutSuccess'),
      duration: 3000,
    });
  };
  
  // 下載備份文件
  const handleDownloadBackup = async () => {
    const data = exportData();
    const success = await saveDataToFile(data, 'household-harbor-backup.json');
    if (success) {
      toast({
        title: t('exportSuccess'),
        duration: 3000,
      });
    } else {
      toast({
        title: t('fileSystemNotSupported'),
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // 上傳備份文件
  const handleUploadBackup = async () => {
    const data = await loadDataFromFile();
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
  
  // 處理雲端儲存
  const handleCloudStorage = async (provider: string) => {
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
        
        {/* 數據管理卡片 - 常用的數據管理功能 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-blue/10 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-whatsleft-blue" />
              <div>
                <CardTitle className="text-whatsleft-blue">{t('dataManagement')}</CardTitle>
                <CardDescription className="text-whatsleft-blue/70">
                  {t('dataManagementDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* 文件系統直接訪問 */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 hover:bg-whatsleft-blue/10 hover:text-whatsleft-blue transition-colors"
              >
                <FileDown className="h-4 w-4" />
                {t('downloadBackup')}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleUploadBackup}
                className="w-full flex items-center justify-center gap-2 hover:bg-whatsleft-blue/10 hover:text-whatsleft-blue transition-colors"
              >
                <FileUp className="h-4 w-4" />
                {t('uploadBackup')}
              </Button>
            </div>
            
            {/* 危險操作放在底部 */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 mt-2 text-whatsleft-red hover:bg-whatsleft-red/10 hover:text-whatsleft-red transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('resetData')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('resetData')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('resetConfirmation')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={resetData} className="bg-whatsleft-red hover:bg-whatsleft-red/90">{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={cloudProvider === 'google' ? "default" : "outline"} 
                  className={`w-full text-xs flex flex-col items-center justify-center gap-1 h-auto py-2 ${cloudProvider === 'google' ? 'bg-whatsleft-yellow text-background hover:bg-whatsleft-yellow/90' : 'hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow'}`}
                  disabled={!!loadingApi}
                  onClick={() => handleCloudStorage('google')}
                >
                  {loadingApi === 'google' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ExternalLink className="h-5 w-5" />
                  )}
                  <span>{t('googleDrive')}</span>
                </Button>
                
                <Button 
                  variant={cloudProvider === 'onedrive' ? "default" : "outline"} 
                  className={`w-full text-xs flex flex-col items-center justify-center gap-1 h-auto py-2 ${cloudProvider === 'onedrive' ? 'bg-whatsleft-yellow text-background hover:bg-whatsleft-yellow/90' : 'hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow'}`}
                  disabled={!!loadingApi}
                  onClick={() => handleCloudStorage('onedrive')}
                >
                  {loadingApi === 'onedrive' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ExternalLink className="h-5 w-5" />
                  )}
                  <span>{t('oneDrive')}</span>
                </Button>
                
                <Button 
                  variant={cloudProvider === 'dropbox' ? "default" : "outline"} 
                  className={`w-full text-xs flex flex-col items-center justify-center gap-1 h-auto py-2 ${cloudProvider === 'dropbox' ? 'bg-whatsleft-yellow text-background hover:bg-whatsleft-yellow/90' : 'hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow'}`}
                  disabled={!!loadingApi}
                  onClick={() => handleCloudStorage('dropbox')}
                >
                  {loadingApi === 'dropbox' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ExternalLink className="h-5 w-5" />
                  )}
                  <span>{t('dropbox')}</span>
                </Button>
              </div>
              
              {cloudProvider && (
                <div className="flex justify-between gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs flex items-center justify-center gap-1 hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow transition-colors"
                    onClick={handleSaveToCloud}
                  >
                    <Download className="h-4 w-4" />
                    {t('saveToCloud')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs flex items-center justify-center gap-1 hover:bg-whatsleft-yellow/10 hover:text-whatsleft-yellow transition-colors"
                    onClick={handleLoadFromCloud}
                  >
                    <Upload className="h-4 w-4" />
                    {t('loadFromCloud')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 用戶帳戶卡片 - 進階功能，放在後面 */}
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
          <CardContent className="pt-4">
            {isLoggedIn ? (
              <div className="space-y-4">
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium">{t('syncData')}</h3>
                  <div className="flex justify-between gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {t('syncToCloud')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {t('syncFromCloud')}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('lastSynced')}: 2023-10-25 14:30</p>
                </div>
              </div>
            ) : (
              <div>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login" className="rounded-lg">{t('login')}</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg">{t('signup')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-login" className="text-sm">{t('email')}</Label>
                      <div className="flex items-center">
                        <Mail className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email-login" 
                          type="email" 
                          className="pl-10 bg-muted/40 border-muted rounded-lg" 
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password-login" className="text-sm">{t('password')}</Label>
                      <Input 
                        id="password-login" 
                        type="password" 
                        className="bg-muted/40 border-muted rounded-lg" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="w-full mt-2 rounded-lg bg-primary hover:bg-primary/90" 
                      onClick={handleLogin}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('login')}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name-signup" className="text-sm">{t('name')}</Label>
                      <Input 
                        id="name-signup" 
                        className="bg-muted/40 border-muted rounded-lg" 
                        placeholder={t('yourName')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-signup" className="text-sm">{t('email')}</Label>
                      <div className="flex items-center">
                        <Mail className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email-signup" 
                          type="email" 
                          className="pl-10 bg-muted/40 border-muted rounded-lg" 
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password-signup" className="text-sm">{t('password')}</Label>
                      <Input 
                        id="password-signup" 
                        type="password" 
                        className="bg-muted/40 border-muted rounded-lg" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm">{t('confirmPassword')}</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        className="bg-muted/40 border-muted rounded-lg" 
                        placeholder="••••••••"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                      />
                    </div>
                    
                    <Button className="w-full mt-2 rounded-lg" onClick={handleSignup}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('signup')}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
        
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
