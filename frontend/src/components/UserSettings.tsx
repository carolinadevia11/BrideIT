import React, { useEffect, useState } from 'react';
import { User, Bell, Shield, Palette, Globe, Heart, Save, Edit, Camera, MessageSquare, BookOpen, Languages, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AnimatedBridgette from './AnimatedBridgette';
import { FamilyProfile } from '@/types/family';
import { authAPI } from '@/lib/api';

type UserProfileInfo = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  bio?: string;
};

interface UserSettingsProps {
  onBack: () => void;
  initialProfile?: UserProfileInfo | null;
  familyProfile?: FamilyProfile | null;
}

const UserSettings: React.FC<UserSettingsProps> = ({ onBack, initialProfile, familyProfile }) => {
  const [bridgetteExpression, setBridgetteExpression] = useState<'thinking' | 'encouraging' | 'celebrating' | 'balanced' | 'mediating'>('encouraging');
  const [bridgetteMessage, setBridgetteMessage] = useState("Let's make sure your Bridge experience is perfect for you! I'm here to help with any changes you'd like to make! ⚙️");
  const [hasChanges, setHasChanges] = useState(false);

  const [settings, setSettings] = useState({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      timezone: 'EST',
      bio: ''
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      calendar: true,
      messages: true,
      expenses: true,
      documents: false
    },
    privacy: {
      profileVisibility: 'co-parent-only',
      activitySharing: true,
      dataExport: false,
      accountDeletion: false
    },
    bridgette: {
      personality: 'encouraging',
      helpLevel: 'detailed',
      proactiveHelp: true,
      dailyTips: true
    },
    appearance: {
      theme: 'light',
      colorScheme: 'blue',
      compactMode: false
    },
    preferences: {
      notificationOptIn: {
        dailyTips: true,
        weeklyDigest: true,
        expertArticles: false,
        communityUpdates: false,
        productUpdates: true,
        emergencyAlerts: true
      },
      articleTypes: {
        communication: true,
        legal: false,
        emotional: true,
        practical: true,
        children: true,
        financial: false
      },
      messageTone: 'friendly',
      language: 'english'
    }
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyProfileToSettings = (profile: UserProfileInfo) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        firstName: profile.firstName ?? prev.profile.firstName,
        lastName: profile.lastName ?? prev.profile.lastName,
        email: profile.email ?? prev.profile.email,
        phone: profile.phone ?? prev.profile.phone,
        timezone: profile.timezone ?? prev.profile.timezone,
        bio: profile.bio ?? prev.profile.bio,
      },
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateProfile = async () => {
      try {
        if (initialProfile) {
          applyProfileToSettings(initialProfile);
          setLoadError(null);
          return;
        }

        setLoadingProfile(true);
        const user = await authAPI.getCurrentUser();
        if (!isMounted) {
          return;
        }

        applyProfileToSettings({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });
        setLoadError(null);
      } catch (error) {
        console.error('Error loading user profile for settings:', error);
        if (isMounted) {
          setLoadError('Unable to load profile information.');
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [initialProfile]);

  const activeEmail = (initialProfile?.email || settings.profile.email || '').toLowerCase();

  useEffect(() => {
    if (!familyProfile || !activeEmail) {
      return;
    }

    const parents = [
      familyProfile.parent1,
      familyProfile.parent2,
    ].filter(Boolean) as Array<FamilyProfile['parent1']>;

    const matchedParent = parents.find((parent) => parent.email?.toLowerCase() === activeEmail);

    if (matchedParent) {
      // Use current settings as fallback, but don't re-run when they change
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentPhone = settings.profile.phone;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentTimezone = settings.profile.timezone;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentBio = settings.profile.bio;

      applyProfileToSettings({
        firstName: matchedParent.firstName,
        lastName: matchedParent.lastName,
        email: matchedParent.email,
        phone: ('phone' in matchedParent ? matchedParent.phone : undefined) || currentPhone,
        timezone: ('timezone' in matchedParent ? matchedParent.timezone : undefined) || currentTimezone,
        bio: ('bio' in matchedParent ? matchedParent.bio : undefined) || currentBio,
      });
    }
  }, [familyProfile, activeEmail]);

  const profileInitials = (
    `${settings.profile.firstName?.charAt(0) ?? ''}${settings.profile.lastName?.charAt(0) ?? ''}`.trim() ||
    settings.profile.email?.charAt(0)?.toUpperCase() ||
    '?'
  );

  const updateSetting = (category: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
    setHasChanges(true);

    // Update Bridgette's reaction
    if (category === 'preferences') {
      if (field === 'language') {
        setBridgetteExpression('encouraging');
        setBridgetteMessage(value === 'spanish' ? "¡Perfecto! Ahora puedo ayudarte en español también! 🌟" : "Great! I'll continue helping you in English! 🌟");
      } else if (field === 'messageTone') {
        setBridgetteExpression('thinking');
        setBridgetteMessage(`Perfect! I'll help you communicate with a ${value} tone. This will make your messages more effective! 💬`);
      } else {
        setBridgetteExpression('encouraging');
        setBridgetteMessage("Excellent choices! These preferences will help me provide you with the most relevant content and support! ✨");
      }
    } else if (category === 'bridgette') {
      setBridgetteExpression('encouraging');
      setBridgetteMessage("Great choice! I love helping you customize your experience! ✨");
    } else if (category === 'notifications') {
      setBridgetteExpression('thinking');
      setBridgetteMessage("Perfect! I'll make sure you get the right notifications at the right time! 🔔");
    }
  };

  const updateNestedSetting = (category: string, subcategory: string, field: string, value: string | boolean) => {
    setSettings(prev => {
      const categoryData = prev[category as keyof typeof prev] as Record<string, unknown>;
      const subcategoryData = categoryData[subcategory] as Record<string, unknown>;
      
      return {
        ...prev,
        [category]: {
          ...categoryData,
          [subcategory]: {
            ...subcategoryData,
            [field]: value
          }
        }
      };
    });
    setHasChanges(true);

    setBridgetteExpression('encouraging');
    setBridgetteMessage("Great! I'm updating your preferences to give you the best possible experience! 🎯");
  };

  const saveSettings = () => {
    setBridgetteExpression('celebrating');
    setBridgetteMessage("🎉 All saved! Your settings have been updated successfully!");
    setHasChanges(false);
    
    setTimeout(() => {
      setBridgetteExpression('encouraging');
      setBridgetteMessage("Everything looks great! Is there anything else you'd like to adjust?");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bridgette Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AnimatedBridgette
                size="xl"
                expression={bridgetteExpression}
                animation={bridgetteExpression === 'celebrating' ? 'celebrate' : 'float'}
                showSpeechBubble={true}
                message={bridgetteMessage}
                position="center"
              />
              
              {hasChanges && (
                <Card className="mt-6 border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-green-800 mb-3">You have unsaved changes!</p>
                    <Button onClick={saveSettings} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save All Changes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Settings Side */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-6 h-6 mr-3 text-blue-600" />
                    Account Settings
                  </div>
                  <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </CardTitle>
                <p className="text-gray-600">
                  {loadingProfile ? 'Loading your information...' : 'Customize your Bridge experience'}
                </p>
                {loadError && (
                  <p className="text-sm text-red-500 mt-1">{loadError}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="profile" className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Preferences</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center space-x-1">
                      <Bell className="w-4 h-4" />
                      <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Privacy</span>
                    </TabsTrigger>
                    <TabsTrigger value="bridgette" className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Bridgette</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Settings */}
                  <TabsContent value="profile" className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {profileInitials}
                        </div>
                        <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {[settings.profile.firstName, settings.profile.lastName].filter(Boolean).join(' ') || 'Your name'}
                        </h3>
                        <p className="text-gray-600">{settings.profile.email || 'Add your email address'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={settings.profile.firstName}
                          onChange={(e) => updateSetting('profile', 'firstName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={settings.profile.lastName}
                          onChange={(e) => updateSetting('profile', 'lastName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={settings.profile.phone}
                        onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="timezone">Time Zone</Label>
                      <Select value={settings.profile.timezone} onValueChange={(value) => updateSetting('profile', 'timezone', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                          <SelectItem value="CST">Central Time (CST)</SelectItem>
                          <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                          <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio (Optional)</Label>
                      <Textarea
                        id="bio"
                        value={settings.profile.bio}
                        onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                        placeholder="Tell your co-parent a bit about yourself..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* New Preferences Tab */}
                  <TabsContent value="preferences" className="space-y-6">
                    {/* Language Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Languages className="w-5 h-5 mr-2 text-blue-600" />
                        Language Preference
                      </h3>
                      <Select value={settings.preferences.language} onValueChange={(value) => updateSetting('preferences', 'language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message Tone Preference */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                        Default Message Tone
                      </h3>
                      <Select value={settings.preferences.messageTone} onValueChange={(value) => updateSetting('preferences', 'messageTone', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">
                            <div>
                              <div className="font-medium">Friendly</div>
                              <div className="text-xs text-gray-500">Warm and collaborative tone</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="matter-of-fact">
                            <div>
                              <div className="font-medium">Matter-of-fact</div>
                              <div className="text-xs text-gray-500">Direct and clear communication</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="neutral-legal">
                            <div>
                              <div className="font-medium">Neutral Legal</div>
                              <div className="text-xs text-gray-500">Professional and documented</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="gentle">
                            <div>
                              <div className="font-medium">Gentle</div>
                              <div className="text-xs text-gray-500">Soft and understanding approach</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notification Opt-ins */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-blue-600" />
                        Notification Preferences
                      </h3>
                      <div className="space-y-3">
                        {[
                          { key: 'dailyTips', label: 'Daily Co-parenting Tips', desc: 'Receive helpful daily tips and encouragement' },
                          { key: 'weeklyDigest', label: 'Weekly Summary', desc: 'Weekly digest of your co-parenting activities' },
                          { key: 'expertArticles', label: 'Expert Articles', desc: 'New articles from psychology and family experts' },
                          { key: 'communityUpdates', label: 'Community Updates', desc: 'Updates from the Bridge co-parenting community' },
                          { key: 'productUpdates', label: 'Product Updates', desc: 'New features and improvements to Bridge' },
                          { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Important urgent notifications only' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center space-x-3">
                            <Checkbox
                              checked={settings.preferences.notificationOptIn[item.key as keyof typeof settings.preferences.notificationOptIn]}
                              onCheckedChange={(checked) => updateNestedSetting('preferences', 'notificationOptIn', item.key, checked)}
                            />
                            <div className="flex-1">
                              <Label className="font-medium">{item.label}</Label>
                              <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Article Type Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                        Article Types You're Interested In
                      </h3>
                      <div className="space-y-3">
                        {[
                          { key: 'communication', label: 'Communication Strategies', desc: 'Tips for better co-parent communication' },
                          { key: 'legal', label: 'Legal Guidance', desc: 'Understanding custody laws and agreements' },
                          { key: 'emotional', label: 'Emotional Support', desc: 'Managing stress and emotional wellbeing' },
                          { key: 'practical', label: 'Practical Tips', desc: 'Day-to-day co-parenting logistics' },
                          { key: 'children', label: 'Children & Family', desc: 'Supporting your children through transitions' },
                          { key: 'financial', label: 'Financial Planning', desc: 'Managing shared expenses and budgeting' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center space-x-3">
                            <Checkbox
                              checked={settings.preferences.articleTypes[item.key as keyof typeof settings.preferences.articleTypes]}
                              onCheckedChange={(checked) => updateNestedSetting('preferences', 'articleTypes', item.key, checked)}
                            />
                            <div className="flex-1">
                              <Label className="font-medium">{item.label}</Label>
                              <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Notification Settings */}
                  <TabsContent value="notifications" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Methods</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="font-medium">Email Notifications</Label>
                            <p className="text-sm text-gray-600">Receive updates via email</p>
                          </div>
                          <Switch
                            checked={settings.notifications.email}
                            onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="font-medium">SMS Notifications</Label>
                            <p className="text-sm text-gray-600">Urgent updates via text</p>
                          </div>
                          <Switch
                            checked={settings.notifications.sms}
                            onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="font-medium">Push Notifications</Label>
                            <p className="text-sm text-gray-600">Real-time alerts on your device</p>
                          </div>
                          <Switch
                            checked={settings.notifications.push}
                            onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">What to notify me about</h3>
                      
                      <div className="space-y-3">
                        {[
                          { key: 'calendar', label: 'Calendar Changes', desc: 'Schedule updates and new events' },
                          { key: 'messages', label: 'New Messages', desc: 'Messages from your co-parent' },
                          { key: 'expenses', label: 'Expense Updates', desc: 'New expenses and payment requests' },
                          { key: 'documents', label: 'Document Changes', desc: 'New documents and updates' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center space-x-3">
                            <Checkbox
                              checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                              onCheckedChange={(checked) => updateSetting('notifications', item.key, checked)}
                            />
                            <div className="flex-1">
                              <Label className="font-medium">{item.label}</Label>
                              <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Privacy Settings */}
                  <TabsContent value="privacy" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Privacy Controls</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Profile Visibility</Label>
                          <Select value={settings.privacy.profileVisibility} onValueChange={(value) => updateSetting('privacy', 'profileVisibility', value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="co-parent-only">Co-parent only</SelectItem>
                              <SelectItem value="family-network">Extended family network</SelectItem>
                              <SelectItem value="private">Completely private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="font-medium">Activity Sharing</Label>
                            <p className="text-sm text-gray-600">Share activity status with co-parent</p>
                          </div>
                          <Switch
                            checked={settings.privacy.activitySharing}
                            onCheckedChange={(checked) => updateSetting('privacy', 'activitySharing', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">Data Security</p>
                          <p className="text-blue-700">All your data is encrypted and stored securely. You can export or delete your data at any time.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Bridgette Settings */}
                  <TabsContent value="bridgette" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Customize Bridgette</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Bridgette's Personality</Label>
                          <Select value={settings.bridgette.personality} onValueChange={(value) => updateSetting('bridgette', 'personality', value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="encouraging">Encouraging & Supportive</SelectItem>
                              <SelectItem value="direct">Direct & Efficient</SelectItem>
                              <SelectItem value="detailed">Detailed & Thorough</SelectItem>
                              <SelectItem value="gentle">Gentle & Calm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Help Level</Label>
                          <Select value={settings.bridgette.helpLevel} onValueChange={(value) => updateSetting('bridgette', 'helpLevel', value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal - Only when asked</SelectItem>
                              <SelectItem value="balanced">Balanced - Helpful suggestions</SelectItem>
                              <SelectItem value="detailed">Detailed - Comprehensive guidance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="font-medium">Proactive Help</Label>
                            <p className="text-sm text-gray-600">Let Bridgette offer suggestions proactively</p>
                          </div>
                          <Switch
                            checked={settings.bridgette.proactiveHelp}
                            onCheckedChange={(checked) => updateSetting('bridgette', 'proactiveHelp', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="font-medium">Daily Tips</Label>
                            <p className="text-sm text-gray-600">Receive daily co-parenting tips</p>
                          </div>
                          <Switch
                            checked={settings.bridgette.dailyTips}
                            onCheckedChange={(checked) => updateSetting('bridgette', 'dailyTips', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;