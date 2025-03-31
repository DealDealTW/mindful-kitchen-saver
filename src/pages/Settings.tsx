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
  Mail
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

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-16">
      <div className="space-y-6">
        {/* 用戶帳戶卡片 */}
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-purple/10 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-whatsleft-purple" />
              <div>
                <CardTitle className="text-whatsleft-purple">{t('account')}</CardTitle>
                <CardDescription className="text-whatsleft-purple/70">
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
                      className="flex items-center gap-1"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium">{t('syncData')}</h3>
                  <div className="flex justify-between gap-2">
                    <Button variant="outline" className="flex-1 text-sm">
                      {t('syncToCloud')}
                    </Button>
                    <Button variant="outline" className="flex-1 text-sm">
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
                    
                    <Button className="w-full mt-2 rounded-lg" onClick={handleLogin}>
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
      
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-primary">{t('appearance')}</CardTitle>
                <CardDescription className="text-primary/70">
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
                className="data-[state=checked]:bg-primary"
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
        
        {/* 默認設置卡片 */}
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
        
        {/* 數據管理卡片 */}
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
            <div className="grid grid-cols-2 gap-3">
              {/* 導出數據按鈕 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t('exportData')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('exportData')}</DialogTitle>
                    <DialogDescription>
                      {t('dataManagementDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <textarea 
                        className="min-h-[150px] flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                        value={exportValue} 
                        readOnly
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" size="sm" onClick={copyToClipboard} variant="outline">
                            {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copySuccess ? t('copied') : t('copyToClipboard')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* 導入數據按鈕 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {t('importData')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('importData')}</DialogTitle>
                    <DialogDescription>
                      {t('dataManagementDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <textarea 
                      className="min-h-[150px] flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                      value={importValue} 
                      onChange={(e) => setImportValue(e.target.value)}
                      placeholder="Paste your exported data here..."
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleImport}>{t('importData')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* 重置數據按鈕 */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full flex items-center justify-center gap-2 mt-2"
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
                  <AlertDialogAction onClick={resetData}>{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-orange/10 pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-whatsleft-orange" />
              <CardTitle className="text-whatsleft-orange">{t('about')}</CardTitle>
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
