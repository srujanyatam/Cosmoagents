import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Zap, Shield, Clock, Users, ArrowRight, History, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Help from '@/components/Help';
import UserDropdown from '@/components/UserDropdown';

// Animated SVG background component (light, cool palette)
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <svg width="100%" height="100%" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-pulse-slow">
      <defs>
        <linearGradient id="bg-gradient-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
      </defs>
      <ellipse cx="400" cy="200" rx="320" ry="180" fill="url(#bg-gradient-light)" opacity="0.5">
        <animate attributeName="cx" values="400;600;400" dur="12s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="1200" cy="600" rx="260" ry="120" fill="#7dd3fc" opacity="0.25">
        <animate attributeName="cy" values="600;500;600" dur="10s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="900" cy="100" rx="180" ry="80" fill="#38bdf8" opacity="0.15">
        <animate attributeName="rx" values="180;220;180" dur="14s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  </div>
);

// Typewriter effect for main tagline
const useTypewriter = (text: string, speed = 40) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
};

// Rotating sub-taglines (spelling/grammar checked)
const rotatingTaglines = [
  'Enterprise-Grade Security and Compliance',
  'Seamless, Automated Database Migration',
  'Accelerate Your Digital Transformation',
  'Zero Data Loss, Maximum Uptime',
  'Trusted by Leading Enterprises',
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const mainTagline = useTypewriter('Modernize Your Sybase Database with Enterprise-Grade Oracle Migration', 32);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIdx((idx) => (idx + 1) % rotatingTaglines.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/migration');
    } else {
      navigate('/auth');
    }
  };

  const handleGoToHistory = () => {
    if (user) {
      navigate('/history', { state: { fromLanding: true } });
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-sky-100 via-white to-blue-100">
      <AnimatedBackground />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-sky-500" />
              <h1 className="text-2xl font-extrabold tracking-tight text-blue-900 font-serif">Sybase to Oracle Migration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowHelp(true)}
                className="flex items-center space-x-2 text-sky-600 hover:text-blue-900"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" onClick={handleGoToHistory} className="text-sky-600 hover:text-blue-900">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  <UserDropdown />
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')} className="text-sky-600 hover:text-blue-900">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-extrabold font-serif text-blue-900 mb-6 leading-tight animate-fade-in drop-shadow-lg">
              {mainTagline}
            </h2>
            <div className="h-10 mb-10 flex items-center justify-center">
              <span className="text-xl md:text-2xl text-sky-700 font-medium transition-all duration-700 animate-fade-in-slow">
                {rotatingTaglines[taglineIdx]}
              </span>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="text-lg px-10 py-5 font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl animate-bounce-slow bg-gradient-to-r from-sky-400 to-blue-400 text-white border-0"
              >
                Start Migration
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/90">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-blue-900 mb-4 font-serif">Why Enterprises Choose Our Platform</h3>
            <p className="text-lg text-sky-700 max-w-2xl mx-auto">
              Harness advanced AI and automation for secure, reliable, and efficient Sybase-to-Oracle migration at scale.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards with hover animation */}
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-sky-500 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-blue-900">AI-Driven Conversion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-sky-700">
                  State-of-the-art AI models ensure accurate, automated SQL conversion and intelligent error detection.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-blue-900">Comprehensive Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-sky-700">
                  In-depth reports on data mapping, performance, and actionable recommendations for seamless migration.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-sky-600 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-blue-900">Security & Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-sky-700">
                  Enterprise-grade security, encrypted data handling, and full compliance with industry standards.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-blue-300 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-blue-900">Accelerated Timelines</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-sky-700">
                  Reduce migration time from months to weeks with automation and optimized workflows.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-200 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-blue-900">Team Collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-sky-700">
                  Multi-user support, project sharing, and collaborative review for enterprise teams.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-sky-700 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-blue-900">Direct Oracle Deployment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-sky-700">
                  Seamless deployment to Oracle with automated testing and rollback capabilities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-sky-100 via-blue-100 to-sky-200 text-blue-900 animate-fade-in">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-4 font-serif">
            Ready to Modernize Your Database?
          </h3>
          <p className="text-2xl mb-8 opacity-90">
            Empower your business with secure, automated, and reliable migration to Oracle.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            variant="secondary"
            className="text-lg px-10 py-5 font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl bg-blue-500 text-white border-0"
          >
            Start Your Migration Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-sky-700 text-sm border-t bg-white/80 mt-8">
        © 2025 Migration Platform. All rights reserved. Developed by CosmoAgents | <a href="https://www.github.com/steezyneo/oracle-ai-migrate" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>GitHub</a>
      </footer>
    </div>
  );
};

export default Landing;
