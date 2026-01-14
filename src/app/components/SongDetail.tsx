import React, { useState, useRef } from 'react';
import { useProjects, Song, Tablature } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, Plus, Music2, FileAudio, Image as ImageIcon, File, Trash2, Guitar, Drum, Music } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/app/components/ui/separator';

const INSTRUMENTS = [
  { value: 'guitar', label: 'Guitarra', icon: Guitar },
  { value: 'bass', label: 'Bajo', icon: Music2 },
  { value: 'drums', label: 'Batería', icon: Drum },
  { value: 'piano', label: 'Piano', icon: Music },
  { value: 'vocal', label: 'Voz', icon: Music2 },
  { value: 'other', label: 'Otro', icon: Music },
];

// Toolbar component for tablature editing
function TablatureToolbar({ onInsert }: { onInsert: (text: string) => void }) {
  const guitarStrings = 'e|---\nB|---\nG|---\nD|---\nA|---\nE|---\n';
  const bassStrings = 'G|---\nD|---\nA|---\nE|---\n';

  const symbols = [
    { label: 'h', desc: 'Hammer-on', value: 'h' },
    { label: 'p', desc: 'Pull-off', value: 'p' },
    { label: 'b', desc: 'Bend', value: 'b' },
    { label: '/', desc: 'Slide up', value: '/' },
    { label: '\\', desc: 'Slide down', value: '\\' },
    { label: '~', desc: 'Vibrato', value: '~' },
    { label: 'x', desc: 'Mute', value: 'x' },
  ];

  return (
    <div className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="space-y-4">
        {/* String templates */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Plantillas de cuerdas</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert(guitarStrings)}
            >
              <Guitar className="size-4 mr-2" />
              Guitarra (6 cuerdas)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert(bassStrings)}
            >
              <Music2 className="size-4 mr-2" />
              Bajo (4 cuerdas)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert('---')}
            >
              Línea simple
            </Button>
          </div>
        </div>

        <Separator />

        {/* Symbols */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Símbolos y técnicas</Label>
          <div className="flex gap-2 flex-wrap">
            {symbols.map((symbol) => (
              <Button
                key={symbol.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onInsert(symbol.value)}
                title={symbol.desc}
              >
                {symbol.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert('|')}
              title="Separador de compás"
            >
              |
            </Button>
          </div>
        </div>

        <Separator />

        {/* Numbers */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Trastes</Label>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onInsert(num.toString())}
                className="w-10"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Formatting */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Formato</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert('\n')}
            >
              Nueva línea
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert('    ')}
            >
              Espacio (4)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert('\n\n[Intro]\n')}
            >
              [Sección]
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SongDetailProps {
  listId: string;
  song: Song;
  onBack: () => void;
}

export function SongDetail({ listId, song, onBack }: SongDetailProps) {
  const { currentProject, updateSong, deleteSong, addSongFile, createTablature, updateTablature, deleteTablature, addTablatureFile } = useProjects();
  const [openTabDialog, setOpenTabDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tablature | null>(null);
  const [tabData, setTabData] = useState({
    instrument: 'guitar',
    name: '',
    tuning: 'Standard (EADGBE)',
  });
  
  // Local state for song editing
  const [editSongData, setEditSongData] = useState({
    name: song.name || '',
    originalBand: song.originalBand || '',
    bpm: song.bpm || 0,
    key: song.key || '',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSaveSong = () => {
    if (!currentProject) return;
    updateSong(currentProject.id, listId, song.id, editSongData);
    toast.success('Canción guardada correctamente');
  };

  const handleCreateTablature = () => {
    if (!currentProject || !tabData.name.trim()) return;
    const instrument = INSTRUMENTS.find(i => i.value === tabData.instrument);
    createTablature(currentProject.id, listId, song.id, {
      instrument: instrument?.label || 'Guitarra',
      instrumentIcon: tabData.instrument,
      name: tabData.name,
      tuning: tabData.tuning,
      content: '',
    });
    setTabData({ instrument: 'guitar', name: '', tuning: 'Standard (EADGBE)' });
    setOpenTabDialog(false);
    toast.success('Tablatura creada');
  };

  const handleDeleteSong = () => {
    if (!currentProject) return;
    deleteSong(currentProject.id, listId, song.id);
    toast.success('Canción eliminada');
    onBack();
  };

  const handleDeleteTablature = (tabId: string) => {
    if (!currentProject) return;
    deleteTablature(currentProject.id, listId, song.id, tabId);
    if (selectedTab?.id === tabId) {
      setSelectedTab(null);
    }
    toast.success('Tablatura eliminada');
  };

  const handleUpdateTabContent = (tabId: string, content: string) => {
    if (!currentProject) return;
    updateTablature(currentProject.id, listId, song.id, tabId, { content });
  };

  const handleInsertText = (text: string) => {
    if (!textareaRef.current || !selectedTab) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = selectedTab.content;
    
    // Insert text at cursor position
    const newContent = 
      currentContent.substring(0, start) + 
      text + 
      currentContent.substring(end);
    
    handleUpdateTabContent(selectedTab.id, newContent);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleFileUpload = (type: 'song' | 'tab', tabId?: string) => {
    // Simulated file upload
    const fileName = prompt('Nombre del archivo:');
    if (!fileName || !currentProject) return;

    const file = {
      name: fileName,
      type: 'audio/mp3',
      url: 'https://example.com/file.mp3',
    };

    if (type === 'song') {
      addSongFile(currentProject.id, listId, song.id, file);
    } else if (tabId) {
      addTablatureFile(currentProject.id, listId, song.id, tabId, file);
    }
    toast.success('Archivo añadido');
  };

  const getInstrumentIcon = (iconName: string) => {
    const instrument = INSTRUMENTS.find(i => i.value === iconName);
    const Icon = instrument?.icon || Music;
    return <Icon className="size-4" />;
  };

  // Update return JSX
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">{song.name}</CardTitle>
                <p className="text-gray-600 mt-1">
                  {song.originalBand || song.bandName} • {song.bpm} BPM • {song.key}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSaveSong} className="bg-green-600 hover:bg-green-700">
                    <File className="size-4 mr-2" />
                    Guardar cambios
                </Button>
                <Button variant="destructive" onClick={handleDeleteSong}>
                <Trash2 className="size-4 mr-2" />
                Eliminar canción
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Información de la canción */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la canción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editSongData.name}
                onChange={(e) => setEditSongData({ ...editSongData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Banda</Label>
              <Input
                value={editSongData.originalBand}
                placeholder="Ej: The Beatles"
                onChange={(e) => setEditSongData({ ...editSongData, originalBand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>BPM</Label>
              <Input
                type="number"
                value={editSongData.bpm}
                onChange={(e) => setEditSongData({ ...editSongData, bpm: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tonalidad</Label>
              <Input
                value={editSongData.key}
                onChange={(e) => setEditSongData({ ...editSongData, key: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* ... rest of the component */}

      {/* Archivos y media */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Archivos y media</CardTitle>
            <Button size="sm" onClick={() => handleFileUpload('song')}>
              <Plus className="size-4 mr-2" />
              Añadir archivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {song.files.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay archivos adjuntos
            </p>
          ) : (
            <div className="space-y-2">
              {song.files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {file.type.startsWith('audio') ? (
                    <FileAudio className="size-5 text-blue-600" />
                  ) : file.type.startsWith('image') ? (
                    <ImageIcon className="size-5 text-green-600" />
                  ) : (
                    <File className="size-5 text-gray-600" />
                  )}
                  <span className="flex-1 text-sm">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tablaturas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tablaturas ({song.tablatures.length})</CardTitle>
            <Dialog open={openTabDialog} onOpenChange={setOpenTabDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Nueva tablatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear tablatura</DialogTitle>
                  <DialogDescription>
                    Añade una nueva tablatura para un instrumento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="tab-instrument">Instrumento</Label>
                    <Select
                      value={tabData.instrument}
                      onValueChange={(value) => setTabData({ ...tabData, instrument: value })}
                    >
                      <SelectTrigger id="tab-instrument">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTRUMENTS.map((inst) => (
                          <SelectItem key={inst.value} value={inst.value}>
                            {inst.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tab-name">Nombre</Label>
                    <Input
                      id="tab-name"
                      placeholder="Ej: Guitarra rítmica"
                      value={tabData.name}
                      onChange={(e) => setTabData({ ...tabData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tab-tuning">Afinación</Label>
                    <Input
                      id="tab-tuning"
                      placeholder="Ej: Standard (EADGBE)"
                      value={tabData.tuning}
                      onChange={(e) => setTabData({ ...tabData, tuning: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateTablature} className="w-full">
                    Crear tablatura
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {song.tablatures.length === 0 ? (
            <div className="text-center py-12">
              <Music2 className="size-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No hay tablaturas aún</p>
              <p className="text-sm text-gray-400">Crea tu primera tablatura</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                {song.tablatures.map((tab) => (
                  <Card
                    key={tab.id}
                    className={`cursor-pointer transition-all ${
                      selectedTab?.id === tab.id ? 'ring-2 ring-blue-600' : ''
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getInstrumentIcon(tab.instrumentIcon)}
                          </div>
                          <div>
                            <p className="font-medium">{tab.name}</p>
                            <p className="text-sm text-gray-600">{tab.instrument}</p>
                            <p className="text-xs text-gray-500">{tab.tuning}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTablature(tab.id);
                          }}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-2">
                {selectedTab ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedTab.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedTab.instrument} • {selectedTab.tuning}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handleFileUpload('tab', selectedTab.id)}>
                          <Plus className="size-4 mr-2" />
                          Añadir archivo
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tablature Toolbar */}
                      <TablatureToolbar onInsert={handleInsertText} />
                      
                      <div className="space-y-2">
                        <Label>Tablatura (estilo Ultimate Guitar)</Label>
                        <Textarea
                          ref={textareaRef}
                          value={selectedTab.content || ''}
                          onChange={(e) => handleUpdateTabContent(selectedTab.id, e.target.value)}
                          placeholder="Escribe tu tablatura aquí..."
                          className="font-mono text-sm min-h-[300px]"
                        />
                      </div>

                      {selectedTab.files.length > 0 && (
                        <div className="space-y-2">
                          <Label>Archivos adjuntos</Label>
                          <div className="space-y-2">
                            {selectedTab.files.map((file) => (
                              <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                {file.type.startsWith('audio') ? (
                                  <FileAudio className="size-5 text-blue-600" />
                                ) : file.type.startsWith('image') ? (
                                  <ImageIcon className="size-5 text-green-600" />
                                ) : (
                                  <File className="size-5 text-gray-600" />
                                )}
                                <span className="flex-1 text-sm">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500">Selecciona una tablatura para editarla</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}