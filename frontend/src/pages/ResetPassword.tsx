import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import AnimatedBridgette from '@/components/AnimatedBridgette';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "The password reset link is invalid or has expired.",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your new password.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
        toast({
            title: "Password too short",
            description: "Password must be at least 8 characters long.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword(token, password);
      
      toast({
        title: "Success!",
        description: "Your password has been reset successfully. Please login with your new password.",
      });
      
      // Redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password. The link may have expired.",
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

  if (!token) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader>
                    <CardTitle className="text-red-600 text-center">Invalid Link</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">The password reset link is invalid or missing.</p>
                    <Link to="/forgot-password">
                        <Button variant="outline">Request New Link</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
        {/* Bridge-it Welcome */}
        <div className="text-center order-2 md:order-1">
          <AnimatedBridgette
            size="xl"
            expression="celebrating"
            animation="bounce"
            showSpeechBubble={true}
            message="Almost there! Set your new password and you'll be back in no time. 🎉"
            position="center"
          />
        </div>

        {/* Reset Password Form */}
        <Card className="w-full shadow-2xl order-1 md:order-2">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
              Reset Password 🔒
            </CardTitle>
            <p className="text-center text-sm sm:text-base text-gray-500 mt-1">
              Create a new password for your account
            </p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter new password"
                autoFocus
                className="placeholder:text-gray-400 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Confirm new password"
                className="placeholder:text-gray-400 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-bridge-blue hover:bg-bridge-blue/90 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
            
            <Separator />
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
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

export default ResetPassword;