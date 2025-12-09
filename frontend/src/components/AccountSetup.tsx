import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AnimatedBridgette from './AnimatedBridgette';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AccountSetupProps {
  onComplete: (userData: { firstName: string; lastName: string; email: string }) => void;
}

const AccountSetup: React.FC<AccountSetupProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bridgetteExpression, setBridgetteExpression] = useState<'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'waving'>('waving');
  const [bridgetteMessage, setBridgetteMessage] = useState("Hi there! Bridge-it is so excited to help you create your Bridge-it account! Let's get started! 🌟");

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    timezone: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    privacy: {
      terms: false,
      privacy: false,
      marketing: false
    }
  });

  const steps = [
    {
      title: "Let's create your account!",
      subtitle: "Tell me a bit about yourself",
      fields: ['firstName', 'lastName', 'email', 'password', 'confirmPassword']
    },
    {
      title: "Almost there!",
      subtitle: "Just a few more details",
      fields: ['phone', 'timezone']
    },
    {
      title: "Customize your experience",
      subtitle: "How would you like to stay connected?",
      fields: ['notifications']
    },
    {
      title: "Privacy & Terms",
      subtitle: "Let's keep your family safe",
      fields: ['privacy']
    }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update Bridgette's expression based on user actions
    if (field === 'firstName' && value) {
      setBridgetteExpression('happy');
      setBridgetteMessage(`Nice to meet you, ${value}! 😊`);
    } else if (field === 'email' && value.includes('@')) {
      setBridgetteExpression('encouraging');
      setBridgetteMessage("Great! That email looks perfect! 📧");
    } else if (field === 'password' && value.length >= 8) {
      setBridgetteExpression('encouraging');
      setBridgetteMessage("Strong password! Your account will be super secure! 🔒");
    }
  };

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setBridgetteExpression('celebrating');
      setBridgetteMessage("Awesome! You're doing great! Let's keep going! ✨");
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setBridgetteExpression('encouraging');
        setBridgetteMessage(getStepMessage(currentStep + 1));
      }, 1000);
    } else {
      // Last step - create account and login
      setIsSubmitting(true);
      try {
        // Create account
        await authAPI.signup({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        });

        // Auto-login after signup
        await authAPI.login(formData.email, formData.password);

      setBridgetteExpression('celebrating');
      setBridgetteMessage("🎉 Welcome to Bridge-it! Your account is all set up and ready to go!");
        
        toast({
          title: "Success!",
          description: "Your account has been created and you're logged in!",
        });

      setTimeout(() => {
          onComplete({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email
          });
      }, 2000);
      } catch (error) {
        console.error('Error creating account:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setBridgetteExpression('thinking');
      setBridgetteMessage("No problem! Let's go back and make sure everything is perfect!");
    }
  };

  const getStepMessage = (step: number) => {
    const messages = [
      "Hi there! Bridge-it is so excited to help you create your Bridge-it account! Let's get started! 🌟",
      "You're doing amazing! Just a couple more details and we'll have you all set up! 📱",
      "Perfect! Now let's make sure you get all the important updates about your co-parenting journey! 🔔",
      "Last step! Let's make sure your family's information stays safe and secure! 🛡️"
    ];
    return messages[step] || messages[0];
  };

  const canProceed = () => {
    const step = steps[currentStep];
    if (step.fields.includes('firstName') && !formData.firstName) return false;
    if (step.fields.includes('lastName') && !formData.lastName) return false;
    if (step.fields.includes('email') && !formData.email.includes('@')) return false;
    if (step.fields.includes('password') && formData.password.length < 8) return false;
    if (step.fields.includes('confirmPassword') && formData.password !== formData.confirmPassword) return false;
    if (step.fields.includes('privacy') && !formData.privacy.terms) return false;
    if (step.fields.includes('privacy') && !formData.privacy.privacy) return false;
    return true;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Your first name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Your last name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="pl-10"
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">For important notifications and account security</p>
            </div>

            <div>
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={formData.timezone} onValueChange={(value) => updateFormData('timezone', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                  <SelectItem value="CST">Central Time (CST)</SelectItem>
                  <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                  <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-4">How would you like to receive notifications?</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="email-notifications"
                    checked={formData.notifications.email}
                    onCheckedChange={(checked) => updateFormData('notifications', {
                      ...formData.notifications,
                      email: checked
                    })}
                  />
                  <Label htmlFor="email-notifications" className="flex-1">
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-500">Get updates about messages, calendar changes, and expenses</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sms-notifications"
                    checked={formData.notifications.sms}
                    onCheckedChange={(checked) => updateFormData('notifications', {
                      ...formData.notifications,
                      sms: checked
                    })}
                  />
                  <Label htmlFor="sms-notifications" className="flex-1">
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-gray-500">Urgent updates via text message</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="push-notifications"
                    checked={formData.notifications.push}
                    onCheckedChange={(checked) => updateFormData('notifications', {
                      ...formData.notifications,
                      push: checked
                    })}
                  />
                  <Label htmlFor="push-notifications" className="flex-1">
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-gray-500">Real-time alerts on your device</div>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Privacy & Terms</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.privacy.terms}
                    onCheckedChange={(checked) => updateFormData('privacy', {
                      ...formData.privacy,
                      terms: checked
                    })}
                  />
                  <Label htmlFor="terms" className="flex-1 text-sm">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacy.privacy}
                    onCheckedChange={(checked) => updateFormData('privacy', {
                      ...formData.privacy,
                      privacy: checked
                    })}
                  />
                  <Label htmlFor="privacy" className="flex-1 text-sm">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={formData.privacy.marketing}
                    onCheckedChange={(checked) => updateFormData('privacy', {
                      ...formData.privacy,
                      marketing: checked
                    })}
                  />
                  <Label htmlFor="marketing" className="flex-1 text-sm">
                    I'd like to receive helpful co-parenting tips and updates (optional)
                  </Label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Your Privacy Matters</p>
                  <p className="text-blue-700">We use bank-level encryption to protect your family's information. Your data is never shared without your permission.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {steps[currentStep].title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{steps[currentStep].subtitle}</p>
                </div>
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderStepContent()}
              
              <div className="flex justify-between pt-6">
                <Button 
                  onClick={prevStep} 
                  variant="outline"
                  disabled={currentStep === 0}
                >
                  Back
                </Button>
                
                <Button 
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSubmitting ? 'Creating Account...' : currentStep === steps.length - 1 ? 'Create Account!' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountSetup;