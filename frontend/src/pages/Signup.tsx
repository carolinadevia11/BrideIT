import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingExplanation from '@/components/OnboardingExplanation';
import AnimatedBridgette from '@/components/AnimatedBridgette';
import { ArrowRight, ArrowLeft, Check, Smartphone, User, Globe, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SignupProps {
  onLogin?: (newSignup?: boolean) => void;
}

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Steps: 0 = Welcome, 1 = Basic Info, 2 = Quick Setup
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    timezone: '',
    termsAccepted: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate Step 1
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields to continue.",
          variant: "destructive",
        });
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSignup = async (skipOptional = false) => {
    if (!skipOptional && currentStep === 2 && !formData.termsAccepted) {
       toast({
          title: "Terms Required",
          description: "Please accept the terms and conditions to create your account.",
          variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        // Only include optional fields if not skipping and they exist
        ...( !skipOptional && formData.phone ? { phone: formData.phone } : {} ),
        ...( !skipOptional && formData.timezone ? { timezone: formData.timezone } : {} ),
      };

      await authAPI.signup(payload);
      
      // Auto-login after signup
      await authAPI.login(formData.email, formData.password);
      
      if (onLogin) {
        onLogin(true);
      }

      toast({
        title: "Welcome to Bridge-it!",
        description: "Your account has been created successfully.",
      });
      
      // Small delay for celebration animation
      setTimeout(() => {
        navigate('/dashboard', {
          replace: true,
          state: { newSignup: true }
        });
      }, 1000);

    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Step 0: Welcome Screen (using the component we updated)
  if (currentStep === 0) {
    return (
      <OnboardingExplanation
        onStartJourney={() => setCurrentStep(1)}
        onCancel={() => setCurrentStep(1)} // "Skip for Now" goes straight to Step 1
      />
    );
  }

  // Calculate Progress (Step 1 is 50%, Step 2 is 100% visually, but logically 1/2 and 2/2)
  const progressValue = ((currentStep) / 2) * 100;

  // Bridgette Configuration per Step
  const getBridgetteConfig = () => {
    if (currentStep === 1) {
      return {
        message: "First things first! I just need your name and email to create your secure private space. 🛡️",
        expression: "encouraging" as const,
        animation: "float" as const
      };
    } else {
      return {
        message: "Almost there! Adding a phone number helps secure your account, but you can skip this if you're in a rush! 🏃💨",
        expression: "happy" as const,
        animation: "bounce" as const
      };
    }
  };

  const bridgetteConfig = getBridgetteConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
        
        {/* Left Side: Bridgette (Hidden on small screens, shown on large) */}
        <div className="hidden lg:flex flex-1 flex-col items-center text-center">
            <AnimatedBridgette
                size="xl"
                expression={bridgetteConfig.expression}
                animation={bridgetteConfig.animation}
                showSpeechBubble={true}
                message={bridgetteConfig.message}
                position="center"
            />
        </div>

        {/* Right Side: Form Card */}
        <div className="flex-1 w-full max-w-md mx-auto">
             {/* Progress Bar with Skip Option */}
            <div className="mb-6 space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="font-medium">Step {currentStep} of 2</span>
                    {currentStep === 2 && (
                        <button onClick={() => handleSignup(true)} className="text-gray-400 hover:text-gray-600 underline text-xs">
                            Skip this step
                        </button>
                    )}
                </div>
                <Progress value={progressValue} className="h-2" />
            </div>

            <Card className="shadow-2xl border-t-4 border-t-bridge-blue">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {currentStep === 1 ? "Basic Information" : "Quick Setup"}
                    </CardTitle>
                    <p className="text-center text-gray-500 text-sm">
                        {currentStep === 1 ? "Create your account" : "Customize your experience"}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* Mobile Bridgette (Small) */}
                    <div className="lg:hidden flex justify-center mb-4">
                         <AnimatedBridgette
                            size="md"
                            expression={bridgetteConfig.expression}
                            animation="idle"
                            showSpeechBubble={true}
                            bubblePosition="bottom"
                            message={bridgetteConfig.message}
                            position="center"
                        />
                    </div>

                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="firstName" 
                                            placeholder="Jane" 
                                            className="pl-9"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        placeholder="Doe" 
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        className="pl-9"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-9 pr-9"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Quick Setup */}
                    {currentStep === 2 && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (Optional)</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="phone" 
                                        type="tel" 
                                        placeholder="+1 (555) 000-0000"
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <div className="relative">
                                     <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                    <Select 
                                        value={formData.timezone} 
                                        onValueChange={(value) => handleInputChange('timezone', value)}
                                    >
                                        <SelectTrigger className="pl-9">
                                            <SelectValue placeholder="Select your timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                                            <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                                            <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                                            <SelectItem value="MST">MST (Mountain Standard Time)</SelectItem>
                                            <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                                            {/* Add more as needed */}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2 pt-2">
                                <Checkbox 
                                    id="terms" 
                                    checked={formData.termsAccepted}
                                    onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                                />
                                <Label htmlFor="terms" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                                </Label>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="pt-4 flex flex-col gap-3">
                         {currentStep === 1 ? (
                            <Button 
                                onClick={handleNext}
                                className="w-full h-11 text-base bg-bridge-blue hover:bg-bridge-blue/90"
                            >
                                Continue to Quick Setup <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                         ) : (
                             <Button 
                                onClick={() => handleSignup(false)}
                                disabled={isSubmitting || !formData.termsAccepted}
                                className="w-full h-11 text-base bg-gradient-to-r from-bridge-blue to-bridge-green hover:opacity-90 transition-all shadow-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup <Check className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                         )}

                         {/* Back / Login Links */}
                         <div className="flex justify-between items-center text-sm pt-2">
                            {currentStep === 2 ? (
                                <button 
                                    onClick={handleBack}
                                    className="text-gray-500 hover:text-gray-800 flex items-center"
                                >
                                    <ArrowLeft className="mr-1 h-3 w-3" /> Back
                                </button>
                            ) : (
                                <div></div> // Spacer
                            )}
                            
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                                    Log in
                                </Link>
                            </p>
                         </div>
                    </div>

                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;