import React, { useEffect, useState, useRef } from 'react';
import { User, Bell, Shield, Palette, Globe, Heart, Save, Edit, Camera, MessageSquare, BookOpen, Languages, ArrowLeft, Users, FileText, Upload, X, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AnimatedBridgette from './AnimatedBridgette';
import { FamilyProfile } from '@/types/family';
import { authAPI, familyAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
  
  // Custody Agreement state
  const [custodyAgreement, setCustodyAgreement] = useState<any>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [showUploadAgreement, setShowUploadAgreement] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load custody agreement
  useEffect(() => {
    const loadAgreement = async () => {
      if (!familyProfile) return;
      
      try {
        setLoadingAgreement(true);
        const agreement = await familyAPI.getContract();
        setCustodyAgreement(agreement);
      } catch (error: any) {
        // 404 means no agreement uploaded yet, which is fine
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          setCustodyAgreement(null);
        } else {
          console.error('Error loading custody agreement:', error);
        }
      } finally {
        setLoadingAgreement(false);
      }
    };

    loadAgreement();
  }, [familyProfile]);

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

  const handleCopyFamilyCode = async () => {
    if (!familyProfile?.familyCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(familyProfile.familyCode);
      toast({
        title: 'Family code copied',
        description: 'Share it with your co-parent when they join Bridge.',
      });
    } catch (error) {
      console.error('Failed to copy family code:', error);
      toast({
        title: 'Unable to copy code',
        description: 'Please highlight the code and copy it manually.',
        variant: 'destructive',
      });
    }
  };

  // Custody Agreement handlers
  const handleAgreementFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file",
          variant: "destructive",
        });
        return;
      }

      setAgreementFile(selectedFile);
    }
  };

  const handleUploadAgreement = async () => {
    if (!agreementFile) return;

    setUploadingAgreement(true);
    setUploadProgress(0);

    try {
      // Read file as base64
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 50;
          setUploadProgress(progress);
        }
      };

      reader.onload = async (event) => {
        const base64Content = event.target?.result as string;
        const base64Data = base64Content.split(',')[1]; // Remove data:...;base64, prefix

        setUploadProgress(50);

        // Simulate parsing progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 5, 95));
        }, 200);

        try {
          const response = await familyAPI.uploadContract({
            fileName: agreementFile.name,
            fileContent: base64Data,
            fileType: agreementFile.name.split('.').pop() || 'pdf'
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          setCustodyAgreement(response.custodyAgreement || response);
          setShowUploadAgreement(false);
          setAgreementFile(null);
          setUploadProgress(0);
          
          toast({
            title: "Success!",
            description: "Custody agreement uploaded and parsed successfully",
          });

          setBridgetteExpression('celebrating');
          setBridgetteMessage("🎉 Great! I've analyzed your custody agreement and updated your family settings!");
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Error uploading agreement:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to upload agreement",
            variant: "destructive",
          });
        } finally {
          setUploadingAgreement(false);
        }
      };

      reader.onerror = () => {
        setUploadingAgreement(false);
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(agreementFile);
    } catch (error) {
      setUploadingAgreement(false);
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const clearAgreementFile = () => {
    setAgreementFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewDocument = async () => {
    try {
      const isPdf = custodyAgreement?.fileType?.toLowerCase() === 'pdf';
      await familyAPI.downloadContract();
      toast({
        title: isPdf ? "Opening document" : "Download started",
        description: isPdf ? "Your custody agreement is opening in a new tab." : "Your custody agreement is being downloaded.",
      });
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open document",
        variant: "destructive",
      });
    }
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
                  <TabsList className="grid w-full grid-cols-7">
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
                    <TabsTrigger value="family" className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">Family</span>
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

                  
                  <TabsContent value="family" className="space-y-6">
                    <Card className="border-2 border-green-200 bg-green-50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <Globe className="w-5 h-5" />
                          Family Profile & Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {familyProfile ? (
                          <>
                            {/* Family Summary Banner */}
                            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Users className="w-8 h-8 text-green-600" />
                                  <div>
                                    <h3 className="font-semibold text-gray-800">{familyProfile.familyName || 'Your Family'}</h3>
                                    <p className="text-sm text-gray-600">
                                      {familyProfile.children.length} {familyProfile.children.length === 1 ? 'child' : 'children'} • 
                                      {familyProfile.custodyArrangement === '50-50' ? ' 50/50 custody' : 
                                       familyProfile.custodyArrangement === 'primary-secondary' ? ' Primary/Secondary custody' : 
                                       ' Custom custody'}
                                      {familyProfile.differentTimezones && ' • Different time zones'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {familyProfile.children.map((child) => (
                                    <div key={child.id} className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                      {child.firstName[0]}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="border rounded-lg bg-white/80 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                                Family Code
                              </p>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono text-lg bg-white px-4 py-2 rounded-md border border-green-200 text-green-800 shadow-sm">
                                  {familyProfile.familyCode || 'Not yet generated'}
                                </span>
                                {familyProfile.familyCode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyFamilyCode}
                                    className="border-green-200 text-green-700 hover:bg-green-100"
                                  >
                                    Copy
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-3">
                                Share this code with your co-parent when they create their own Bridge account so they can link to this family.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-lg border border-dashed border-green-200 bg-white/70 p-6 text-center text-sm text-green-800">
                            Complete your family onboarding to generate a Family Code.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Custody Agreement Section */}
                    <Card className="border-2 border-blue-200 bg-blue-50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <FileText className="w-5 h-5" />
                          Custody Agreement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {loadingAgreement ? (
                          <div className="text-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                            <p className="text-sm text-gray-600 mt-2">Loading agreement...</p>
                          </div>
                        ) : custodyAgreement ? (
                          <>
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <div>
                                    <h4 className="font-semibold text-gray-900">Agreement Uploaded</h4>
                                    <p className="text-sm text-gray-600">
                                      {custodyAgreement.fileName || 'Custody Agreement'}
                                    </p>
                                    {custodyAgreement.uploadDate && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Uploaded: {new Date(custodyAgreement.uploadDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleViewDocument}
                                    disabled={!custodyAgreement.fileContent}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!custodyAgreement.fileContent ? "Original file not available. Please re-upload to enable viewing." : custodyAgreement.fileType?.toLowerCase() === 'pdf' ? "View the document in a new tab" : "Download the document"}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowUploadAgreement(true)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Update
                                  </Button>
                                </div>
                              </div>

                              {custodyAgreement.expenseSplit && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Extracted Information:</h5>
                                  <div className="space-y-2 text-sm">
                                    {custodyAgreement.custodySchedule && (
                                      <div>
                                        <span className="font-medium text-gray-700">Custody Schedule: </span>
                                        <span className="text-gray-600">{custodyAgreement.custodySchedule}</span>
                                      </div>
                                    )}
                                    {custodyAgreement.holidaySchedule && (
                                      <div>
                                        <span className="font-medium text-gray-700">Holiday Schedule: </span>
                                        <span className="text-gray-600">{custodyAgreement.holidaySchedule}</span>
                                      </div>
                                    )}
                                    {custodyAgreement.decisionMaking && (
                                      <div>
                                        <span className="font-medium text-gray-700">Decision Making: </span>
                                        <span className="text-gray-600">{custodyAgreement.decisionMaking}</span>
                                      </div>
                                    )}
                                    {custodyAgreement.expenseSplit && (
                                      <div>
                                        <span className="font-medium text-gray-700">Expense Split: </span>
                                        <span className="text-gray-600">
                                          {custodyAgreement.expenseSplit.ratio || '50-50'} 
                                          {custodyAgreement.expenseSplit.parent1 && custodyAgreement.expenseSplit.parent2 && (
                                            ` (Parent 1: ${custodyAgreement.expenseSplit.parent1}%, Parent 2: ${custodyAgreement.expenseSplit.parent2}%)`
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <Alert className="mb-4">
                              <AlertCircle className="w-4 h-4" />
                              <AlertDescription>
                                No custody agreement uploaded yet. Upload your divorce agreement to automatically extract custody schedules, expense splits, and other important terms.
                              </AlertDescription>
                            </Alert>
                            <Button
                              onClick={() => setShowUploadAgreement(true)}
                              className="bg-gradient-to-r from-blue-500 to-purple-600"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Agreement
                            </Button>
                          </div>
                        )}

                        {/* Upload Form */}
                        {showUploadAgreement && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-800">
                                  {custodyAgreement ? 'Update' : 'Upload'} Custody Agreement
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setShowUploadAgreement(false);
                                    clearAgreementFile();
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  onChange={handleAgreementFileSelect}
                                  accept=".pdf,.doc,.docx,.txt"
                                  className="hidden"
                                  id="agreement-upload"
                                />
                                
                                {!agreementFile ? (
                                  <label htmlFor="agreement-upload" className="cursor-pointer">
                                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      PDF, DOC, DOCX, or TXT (max 10MB)
                                    </p>
                                  </label>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-center space-x-3">
                                      <FileText className="w-8 h-8 text-blue-500" />
                                      <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">{agreementFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {(agreementFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAgreementFile}
                                        className="ml-auto"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    {uploadingAgreement && (
                                      <div className="space-y-2">
                                        <Progress value={uploadProgress} className="h-2" />
                                        <p className="text-xs text-gray-600">
                                          {uploadProgress < 50 ? 'Uploading...' : 'Analyzing document with AI...'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-3">
                                <Button 
                                  onClick={handleUploadAgreement}
                                  disabled={!agreementFile || uploadingAgreement}
                                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                                >
                                  {uploadingAgreement ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {uploadProgress < 50 ? 'Uploading...' : 'Parsing...'}
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload & Parse
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setShowUploadAgreement(false);
                                    clearAgreementFile();
                                  }}
                                  variant="outline"
                                  disabled={uploadingAgreement}
                                >
                                  Cancel
                                </Button>
                              </div>

                              <Alert>
                                <AlertDescription className="text-xs">
                                  Bridge uses AI to automatically extract key information from your agreement, including custody schedules, expense splits, and decision-making arrangements.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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