import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Paintbrush, Bell, Info, Moon, Globe, BellRing } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation, SupportedLanguage } from '@/utils/translations';

const Settings: React.FC = () => {
  const { darkMode, setDarkMode, language, setLanguage } = useApp();
  const t = useTranslation(language);
  
  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-16">
      <div className="space-y-6">
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
        
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-whatsleft-orange/10 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-whatsleft-orange" />
              <div>
                <CardTitle className="text-whatsleft-orange">{t('notifications')}</CardTitle>
                <CardDescription className="text-whatsleft-orange/70">
                  {t('notificationsDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="notifications-enabled" className="font-medium cursor-pointer">{t('notificationsEnabled')}</Label>
              </div>
              <Switch
                id="notifications-enabled"
                defaultChecked={true}
                className="data-[state=checked]:bg-whatsleft-orange"
              />
            </div>
          </CardContent>
        </Card>
        
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
