import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Zap, 
  Clock, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Smartphone,
  CloudUpload,
  Award
} from 'lucide-react';

export function AdvantagesSection() {
  const advantages = [
    {
      icon: Zap,
      title: 'Creación Instantánea',
      description: 'Genera cientos de tarjetas de repaso en segundos. Solo toma una foto de tus apuntes y deja que la IA haga el trabajo.',
      features: ['OCR Preciso', 'IA Avanzada', 'Procesamiento Rápido']
    },
    {
      icon: Clock,
      title: 'Ahorra Tiempo',
      description: 'Dedica más tiempo a estudiar y menos a crear material. La automatización te permite enfocarte en lo importante.',
      features: ['Automatización Total', 'Sin Trabajo Manual', 'Optimización Inteligente']
    },
    {
      icon: Target,
      title: 'Aprendizaje Enfocado',
      description: 'La IA identifica los conceptos más importantes de tus apuntes para crear tarjetas relevantes y efectivas.',
      features: ['Conceptos Clave', 'Priorización IA', 'Contenido Relevante']
    },
    {
      icon: BookOpen,
      title: 'Múltiples Formatos',
      description: 'Soporta diferentes tipos de apuntes: manuscritos, digitales, imágenes, PDFs y más fuentes de contenido.',
      features: ['Texto Manual', 'Texto Digital', 'Imágenes y PDFs']
    },
    {
      icon: TrendingUp,
      title: 'Progreso Visible',
      description: 'Estadísticas detalladas de tu aprendizaje te permiten ver tu evolución y áreas de mejora en tiempo real.',
      features: ['Métricas Detalladas', 'Análisis de Progreso', 'Reportes Visuales']
    },
    {
      icon: Smartphone,
      title: 'Estudia Donde Sea',
      description: 'Accede a tus tarjetas desde cualquier dispositivo. Estudia en el bus, en casa o donde prefieras.',
      features: ['Multiplataforma', 'Sincronización', 'Acceso en la nube']
    },
    {
      icon: CloudUpload,
      title: 'Colecciones Ilimitadas',
      description: 'Organiza tus tarjetas por materia, tema o como prefieras. Crea tantas colecciones como necesites.',
      features: ['Organización Flexible', 'Etiquetas', 'Búsqueda Rápida']
    },
    {
      icon: Award,
      title: 'Repetición Espaciada',
      description: 'Sistema científico de repaso que optimiza la retención a largo plazo según tu desempeño.',
      features: ['Algoritmo Adaptativo', 'Retención Óptima', 'Repaso Inteligente']
    }
  ];

  return (
    <section id="ventajas" className="py-20 bg-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-4">Ventajas de Cardly</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre cómo Cardly revoluciona tu forma de estudiar con tecnología de vanguardia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {advantage.description}
                  </CardDescription>
                  <ul className="space-y-1">
                    {advantage.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}