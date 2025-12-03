import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, RotateCw, Clock } from 'lucide-react';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
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

interface FlashcardViewerProps {
  collection: Collection;
  onBack: () => void;
  onProgressUpdate?: () => void;
}

export function FlashcardViewer({ collection, onBack, onProgressUpdate }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [cards, setCards] = useState<Card[]>(collection.cards);

  const currentCard = cards[currentIndex];
  const progress = collection.cards.length > 0 ? (reviewedCards / collection.cards.length) * 100 : 0;

  const updateCollectionProgress = async (newProgress: number) => {
    try {
      // Solo actualizar progreso si no es una colección virtual (todas las tarjetas)
      if (collection.id !== 'all-pending') {
        await api.updateCollection(String(collection.id), {
          progress: Math.min(100, Math.round(newProgress)),
        });
      }
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error: any) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  const handleResponse = async (level: 'again' | 'hard' | 'good' | 'easy') => {
    try {
      const intervals = {
        again: '< 1 min',
        hard: '5 min',
        good: '10 min',
        easy: '4 días'
      };

      // Actualizar tarjeta en el backend con repetición espaciada
      const result = await api.reviewCard(String(currentCard.id), level);
      
      const nextReviewIn = result.nextReviewIn;
      let nextReviewText = '';
      if (nextReviewIn < 60) {
        nextReviewText = `${nextReviewIn} min`;
      } else if (nextReviewIn < 1440) {
        nextReviewText = `${Math.round(nextReviewIn / 60)} hora${Math.round(nextReviewIn / 60) > 1 ? 's' : ''}`;
      } else {
        nextReviewText = `${Math.round(nextReviewIn / 1440)} día${Math.round(nextReviewIn / 1440) > 1 ? 's' : ''}`;
      }

      toast.success(`Tarjeta programada para: ${nextReviewText}`);
      
      // Remover la tarjeta de la lista (ya fue revisada)
      const updatedCards = cards.filter(card => card.id !== currentCard.id);
      setCards(updatedCards);
      
      // Incrementar contador de tarjetas revisadas
      const newReviewedCount = reviewedCards + 1;
      setReviewedCards(newReviewedCount);
      
      // Calcular nuevo progreso basado en tarjetas restantes
      const totalCards = collection.cards.length;
      const newProgress = totalCards > 0 ? ((totalCards - updatedCards.length) / totalCards) * 100 : 100;
      
      // Actualizar progreso en el backend
      await updateCollectionProgress(newProgress);

      // Pasar a la siguiente tarjeta o terminar sesión
      if (updatedCards.length > 0) {
        // Asegurarse de que el índice no exceda el nuevo tamaño del array
        const newIndex = currentIndex >= updatedCards.length ? 0 : currentIndex;
        setCurrentIndex(newIndex);
        setIsFlipped(false);
      } else {
        // Terminar sesión de estudio
        setSessionCompleted(true);
        toast.success('¡Sesión completada!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar tarjeta');
    }
  };

  const flipCard = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const skipCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Colecciones
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2">{collection.name}</h2>
            <p className="text-muted-foreground">
              Tarjeta {currentIndex + 1} de {cards.length}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progreso de revisión</span>
              <span className="text-primary">{reviewedCards} / {collection.cards.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Flashcard */}
          {currentCard && (
            <Card className="mb-6 border-2">
              <CardContent className="p-8">
                {/* Pregunta */}
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Pregunta:</p>
                  <p className="text-2xl">{currentCard.front}</p>
                </div>

              {/* Respuesta */}
              {!isFlipped ? (
                <div>
                  <div className="border-t pt-6">
                    <p className="text-sm text-muted-foreground mb-3">Respuesta:</p>
                    <div className="bg-secondary/30 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-lg blur-sm select-none">{currentCard.back}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-6">
                  <p className="text-sm text-muted-foreground mb-3">Respuesta:</p>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-lg">{currentCard.back}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Repetición Espaciada Buttons */}
          {currentCard && isFlipped && !sessionCompleted ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground mb-4">
                ¿Qué tan bien recordaste esta tarjeta?
              </p>
              
              <div className="grid grid-cols-4 gap-2">
                {/* Otra vez */}
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500"
                  onClick={() => handleResponse('again')}
                >
                  <span className="font-semibold text-red-600">Otra vez</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {'< 1 min'}
                  </span>
                </Button>

                {/* Difícil */}
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500"
                  onClick={() => handleResponse('hard')}
                >
                  <span className="font-semibold text-orange-600">Difícil</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    5 min
                  </span>
                </Button>

                {/* Bien */}
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary"
                  onClick={() => handleResponse('good')}
                >
                  <span className="font-semibold text-primary">Bien</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    10 min
                  </span>
                </Button>

                {/* Fácil */}
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500"
                  onClick={() => handleResponse('easy')}
                >
                  <span className="font-semibold text-green-600">Fácil</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    4 días
                  </span>
                </Button>
              </div>
            </div>
          ) : sessionCompleted ? (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-primary mb-2">¡Sesión completada!</p>
              <p className="text-sm text-muted-foreground mb-4">
                Has completado todas las tarjetas. Vuelve más tarde para repasar según la técnica de repetición espaciada.
              </p>
              <Button onClick={onBack} variant="outline">
                Volver a Colecciones
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                onClick={skipCard}
                disabled={currentIndex >= cards.length - 1}
              >
                Saltar
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={flipCard}
              >
                <RotateCw className="h-5 w-5 mr-2" />
                Ver Respuesta
              </Button>
            </div>
          )}

          {/* Quick Navigation */}
          {cards.length > 0 && (() => {
            const MAX_VISIBLE = 15; // Máximo de círculos visibles
            const RANGE = 5; // Rango de círculos a mostrar alrededor del actual
            
            // Si hay pocas tarjetas, mostrar todas
            if (cards.length <= MAX_VISIBLE) {
              return (
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {cards.map((card, index) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsFlipped(false);
                      }}
                      className={`w-8 h-8 rounded-full text-sm transition-colors ${
                        index === currentIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              );
            }
            
            // Si hay muchas tarjetas, mostrar solo un rango
            const start = Math.max(0, currentIndex - RANGE);
            const end = Math.min(cards.length - 1, currentIndex + RANGE);
            const showStartEllipsis = start > 0;
            const showEndEllipsis = end < cards.length - 1;
            
            return (
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {/* Primer círculo */}
                {showStartEllipsis && (
                  <>
                    <button
                      onClick={() => {
                        setCurrentIndex(0);
                        setIsFlipped(false);
                      }}
                      className="w-8 h-8 rounded-full text-sm transition-colors bg-secondary hover:bg-secondary/80"
                    >
                      1
                    </button>
                    <span className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                      ...
                    </span>
                  </>
                )}
                
                {/* Rango de círculos visibles */}
                {cards.slice(start, end + 1).map((card, relativeIndex) => {
                  const index = start + relativeIndex;
                  return (
                    <button
                      key={card.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsFlipped(false);
                      }}
                      className={`w-8 h-8 rounded-full text-sm transition-colors ${
                        index === currentIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
                
                {/* Último círculo */}
                {showEndEllipsis && (
                  <>
                    <span className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                      ...
                    </span>
                    <button
                      onClick={() => {
                        setCurrentIndex(cards.length - 1);
                        setIsFlipped(false);
                      }}
                      className="w-8 h-8 rounded-full text-sm transition-colors bg-secondary hover:bg-secondary/80"
                    >
                      {cards.length}
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}