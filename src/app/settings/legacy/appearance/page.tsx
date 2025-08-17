'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Type,
  Layout,
  Eye,
  Contrast,
  Globe,
  Check
} from 'lucide-react';

// Theme Toggle Component for the settings page
function ThemeToggleSection({ theme, setTheme, mounted, resolvedTheme }: {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  mounted: boolean;
  resolvedTheme: string | undefined;
}) {
  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Clean and bright interface'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes in low light'
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Matches your device settings'
    }
  ];

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Selection
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Selection
        </CardTitle>
        <CardDescription>
          Choose your preferred color scheme. Currently using <Badge variant="secondary">{resolvedTheme}</Badge> theme.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={theme} 
          onValueChange={(value) => {
            setTheme(value);
            toast.success(`Theme changed to ${value === 'system' ? 'system default' : value} mode`);
          }} 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {themeOptions.map((option) => (
            <div key={option.value} className="relative">
              <RadioGroupItem 
                value={option.value} 
                id={option.value}
                className="peer sr-only"
              />
              <Label 
                htmlFor={option.value} 
                className="flex cursor-pointer flex-col items-center gap-3 p-4 border-2 border-muted rounded-lg hover:border-primary/50 transition-colors peer-checked:border-primary peer-checked:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <option.icon className="h-5 w-5" />
                  <span className="font-medium">{option.label}</span>
                  {theme === option.value && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {option.description}
                </p>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {/* Theme Preview */}
        <div className="mt-6 p-4 border rounded-lg bg-background">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme Preview</span>
              <Badge>Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              This is how your interface looks with the current theme.
            </p>
            <div className="flex gap-2">
              <Button size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="outline" size="sm">Outline</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppearanceSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Helper function to get font family CSS
  const getFontFamilyCSS = (fontFamily: string) => {
    const fontMap: Record<string, string> = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'inter': '"Inter", sans-serif',
      'roboto': '"Roboto", sans-serif',
      'open-sans': '"Open Sans", sans-serif',
      'lato': '"Lato", sans-serif'
    };
    return fontMap[fontFamily] ?? fontMap.system;
  };
  
  // Appearance preferences
  const [preferences, setPreferences] = useState({
    fontSize: 16,
    fontFamily: 'system',
    sidebarPosition: 'left',
    compactMode: false,
    animationsEnabled: true,
    highContrast: false,
    reducedMotion: false,
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  useEffect(() => {
    setMounted(true);
    
    // Load saved preferences from localStorage
    try {
      const savedPreferences = localStorage.getItem('appearance-preferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences) as typeof preferences;
        
        // Validate the parsed data has all required properties
        if (parsed && typeof parsed === 'object' && 
            typeof parsed.fontSize === 'number' &&
            typeof parsed.fontFamily === 'string' &&
            typeof parsed.compactMode === 'boolean' &&
            typeof parsed.animationsEnabled === 'boolean' &&
            typeof parsed.highContrast === 'boolean' &&
            typeof parsed.reducedMotion === 'boolean') {
          
          setPreferences(parsed);
          
          // Apply saved preferences to the DOM
          if (parsed.fontSize !== 16) {
            document.documentElement.style.fontSize = `${parsed.fontSize}px`;
          }
          if (parsed.fontFamily !== 'system') {
            const fontCSS = getFontFamilyCSS(parsed.fontFamily);
            if (fontCSS) {
              document.documentElement.style.fontFamily = fontCSS;
            }
          }
          if (parsed.compactMode) {
            document.documentElement.classList.add('compact-mode');
          }
          if (!parsed.animationsEnabled) {
            document.documentElement.classList.add('no-animations');
          }
          if (parsed.highContrast) {
            document.documentElement.classList.add('high-contrast');
          }
          if (parsed.reducedMotion) {
            document.documentElement.classList.add('reduced-motion');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load appearance preferences:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  const updatePreference = async (key: string, value: string | number | boolean) => {
    try {
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Apply changes immediately for better UX
      if (key === 'fontSize') {
        document.documentElement.style.fontSize = `${value}px`;
      } else if (key === 'fontFamily') {
        const fontCSS = getFontFamilyCSS(value as string);
        if (fontCSS) {
          document.documentElement.style.fontFamily = fontCSS;
        }
      } else if (key === 'compactMode') {
        document.documentElement.classList.toggle('compact-mode', value as boolean);
      } else if (key === 'animationsEnabled') {
        document.documentElement.classList.toggle('no-animations', !(value as boolean));
      } else if (key === 'highContrast') {
        document.documentElement.classList.toggle('high-contrast', value as boolean);
      } else if (key === 'reducedMotion') {
        document.documentElement.classList.toggle('reduced-motion', value as boolean);
      }
      
      // Save to localStorage for persistence
      localStorage.setItem('appearance-preferences', JSON.stringify({
        ...preferences,
        [key]: value
      }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.success('Appearance updated');
    } catch {
      toast.error('Failed to update appearance');
    }
  };

  const resetToDefaults = () => {
    const defaultPreferences = {
      fontSize: 16,
      fontFamily: 'system',
      sidebarPosition: 'left',
      compactMode: false,
      animationsEnabled: true,
      highContrast: false,
      reducedMotion: false,
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    };
    
    setPreferences(defaultPreferences);
    setTheme('system');
    
    // Reset DOM to defaults
    document.documentElement.style.fontSize = '16px';
    document.documentElement.style.fontFamily = '';
    document.documentElement.classList.remove('compact-mode', 'no-animations', 'high-contrast', 'reduced-motion');
    
    // Clear localStorage
    localStorage.removeItem('appearance-preferences');
    
    toast.success('Reset to default settings');
  };

  if (status === 'loading' || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appearance Settings</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of your application interface. All theme controls are now located here.
        </p>
      </div>

      {/* Theme Selection - Enhanced */}
      <ThemeToggleSection 
        theme={theme}
        setTheme={setTheme}
        mounted={mounted}
        resolvedTheme={resolvedTheme}
      />

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
          <CardDescription>
            Adjust text size and font preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Font Size: {preferences.fontSize}px</Label>
            <Slider
              value={[preferences.fontSize]}
              onValueChange={(value) => updatePreference('fontSize', value[0] ?? 14)}
              min={12}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small (12px)</span>
              <span>Normal (16px)</span>
              <span>Large (20px)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select value={preferences.fontFamily} onValueChange={(value) => updatePreference('fontFamily', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Default</SelectItem>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="open-sans">Open Sans</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Layout Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout Options
          </CardTitle>
          <CardDescription>
            Customize the layout and spacing of the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sidebar Position</Label>
            <Select value={preferences.sidebarPosition} onValueChange={(value) => updatePreference('sidebarPosition', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left Side</SelectItem>
                <SelectItem value="right">Right Side</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding for a denser layout
              </p>
            </div>
            <Switch
              checked={preferences.compactMode}
              onCheckedChange={(value) => updatePreference('compactMode', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch
              checked={preferences.animationsEnabled}
              onCheckedChange={(value) => updatePreference('animationsEnabled', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Options to improve accessibility and usability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Contrast className="h-4 w-4" />
              <div>
                <Label className="font-medium">High Contrast</Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.highContrast}
              onCheckedChange={(value) => updatePreference('highContrast', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations for motion sensitivity
              </p>
            </div>
            <Switch
              checked={preferences.reducedMotion}
              onCheckedChange={(value) => updatePreference('reducedMotion', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => updatePreference('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={preferences.timeFormat} onValueChange={(value) => updatePreference('timeFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset to Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Reset Settings</CardTitle>
          <CardDescription>
            Restore all appearance settings to their default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
