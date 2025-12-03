import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ArrowLeft, Upload, Eye, Sparkles, Check, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../services/api';

interface GenerateCardsProps {
  onBack: () => void;
  onCardsGenerated?: () => void;
}

export function GenerateCards({ onBack, onCardsGenerated }: GenerateCardsProps) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Array<{ front: string; back: string }>>([]);
  const [extractedText, setExtractedText] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [numCards, setNumCards] = useState('5');
  const [difficulty, setDifficulty] = useState<'facil' | 'media' | 'dificil'>('media');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar disponibilidad antes de iniciar generación
  const checkAvailability = async (): Promise<boolean> => {
    try {
      const user = await api.getCurrentUser();
      const isFree = user.plan === 'Gratis';
      const hasCollections = isFree ? (user.collectionsLeft ?? 10) > 0 : true;
      const hasGenerations = isFree ? (user.generationsLeft ?? 15) > 0 : true;
      
      if (!hasCollections) {
        toast.error('No tienes colecciones disponibles. Por favor, actualiza tu plan.');
        return false;
      }
      if (!hasGenerations) {
        toast.error('No tienes generaciones disponibles. Por favor, actualiza tu plan.');
        return false;
      }
      return true;
    } catch (error: any) {
      toast.error('Error al verificar disponibilidad. Por favor, intenta de nuevo.');
      return false;
    }
  };

  // Iniciar generación automáticamente cuando se llega al paso 3
  useEffect(() => {
    if (step === 3 && !isProcessing && !hasStartedGeneration && extractedText && collectionName) {
      setHasStartedGeneration(true);
      // Llamar a processStep para generar las tarjetas
      const generateCards = async () => {
        // Verificar disponibilidad antes de continuar
        const isAvailable = await checkAvailability();
        if (!isAvailable) {
          setHasStartedGeneration(false);
          setStep(2); // Volver al paso anterior
          return;
        }

        setIsProcessing(true);
        try {
          // Primero crear la colección
          const collection = await api.createCollection(collectionName || fileName.replace(/\.[^/.]+$/, ''));
          setCollectionId(collection.id);
          
          // Luego generar las tarjetas
          const result = await api.generateCards(
            extractedText,
            collection.id,
            parseInt(numCards),
            difficulty,
            collectionName || fileName.replace(/\.[^/.]+$/, '')
          );
          
          setGeneratedCards(result.cards);
          setStep(4);
          toast.success(`¡${result.generated} tarjetas generadas exitosamente!`);
          // Notificar al Dashboard para actualizar contadores
          if (onCardsGenerated) {
            onCardsGenerated();
          }
        } catch (error: any) {
          toast.error(error.message || 'Error al generar tarjetas');
          setHasStartedGeneration(false);
          setStep(2); // Volver al paso anterior en caso de error
        } finally {
          setIsProcessing(false);
        }
      };
      generateCards();
    }
  }, [step, isProcessing, hasStartedGeneration, extractedText, collectionName, fileName, numCards, difficulty, onCardsGenerated]);

  const steps = [
    { number: 1, title: 'Subir Archivo', icon: Upload },
    { number: 2, title: 'Procesar OCR', icon: Eye },
    { number: 3, title: 'Generando con IA', icon: Sparkles },
    { number: 4, title: 'Tarjetas Generadas', icon: Check }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file); // Guardar el archivo en el estado
      // Generar nombre sugerido de la colección
      const suggestedName = file.name.replace(/\.[^/.]+$/, '');
      setCollectionName(suggestedName);
      toast.success('Archivo cargado correctamente');
    }
  };

  const processOCR = async () => {
    if (!selectedFile) {
      toast.error('No se seleccionó ningún archivo');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await api.extractText(selectedFile);
      setExtractedText(result.text);
      toast.success('Texto extraído correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const processStep = async (nextStep: number) => {
    if (nextStep === 3) {
      // Generar tarjetas con IA
      setIsProcessing(true);
      try {
        // Primero crear la colección
        const collection = await api.createCollection(collectionName || fileName.replace(/\.[^/.]+$/, ''));
        setCollectionId(collection.id);
        
        // Luego generar las tarjetas
        const result = await api.generateCards(
          extractedText,
          collection.id,
          parseInt(numCards),
          difficulty,
          collectionName || fileName.replace(/\.[^/.]+$/, '')
        );
        
        setGeneratedCards(result.cards);
        setStep(4);
        toast.success(`¡${result.generated} tarjetas generadas exitosamente!`);
      } catch (error: any) {
        toast.error(error.message || 'Error al generar tarjetas');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setStep(nextStep);
    }
  };

  const saveCollection = () => {
    // Las tarjetas ya están guardadas en el backend cuando se generaron
    toast.success('Colección guardada correctamente');
    onBack();
  };

  const progress = (step / 4) * 100;

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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl mb-2">Generar Tarjetas con IA</h2>
            <p className="text-muted-foreground">
              Sigue los pasos para crear tus tarjetas de estudio
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-between mb-12">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              
              return (
                <div key={s.number} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`text-xs text-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1].title}</CardTitle>
              <CardDescription>
                {step === 1 && 'Sube tu archivo de apuntes (PDF, imagen o documento)'}
                {step === 2 && !extractedText && 'Extrayendo texto de tu documento...'}
                {step === 2 && extractedText && 'Configura los parámetros de generación de tarjetas'}
                {step === 3 && 'La IA está generando tarjetas personalizadas...'}
                {step === 4 && '¡Tus tarjetas están listas para estudiar!'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Upload */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button asChild>
                        <span>Seleccionar archivo</span>
                      </Button>
                    </label>
                    {fileName && (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Archivo seleccionado: <span className="text-primary">{fileName}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Recomendaciones para OCR */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      Recomendaciones para un OCR óptimo:
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                      <li>Evita imágenes borrosas, pixeladas o con ángulos inclinados</li>
                      <li>Para documentos escaneados, asegúrate de que estén completamente visibles</li>
                    </ul>
                  </div>
                  
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedFile || isProcessing}
                    onClick={() => processStep(2)}
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* Step 2: OCR Processing */}
              {step === 2 && !extractedText && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Eye className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
                    <p className="text-lg mb-2">Procesando documento...</p>
                    <p className="text-sm text-muted-foreground">
                      Extrayendo texto usando OCR
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                    onClick={processOCR}
                  >
                    {isProcessing ? 'Procesando...' : 'Iniciar OCR'}
                  </Button>
                </div>
              )}

              {/* Step 2: OCR Results & Configuration */}
              {step === 2 && extractedText && (
                <div className="space-y-4">
                  {/* Texto Extraído */}
                  <div>
                    <label className="text-sm mb-2 block">Texto extraído del documento:</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg bg-secondary/20 resize-none"
                      rows={6}
                      maxLength={5000}
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {extractedText.length}/5000 caracteres (Límite recomendado para generar hasta 30 tarjetas)
                    </p>
                  </div>

                  {/* Nombre de la Colección */}
                  <div>
                    <label htmlFor="collection-name" className="text-sm mb-2 block">
                      Nombre de la colección:
                    </label>
                    <input
                      id="collection-name"
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="Ej: Conceptos de IA"
                    />
                  </div>

                  {/* Número de Tarjetas */}
                  <div>
                    <label htmlFor="num-cards" className="text-sm mb-2 block">
                      Número de tarjetas a generar:
                    </label>
                    <input
                      id="num-cards"
                      type="number"
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      value={numCards}
                      onChange={(e) => setNumCards(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo: 30 tarjetas
                    </p>
                  </div>

                  {/* Dificultad */}
                  <div>
                    <label className="text-sm mb-2 block">Dificultad:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={difficulty === 'facil' ? 'default' : 'outline'}
                        onClick={() => setDifficulty('facil')}
                        className="w-full"
                      >
                        Fácil
                      </Button>
                      <Button
                        type="button"
                        variant={difficulty === 'media' ? 'default' : 'outline'}
                        onClick={() => setDifficulty('media')}
                        className="w-full"
                      >
                        Media
                      </Button>
                      <Button
                        type="button"
                        variant={difficulty === 'dificil' ? 'default' : 'outline'}
                        onClick={() => setDifficulty('dificil')}
                        className="w-full"
                      >
                        Difícil
                      </Button>
                    </div>
                    <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        {difficulty === 'facil' && '✨ Fácil: Tarjetas con conceptos básicos y definiciones simples'}
                        {difficulty === 'media' && '🎯 Media: Tarjetas con conceptos intermedios y relaciones entre ideas'}
                        {difficulty === 'dificil' && '🔥 Difícil: Tarjetas con conceptos avanzados, análisis profundo y aplicaciones complejas'}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!collectionName || isProcessing}
                    onClick={async () => {
                      // Verificar disponibilidad antes de continuar
                      const isAvailable = await checkAvailability();
                      if (isAvailable) {
                        setStep(3);
                      }
                    }}
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* Step 3: AI Generation */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
                    <p className="text-lg mb-2">Generando tarjetas...</p>
                    <p className="text-sm text-muted-foreground">
                      La IA está analizando el contenido y creando tarjetas
                    </p>
                  </div>
                  {!isProcessing && (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => processStep(3)}
                    >
                      Generar Tarjetas
                    </Button>
                  )}
                </div>
              )}

              {/* Step 4: Generated Cards */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Check className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <p className="text-lg mb-2">¡{generatedCards.length} tarjetas generadas!</p>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedCards.map((card, index) => (
                      <Card key={index} className="border-primary/20">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="mb-2">{card.front}</p>
                              <p className="text-sm text-muted-foreground">{card.back}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onBack}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={saveCollection}
                    >
                      Guardar Colección
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}