import { useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface LoginSuccessProps {
  onComplete: () => void;
  userName: string;
}

export function LoginSuccess({ onComplete, userName }: LoginSuccessProps) {
  useEffect(() => {
    // Mostrar el mensaje de éxito por 2 segundos antes de redirigir
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center z-50">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        {/* Icono animado */}
        <div className="relative mx-auto w-24 h-24">
          {/* Círculo de fondo pulsante */}
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          {/* Círculo de fondo estático */}
          <div className="absolute inset-0 bg-primary/10 rounded-full" />
          {/* Icono de check */}
          <div className="relative flex items-center justify-center h-full">
            <CheckCircle2 className="h-12 w-12 text-primary animate-in zoom-in duration-500" />
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <h2 className="text-2xl text-primary animate-in slide-in-from-bottom duration-500">
            ¡Bienvenido de vuelta!
          </h2>
          <p className="text-muted-foreground animate-in slide-in-from-bottom duration-700">
            Hola {userName}, es genial verte de nuevo 👋
          </p>
          <p className="text-sm text-muted-foreground animate-in slide-in-from-bottom duration-900">
            Redirigiendo a tu dashboard...
          </p>
        </div>

        {/* Indicador de carga */}
        <div className="flex justify-center gap-2 animate-in slide-in-from-bottom duration-1000">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
