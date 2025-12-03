import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, BookOpen, Trash2, Calendar, FileText, ChevronRight, Edit, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { FlashcardViewer } from './FlashcardViewer';
import { EditCollection } from './EditCollection';
import { DeleteCollectionDialog } from './DeleteCollectionDialog';
import { Input } from './ui/input';
import { api } from '../services/api';

interface Card {
  id: string;
  front: string;
  back: string;
  nextReviewDate?: string | null;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
}

interface Collection {
  id: string | number;
  name: string;
  date: string;
  cards: Card[];
  progress: number;
}

interface StudyModeProps {
  onBack: () => void;
  onCreateCollection?: () => void;
  onCollectionUpdate?: () => void; // Para notificar al Dashboard cuando se elimina una colección
}

export function StudyMode({ onBack, onCreateCollection, onCollectionUpdate }: StudyModeProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nextReviewTimes, setNextReviewTimes] = useState<Record<string, string | null>>({});
  const [allPendingCards, setAllPendingCards] = useState<Card[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const collectionsData = await api.getCollections();
      // Transformar el formato del API al formato esperado por el componente
      const formattedCollections: Collection[] = await Promise.all(
        collectionsData.map(async (col: any) => {
          // Obtener solo las tarjetas listas para repasar
          let reviewCards = [];
          try {
            reviewCards = await api.getCardsForReview(String(col.id));
          } catch (error) {
            // Si falla, usar todas las tarjetas
            reviewCards = col.cards || [];
          }
          
          return {
            id: col.id,
            name: col.name,
            date: col.createdAt,
            cards: reviewCards,
            progress: col.progress || 0
          };
        })
      );
      setCollections(formattedCollections);
      
      // Obtener todas las tarjetas pendientes de todas las colecciones
      const allPending: Card[] = [];
      for (const col of formattedCollections) {
        allPending.push(...col.cards);
      }
      setAllPendingCards(allPending);
      
      // Calcular tiempos de próxima revisión para cada colección
      const times: Record<string, string | null> = {};
      for (const col of formattedCollections) {
        if (col.cards.length === 0) {
          const time = await getNextReviewTime(String(col.id));
          times[String(col.id)] = time;
        }
      }
      setNextReviewTimes(times);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar colecciones');
      // Fallback a localStorage si hay error (para migración)
      const stored = localStorage.getItem('cardly_collections');
      if (stored) {
        setCollections(JSON.parse(stored));
      }
    }
  };

  const deleteCollection = async (id: number | string) => {
    try {
      const response = await api.deleteCollection(String(id));
      const updated = collections.filter(c => c.id !== id);
      setCollections(updated);
      toast.success('Colección eliminada');
      
      // Si el backend devuelve el usuario actualizado, actualizar localStorage inmediatamente
      if (response && (response as any).user) {
        const updatedUser = (response as any).user;
        localStorage.setItem('cardly_user', JSON.stringify(updatedUser));
      }
      
      // Notificar al Dashboard para que recargue los datos del usuario
      // Llamar inmediatamente y también después de un delay para asegurar
      if (onCollectionUpdate) {
        onCollectionUpdate();
        // También llamar después de un pequeño delay para asegurar que el backend haya procesado
        setTimeout(() => {
          if (onCollectionUpdate) {
            onCollectionUpdate();
          }
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar colección');
    }
  };

  const saveCollection = async (updatedCollection: Collection) => {
    try {
      await api.updateCollection(String(updatedCollection.id), {
        name: updatedCollection.name,
        progress: updatedCollection.progress,
      });
      
      // Actualizar tarjetas si hay cambios
      const currentCollection = collections.find(c => c.id === updatedCollection.id);
      if (currentCollection) {
        const cardsChanged = JSON.stringify(currentCollection.cards) !== JSON.stringify(updatedCollection.cards);
        if (cardsChanged) {
          // Eliminar todas las tarjetas existentes y crear nuevas
          const currentCards = await api.getCards(String(updatedCollection.id));
          for (const card of currentCards) {
            await api.deleteCard(card.id);
          }
          
          if (updatedCollection.cards.length > 0) {
            await api.createBulkCards(String(updatedCollection.id), updatedCollection.cards);
          }
        }
      }
      
      const updated = collections.map(c => 
        c.id === updatedCollection.id ? updatedCollection : c
      );
      setCollections(updated);
      toast.success('Colección actualizada');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar colección');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getNextReviewTime = async (collectionId: string): Promise<string | null> => {
    try {
      // Obtener todas las tarjetas de la colección para calcular el tiempo
      const allCards = await api.getCards(String(collectionId));
      
      if (allCards.length === 0) return null;
      
      // Encontrar la fecha de próxima revisión más cercana
      const now = new Date();
      const reviewDates = allCards
        .map((card: any) => card.nextReviewDate ? new Date(card.nextReviewDate) : null)
        .filter((date): date is Date => date !== null && date > now)
        .sort((a, b) => a.getTime() - b.getTime());

      if (reviewDates.length === 0) return null;

      const nextReview = reviewDates[0];
      const diffMs = nextReview.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return `en ${diffMins} min`;
      } else if (diffHours < 24) {
        return `en ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      } else {
        return `en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return null;
    }
  };

  // Filtrar colecciones por búsqueda
  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCollection) {
    return (
      <FlashcardViewer
        collection={selectedCollection}
        onBack={() => {
          setSelectedCollection(null);
          loadCollections(); // Recargar colecciones para actualizar progreso
        }}
        onProgressUpdate={() => {
          loadCollections(); // Recargar cuando se actualice el progreso
        }}
      />
    );
  }

  if (editingCollection) {
    return (
      <EditCollection
        collection={editingCollection}
        onBack={() => setEditingCollection(null)}
        onSave={saveCollection}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl mb-2">Mis Colecciones</h2>
            <p className="text-muted-foreground">
              Selecciona una colección para comenzar a estudiar
            </p>
          </div>

          {/* Search Bar */}
          {collections.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar colección por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7"
                  onClick={() => setSearchQuery('')}
                >
                  Limpiar
                </Button>
              )}
            </div>
          )}

          {/* Card para estudiar todas las tarjetas pendientes */}
          {collections.length > 0 && allPendingCards.length > 0 && (
            <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-1">Sesión de Estudio Completa</CardTitle>
                    <CardDescription>
                      Estudia todas las tarjetas pendientes de todas tus colecciones
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {allPendingCards.length} tarjeta{allPendingCards.length !== 1 ? 's' : ''} pendiente{allPendingCards.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => {
                      // Crear una colección virtual con todas las tarjetas pendientes
                      const allCardsCollection: Collection = {
                        id: 'all-pending',
                        name: 'Todas las Tarjetas Pendientes',
                        date: new Date().toISOString(),
                        cards: allPendingCards,
                        progress: 0,
                      };
                      setSelectedCollection(allCardsCollection);
                    }}
                  >
                    Comenzar Sesión
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {collections.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2">No tienes colecciones aún</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Genera tu primera colección de tarjetas con IA
                </p>
                <Button onClick={onCreateCollection || onBack}>
                  Crear Colección
                </Button>
              </CardContent>
            </Card>
          ) : filteredCollections.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2">No se encontraron colecciones</p>
                <p className="text-sm text-muted-foreground mb-6">
                  No hay colecciones que coincidan con "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Limpiar búsqueda
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCollections.map((collection) => (
                <Card
                  key={collection.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{collection.name}</CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(collection.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {collection.cards.length} tarjetas
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCollection(collection);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCollection(collection);
                          }}
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="text-primary">{collection.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${collection.progress}%` }}
                          />
                        </div>
                      </div>

                      {collection.cards.length === 0 ? (
                        <div className="space-y-2">
                          <Button
                            className="w-full"
                            variant="outline"
                            disabled
                          >
                            Sin tarjetas para repasar
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            {nextReviewTimes[String(collection.id)]
                              ? `Próxima sesión disponible ${nextReviewTimes[String(collection.id)]}`
                              : 'Todas las tarjetas están programadas para más tarde'}
                          </p>
                        </div>
                      ) : collection.progress >= 100 && collection.cards.length === 0 ? (
                        <div className="space-y-2">
                          <Button
                            className="w-full"
                            variant="outline"
                            disabled
                          >
                            Sesión Completada
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            {nextReviewTimes[String(collection.id)]
                              ? `Próxima sesión disponible ${nextReviewTimes[String(collection.id)]}`
                              : 'Vuelve más tarde para repasar según la técnica de repetición espaciada'}
                          </p>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => setSelectedCollection(collection)}
                        >
                          Estudiar {collection.cards.length} tarjeta{collection.cards.length !== 1 ? 's' : ''}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {deletingCollection && (
        <DeleteCollectionDialog
          isOpen={!!deletingCollection}
          onClose={() => setDeletingCollection(null)}
          onConfirm={() => {
            deleteCollection(deletingCollection.id);
            setDeletingCollection(null);
          }}
          collectionName={deletingCollection.name}
          cardCount={deletingCollection.cards.length}
        />
      )}
    </div>
  );
}