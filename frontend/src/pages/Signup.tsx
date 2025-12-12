import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingExplanation from '@/components/OnboardingExplanation';

interface SignupProps {
  onLogin?: (newSignup?: boolean) => void;
}

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    setIsSubmitting(true);
    try {
      await authAPI.signup({
        email,
        password,
        firstName,
        lastName,
      });
      
      // Auto-login after signup
      await authAPI.login(email, password);
      
      if (onLogin) {
        // Pass true to indicate this is a new signup
        onLogin(true);
      }

      toast({
        title: "Success!",
        description: "Your account has been created successfully!",
      });
      
      // Redirect to dashboard to start onboarding
      // Small delay to ensure state updates propagate
      setTimeout(() => {
        navigate('/dashboard', {
          replace: true,
          state: { newSignup: true }
        });
      }, 100);
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showExplanation) {
    return (
      <OnboardingExplanation
        onStartJourney={() => setShowExplanation(false)}
        onCancel={() => setShowExplanation(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex items-center justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowExplanation(true)}
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm px-2 sm:px-4 text-gray-500 hover:text-gray-800"
          >
            ← Back
          </Button>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
            Create Your Bridge Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              className="h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              autoComplete="new-password"
              className="h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          <Button 
            onClick={handleSignup} 
            disabled={isSubmitting} 
            className="w-full h-10 sm:h-11 text-sm sm:text-base"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;