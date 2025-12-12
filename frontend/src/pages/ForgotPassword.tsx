import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import AnimatedBridgette from '@/components/AnimatedBridgette';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.forgotPassword(email);
      setIsSubmitted(true);
      toast({
        title: "Request Sent",
        description: "If an account exists with that email, you will receive a password reset link shortly.",
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
        {/* Bridge-it Welcome */}
        <div className="text-center order-2 md:order-1">
          <AnimatedBridgette
            size="xl"
            expression="thinking"
            animation="float"
            showSpeechBubble={true}
            message="Don't worry! It happens to everyone. Let's get you back into your account. 🔐"
            position="center"
          />
        </div>

        {/* Forgot Password Form */}
        <Card className="w-full shadow-2xl order-1 md:order-2">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
              Forgot Password? 🔑
            </CardTitle>
            <p className="text-center text-sm sm:text-base text-gray-500 mt-1">
              Enter your email to reset your password
            </p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {!isSubmitted ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    autoFocus
                    className="placeholder:text-gray-400 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-bridge-blue hover:bg-bridge-blue/90 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200"
                >
                  {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1">We've sent password reset instructions to {email}.</p>
                </div>
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                >
                  Try another email
                </Button>
              </div>
            )}
            
            <Separator />
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;