import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Check, X, Star } from 'lucide-react';

interface PricingSectionProps {
  onGetStarted?: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const plans = [
    {
      name: 'Gratis',
      price: '$0',
      period: 'para siempre',
      description: 'Perfecto para empezar a explorar Cardly',
      features: [
        { name: '10 generaciones con IA', included: true, limited: true },
        { name: 'Hasta 10 colecciones', included: true, limited: true },
        { name: 'OCR básico', included: true },
        { name: 'Repetición espaciada', included: true },
        { name: 'Sincronización en la nube', included: false },
        { name: 'Soporte prioritario', included: false },
      ],
      highlighted: false,
      buttonText: 'Comenzar Gratis'
    },
    {
      name: 'Trimestral',
      price: '$29',
      period: 'cada 3 meses',
      description: 'Ideal para un semestre académico',
      features: [
        { name: 'IA ilimitada', included: true },
        { name: 'Colecciones ilimitadas', included: true },
        { name: 'OCR avanzado', included: true },
        { name: 'Repetición espaciada', included: true },
        { name: 'Sincronización en la nube', included: true },
        { name: 'Soporte prioritario', included: true },
      ],
      highlighted: false,
      buttonText: 'Suscribirse'
    },
    {
      name: 'Semestral',
      price: '$49',
      period: 'cada 6 meses',
      description: 'La opción más popular para estudiantes',
      features: [
        { name: 'IA ilimitada', included: true },
        { name: 'Colecciones ilimitadas', included: true },
        { name: 'OCR avanzado', included: true },
        { name: 'Repetición espaciada', included: true },
        { name: 'Sincronización en la nube', included: true },
        { name: 'Soporte prioritario', included: true },
      ],
      highlighted: true,
      badge: 'Recomendado',
      savings: 'Ahorra 15%',
      buttonText: 'Mejor Opción'
    },
    {
      name: 'Anual',
      price: '$79',
      period: 'cada año',
      description: 'Máximo ahorro para todo el año académico',
      features: [
        { name: 'IA ilimitada', included: true },
        { name: 'Colecciones ilimitadas', included: true },
        { name: 'OCR avanzado', included: true },
        { name: 'Repetición espaciada', included: true },
        { name: 'Sincronización en la nube', included: true },
        { name: 'Soporte prioritario', included: true },
      ],
      highlighted: false,
      savings: 'Ahorra 32%',
      buttonText: 'Máximo Ahorro'
    }
  ];

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <section id="planes" className="py-20 bg-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-4">Planes y Precios</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades de estudio. 
            Todos los planes incluyen acceso completo a la plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden ${
                plan.highlighted 
                  ? 'border-primary border-2 shadow-xl scale-105' 
                  : 'hover:shadow-lg'
              } transition-all`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-tl-none rounded-br-none bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge variant="secondary" className="mt-2 w-fit">
                    {plan.savings}
                  </Badge>
                )}
                <CardDescription className="mt-3">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? feature.limited 
                            ? 'text-muted-foreground' 
                            : 'text-foreground'
                          : 'text-muted-foreground line-through'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={handleGetStarted}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}