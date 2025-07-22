import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Zap, Shield, Clock, Users, ArrowRight, History, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Help from '@/components/Help';
import UserDropdown from '@/components/UserDropdown';

// --- Custom Animations ---
// Add these to your global CSS (e.g., App.css or index.css):
// .animate-slide-in { animation: slideIn 1s cubic-bezier(0.23, 1, 0.32, 1) both; }
// .animate-fade-up { animation: fadeUp 1.2s cubic-bezier(0.23, 1, 0.32, 1) both; }
// .animate-tilt:hover { transform: rotate(-3deg) scale(1.04); transition: transform 0.3s; }
// .animate-glow { box-shadow: 0 0 16px 2px #6ee7b7, 0 0 32px 4px #a7f3d0; animation: glowPulse 2s infinite alternate; }
// .shine-btn { position: relative; overflow: hidden; }
// .shine-btn::after { content: ''; position: absolute; top: 0; left: -75%; width: 50%; height: 100%; background: linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 100%); transform: skewX(-20deg); animation: shine 2.5s infinite; }
// @keyframes slideIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
// @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
// @keyframes glowPulse { from { box-shadow: 0 0 8px 2px #6ee7b7; } to { box-shadow: 0 0 24px 8px #a7f3d0; } }
// @keyframes shine { 0% { left: -75%; } 100% { left: 125%; } }

// Animated SVG background component (mint/teal/green palette)
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <svg width="100%" height="100%" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-pulse-slow">
      <defs>
        <linearGradient id="bg-gradient-mint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="50%" stopColor="#f0fdfa" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>
      <ellipse cx="400" cy="200" rx="320" ry="180" fill="url(#bg-gradient-mint)" opacity="0.5">
        <animate attributeName="cx" values="400;600;400" dur="12s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="1200" cy="600" rx="260" ry="120" fill="#6ee7b7" opacity="0.22">
        <animate attributeName="cy" values="600;500;600" dur="10s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="900" cy="100" rx="180" ry="80" fill="#34d399" opacity="0.13">
        <animate attributeName="rx" values="180;220;180" dur="14s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  </div>
);

// Typewriter effect for main tagline (robust, no undefined)
const useTypewriter = (text, speed = 40) => {
  const [displayed, setDisplayed] = useState('');
  const intervalRef = useRef(null);
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplayed((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(intervalRef.current);
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [text, speed]);
  return displayed;
};

// New, professional taglines
const rotatingTaglines = [
  'Seamless Sybase to Oracle migration, powered by AI.',
  'Future-proof your data with secure, automated workflows.',
  'Accelerate transformation with zero data loss.',
  'Enterprise-grade reliability and compliance.',
  'Trusted by technology leaders worldwide.',
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  // Main tagline, spelling checked and rewritten
  const mainTaglineText = 'Effortless, Secure Sybase-to-Oracle Database Migration';
  const mainTagline = useTypewriter(mainTaglineText, 32);

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
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-teal-100 font-sans">
      <AnimatedBackground />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-emerald-500 animate-float" />
              <h1 className="text-2xl font-extrabold tracking-tight text-emerald-900 font-serif animate-slide-in">Sybase to Oracle Migration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowHelp(true)}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-900"
              >
                <HelpCircle className="h-4 w-4 animate-fade-in" />
                <span>Help</span>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" onClick={handleGoToHistory} className="text-emerald-600 hover:text-emerald-900">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  <UserDropdown />
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')} className="text-emerald-600 hover:text-emerald-900">
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
            <h2 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-400 mb-6 leading-tight animate-fade-in drop-shadow-lg animate-slide-in font-display shine-text">
              {mainTagline}
            </h2>
            <div className="h-10 mb-10 flex items-center justify-center">
              <span className="text-xl md:text-2xl text-emerald-700 font-medium transition-all duration-700 animate-fade-up animate-pulse">
                {rotatingTaglines[taglineIdx]}
              </span>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="shine-btn text-lg px-10 py-5 font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl animate-glow bg-gradient-to-r from-emerald-400 to-teal-400 text-white border-0"
              >
                Start Migration
                <ArrowRight className="ml-2 h-5 w-5 animate-fade-in" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/90">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-emerald-900 mb-4 font-serif animate-fade-in">Why Choose Our Platform?</h3>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto animate-fade-up">
              Harness advanced AI and automation for secure, reliable, and efficient Sybase-to-Oracle migration at scale.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards with hover animation */}
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-green-100 animate-fade-up animate-tilt">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-emerald-500 group-hover:scale-110 transition-transform animate-float animate-tilt" />
                  <CardTitle className="text-emerald-900">AI-Powered Conversion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-emerald-700">
                  Advanced AI models deliver precise, automated SQL conversion and intelligent error detection.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-green-100 animate-fade-up animate-tilt">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-teal-400 group-hover:scale-110 transition-transform animate-float animate-tilt" />
                  <CardTitle className="text-emerald-900">Comprehensive Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-emerald-700">
                  In-depth reports on data mapping, performance, and actionable recommendations for seamless migration.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-green-100 animate-fade-up animate-tilt">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-emerald-600 group-hover:scale-110 transition-transform animate-float animate-tilt" />
                  <CardTitle className="text-emerald-900">Security & Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-emerald-700">
                  Enterprise-grade security, encrypted data handling, and full compliance with industry standards.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-green-100 animate-fade-up animate-tilt">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-teal-300 group-hover:scale-110 transition-transform animate-float animate-tilt" />
                  <CardTitle className="text-emerald-900">Accelerated Timelines</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-emerald-700">
                  Reduce migration time from months to weeks with automation and optimized workflows.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-green-100 animate-fade-up animate-tilt">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-teal-200 group-hover:scale-110 transition-transform animate-float animate-tilt" />
                  <CardTitle className="text-emerald-900">Team Collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-emerald-700">
                  Multi-user support, project sharing, and collaborative review for enterprise teams.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group bg-white border-green-100 animate-fade-up animate-tilt">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-emerald-700 group-hover:scale-110 transition-transform animate-float animate-tilt" />
                  <CardTitle className="text-emerald-900">Direct Oracle Deployment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-emerald-700">
                  Seamless deployment to Oracle with automated testing and rollback capabilities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-100 via-teal-100 to-green-200 text-emerald-900 animate-fade-in">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-4 font-serif animate-fade-up">
            Ready to Future-Proof Your Database?
          </h3>
          <p className="text-2xl mb-8 opacity-90 animate-fade-up">
            Empower your business with secure, automated, and reliable migration to Oracle.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            variant="secondary"
            className="shine-btn text-lg px-10 py-5 font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl bg-emerald-500 text-white border-0 animate-glow"
          >
            Start Your Migration Today
            <ArrowRight className="ml-2 h-5 w-5 animate-float" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-emerald-700 text-sm border-t bg-white/80 mt-8">
        © 2025 Migration Platform. All rights reserved. Developed by CosmoAgents | <a href="https://www.github.com/steezyneo/oracle-ai-migrate" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>GitHub</a>
      </footer>
    </div>
  );
};

export default Landing;
