import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../services/api';

interface Collection {
  id: string | number;
  name: string;
  date: string;
  cards: Array<{ front: string; back: string }>;
  progress: number;
}

interface EditCollectionProps {
  collection: Collection;
  onBack: () => void;
  onSave: (updatedCollection: Collection) => void;
}

export function EditCollection({ collection, onBack, onSave }: EditCollectionProps) {
  const [collectionName, setCollectionName] = useState(collection.name);
  const [cards, setCards] = useState(collection.cards);

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updatedCards = [...cards];
    updatedCards[index][field] = value;
    setCards(updatedCards);
  };

  const deleteCard = (index: number) => {
    if (cards.length <= 1) {
      toast.error('Debe haber al menos una tarjeta');
      return;
    }
    const updatedCards = cards.filter((_, i) => i !== index);
    setCards(updatedCards);
    toast.success('Tarjeta eliminada');
  };

  const addCard = () => {
    setCards([...cards, { front: '', back: '' }]);
    toast.success('Tarjeta agregada');
  };

  const handleSave = async () => {
    // Validar que no haya tarjetas vacías
    const hasEmptyCards = cards.some(card => !card.front.trim() || !card.back.trim());
    if (hasEmptyCards) {
      toast.error('Todas las tarjetas deben tener pregunta y respuesta');
      return;
    }

    if (!collectionName.trim()) {
      toast.error('La colección debe tener un nombre');
      return;
    }

    try {
      // Actualizar nombre de la colección
      await api.updateCollection(String(collection.id), {
        name: collectionName,
      });

      // Obtener tarjetas actuales
      const currentCards = await api.getCards(String(collection.id));
      
      // Eliminar todas las tarjetas existentes
      for (const card of currentCards) {
        await api.deleteCard(card.id);
      }
      
      // Crear nuevas tarjetas
      if (cards.length > 0) {
        await api.createBulkCards(String(collection.id), cards);
      }

      const updatedCollection: Collection = {
        ...collection,
        name: collectionName,
        cards: cards
      };

      onSave(updatedCollection);
      toast.success('Colección actualizada');
      onBack();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar colección');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Colecciones
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <label className="text-sm text-muted-foreground mb-2 block">
              Nombre de la Colección
            </label>
            <Input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Nombre de la colección"
              className="text-xl"
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl">Tarjetas ({cards.length})</h3>
            <Button variant="outline" onClick={addCard}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Tarjeta
            </Button>
          </div>

          <div className="space-y-4">
            {cards.map((card, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tarjeta {index + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCard(index)}
                      disabled={cards.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Pregunta
                    </label>
                    <Textarea
                      value={card.front}
                      onChange={(e) => updateCard(index, 'front', e.target.value)}
                      placeholder="Escribe la pregunta..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Respuesta
                    </label>
                    <Textarea
                      value={card.back}
                      onChange={(e) => updateCard(index, 'back', e.target.value)}
                      placeholder="Escribe la respuesta..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
