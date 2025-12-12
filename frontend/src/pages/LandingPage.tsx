import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, DollarSign, FileText, Shield, Heart, Users, BookOpen, CheckCircle, ArrowRight, Sparkles, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-bridge-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/bridgette-avatar.png" 
                  alt="Bridge-it Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
                <h1 className="text-lg sm:text-2xl font-bold text-bridge-black">
                  Bridge-it
                </h1>
              </div>
              <div className="hidden md:block text-sm text-bridge-black font-medium">
                Fair & Balanced Co-Parenting
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-bridge-blue text-bridge-blue hover:bg-bridge-blue hover:text-white text-xs sm:text-sm px-2 sm:px-4"
                >
                  <span className="hidden sm:inline">Log In</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="bg-bridge-yellow hover:bg-bridge-yellow/90 text-bridge-blue border-2 border-bridge-yellow font-bold text-xs sm:text-sm px-2 sm:px-4 transition-all hover:scale-105"
                >
                  <span className="hidden sm:inline">Get Started Free</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-bridge-blue bg-white shadow-[0_25px_80px_rgba(59,130,246,0.25)] px-4 py-8 sm:px-6 sm:py-12 md:px-20 md:py-24 mb-8 sm:mb-12">
          <div className="absolute -top-40 -left-20 h-80 w-80 bg-gradient-to-br from-bridge-blue/40 via-bridge-green/30 to-transparent blur-3xl" aria-hidden="true"></div>
          <div className="absolute -bottom-48 -right-16 h-[28rem] w-[28rem] bg-gradient-to-tr from-purple-300/30 via-blue-300/20 to-transparent blur-3xl" aria-hidden="true"></div>

          <div className="relative text-center">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-50 border border-blue-200 text-xs sm:text-sm font-medium text-blue-700 mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> 
              <span className="hidden sm:inline">Introducing Bridge-it — your AI co-parenting guide</span>
              <span className="sm:hidden">AI Co-Parenting Guide</span>
            </div>

            <div className="flex justify-center mb-6 sm:mb-8">
              <img 
                src="/bridgette-avatar.png" 
                alt="Bridge-it AI Assistant" 
                className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 bridgette-animated"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-bridge-black tracking-tight mb-4 sm:mb-6 px-2">
              Transform Co-Parenting with <span className="text-bridge-blue">Bridge-it</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2">
              Meet <strong>Bridge-it</strong>, the friendly assistant that keeps both parents aligned. From custody schedules to expenses and conversations, Bridge-it brings calm, clarity, and cooperation to every family.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-12 px-2">
              <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" /> 
                <span className="whitespace-nowrap">AI-guided onboarding</span>
              </div>
              <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-50 text-green-700 text-xs sm:text-sm font-medium">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" /> 
                <span className="whitespace-nowrap">Shared calendar</span>
              </div>
              <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-50 text-purple-700 text-xs sm:text-sm font-medium">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" /> 
                <span className="whitespace-nowrap">Court-ready docs</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-2">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-bridge-blue hover:bg-bridge-blue/90 text-white text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-6 shadow-lg w-full sm:w-auto transition-all hover:scale-105"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-bridge-blue text-bridge-blue hover:bg-bridge-blue hover:text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                >
                  I Have an Account
                </Button>
              </Link>
            </div>

            <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold mb-2">Peace of Mind</p>
                <p className="text-xs sm:text-sm text-gray-600">Real-time updates keep both parents on the same page, reducing stress and misunderstandings.</p>
              </div>
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-green-50 border border-green-100">
                <p className="text-xs uppercase tracking-wide text-green-500 font-semibold mb-2">Balanced Support</p>
                <p className="text-xs sm:text-sm text-gray-600">Smart suggestions and reminders ensure responsibilities stay fair and child-focused.</p>
              </div>
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-purple-50 border border-purple-100">
                <p className="text-xs uppercase tracking-wide text-purple-500 font-semibold mb-2">Built for Families</p>
                <p className="text-xs sm:text-sm text-gray-600">Designed with therapists, mediators, and legal experts to support every kind of co-parenting journey.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-16">
          <Card className="border-2 border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <Scale className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-bridge-black mb-2">Fair & Balanced</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Ensure equitable decisions and transparent tracking for both parents
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-bridge-black mb-2">Court-Ready Docs</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Comprehensive audit logs and documentation for legal proceedings
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
            <CardContent className="p-4 sm:p-6 text-center">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-bridge-black mb-2">Child-Focused</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Every feature designed to prioritize your children's best interests
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-bridge-black mb-3 sm:mb-4 px-2">
              Everything You Need in <span className="text-bridge-blue">One Place</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 px-2">
              Comprehensive tools to simplify co-parenting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Smart Custody Calendar */}
            <Card className="border-2 border-bridge-green/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-bridge-green/10">
                <CardTitle className="flex items-center text-bridge-black">
                  <Calendar className="w-6 h-6 mr-3 text-bridge-green" />
                  Smart Custody Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-green mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Color-coded events for custody days, holidays, school events, and medical appointments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-green mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Shared visibility—both parents always on the same page</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-green mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered conflict resolution for scheduling disputes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Secure Messaging */}
            <Card className="border-2 border-bridge-yellow/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-bridge-yellow/10">
                <CardTitle className="flex items-center text-bridge-black">
                  <MessageSquare className="w-6 h-6 mr-3 text-bridge-yellow-dark" />
                  Secure Messaging System
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-yellow-dark mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Tone selection (matter-of-fact, friendly, or neutral legal)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-yellow-dark mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Bridge-it mediates and suggests improvements to messages</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-yellow-dark mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Immutable logging for court documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Expense Tracking */}
            <Card className="border-2 border-bridge-red/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-bridge-red/10">
                <CardTitle className="flex items-center text-bridge-black">
                  <DollarSign className="w-6 h-6 mr-3 text-bridge-red" />
                  Expense Tracking & Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-red mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Automatic split calculation based on custody agreement</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-red mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Receipt management with photo upload</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-red mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Structured dispute resolution process</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Document Management */}
            <Card className="border-2 border-bridge-blue/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-bridge-blue/10">
                <CardTitle className="flex items-center text-bridge-black">
                  <FileText className="w-6 h-6 mr-3 text-bridge-blue" />
                  Document Management & Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-blue mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">AI parsing of custody agreements and divorce documents</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-blue mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Comprehensive audit trail of all platform activities</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-bridge-blue mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Printable court-ready documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bridgette AI Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Card className="border-2 border-bridge-blue/30 bg-bridge-blue/5">
          <CardContent className="p-6 sm:p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-6 sm:mb-8 md:mb-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-bridge-blue mr-2 sm:mr-3 mb-2 sm:mb-0" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-bridge-black">
                    Meet <span className="text-bridge-blue">Bridge-it</span>, Your AI Assistant
                  </h2>
                </div>
                <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6">
                  Bridge-it is more than just a chatbot—it's your compassionate co-parenting companion that:
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Guides you through setup with empathy and expertise</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Processes custody agreements and extracts key terms</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Provides educational resources and emotional support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Connects you with legal and therapeutic professionals</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 flex justify-center mt-6 md:mt-0">
                <img 
                  src="/bridgette-avatar.png" 
                  alt="Bridge-it" 
                  className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-pulse"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Educational Resources Section */}
      <section className="bg-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-bridge-black mb-3 sm:mb-4 px-2">
              Educational & Support Resources
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Access a comprehensive library of co-parenting tips, legal guidance, child psychology resources, 
              and connections to therapists, mediators, and legal professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Dual-Instance Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <Card className="border-2 border-bridge-green/30 bg-bridge-green/5">
          <CardContent className="p-6 sm:p-8 md:p-12">
            <div className="text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-bridge-green mx-auto mb-4 sm:mb-6" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-bridge-green mb-4 sm:mb-6 px-2">
                Dual-Instance Architecture
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 max-w-3xl mx-auto px-2">
                Each parent maintains their own app instance with personalized views and preferences, 
                while sharing core data like calendars, expenses, and documents. 
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-green-200">
                  <h3 className="text-lg sm:text-xl font-bold text-bridge-black mb-2 sm:mb-3">Parent 1</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Creates family account, generates unique 6-character Family Code, 
                    uploads custody agreement
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-blue-200">
                  <h3 className="text-lg sm:text-xl font-bold text-bridge-black mb-2 sm:mb-3">Parent 2</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Uses Family Code to link account, gains instant access to shared family data
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="bg-bridge-blue py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-bridge-green/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
            Ready to Transform Your Co-Parenting Journey?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 px-2">
            Join thousands of parents who are making co-parenting easier, fairer, and more child-focused.
          </p>
          <div className="flex justify-center">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-bridge-yellow text-bridge-blue hover:bg-bridge-yellow/90 hover:scale-105 transition-all text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto font-bold"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <img 
                  src="/bridgette-avatar.png" 
                  alt="Bridge-it Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
                <h3 className="text-lg sm:text-xl font-bold">Bridge-it</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-400">
                Fair & Balanced Co-Parenting
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Features</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
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
              <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <li>Educational Articles</li>
                <li>Legal Guidance</li>
                <li>Professional Network</li>
                <li>Support Community</li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-400">
            <p>&copy; 2025 Bridge-it Co-Parenting Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

