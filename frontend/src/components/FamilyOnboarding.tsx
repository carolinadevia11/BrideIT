import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Users, MapPin, Clock, Heart, Baby, Home, CheckCircle, Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';
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
}

const FamilyOnboarding: React.FC<FamilyOnboardingProps> = ({ onComplete, initialUserData }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bridgetteExpression, setBridgetteExpression] = useState<'thinking' | 'encouraging' | 'celebrating' | 'balanced' | 'mediating'>('encouraging');
  const [bridgetteMessage, setBridgetteMessage] = useState("Hi! Bridge-it is so excited to help you set up your family profile! This will help Bridge-it organize everything perfectly for your unique situation! 🌟");

  const [familyData, setFamilyData] = useState<Partial<FamilyProfile>>({
    familyName: initialUserData ? `${initialUserData.lastName} Family` : '',
    parent1: {
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
    parent2: {
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
    children: [],
    differentTimezones: false,
    specialAccommodations: [],
    custodyArrangement: '50-50',
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
      title: 'Welcome to Bridge-it! 🌟',
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
      id: 'geography',
      title: 'Location Information',
      description: 'Tell us about different locations (if applicable)'
    },
    {
      id: 'custody',
      title: 'Custody Arrangement',
      description: 'Basic custody information'
    },
    {
      id: 'special',
      title: 'Special Accommodations',
      description: 'Any special needs or considerations'
    },
    {
      id: 'review',
      title: 'Review & Confirm',
      description: 'Make sure everything looks good'
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateParent1 = (field: string, value: string) => {
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
    }
  };

  const updateBridgetteForStep = (step: number) => {
    const messages = [
      "Hi! Bridge-it is so excited to help you set up your family profile! This will help Bridge-it organize everything perfectly for your unique situation! 🌟",
      "Great! Let's start with the first parent's information. This helps Bridge-it understand your family structure! 👤",
      "Perfect! Now let's get the second parent's information. Almost there! 👥",
      "Understanding where everyone lives helps Bridge-it manage schedules across different locations! 🗺️",
      "Now the most important part - tell Bridge-it about your wonderful children! Bridge-it will help organize everything for each of them! 👶",
      "Understanding your custody arrangement helps Bridge-it set up the calendar correctly! 📅",
      "Let Bridge-it know about any special needs or accommodations so Bridge-it can help you better! ❤️",
      "Let's review everything to make sure it's perfect! You're almost ready to start using Bridge-it! ✨"
    ];
    setBridgetteMessage(messages[step]);
    setBridgetteExpression(step === steps.length - 1 ? 'celebrating' : 'encouraging');
  };

  const completeOnboarding = () => {
    // Don't create family in backend yet - just pass data to parent component
    // Family will be created in FamilyCodeSetup component
    setBridgetteExpression('celebrating');
    setBridgetteMessage("Perfect! Now Bridge-it will generate your Family Code! 🎉");
    
    const completedProfile: FamilyProfile = {
      id: Date.now().toString(),
      familyName: familyData.familyName || `${familyData.parent1?.lastName} Family`,
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
      onboardingCompleted: false,
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
        return true; // Geography step - optional
      case 3:
        return (familyData.children?.length || 0) > 0;
      case 4:
        return familyData.custodyArrangement;
      case 5:
        return true;
      case 6:
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
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Bridge-it!</h2>
              <p className="text-gray-600 mb-6">
                Let's set up your family profile so I can help you organize your co-parenting journey effectively.
                This will only take a few minutes!
              </p>
            </div>

            <div>
              <Label htmlFor="familyName">Family Name (Optional)</Label>
              <Input
                id="familyName"
                value={familyData.familyName}
                onChange={(e) => setFamilyData(prev => ({ ...prev, familyName: e.target.value }))}
                placeholder="e.g., Johnson Family"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">This helps identify your family in the system</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800">Parent Info</h3>
                  <p className="text-xs text-gray-600">Contact details for both parents</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200">
                <CardContent className="p-4 text-center">
                  <Baby className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800">Children</h3>
                  <p className="text-xs text-gray-600">Information about your kids</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800">Locations</h3>
                  <p className="text-xs text-gray-600">Addresses and time zones</p>
                </CardContent>
              </Card>
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
                <Input
                  id="p1-firstName"
                  value={familyData.parent1?.firstName}
                  onChange={(e) => updateParent1('firstName', e.target.value)}
                  placeholder="Sarah"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="p1-lastName">Last Name *</Label>
                <Input
                  id="p1-lastName"
                  value={familyData.parent1?.lastName}
                  onChange={(e) => updateParent1('lastName', e.target.value)}
                  placeholder="Johnson"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p1-email">Email *</Label>
                <Input
                  id="p1-email"
                  type="email"
                  value={familyData.parent1?.email}
                  onChange={(e) => updateParent1('email', e.target.value)}
                  placeholder="sarah@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="p1-phone">Phone</Label>
                <Input
                  id="p1-phone"
                  type="tel"
                  value={familyData.parent1?.phone}
                  onChange={(e) => updateParent1('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="p1-address">Street Address</Label>
              <Input
                id="p1-address"
                value={familyData.parent1?.address}
                onChange={(e) => updateParent1('address', e.target.value)}
                placeholder="123 Main St"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p1-city">City</Label>
                <Input
                  id="p1-city"
                  value={familyData.parent1?.city}
                  onChange={(e) => updateParent1('city', e.target.value)}
                  placeholder="Seattle"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="p1-state">State</Label>
                <Input
                  id="p1-state"
                  value={familyData.parent1?.state}
                  onChange={(e) => updateParent1('state', e.target.value)}
                  placeholder="WA"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="p1-zip">ZIP Code</Label>
                <Input
                  id="p1-zip"
                  value={familyData.parent1?.zipCode}
                  onChange={(e) => updateParent1('zipCode', e.target.value)}
                  placeholder="98101"
                  className="mt-1"
                />
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Your Location</h3>
            
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Home className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-800">Your Address</h4>
                    <p className="text-sm text-gray-600">
                      {familyData.parent1?.address && `${familyData.parent1.address}, `}
                      {familyData.parent1?.city}, {familyData.parent1?.state} {familyData.parent1?.zipCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Timezone: {familyData.parent1?.timezone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">About Your Co-Parent</h4>
                    <p className="text-sm text-green-700">
                      Your co-parent will create their own account and link to your family using the Family Code we'll generate for you. They'll add their own location information when they join.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
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
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
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
                    <Input
                      id="child-firstName"
                      value={newChild.firstName}
                      onChange={(e) => setNewChild(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Emma"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="child-lastName">Last Name</Label>
                    <Input
                      id="child-lastName"
                      value={newChild.lastName}
                      onChange={(e) => setNewChild(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder={familyData.familyName || 'Johnson'}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="child-dob">Date of Birth *</Label>
                    <Input
                      id="child-dob"
                      type="date"
                      value={newChild.dateOfBirth ? new Date(newChild.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => setNewChild(prev => ({ ...prev, dateOfBirth: new Date(e.target.value) }))}
                      className="mt-1"
                    />
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

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Custody Arrangement</h3>
            
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

            <div>
              <Label htmlFor="custody-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="custody-notes"
                value={familyData.custodyNotes}
                onChange={(e) => setFamilyData(prev => ({ ...prev, custodyNotes: e.target.value }))}
                placeholder="Any specific details about your custody arrangement..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Special Accommodations</h3>
            
            <div>
              <Label>Do any of these apply to your family?</Label>
              <div className="space-y-3 mt-3">
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
                    <Label className="font-normal cursor-pointer">{accommodation}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
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
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {child.firstName[0]}
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
                      Everything looks great! Click "Complete Setup" to start using Bridge-it with your family profile.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
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

          {/* Form Side */}
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
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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
        </div>
      </div>
    </div>
  );
};

export default FamilyOnboarding;