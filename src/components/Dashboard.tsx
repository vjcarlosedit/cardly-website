import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, BookOpen, LogOut, UserPen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { GenerateCards } from './GenerateCards';
import { StudyMode } from './StudyMode';
import { EditProfile } from './EditProfile';
import { LogoutLoading } from './LogoutLoading';
import { api } from '../services/api';
import { toast } from 'sonner@2.0.3';

interface UserProfile {
  name: string;
  email: string;
  photo?: string;
  password?: string;
  plan?: 'Gratis' | 'Trimestral' | 'Semestral' | 'Anual';
  generationsLeft?: number;
  collectionsLeft?: number;
}

interface Collection {
  id: string;
  name: string;
  progress: number;
  cards: Array<{ id: string }>;
  _count?: { cards: number };
}

export function Dashboard() {
  const [view, setView] = useState<'home' | 'generate' | 'study' | 'editProfile' | 'logout'>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalCards: 0,
    averageProgress: 0,
  });

  const loadUser = async () => {
    const token = localStorage.getItem('cardly_token');
    if (token) {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
        localStorage.setItem('cardly_user', JSON.stringify(userData));
        // Forzar re-render para actualizar contadores
        return userData;
      } catch (error) {
        // Si el token es inválido, limpiar y redirigir
        api.logout();
        window.location.reload();
      }
    } else {
      // Si no hay token, verificar si hay usuario en localStorage (migración)
      const userData = localStorage.getItem('cardly_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    }
  };

  const loadUserAndCollections = async () => {
    // Recargar usuario primero para obtener los contadores actualizados
    const userData = await loadUser();
    // También recargar colecciones para actualizar estadísticas
    const token = localStorage.getItem('cardly_token');
    if (token) {
      try {
        const collectionsData = await api.getCollections();
        
        // Calcular estadísticas
        const totalCollections = collectionsData.length;
        const totalCards = collectionsData.reduce((sum: number, collection: Collection) => {
          return sum + (collection._count?.cards || collection.cards?.length || 0);
        }, 0);
        const averageProgress = totalCollections > 0
          ? Math.round(
              collectionsData.reduce((sum: number, collection: Collection) => sum + collection.progress, 0) / totalCollections
            )
          : 0;

        setStats({
          totalCollections,
          totalCards,
          averageProgress,
        });
      } catch (error) {
        console.error('Error al cargar colecciones:', error);
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Recargar usuario cuando se regresa de otras vistas (para actualizar contadores)
  useEffect(() => {
    if (view === 'home') {
      loadUser();
    }
  }, [view]);

  useEffect(() => {
    const loadCollections = async () => {
      const token = localStorage.getItem('cardly_token');
      if (token) {
        try {
          const collectionsData = await api.getCollections();
          
          // Calcular estadísticas
          const totalCollections = collectionsData.length;
          const totalCards = collectionsData.reduce((sum: number, collection: Collection) => {
            return sum + (collection._count?.cards || collection.cards?.length || 0);
          }, 0);
          const averageProgress = totalCollections > 0
            ? Math.round(
                collectionsData.reduce((sum: number, collection: Collection) => sum + collection.progress, 0) / totalCollections
              )
            : 0;

          setStats({
            totalCollections,
            totalCards,
            averageProgress,
          });
        } catch (error) {
          // Si hay error, mantener valores en 0
          console.error('Error al cargar colecciones:', error);
        }
      }
    };
    loadCollections();
  }, [view]); // Recargar cuando cambie la vista (para actualizar después de crear/eliminar colecciones)

  const handleLogout = () => {
    setView('logout');
  };

  const handleLogoutComplete = () => {
    api.logout();
    window.location.reload();
  };

  const handleSaveProfile = async (updatedUser: UserProfile) => {
    try {
      const updated = await api.updateUser({
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.photo,
        plan: updatedUser.plan,
      });
      setUser(updated);
      localStorage.setItem('cardly_user', JSON.stringify(updated));
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar perfil');
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeVariant = () => {
    switch (user?.plan) {
      case 'Anual':
        return 'default';
      case 'Semestral':
        return 'secondary';
      case 'Trimestral':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getUsageBadgeColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    // Sistema de colores para plan Gratis:
    // Rojo fuerte (0): Sin usos disponibles
    // Rojo tenue (1-26%): Quedan 1-4 de 15 generaciones o 1-2 de 10 colecciones
    // Naranja (27-66%): Quedan 5-10 de 15 generaciones o 3-6 de 10 colecciones  
    // Verde (>66%): Quedan 11+ de 15 generaciones o 7+ de 10 colecciones
    if (remaining === 0) return 'bg-red-100 text-red-700 border-red-300';
    if (percentage <= 26) return 'bg-red-50 text-red-600 border-red-200';
    if (percentage <= 66) return 'bg-orange-50 text-orange-600 border-orange-200';
    return 'bg-green-50 text-green-600 border-green-200';
  };

        const isFreePlan = user?.plan === 'Gratis';
        // Usar valores del usuario si existen, de lo contrario usar valores por defecto solo si no hay usuario
        // IMPORTANTE: Si collectionsLeft es 0, no usar el valor por defecto
        const generationsLeft = user !== null && user !== undefined ? (user.generationsLeft !== undefined ? user.generationsLeft : 15) : 15;
        const collectionsLeft = user !== null && user !== undefined ? (user.collectionsLeft !== undefined ? user.collectionsLeft : 10) : 10;
        const canGenerate = !isFreePlan || (generationsLeft > 0 && collectionsLeft > 0);
        const canStudy = !isFreePlan || collectionsLeft > 0;

  if (view === 'generate') {
    return <GenerateCards 
      onBack={() => setView('home')} 
      onCardsGenerated={() => {
        // Recargar usuario para actualizar contadores
        loadUser();
      }}
    />;
  }

  if (view === 'study') {
    return <StudyMode 
      onBack={() => {
        setView('home');
        // Recargar usuario cuando se vuelve del modo de estudio
        loadUserAndCollections();
      }} 
      onCreateCollection={() => setView('generate')}
      onCollectionUpdate={() => {
        // Recargar usuario para actualizar contadores después de eliminar una colección
        loadUserAndCollections();
      }}
    />;
  }

  if (view === 'editProfile' && user) {
    return <EditProfile onBack={() => setView('home')} user={user} onSave={handleSaveProfile} />;
  }

  if (view === 'logout') {
    return <LogoutLoading onComplete={handleLogoutComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl text-primary">Cardly</h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photo} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <p className="text-sm">{user?.name}</p>
                <Badge variant={getPlanBadgeVariant()} className="text-xs px-2 py-0">
                  {user?.plan || 'Gratis'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setView('editProfile')}
              title="Editar perfil"
            >
              <UserPen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Bienvenido a Cardly</h2>
            <p className="text-muted-foreground text-lg">
              ¿Qué te gustaría hacer hoy?
            </p>
          </div>

          {/* Stats Section */}
          <div className="mb-12 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl mb-1 text-[#0a1628]">{stats.totalCollections}</p>
                <p className="text-sm text-muted-foreground">Colecciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl mb-1 text-[#0a1628]">{stats.totalCards}</p>
                <p className="text-sm text-muted-foreground">Tarjetas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl mb-1 text-[#0a1628]">{stats.averageProgress}%</p>
                <p className="text-sm text-muted-foreground">Progreso</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Generar Tarjetas con IA */}
            <Card className={`flex flex-col relative transition-all ${
              !canGenerate 
                ? 'opacity-60 cursor-not-allowed border-2 border-muted' 
                : 'cursor-pointer hover:shadow-lg border-2 hover:border-primary/50'
            }`}>
              {isFreePlan && (
                <div className="absolute top-3 right-3">
                  <Badge className={`text-xs px-2 py-1 border ${getUsageBadgeColor(generationsLeft, 15)}`}>
                    {generationsLeft}/15 disponibles
                  </Badge>
                </div>
              )}
              <CardHeader className="flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  !canGenerate ? 'bg-muted' : 'bg-primary/10'
                }`}>
                  <Sparkles className={`h-6 w-6 ${!canGenerate ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <CardTitle className={!canGenerate ? 'text-muted-foreground' : ''}>
                  Generar Tarjetas con IA
                </CardTitle>
                <CardDescription className={!canGenerate ? 'text-muted-foreground' : ''}>
                  {!canGenerate 
                    ? isFreePlan && collectionsLeft <= 0
                      ? 'Has alcanzado el límite de colecciones. Actualiza tu plan para continuar.'
                      : isFreePlan && generationsLeft <= 0
                      ? 'Has alcanzado el límite de generaciones. Actualiza tu plan para continuar.'
                      : 'Has alcanzado el límite. Actualiza tu plan para continuar.'
                    : 'Sube tus apuntes y deja que la IA genere tarjetas de estudio automáticamente'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                {!canGenerate ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant="default"
                    onClick={() => {
                      // Aquí puedes agregar lógica para redirigir a planes
                      toast.info('Funcionalidad de planes próximamente');
                    }}
                  >
                    Actualizar Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={async () => {
                      // Verificar nuevamente antes de entrar
                      try {
                        const currentUser = await api.getCurrentUser();
                        const isFree = currentUser.plan === 'Gratis';
                        const hasCollections = isFree ? (currentUser.collectionsLeft ?? 10) > 0 : true;
                        const hasGenerations = isFree ? (currentUser.generationsLeft ?? 15) > 0 : true;
                        
                        if (!hasCollections) {
                          toast.error('No tienes colecciones disponibles. Por favor, actualiza tu plan.');
                          return;
                        }
                        if (!hasGenerations) {
                          toast.error('No tienes generaciones disponibles. Por favor, actualiza tu plan.');
                          return;
                        }
                        
                        setView('generate');
                      } catch (error: any) {
                        toast.error('Error al verificar disponibilidad. Por favor, intenta de nuevo.');
                      }
                    }}
                  >
                    Comenzar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Modo de Estudio */}
            <Card className={`flex flex-col relative transition-all ${
              !canStudy 
                ? 'opacity-60 cursor-not-allowed border-2 border-muted' 
                : 'cursor-pointer hover:shadow-lg border-2 hover:border-primary/50'
            }`}>
              {isFreePlan && (
                <div className="absolute top-3 right-3">
                  <Badge className={`text-xs px-2 py-1 border ${getUsageBadgeColor(collectionsLeft, 10)}`}>
                    {collectionsLeft}/10 disponibles
                  </Badge>
                </div>
              )}
              <CardHeader className="flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  !canStudy ? 'bg-muted' : 'bg-primary/10'
                }`}>
                  <BookOpen className={`h-6 w-6 ${!canStudy ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <CardTitle className={!canStudy ? 'text-muted-foreground' : ''}>
                  Modo de Estudio
                </CardTitle>
                <CardDescription className={!canStudy ? 'text-muted-foreground' : ''}>
                  {!canStudy 
                    ? 'Has alcanzado el límite de colecciones. Elimina colecciones para continuar.'
                    : 'Revisa y estudia tus colecciones de tarjetas generadas'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                {!canStudy ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant="default"
                    onClick={() => {
                      // Redirigir a Modo de Estudio para que puedan ver y eliminar colecciones
                      setView('study');
                    }}
                  >
                    Modificar Colecciones
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setView('study')}
                  >
                    Estudiar
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Upgrade Banner Footer - Solo para plan Gratis */}
      {isFreePlan && (
        <footer className="bg-[#0a1628] border-t border-white/10 mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-white/90 text-sm">
                  Desbloquea todo el potencial de Cardly con uno de nuestros planes
                </p>
                <p className="text-white/60 text-xs mt-1">
                  Generaciones ilimitadas, más colecciones y funciones exclusivas
                </p>
              </div>
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
              >
                Ver Planes
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}