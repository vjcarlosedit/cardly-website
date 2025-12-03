import { Button } from './ui/button';
import { ArrowRight, Scan, Brain, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const scrollToAdvantages = () => {
    const element = document.querySelector('#ventajas');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl mb-6 text-foreground max-w-4xl mx-auto">
            Aplicación inteligente de apuntes y repaso con IA
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Genera tarjetas de repaso automáticamente desde tus apuntes usando OCR e inteligencia artificial. 
            Optimiza tu tiempo de estudio y mejora tu retención de conocimientos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" onClick={handleGetStarted} className="group">
              Comienza Gratis
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToAdvantages}>
              Ver Ventajas
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-border">
              <Scan className="h-12 w-12 text-primary mb-4" />
              <h3 className="mb-2">Generación por OCR</h3>
              <p className="text-muted-foreground text-center">
                Escanea tus apuntes y obtén tarjetas de repaso automáticamente con reconocimiento de texto.
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-border">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="mb-2">Inteligencia Artificial</h3>
              <p className="text-muted-foreground text-center">
                La IA identifica conceptos clave y crea preguntas relevantes para optimizar tu aprendizaje.
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-border">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <h3 className="mb-2">Repaso Inteligente</h3>
              <p className="text-muted-foreground text-center">
                Sistema de repetición espaciada que se adapta a tu ritmo de aprendizaje y necesidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}