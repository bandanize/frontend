import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Music2, ListMusic, FileMusic, Guitar } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Music2 className="size-8 text-purple-600" />
            ¡Bienvenido a tu espacio musical!
          </DialogTitle>
          <DialogDescription className="text-base mt-4">
            Esta plataforma te ayudará a organizar tus proyectos musicales y colaborar con tu banda.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">¿Cómo funciona?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sigue estos pasos para empezar a organizar tu música:
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="size-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Music2 className="size-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">1. Crea un Proyecto Musical</h4>
                  <p className="text-sm text-gray-600">
                    Puede ser un proyecto en solitario o una banda. Añade nombre, descripción, imagen y miembros.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="size-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ListMusic className="size-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">2. Organiza con Listas de Canciones</h4>
                  <p className="text-sm text-gray-600">
                    Dentro de cada proyecto, crea listas para agrupar canciones (ej: "Álbum 2024", "Setlist en vivo").
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="size-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileMusic className="size-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">3. Añade Canciones</h4>
                  <p className="text-sm text-gray-600">
                    En cada lista, añade canciones con detalles como BPM, tonalidad y archivos multimedia.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="size-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Guitar className="size-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold">4. Crea Tablaturas</h4>
                  <p className="text-sm text-gray-600">
                    Para cada canción, añade tablaturas por instrumento con la barra de herramientas integrada.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm">
              <strong>💡 Tip:</strong> Usa el chat del proyecto para comunicarte con tu banda y mantener todos organizados.
            </p>
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full" size="lg">
          ¡Entendido, empecemos!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
