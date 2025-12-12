import React, { useEffect, useState, useRef } from 'react';
import { User, Bell, Shield, Globe, Heart, Camera, MessageSquare, BookOpen, Languages, Users, FileText, Upload, X, Loader2, CheckCircle, AlertCircle, Eye, Trash2, Edit, Sparkles } from 'lucide-react';
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

import { FamilyProfile, CustodyDistribution } from '@/types/family';
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
  initialProfile?: UserProfileInfo | null;
  familyProfile?: FamilyProfile | null;
}

const UserSettings: React.FC<UserSettingsProps> = ({ initialProfile, familyProfile }) => {
  const { toast } = useToast();

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
  const [custodyDistribution, setCustodyDistribution] = useState<CustodyDistribution | null>(null);
  const [loadingCustody, setLoadingCustody] = useState(false);
  const [custodyViewPeriod, setCustodyViewPeriod] = useState<'weekly' | 'yearly'>('weekly');

  // Manual entry state
  const [entryMode, setEntryMode] = useState<'upload' | 'manual'>('upload');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [savingManualEntry, setSavingManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    scheduleType: 'week-on-week-off' as 'week-on-week-off' | '2-2-3' | 'custom',
    customDays: {
      parent1: [] as string[],
      parent2: [] as string[]
    },
    holidaySchedule: '',
    decisionMaking: '',
    expenseSplitType: '50-50' as '50-50' | '60-40' | '70-30' | 'custom',
    expenseParent1: 50,
    expenseParent2: 50
  });

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAgreement = async () => {
    try {
      setLoadingAgreement(true);
      await familyAPI.deleteContract();
      setCustodyAgreement(null);
      setShowDeleteConfirm(false);
      toast({
        title: "Agreement deleted",
        description: "Custody agreement and associated events have been removed.",
      });
      loadCustodyDistribution(custodyViewPeriod);
    } catch (error) {
      console.error('Error deleting agreement:', error);
      toast({
        title: "Error",
        description: "Failed to delete agreement",
        variant: "destructive",
      });
    } finally {
      setLoadingAgreement(false);
    }
  };

  const loadCustodyDistribution = async (period: 'weekly' | 'yearly') => {
    if (!familyProfile) return;
    setLoadingCustody(true);
    try {
      const distribution = await familyAPI.getCustodyDistribution({ period });
      setCustodyDistribution(distribution);
    } catch (error) {
      console.error('Error loading custody distribution:', error);
      setCustodyDistribution(null); // Clear previous data on error
    } finally {
      setLoadingCustody(false);
    }
  };

  useEffect(() => {
    if (familyProfile) {
      loadCustodyDistribution(custodyViewPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyProfile, custodyViewPeriod]);

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
        phone: ('phone' in matchedParent ? String(matchedParent.phone) : undefined) || currentPhone,
        timezone: ('timezone' in matchedParent ? String(matchedParent.timezone) : undefined) || currentTimezone,
        bio: ('bio' in matchedParent ? String(matchedParent.bio) : undefined) || currentBio,
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
  };

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully!",
    });
  };

  const handleCopyFamilyCode = async () => {
    if (!familyProfile?.familyCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(familyProfile.familyCode);
      toast({
        title: 'Family code copied',
        description: 'Share it with your co-parent when they join Bridge-it.',
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



          // Refresh custody distribution
          loadCustodyDistribution(custodyViewPeriod);
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

  // Manual entry handlers
  const handleScheduleTypeChange = (type: 'week-on-week-off' | '2-2-3' | 'custom') => {
    setManualData(prev => ({ ...prev, scheduleType: type }));
  };

  const handleCustomDayToggle = (parent: 'parent1' | 'parent2', day: string) => {
    setManualData(prev => {
      const currentDays = prev.customDays[parent];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      return {
        ...prev,
        customDays: {
          ...prev.customDays,
          [parent]: newDays
        }
      };
    });
  };

  const handleExpenseSplitChange = (type: '50-50' | '60-40' | '70-30' | 'custom') => {
    setManualData(prev => {
      if (type === '50-50') {
        return { ...prev, expenseSplitType: type, expenseParent1: 50, expenseParent2: 50 };
      } else if (type === '60-40') {
        return { ...prev, expenseSplitType: type, expenseParent1: 60, expenseParent2: 40 };
      } else if (type === '70-30') {
        return { ...prev, expenseSplitType: type, expenseParent1: 70, expenseParent2: 30 };
      } else {
        return { ...prev, expenseSplitType: type };
      }
    });
  };

  const handleSaveManualEntry = async () => {
    // Validate custom schedule
    if (manualData.scheduleType === 'custom') {
      if (manualData.customDays.parent1.length === 0 && manualData.customDays.parent2.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one day for custody schedule",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate expense split for custom
    if (manualData.expenseSplitType === 'custom') {
      const total = manualData.expenseParent1 + manualData.expenseParent2;
      if (Math.abs(total - 100) > 0.01) {
        toast({
          title: "Validation Error",
          description: "Expense split percentages must add up to 100%",
          variant: "destructive",
        });
        return;
      }
    }

    setSavingManualEntry(true);

    try {
      // Build custody schedule string based on type
      let custodySchedule = '';
      if (manualData.scheduleType === 'week-on-week-off') {
        custodySchedule = 'Week-on/week-off alternating schedule';
      } else if (manualData.scheduleType === '2-2-3') {
        const p1Name = familyProfile?.parent1?.firstName || 'Parent 1';
        const p2Name = familyProfile?.parent2?.firstName || 'Parent 2';
        custodySchedule = `2-2-3 schedule (2 days ${p1Name}, 2 days ${p2Name}, 3 days ${p1Name}, then alternates)`;
      } else {
        const p1Days = manualData.customDays.parent1.join(', ');
        const p2Days = manualData.customDays.parent2.join(', ');
        custodySchedule = `Custom schedule: ${familyProfile?.parent1?.firstName || 'Parent 1'} has custody on ${p1Days}. ${familyProfile?.parent2?.firstName || 'Parent 2'} has custody on ${p2Days}.`;
      }

      // Initial save request
      const response = await familyAPI.saveManualCustody({
        custodySchedule,
        holidaySchedule: manualData.holidaySchedule || undefined,
        decisionMaking: manualData.decisionMaking || undefined,
        expenseSplitRatio: `${manualData.expenseParent1}-${manualData.expenseParent2}`,
        expenseParent1: manualData.expenseParent1,
        expenseParent2: manualData.expenseParent2,
      });

      // Immediately close modal and show success (optimistic UI)
      setCustodyAgreement(response.custodyAgreement || response);
      setShowManualEntry(false);
      
      // Reset form
      setManualData({
        scheduleType: 'week-on-week-off',
        customDays: { parent1: [], parent2: [] },
        holidaySchedule: '',
        decisionMaking: '',
        expenseSplitType: '50-50',
        expenseParent1: 50,
        expenseParent2: 50
      });

      toast({
        title: "Saved!",
        description: "Custody information saved. Calendar is updating in the background.",
      });
      
      setSavingManualEntry(false);

      // Poll for completion to update stats
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await familyAPI.getContractStatus();
          if (statusResponse.status === 'completed') {
            clearInterval(pollInterval);
            loadCustodyDistribution(custodyViewPeriod);
            toast({
              title: "Calendar Updated",
              description: "Your custody calendar is fully generated.",
            });
          } else if (statusResponse.status === 'failed') {
            clearInterval(pollInterval);
            console.error("Calendar generation failed");
          }
        } catch (e) {
          console.warn("Polling error:", e);
        }
      }, 2000);

    } catch (error) {
      console.error('Error saving manual entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save custody information",
        variant: "destructive",
      });
      setSavingManualEntry(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <TabsTrigger
              value="profile"
              className="flex items-center justify-center space-x-2 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-bridge-blue data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-bridge-blue hover:bg-blue-50"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center justify-center space-x-2 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-bridge-blue data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-bridge-blue hover:bg-blue-50"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center justify-center space-x-2 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-bridge-blue data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-bridge-blue hover:bg-blue-50"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex items-center justify-center space-x-2 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-bridge-blue data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-bridge-blue hover:bg-blue-50"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger
              value="bridgette"
              className="flex items-center justify-center space-x-2 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-bridge-blue data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-bridge-blue hover:bg-blue-50"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Bridge-it</span>
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="flex items-center justify-center space-x-2 rounded-lg py-2 text-sm font-medium transition-all data-[state=active]:bg-bridge-blue data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-bridge-blue hover:bg-blue-50"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Family</span>
            </TabsTrigger>
          </TabsList>

          <Card className="shadow-xl border-bridge-blue/10 bg-white/90 backdrop-blur-sm">

            <CardContent className="pt-6">

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
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
                      { key: 'communityUpdates', label: 'Community Updates', desc: 'Updates from the Bridge-it co-parenting community' },
                      { key: 'productUpdates', label: 'Product Updates', desc: 'New features and improvements to Bridge-it' },
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Customize Bridge-it</h3>

                  <div className="space-y-4">
                    <div>
                      <Label>Bridge-it's Personality</Label>
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
                        <p className="text-sm text-gray-600">Let Bridge-it offer suggestions proactively</p>
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
                                  {child.firstName && child.firstName[0] ? child.firstName[0] : '?'}
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
                            Share this code with your co-parent when they create their own Bridge-it account so they can link to this family.
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

                {/* Custody Distribution Section */}
                <Card className="border-2 border-purple-200 bg-purple-50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <Users className="w-5 h-5" />
                      Custody Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs
                      value={custodyViewPeriod}
                      onValueChange={(value) => {
                        setCustodyDistribution(null);
                        setCustodyViewPeriod(value as 'weekly' | 'yearly');
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                      </TabsList>
                      <TabsContent value="weekly">
                        {loadingCustody ? (
                          <div className="text-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                            <p className="text-sm text-gray-600 mt-2">Loading weekly custody details...</p>
                          </div>
                        ) : custodyDistribution ? (
                          <div className="space-y-4 pt-4">
                            <div className="flex justify-around text-center">
                              <div>
                                <p className="font-bold text-2xl text-purple-800">{custodyDistribution.parent1.days}</p>
                                <p className="text-sm text-gray-600">{custodyDistribution.parent1.name} Days</p>
                                <p className="text-xs text-gray-500">{custodyDistribution.parent1.percentage.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="font-bold text-2xl text-purple-800">{custodyDistribution.parent2.days}</p>
                                <p className="text-sm text-gray-600">{custodyDistribution.parent2.name} Days</p>
                                <p className="text-xs text-gray-500">{custodyDistribution.parent2.percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                            <Progress value={custodyDistribution.parent1.percentage} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-pink-400" />
                          </div>
                        ) : (
                          <div className="text-center text-sm text-gray-600 py-4">
                            Weekly custody distribution data is not available.
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="yearly">
                        {loadingCustody ? (
                          <div className="text-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                            <p className="text-sm text-gray-600 mt-2">Loading yearly custody details...</p>
                          </div>
                        ) : custodyDistribution ? (
                          <div className="space-y-4 pt-4">
                            <div className="flex justify-around text-center">
                              <div>
                                <p className="font-bold text-2xl text-purple-800">{custodyDistribution.parent1.days}</p>
                                <p className="text-sm text-gray-600">{custodyDistribution.parent1.name} Days</p>
                                <p className="text-xs text-gray-500">{custodyDistribution.parent1.percentage.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="font-bold text-2xl text-purple-800">{custodyDistribution.parent2.days}</p>
                                <p className="text-sm text-gray-600">{custodyDistribution.parent2.name} Days</p>
                                <p className="text-xs text-gray-500">{custodyDistribution.parent2.percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                            <Progress value={custodyDistribution.parent1.percentage} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-pink-400" />
                          </div>
                        ) : (
                          <div className="text-center text-sm text-gray-600 py-4">
                            Yearly custody distribution data is not available.
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
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
                            <div className="flex flex-wrap gap-2">
                              {custodyAgreement.fileType !== 'manual' && (
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
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEntryMode('manual');
                                  setShowManualEntry(true);
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Info
                              </Button>
                              {custodyAgreement.fileType !== 'manual' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEntryMode('upload');
                                    setShowUploadAgreement(true);
                                  }}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Re-upload
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
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
                            No custody agreement configured yet. You can either upload your divorce agreement for automatic parsing or enter the information manually.
                          </AlertDescription>
                        </Alert>
                        <div className="flex justify-center space-x-3">
                          <Button
                            onClick={() => {
                              setEntryMode('upload');
                              setShowUploadAgreement(true);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-purple-600"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Agreement
                          </Button>
                          <Button
                            onClick={() => {
                              setEntryMode('manual');
                              setShowManualEntry(true);
                            }}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Enter Manually
                          </Button>
                        </div>
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
                              Bridge-it uses AI to automatically extract key information from your agreement, including custody schedules, expense splits, and decision-making arrangements.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    )}

                    {/* Manual Entry Form */}
                    {showManualEntry && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">
                              {custodyAgreement ? 'Update' : 'Enter'} Custody Information Manually
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowManualEntry(false);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Custody Schedule Type */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                              Custody Schedule Type
                            </Label>
                            <Select 
                              value={manualData.scheduleType} 
                              onValueChange={handleScheduleTypeChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="week-on-week-off">
                                  <div>
                                    <div className="font-medium">Week-on/Week-off</div>
                                    <div className="text-xs text-gray-500">Alternating weeks with each parent</div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="2-2-3">
                                  <div>
                                    <div className="font-medium">2-2-3 Schedule</div>
                                    <div className="text-xs text-gray-500">2 days, 2 days, then 3 days alternating</div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="custom">
                                  <div>
                                    <div className="font-medium">Custom Schedule</div>
                                    <div className="text-xs text-gray-500">Select specific days for each parent</div>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Custom Days Selector */}
                          {manualData.scheduleType === 'custom' && (
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div>
                                <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                                  {familyProfile?.parent1?.firstName || 'Parent 1'}'s Custody Days
                                </Label>
                                <div className="grid grid-cols-7 gap-2">
                                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                    <div key={`p1-${day}`} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`parent1-${day}`}
                                        checked={manualData.customDays.parent1.includes(day)}
                                        onCheckedChange={() => handleCustomDayToggle('parent1', day)}
                                      />
                                      <Label 
                                        htmlFor={`parent1-${day}`}
                                        className="text-xs font-medium cursor-pointer"
                                      >
                                        {day}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                                  {familyProfile?.parent2?.firstName || 'Parent 2'}'s Custody Days
                                </Label>
                                <div className="grid grid-cols-7 gap-2">
                                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                    <div key={`p2-${day}`} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`parent2-${day}`}
                                        checked={manualData.customDays.parent2.includes(day)}
                                        onCheckedChange={() => handleCustomDayToggle('parent2', day)}
                                      />
                                      <Label 
                                        htmlFor={`parent2-${day}`}
                                        className="text-xs font-medium cursor-pointer"
                                      >
                                        {day}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <Alert>
                                <AlertDescription className="text-xs">
                                  Select the days of the week when each parent has custody. Days can overlap if custody is shared on certain days.
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}

                          {/* Holiday Schedule */}
                          <div>
                            <Label htmlFor="holidaySchedule" className="text-sm font-semibold text-gray-800 mb-2 block">
                              Holiday Schedule (Optional)
                            </Label>
                            <Textarea
                              id="holidaySchedule"
                              value={manualData.holidaySchedule}
                              onChange={(e) => setManualData(prev => ({ ...prev, holidaySchedule: e.target.value }))}
                              placeholder="e.g., Thanksgiving alternates yearly. Parent 1 has Christmas Eve, Parent 2 has Christmas Day."
                              rows={3}
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Describe how holidays are split between parents
                            </p>
                          </div>

                          {/* Decision Making */}
                          <div>
                            <Label htmlFor="decisionMaking" className="text-sm font-semibold text-gray-800 mb-2 block">
                              Decision Making (Optional)
                            </Label>
                            <Textarea
                              id="decisionMaking"
                              value={manualData.decisionMaking}
                              onChange={(e) => setManualData(prev => ({ ...prev, decisionMaking: e.target.value }))}
                              placeholder="e.g., Joint decision-making for medical and educational matters. Parent 1 makes day-to-day decisions during their custody time."
                              rows={3}
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Describe how major decisions are made for the children
                            </p>
                          </div>

                          {/* Expense Split */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                              Expense Split Ratio
                            </Label>
                            <Select 
                              value={manualData.expenseSplitType} 
                              onValueChange={handleExpenseSplitChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="50-50">50/50 - Equal split</SelectItem>
                                <SelectItem value="60-40">60/40 split</SelectItem>
                                <SelectItem value="70-30">70/30 split</SelectItem>
                                <SelectItem value="custom">Custom split</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Custom Expense Split */}
                          {manualData.expenseSplitType === 'custom' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div>
                                <Label htmlFor="expenseParent1" className="text-sm font-medium">
                                  {familyProfile?.parent1?.firstName || 'Parent 1'} %
                                </Label>
                                <Input
                                  id="expenseParent1"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={manualData.expenseParent1}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setManualData(prev => ({ 
                                      ...prev, 
                                      expenseParent1: val,
                                      expenseParent2: 100 - val
                                    }));
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="expenseParent2" className="text-sm font-medium">
                                  {familyProfile?.parent2?.firstName || 'Parent 2'} %
                                </Label>
                                <Input
                                  id="expenseParent2"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={manualData.expenseParent2}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setManualData(prev => ({ 
                                      ...prev, 
                                      expenseParent2: val,
                                      expenseParent1: 100 - val
                                    }));
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <p className="text-xs text-gray-500 col-span-2">
                                Total: {manualData.expenseParent1 + manualData.expenseParent2}% 
                                {Math.abs((manualData.expenseParent1 + manualData.expenseParent2) - 100) > 0.01 && 
                                  <span className="text-red-600 ml-1">(Must equal 100%)</span>
                                }
                              </p>
                            </div>
                          )}

                          <div className="flex space-x-3">
                            <Button
                              onClick={handleSaveManualEntry}
                              disabled={savingManualEntry}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                            >
                              {savingManualEntry ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Save Custody Information
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowManualEntry(false);
                              }}
                              variant="outline"
                              disabled={savingManualEntry}
                            >
                              Cancel
                            </Button>
                          </div>

                          <Alert>
                            <AlertDescription className="text-xs">
                              This information will be used to generate custody events on your calendar and calculate expense splits.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Custody Agreement?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this agreement? This will also remove all associated custody events from your calendar. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteAgreement}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;