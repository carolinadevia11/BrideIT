import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, ArrowLeft, Users, MapPin, Clock, Heart, Baby, Home, CheckCircle, Plus, Trash2, Calendar, AlertTriangle, User, Mail, Phone, Hash, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import AnimatedBridgette from './AnimatedBridgette';
import { Child, FamilyProfile } from '@/types/family';
import { familyAPI, childrenAPI, authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FamilyOnboardingProps {
  onComplete: (familyProfile: FamilyProfile) => void;
  initialUserData?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  currentFamilyProfile?: FamilyProfile | null;
  onBack?: () => void;
}

const FamilyOnboarding: React.FC<FamilyOnboardingProps> = ({ onComplete, initialUserData, currentFamilyProfile, onBack }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bridgetteExpression, setBridgetteExpression] = useState<'thinking' | 'encouraging' | 'celebrating' | 'balanced' | 'mediating'>('encouraging');
  const [bridgetteMessage, setBridgetteMessage] = useState("Hi! I'm so excited to help you set up your family profile! This will help me organize everything perfectly for your unique situation! 🌟");

  const [familyData, setFamilyData] = useState<Partial<FamilyProfile>>({
    familyName: currentFamilyProfile?.familyName || (initialUserData ? `${initialUserData.lastName} Family` : ''),
    parent1: currentFamilyProfile?.parent1 || {
      firstName: initialUserData?.firstName || '',
      lastName: initialUserData?.lastName || '',
      email: initialUserData?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      timezone: 'EST'
    },
    parent2: currentFamilyProfile?.parent2 || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      timezone: 'EST'
    },
    children: currentFamilyProfile?.children || [],
    differentTimezones: currentFamilyProfile?.differentTimezones || false,
    specialAccommodations: currentFamilyProfile?.specialAccommodations || [],
    custodyArrangement: currentFamilyProfile?.custodyArrangement || '50-50',
    onboardingCompleted: false
  });

  const [newChild, setNewChild] = useState<Partial<Child>>({
    firstName: '',
    lastName: '',
    dateOfBirth: undefined,
    gender: undefined,
    specialNeeds: [],
    medicalConditions: [],
    allergies: []
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Bridge! 🌟',
      description: "Let's get to know your family"
    },
    {
      id: 'parent1',
      title: 'Your Information',
      description: 'Complete your contact details'
    },
    {
      id: 'children',
      title: 'Your Children',
      description: 'Add information about your children'
    },
    {
      id: 'custody',
      title: 'Custody & Details',
      description: 'Arrangement and other details'
    },
    {
      id: 'review',
      title: 'Review & Confirm',
      description: 'Make sure everything looks good'
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateParent1 = (field: string, value: string) => {
    // Validation: Only allow letters for names
    if ((field === 'firstName' || field === 'lastName') && value) {
      if (!/^[a-zA-Z\s\-']*$/.test(value)) return;
    }
    
    // Validation: Only allow numbers and format chars for phone/zip
    if ((field === 'zipCode' || field === 'phone') && value) {
      if (!/^[0-9\-\+\(\)\s]*$/.test(value)) return;
    }

    setFamilyData(prev => ({
      ...prev,
      parent1: {
        ...prev.parent1!,
        [field]: value
      }
    }));
  };

  const updateParent2 = (field: string, value: string) => {
    setFamilyData(prev => ({
      ...prev,
      parent2: {
        ...prev.parent2!,
        [field]: value
      }
    }));
  };

  const addChild = () => {
    if (!newChild.firstName || !newChild.dateOfBirth) return;

    const birthDate = new Date(newChild.dateOfBirth);
    if (birthDate > new Date()) {
      toast({
        title: "Invalid Date",
        description: "Date of birth cannot be in the future.",
        variant: "destructive",
      });
      return;
    }

    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const child: Child = {
      id: Date.now().toString(),
      firstName: newChild.firstName,
      lastName: newChild.lastName || familyData.familyName || '',
      dateOfBirth: birthDate,
      age,
      gender: newChild.gender,
      specialNeeds: newChild.specialNeeds || [],
      medicalConditions: newChild.medicalConditions || [],
      allergies: newChild.allergies || []
    };

    setFamilyData(prev => ({
      ...prev,
      children: [...(prev.children || []), child]
    }));

    setNewChild({
      firstName: '',
      lastName: '',
      dateOfBirth: undefined,
      gender: undefined,
      specialNeeds: [],
      medicalConditions: [],
      allergies: []
    });

    setBridgetteExpression('celebrating');
    setBridgetteMessage(`Wonderful! ${child.firstName} has been added to your family! 🎉`);
  };

  const removeChild = (childId: string) => {
    setFamilyData(prev => ({
      ...prev,
      children: prev.children?.filter(c => c.id !== childId) || []
    }));
  };

  const calculateDistance = () => {
    // In a real app, this would use a geocoding API
    // For now, we'll just check if addresses are different
    if (familyData.parent1?.address && familyData.parent2?.address) {
      if (familyData.parent1.address !== familyData.parent2.address) {
        return 25; // Mock distance
      }
    }
    return 0;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      updateBridgetteForStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      updateBridgetteForStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const updateBridgetteForStep = (step: number) => {
    const messages = [
      "Hi! I'm so excited to help you set up your family profile! This will help me organize everything perfectly for your unique situation! 🌟",
      "Let's start with your contact information. This helps me understand who's who in the family! 👤",
      "Tell me about your wonderful children! I'll help organize everything for each of them! 👶",
      "Understanding your custody arrangement and any special details helps me set up the calendar correctly! 📅",
      "Let's review everything to make sure it's perfect! You're almost ready to start using Bridge! ✨"
    ];
    setBridgetteMessage(messages[step]);
    setBridgetteExpression(step === steps.length - 1 ? 'celebrating' : 'encouraging');
  };

  const completeOnboarding = () => {
    // Pass updated data to parent component
    setBridgetteExpression('celebrating');
    setBridgetteMessage("Perfect! Your family profile is all set up! 🎉");
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setIsSubmitting(true);
    
    // Prepare children data for backend (map firstName/lastName to name)
    // The backend expects 'name' but the frontend interface uses firstName/lastName
    // We'll let the api.ts handle the transformation or send it as is if the backend model is updated
    // For now, let's create the profile object matching the frontend type
    const completedProfile: FamilyProfile = {
      id: currentFamilyProfile?.id || Date.now().toString(),
      familyName: familyData.familyName || `${familyData.parent1?.lastName} Family`,
      familyCode: currentFamilyProfile?.familyCode,
      parent1: familyData.parent1!,
      parent2: familyData.parent2 || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        timezone: 'EST'
      },
      children: familyData.children || [],
      geographicalDistance: 0,
      differentTimezones: false,
      specialAccommodations: familyData.specialAccommodations,
      custodyArrangement: familyData.custodyArrangement,
      custodyNotes: familyData.custodyNotes,
      onboardingCompleted: true, // Mark as completed
      setupDate: new Date()
    };

    onComplete(completedProfile);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return familyData.parent1?.firstName && familyData.parent1?.email;
      case 2:
        return (familyData.children?.length || 0) > 0;
      case 3:
        return !!familyData.custodyArrangement;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Bridge!</h2>
              <p className="text-gray-600 mb-6">
                Let's set up your family profile so I can help you organize your co-parenting journey effectively.
                This will only take a few minutes!
              </p>
            </div>

            <div>
              <Label htmlFor="familyName">Family Name (Optional)</Label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="familyName"
                  value={familyData.familyName}
                  onChange={(e) => setFamilyData(prev => ({ ...prev, familyName: e.target.value }))}
                  placeholder="e.g., Johnson Family"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This helps identify your family in the system</p>
            </div>

          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Parent 1 Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p1-firstName">First Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-firstName"
                    value={familyData.parent1?.firstName}
                    onChange={(e) => updateParent1('firstName', e.target.value)}
                    placeholder="Sarah"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="p1-lastName">Last Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-lastName"
                    value={familyData.parent1?.lastName}
                    onChange={(e) => updateParent1('lastName', e.target.value)}
                    placeholder="Johnson"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p1-email">Email *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-email"
                    type="email"
                    value={familyData.parent1?.email}
                    onChange={(e) => updateParent1('email', e.target.value)}
                    placeholder="sarah@email.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="p1-phone">Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-phone"
                    type="tel"
                    value={familyData.parent1?.phone}
                    onChange={(e) => updateParent1('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="p1-address">Street Address</Label>
              <div className="relative mt-1">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="p1-address"
                  value={familyData.parent1?.address}
                  onChange={(e) => updateParent1('address', e.target.value)}
                  placeholder="123 Main St"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p1-city">City</Label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-city"
                    value={familyData.parent1?.city}
                    onChange={(e) => updateParent1('city', e.target.value)}
                    placeholder="Seattle"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="p1-state">State</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-state"
                    value={familyData.parent1?.state}
                    onChange={(e) => updateParent1('state', e.target.value)}
                    placeholder="WA"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="p1-zip">ZIP Code</Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p1-zip"
                    value={familyData.parent1?.zipCode}
                    onChange={(e) => updateParent1('zipCode', e.target.value)}
                    placeholder="98101"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="p1-timezone">Time Zone</Label>
              <Select value={familyData.parent1?.timezone} onValueChange={(value) => updateParent1('timezone', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                  <SelectItem value="CST">Central Time (CST)</SelectItem>
                  <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                  <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                  <SelectItem value="AKST">Alaska Time (AKST)</SelectItem>
                  <SelectItem value="HST">Hawaii Time (HST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Co-Parent Information (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Adding your co-parent's name now helps personalize the calendar and other features before they join.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="p2-firstName">First Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="p2-firstName"
                      value={familyData.parent2?.firstName}
                      onChange={(e) => updateParent2('firstName', e.target.value)}
                      placeholder="Michael"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="p2-lastName">Last Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="p2-lastName"
                      value={familyData.parent2?.lastName}
                      onChange={(e) => updateParent2('lastName', e.target.value)}
                      placeholder="Smith"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="p2-email">Email (for invitation)</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="p2-email"
                    type="email"
                    value={familyData.parent2?.email}
                    onChange={(e) => updateParent2('email', e.target.value)}
                    placeholder="michael@email.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Your Children</h3>
            
            {/* Existing Children */}
            {(familyData.children?.length || 0) > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Added Children:</h4>
                {familyData.children?.map((child) => (
                  <Card key={child.id} className="border-2 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-bridge-green rounded-full flex items-center justify-center text-white font-bold">
                            {child.firstName[0]}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{child.firstName} {child.lastName}</h4>
                            <p className="text-sm text-gray-600">Age {child.age}</p>
                            {child.specialNeeds && child.specialNeeds.length > 0 && (
                              <p className="text-xs text-gray-500">Special needs: {child.specialNeeds.join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(child.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add New Child Form */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Add a Child</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="child-firstName">First Name *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="child-firstName"
                        value={newChild.firstName}
                        onChange={(e) => {
                          if (e.target.value && !/^[a-zA-Z\s\-']*$/.test(e.target.value)) return;
                          setNewChild(prev => ({ ...prev, firstName: e.target.value }))
                        }}
                        placeholder="Emma"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="child-lastName">Last Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="child-lastName"
                        value={newChild.lastName}
                        onChange={(e) => {
                          if (e.target.value && !/^[a-zA-Z\s\-']*$/.test(e.target.value)) return;
                          setNewChild(prev => ({ ...prev, lastName: e.target.value }))
                        }}
                        placeholder={familyData.familyName || 'Johnson'}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="child-dob">Date of Birth *</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      <Input
                        id="child-dob"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={newChild.dateOfBirth ? new Date(newChild.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => setNewChild(prev => ({ ...prev, dateOfBirth: new Date(e.target.value) }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="child-gender">Gender</Label>
                    <Select value={newChild.gender} onValueChange={(value: any) => setNewChild(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="child-special-needs">Special Needs (Optional)</Label>
                  <Textarea
                    id="child-special-needs"
                    placeholder="Any special needs, medical conditions, or allergies..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <Button onClick={addChild} disabled={!newChild.firstName || !newChild.dateOfBirth} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </CardContent>
            </Card>

            {(familyData.children?.length || 0) === 0 && (
              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Please add at least one child</h4>
                      <p className="text-sm text-yellow-700">
                        You need to add at least one child to continue with the setup.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Custody & Details</h3>
            
            <div>
              <Label>What type of custody arrangement do you have?</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <Card
                  className={`cursor-pointer transition-all ${familyData.custodyArrangement === '50-50' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                  onClick={() => setFamilyData(prev => ({ ...prev, custodyArrangement: '50-50' }))}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium text-gray-800">50/50 Split</h4>
                    <p className="text-xs text-gray-600 mt-1">Equal time with both parents</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${familyData.custodyArrangement === 'primary-secondary' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                  onClick={() => setFamilyData(prev => ({ ...prev, custodyArrangement: 'primary-secondary' }))}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium text-gray-800">Primary/Secondary</h4>
                    <p className="text-xs text-gray-600 mt-1">One primary custodian</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${familyData.custodyArrangement === 'custom' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                  onClick={() => setFamilyData(prev => ({ ...prev, custodyArrangement: 'custom' }))}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium text-gray-800">Custom</h4>
                    <p className="text-xs text-gray-600 mt-1">Unique arrangement</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-6">
              <Label>Special Accommodations (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {[
                  'Long-distance co-parenting',
                  'Different time zones',
                  'Special medical needs',
                  'Dietary restrictions',
                  'Learning disabilities',
                  'Mental health considerations',
                  'Language barriers',
                  'Cultural considerations',
                  'Religious observances'
                ].map((accommodation) => (
                  <div key={accommodation} className="flex items-center space-x-3">
                    <Checkbox
                      checked={familyData.specialAccommodations?.includes(accommodation)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFamilyData(prev => ({
                            ...prev,
                            specialAccommodations: [...(prev.specialAccommodations || []), accommodation]
                          }));
                        } else {
                          setFamilyData(prev => ({
                            ...prev,
                            specialAccommodations: prev.specialAccommodations?.filter(a => a !== accommodation)
                          }));
                        }
                      }}
                    />
                    <Label className="font-normal cursor-pointer text-sm">{accommodation}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Review Your Information</h3>
            
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Family Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Parents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{familyData.parent1?.firstName} {familyData.parent1?.lastName}</p>
                      <p className="text-sm text-gray-600">{familyData.parent1?.email}</p>
                      <p className="text-sm text-gray-600">{familyData.parent1?.city}, {familyData.parent1?.state}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{familyData.parent2?.firstName} {familyData.parent2?.lastName}</p>
                      <p className="text-sm text-gray-600">{familyData.parent2?.email}</p>
                      <p className="text-sm text-gray-600">{familyData.parent2?.city}, {familyData.parent2?.state}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Children ({familyData.children?.length})</h4>
                  <div className="space-y-2">
                    {familyData.children?.map((child) => (
                      <div key={child.id} className="bg-gray-50 p-3 rounded flex items-center space-x-3">
                        <div className="w-10 h-10 bg-bridge-green rounded-full flex items-center justify-center text-white font-bold">
                          {child.firstName && child.firstName[0] ? child.firstName[0] : '?'}
                        </div>
                        <div>
                          <p className="font-medium">{child.firstName} {child.lastName}</p>
                          <p className="text-sm text-gray-600">Age {child.age}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Custody Arrangement</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {familyData.custodyArrangement === '50-50' ? '50/50 Split - Equal time with both parents' :
                     familyData.custodyArrangement === 'primary-secondary' ? 'Primary/Secondary - One primary custodian' :
                     'Custom arrangement'}
                  </p>
                </div>

                {familyData.specialAccommodations && familyData.specialAccommodations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Special Accommodations</h4>
                    <div className="flex flex-wrap gap-2">
                      {familyData.specialAccommodations.map((acc) => (
                        <span key={acc} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Ready to Start!</h4>
                    <p className="text-sm text-green-700">
                      Everything looks great! Click "Complete Setup" to start using Bridge with your family profile.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left">
            <AnimatedBridgette
              size="xl"
              expression={bridgetteExpression}
              animation={bridgetteExpression === 'celebrating' ? 'celebrate' : 'float'}
              showSpeechBubble={true}
              message={bridgetteMessage}
              position="center"
            />
          </div>

          {isSubmitting ? (
            <Card className="w-full shadow-2xl">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Setting Up Your Profile...</h3>
                  <p className="text-gray-600 text-lg">
                    Please wait while we finalize your family settings and prepare your dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Form Side */
            <Card className="w-full shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  {steps[currentStep].title}
                </CardTitle>
                <p className="text-gray-600">{steps[currentStep].description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {renderStepContent()}
                
                <div className="flex justify-between pt-6">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    disabled={currentStep === 0 && !onBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed() || isSubmitting}
                    className="bg-bridge-blue hover:bg-bridge-blue/90"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Setup
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyOnboarding;