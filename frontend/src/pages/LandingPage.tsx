import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, DollarSign, FileText, Shield, Heart, Users, BookOpen, CheckCircle, ArrowRight, Sparkles, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-bridge-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/bridge-avatar.png" 
                  alt="Bridge Logo" 
                  className="w-8 h-8"
                />
                <h1 className="text-2xl font-bold text-bridge-black">
                  Bridge-it
                </h1>
              </div>
              <div className="hidden md:block text-sm text-bridge-black font-medium">
                Fair & Balanced Co-Parenting
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" className="border-bridge-blue text-bridge-blue hover:bg-bridge-blue hover:text-white">
                  Log In
                </Button>
              </Link>
              <Button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-bridge-blue to-bridge-green hover:from-blue-600 hover:to-green-600 text-black border-2 border-bridge-green"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl border-2 border-bridge-blue bg-white shadow-[0_25px_80px_rgba(59,130,246,0.25)] px-6 py-16 md:px-20 md:py-24 mb-12">
          <div className="absolute -top-40 -left-20 h-80 w-80 bg-gradient-to-br from-bridge-blue/40 via-bridge-green/30 to-transparent blur-3xl" aria-hidden="true"></div>
          <div className="absolute -bottom-48 -right-16 h-[28rem] w-[28rem] bg-gradient-to-tr from-purple-300/30 via-blue-300/20 to-transparent blur-3xl" aria-hidden="true"></div>

          <div className="relative text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-sm font-medium text-blue-700 mb-6">
              <Sparkles className="w-4 h-4 mr-2" /> Introducing Bridge-it — your AI co-parenting guide
            </div>

            <div className="flex justify-center mb-8">
              <img 
                src="/bridgette-avatar.png" 
                alt="Bridge-it AI Assistant" 
                className="w-36 h-36 md:w-44 md:h-44 bridgette-animated"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-bridge-black tracking-tight mb-6">
              Transform Co-Parenting with <span className="text-bridge-blue">Bridge-it</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Meet <strong>Bridge-it</strong>, the friendly assistant that keeps both parents aligned. From custody schedules to expenses and conversations, Bridge-it brings calm, clarity, and cooperation to every family.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <div className="flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2" /> AI-guided onboarding
              </div>
              <div className="flex items-center px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2" /> Shared custody calendar
              </div>
              <div className="flex items-center px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2" /> Court-ready documentation
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-blue-600 to-green-500 text-white text-lg px-10 py-6 shadow-lg"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/login">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-bridge-blue text-bridge-blue hover:bg-bridge-blue hover:text-white text-lg px-8 py-6"
                >
                  I Have an Account
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold mb-2">Peace of Mind</p>
                <p className="text-sm text-gray-600">Real-time updates keep both parents on the same page, reducing stress and misunderstandings.</p>
              </div>
              <div className="p-5 rounded-2xl bg-green-50 border border-green-100">
                <p className="text-xs uppercase tracking-wide text-green-500 font-semibold mb-2">Balanced Support</p>
                <p className="text-sm text-gray-600">Smart suggestions and reminders ensure responsibilities stay fair and child-focused.</p>
              </div>
              <div className="p-5 rounded-2xl bg-purple-50 border border-purple-100">
                <p className="text-xs uppercase tracking-wide text-purple-500 font-semibold mb-2">Built for Families</p>
                <p className="text-sm text-gray-600">Designed with therapists, mediators, and legal experts to support every kind of co-parenting journey.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="border-2 border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Scale className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-bridge-black mb-2">Fair & Balanced</h3>
              <p className="text-gray-600">
                Ensure equitable decisions and transparent tracking for both parents
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-bridge-black mb-2">Court-Ready Docs</h3>
              <p className="text-gray-600">
                Comprehensive audit logs and documentation for legal proceedings
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-bridge-black mb-2">Child-Focused</h3>
              <p className="text-gray-600">
                Every feature designed to prioritize your children's best interests
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-bridge-black mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools to simplify co-parenting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Smart Custody Calendar */}
            <Card className="border-2 border-green-300 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center text-bridge-black">
                  <Calendar className="w-6 h-6 mr-3 text-green-600" />
                  Smart Custody Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Color-coded events for custody days, holidays, school events, and medical appointments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Shared visibility—both parents always on the same page</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered conflict resolution for scheduling disputes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Secure Messaging */}
            <Card className="border-2 border-yellow-300 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center text-bridge-black">
                  <MessageSquare className="w-6 h-6 mr-3 text-yellow-600" />
                  Secure Messaging System
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Tone selection (matter-of-fact, friendly, or neutral legal)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Bridge-it mediates and suggests improvements to messages</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Immutable logging for court documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Expense Tracking */}
            <Card className="border-2 border-red-300 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                <CardTitle className="flex items-center text-bridge-black">
                  <DollarSign className="w-6 h-6 mr-3 text-red-600" />
                  Expense Tracking & Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-red-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Automatic split calculation based on custody agreement</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-red-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Receipt management with photo upload</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-red-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Structured dispute resolution process</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Document Management */}
            <Card className="border-2 border-blue-300 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center text-bridge-black">
                  <FileText className="w-6 h-6 mr-3 text-blue-600" />
                  Document Management & Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">AI parsing of custody agreements and divorce documents</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Comprehensive audit trail of all platform activities</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Printable court-ready documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bridgette AI Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
                  <h2 className="text-4xl font-bold text-bridge-black">
                    Meet Bridge-it, Your AI Assistant
                  </h2>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  Bridge-it is more than just a chatbot—it's your compassionate co-parenting companion that:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Guides you through setup with empathy and expertise</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Processes custody agreements and extracts key terms</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Provides educational resources and emotional support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Connects you with legal and therapeutic professionals</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <img 
                  src="/bridgette-avatar.png" 
                  alt="Bridge-it" 
                  className="w-64 h-64 animate-pulse"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Educational Resources Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-bridge-black mb-4">
              Educational & Support Resources
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access a comprehensive library of co-parenting tips, legal guidance, child psychology resources, 
              and connections to therapists, mediators, and legal professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Dual-Instance Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-bridge-black mb-6">
                Dual-Instance Architecture
              </h2>
              <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
                Each parent maintains their own app instance with personalized views and preferences, 
                while sharing core data like calendars, expenses, and documents. 
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-lg p-6 border-2 border-green-200">
                  <h3 className="text-xl font-bold text-bridge-black mb-3">Parent 1</h3>
                  <p className="text-gray-600">
                    Creates family account, generates unique 6-character Family Code, 
                    uploads custody agreement
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-bridge-black mb-3">Parent 2</h3>
                  <p className="text-gray-600">
                    Uses Family Code to link account, gains instant access to shared family data
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-bridge-blue to-bridge-green py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-bridge-black mb-6">
            Ready to Transform Your Co-Parenting Journey?
          </h2>
          <p className="text-xl text-bridge-black mb-8">
            Join thousands of parents who are making co-parenting easier, fairer, and more child-focused.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-white text-bridge-blue hover:bg-gray-100 text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/bridge-avatar.png" 
                  alt="Bridge Logo" 
                  className="w-8 h-8"
                />
                <h3 className="text-xl font-bold">Bridge-it</h3>
              </div>
              <p className="text-gray-400">
                Fair & Balanced Co-Parenting
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/features/smart-calendar" className="hover:text-white transition-colors">
                    Smart Calendar
                  </Link>
                </li>
                <li>
                  <Link to="/features/secure-messaging" className="hover:text-white transition-colors">
                    Secure Messaging
                  </Link>
                </li>
                <li>
                  <Link to="/features/expense-tracking" className="hover:text-white transition-colors">
                    Expense Tracking
                  </Link>
                </li>
                <li>
                  <Link to="/features/document-management" className="hover:text-white transition-colors">
                    Document Management
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Educational Articles</li>
                <li>Legal Guidance</li>
                <li>Professional Network</li>
                <li>Support Community</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bridge-it Co-Parenting Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

