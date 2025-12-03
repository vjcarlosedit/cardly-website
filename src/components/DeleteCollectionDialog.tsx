import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  collectionName: string;
  cardCount: number;
}

export function DeleteCollectionDialog({
  isOpen,
  onClose,
  onConfirm,
  collectionName,
  cardCount,
}: DeleteCollectionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              ¿Eliminar esta colección?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p>
              Estás a punto de eliminar la colección{' '}
              <span className="text-foreground font-medium">"{collectionName}"</span>.
            </p>
            <p>
              Esta colección contiene{' '}
              <span className="text-foreground font-medium">{cardCount} {cardCount === 1 ? 'tarjeta' : 'tarjetas'}</span>{' '}
              que se perderán permanentemente.
            </p>
            <p className="text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar colección
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
