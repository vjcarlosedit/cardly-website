import { Card, CardContent } from './ui/card';
import { Target, Rocket } from 'lucide-react';

export function AboutSection() {
  const stats = [
    { icon: Target, label: 'Tasa de Retención', value: '95%' },
    { icon: Rocket, label: 'Tiempo Ahorrado', value: '80%' }
  ];

  return (
    <section id="about" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl mb-6">
              Sobre Cardly
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Cardly es una aplicación innovadora de apuntes y repaso que utiliza inteligencia artificial 
              y reconocimiento óptico de caracteres (OCR) para transformar tus apuntes en tarjetas de 
              estudio personalizadas. Nuestra tecnología identifica automáticamente los conceptos clave 
              y genera preguntas efectivas para optimizar tu aprendizaje.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Con Cardly, el tedioso proceso de crear tarjetas de repaso manualmente queda en el pasado. 
              Simplemente escanea tus apuntes y nuestra IA hará el trabajo pesado por ti, permitiéndote 
              enfocarte en lo que realmente importa: aprender y retener información de manera efectiva. 
              Nuestro sistema de repetición espaciada basado en evidencia científica maximiza tu retención 
              a largo plazo.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3">¿Qué hace diferente a Cardly?</h3>
                <p className="text-muted-foreground">
                  A diferencia de otras herramientas, Cardly no solo digitaliza tus apuntes. 
                  Nuestra IA los comprende, extrae lo esencial y crea tarjetas optimizadas para 
                  tu estilo de aprendizaje, ahorrándote horas de trabajo manual.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3">¿Por qué elegir Cardly?</h3>
                <p className="text-muted-foreground">
                  Ahorra hasta un 80% del tiempo que dedicas a crear material de estudio. 
                  Nuestra IA hace el trabajo tedioso mientras tú te enfocas en aprender de 
                  manera más efectiva y eficiente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}