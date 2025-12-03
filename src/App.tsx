import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { AdvantagesSection } from './components/AdvantagesSection';
import { AboutSection } from './components/AboutSection';
import { PricingSection } from './components/PricingSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado (por token o localStorage legacy)
    const token = localStorage.getItem('cardly_token');
    const user = localStorage.getItem('cardly_user');
    if (token || user) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  // Si está autenticado, mostrar dashboard
  if (isAuthenticated) {
    return (
      <>
        <Dashboard />
        <Toaster />
      </>
    );
  }

  // Si está en página de autenticación
  if (showAuth) {
    return (
      <>
        <AuthPage 
          onBack={() => setShowAuth(false)} 
          onAuthSuccess={handleAuthSuccess}
        />
        <Toaster />
      </>
    );
  }

  // Landing page por defecto
  return (
    <div className="min-h-screen">
      <Navigation onGetStarted={() => setShowAuth(true)} />
      <main>
        <HeroSection onGetStarted={() => setShowAuth(true)} />
        <AdvantagesSection />
        <AboutSection />
        <PricingSection onGetStarted={() => setShowAuth(true)} />
        <ContactSection />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}