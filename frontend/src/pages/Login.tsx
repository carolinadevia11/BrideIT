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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Bridge-it Welcome */}
        <div className="text-center">
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
        <Card className="w-full shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 text-center">
              Welcome to Bridge-it! 👋
            </CardTitle>
            <p className="text-center text-gray-500">Fair & Balanced Co-Parenting</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your email address"
                autoComplete="email"
                autoFocus
                className="placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="placeholder:text-gray-400"
              />
            </div>
            <Button onClick={handleLogin} disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
            <Separator />
            <div className="text-center">
              <p className="text-sm text-gray-600">
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