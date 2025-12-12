import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import AnimatedBridgette from '@/components/AnimatedBridgette';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.login(email, password);
      const token = response.access_token;
      localStorage.setItem('authToken', token);
      
      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
      });
      onLogin();
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('Error logging in:', error);
      toast({
        title: "Error",
        description: "Failed to log in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
        {/* Bridge-it Welcome */}
        <div className="text-center order-2 md:order-1">
          <AnimatedBridgette
            size="xl"
            expression="encouraging"
            animation="float"
            showSpeechBubble={true}
            message="Welcome back! Bridge-it is here to help you get organized and find balance. Let's get you signed in! ⚖️"
            position="center"
          />
        </div>

        {/* Login Form */}
        <Card className="w-full shadow-2xl order-1 md:order-2">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
              Welcome to Bridge-it! 👋
            </CardTitle>
            <p className="text-center text-sm sm:text-base text-gray-500 mt-1">Fair & Balanced Co-Parenting</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="placeholder:text-gray-400 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={isSubmitting} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-10 sm:h-11 text-sm sm:text-base"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
            <Separator />
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-blue-600 hover:underline">
                  Create one now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;