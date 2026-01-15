import React, { useState, useRef, useEffect } from 'react';
import { useProjects, Song, Tablature } from '@/contexts/ProjectContext';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, Plus, Music2, FileAudio, Image as ImageIcon, File, Trash2, Guitar, Drum, Music, Check, Download, Play, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/app/components/ui/separator';
import { Progress } from '@/app/components/ui/progress';

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
              Guitarra
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsert(bassStrings)}
            >
              <Music2 className="size-4 mr-2" />
              Bajo
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
  const { 
    currentProject, 
    updateSong, 
    deleteSong, 
    addSongFile, 
    deleteSongFile,
    createTablature, 
    updateTablature, 
    deleteTablature, 
    addTablatureFile,
    deleteTablatureFile
  } = useProjects();
  const [openTabDialog, setOpenTabDialog] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
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

  // Local state for active tablature editing
  const [editingContent, setEditingContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSong, setIsSavingSong] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Upload State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Helper for exponential backoff
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Derive selectedTab from props to ensure it's always up to date
  const selectedTab = song.tablatures.find(t => t.id === selectedTabId) || null;

  // Sync local content when switching tabs
  useEffect(() => {
    if (selectedTab) {
      setEditingContent(selectedTab.content || '');
    }
  }, [selectedTabId]); 

  // Manual Save for Tablature
  const [hasTabChanges, setHasTabChanges] = useState(false);

  useEffect(() => {
    if (!selectedTab) return;
    setHasTabChanges(editingContent !== (selectedTab.content || ''));
  }, [editingContent, selectedTab]);

  const handleSaveTab = async () => {
    if (!selectedTabId || !currentProject) return;

    setIsSaving(true);
    try {
      await updateTablature(currentProject.id, listId, song.id, selectedTabId, { content: editingContent });
      setHasTabChanges(false);
      toast.success('Tablatura actualizada');
    } catch (error) {
      toast.error('Error al guardar tablatura');
    } finally {
      setIsSaving(false);
    }
  };

  const [hasSongChanges, setHasSongChanges] = useState(false);

  useEffect(() => {
    const hasChanges = 
        editSongData.name !== (song.name || '') ||
        editSongData.originalBand !== (song.originalBand || '') ||
        editSongData.bpm !== (song.bpm || 0) ||
        editSongData.key !== (song.key || '');
    setHasSongChanges(hasChanges);
  }, [editSongData, song]);

  const handleSaveSong = async () => {
    if (!currentProject) return;

    setIsSavingSong(true);
    try {
      await updateSong(currentProject.id, listId, song.id, editSongData);
      setHasSongChanges(false);
      toast.success('Canción actualizada');
    } catch (error) {
      toast.error('Error al guardar canción');
    } finally {
      setIsSavingSong(false);
    }
  };

  const handleInsertText = (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = editingContent;
    
    // Insert text at cursor position
    const newContent = 
      currentContent.substring(0, start) + 
      text + 
      currentContent.substring(end);
    
    setEditingContent(newContent);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
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
    if (selectedTabId === tabId) {
      setSelectedTabId(null);
    }
    toast.success('Tablatura eliminada');
  };

  const handleUpdateTabContent = (tabId: string, content: string) => {
    if (!currentProject) return;
    updateTablature(currentProject.id, listId, song.id, tabId, { content });
  };

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'song' | 'tab', tabId?: string } | null>(null);

  const handleFileUpload = (type: 'song' | 'tab', tabId?: string) => {
    setUploadTarget({ type, tabId });
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    }
  };

  // Helper for generating UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const uploadFileWithRetry = async (url: string, formData: FormData, retries = 3, delay = 1000): Promise<any> => {
      try {
          return await api.post(url, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 1000 * 60 * 5, // 5 minutes per chunk
          });
      } catch (error: any) {
          if (retries > 0) {
              if (error.response && error.response.status >= 400 && error.response.status < 500) {
                  throw error; // Don't retry client errors (4xx)
              }
              await wait(delay);
              return uploadFileWithRetry(url, formData, retries - 1, delay * 2);
          }
          throw error;
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !uploadTarget || !currentProject) return;

      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Iniciando subida...');
      const toastId = toast.loading('Calculando chunks...');

      try {
          let endpointCategory = 'file';
          if (file.type.startsWith('image/')) endpointCategory = 'image';
          else if (file.type.startsWith('audio/')) endpointCategory = 'audio';
          else if (file.type.startsWith('video/')) endpointCategory = 'video';

          const uploadId = generateUUID();
          const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks (Cloudflare limit is 100MB, so safe)
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          
          if (file.size === 0) {
            toast.error("El archivo está vacío");
            setUploadTarget(null);
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          let finalFilename = '';

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              const start = chunkIndex * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunk = file.slice(start, end);

              const formData = new FormData();
              formData.append('file', chunk);
              formData.append('chunkIndex', chunkIndex.toString());
              formData.append('totalChunks', totalChunks.toString());
              formData.append('uploadId', uploadId);
              formData.append('originalFilename', file.name);
              formData.append('folder', endpointCategory); // Backend expects singular or mapped 'files'

              const currentProgress = Math.round((chunkIndex / totalChunks) * 100);
              setUploadStatus(`Subiendo parte ${chunkIndex + 1} de ${totalChunks} (${currentProgress}%)...`);
              toast.loading(`Subiendo parte ${chunkIndex + 1} de ${totalChunks} (${currentProgress}%)`, { id: toastId });
              
              const response = await uploadFileWithRetry('/upload/chunk', formData);
              
              if (chunkIndex === totalChunks - 1) {
                  finalFilename = response.data;
              }

              // Update progress bar to completion of this chunk
              const percentCompleted = Math.round(((chunkIndex + 1) / totalChunks) * 100);
              setUploadProgress(percentCompleted);
          }

          let folderName = 'files';
          if (endpointCategory === 'image') folderName = 'images';
          if (endpointCategory === 'audio') folderName = 'audio';
          if (endpointCategory === 'video') folderName = 'videos';
          
          const mediaFile = {
              name: file.name,
              type: file.type,
              url: `/api/uploads/${folderName}/${finalFilename}`
          };

          if (uploadTarget.type === 'song') {
              await addSongFile(currentProject.id, listId, song.id, mediaFile);
          } else if (uploadTarget.type === 'tab' && uploadTarget.tabId) {
              await addTablatureFile(currentProject.id, listId, song.id, uploadTarget.tabId, mediaFile);
          }
          
          toast.success('Archivo subido correctamente', { id: toastId });

      } catch (error: any) {
          console.error("Upload error", error);
          let errorMessage = 'Error al subir el archivo';
          
          if (error.response) {
             if (error.response.status === 413) {
                  errorMessage = 'Chunk demasiado grande (Error inesperado)';
              } else if (error.response.status === 524) {
                  errorMessage = 'Timeout en subida de chunk.';
              }
          }

          toast.error(errorMessage, { id: toastId });
      } finally {
          setIsUploading(false);
          setUploadTarget(null);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const getInstrumentIcon = (iconName: string) => {
    const instrument = INSTRUMENTS.find(i => i.value === iconName);
    const Icon = instrument?.icon || Music;
    return <Icon className="size-4" />;
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
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
            <div className="flex gap-1 items-center">
                {hasSongChanges && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                        onClick={handleSaveSong}
                        disabled={isSavingSong}
                    >
                        <Check className="size-4" />
                    </Button>
                )}
                <Button 
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={handleDeleteSong}
                >
                    <Trash2 className="size-4" />
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

      {/* Archivos y media */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <CardTitle>Archivos y media</CardTitle>
                <Button size="sm" onClick={() => handleFileUpload('song')} disabled={isUploading}>
                  <Plus className="size-4 mr-2" />
                  Añadir archivo
                </Button>
              </div>
              {isUploading && (
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                          <span>{uploadStatus}</span>
                          <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                  </div>
              )}
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
                <div key={file.url} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                  {file.type.startsWith('audio') ? (
                    <FileAudio className="size-5 text-blue-600" />
                  ) : file.type.startsWith('image') ? (
                    <ImageIcon className="size-5 text-green-600" />
                  ) : (
                    <File className="size-5 text-gray-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(file.type.startsWith('audio') || file.type.startsWith('video') || file.type.startsWith('image')) && (
                        <Button
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setPreviewFile(file)}
                          title="Reproducir/Ver"
                        >
                            {file.type.startsWith('image') ? <Eye className="size-4" /> : <Play className="size-4" />}
                        </Button>
                      )}
                      
                        <a 
                        href={`${(import.meta.env.VITE_API_URL || '') + (file.url.startsWith('/uploads') ? '/api' + file.url : file.url)}`} 
                        download 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-200 rounded-md text-gray-600"
                        title="Descargar"
                      >
                          <Download className="size-4" />
                      </a>
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => currentProject && deleteSongFile(currentProject.id, listId, song.id, file.url)}
                        title="Eliminar"
                      >
                          <Trash2 className="size-4" />
                      </Button>
                  </div>
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
                      selectedTabId === tab.id ? 'ring-2 ring-blue-600' : ''
                    }`}
                    onClick={() => setSelectedTabId(tab.id)}
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
                      <div className="flex justify-end mb-2 items-center h-8 gap-1">
                        {hasTabChanges && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                                onClick={handleSaveTab}
                                disabled={isSaving}
                            >
                                <Check className="size-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => selectedTabId && handleDeleteTablature(selectedTabId)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {/* Tablature Toolbar */}
                      <TablatureToolbar onInsert={handleInsertText} />
                      
                      <div className="space-y-2">
                        <Label>Tablatura</Label>
                        <Textarea
                          ref={textareaRef}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          placeholder="Escribe tu tablatura aquí..."
                          className="font-mono text-sm min-h-[300px]"
                        />
                      </div>

                      {selectedTab.files.length > 0 && (
                        <div className="space-y-2">
                          <Label>Archivos adjuntos</Label>
                          <div className="space-y-2">
                            {selectedTab.files.map((file) => (
                              <div key={file.url} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                                {file.type.startsWith('audio') ? (
                                  <FileAudio className="size-5 text-blue-600" />
                                ) : file.type.startsWith('image') ? (
                                  <ImageIcon className="size-5 text-green-600" />
                                ) : (
                                  <File className="size-5 text-gray-600" />
                                )}
                                <div className="flex-1 min-w-0">
                                   <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {(file.type.startsWith('audio') || file.type.startsWith('video') || file.type.startsWith('image')) && (
                                      <Button
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => setPreviewFile(file)}
                                        title="Reproducir/Ver"
                                      >
                                          {file.type.startsWith('image') ? <Eye className="size-4" /> : <Play className="size-4" />}
                                      </Button>
                                    )}

                                    <a 
                                      href={`${(import.meta.env.VITE_API_URL || '') + (file.url.startsWith('/uploads') ? '/api' + file.url : file.url)}`} 
                                      download 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 hover:bg-gray-200 rounded-md text-gray-600"
                                      title="Descargar"
                                    >
                                        <Download className="size-4" />
                                    </a>
                                    <Button
                                      variant="ghost" 
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => currentProject && deleteTablatureFile(currentProject.id, listId, song.id, selectedTab.id, file.url)}
                                      title="Eliminar"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
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

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none text-white [&>button]:hidden">
            <DialogHeader className="p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex justify-between items-center">
                    <DialogTitle className="text-white drop-shadow-md">{previewFile?.name}</DialogTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setPreviewFile(null)}
                        className="text-white hover:bg-white/20 rounded-full"
                    >
                        <X className="size-6" />
                    </Button>
                </div>
                <DialogDescription className="sr-only">
                    Previsualización del archivo {previewFile?.name}
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center min-h-[50vh] max-h-[85vh] overflow-hidden p-4">
                {previewFile && (
                    <>
                        {previewFile.type.startsWith('image') && (
                            <img 
                                src={`${(import.meta.env.VITE_API_URL || '') + (previewFile.url.startsWith('/uploads') ? '/api' + previewFile.url : previewFile.url)}`} 
                                alt={previewFile.name} 
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                        )}
                        {previewFile.type.startsWith('audio') && (
                            <div className="w-full max-w-md bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                                <FileAudio className="size-16 mx-auto mb-4 text-blue-400" />
                                <audio 
                                    controls 
                                    className="w-full" 
                                    src={`${(import.meta.env.VITE_API_URL || '') + (previewFile.url.startsWith('/uploads') ? '/api' + previewFile.url : previewFile.url)}`} 
                                    autoPlay
                                />
                            </div>
                        )}
                        {previewFile.type.startsWith('video') && (
                            <video 
                                controls 
                                className="max-w-full max-h-[80vh]" 
                                src={`${(import.meta.env.VITE_API_URL || '') + (previewFile.url.startsWith('/uploads') ? '/api' + previewFile.url : previewFile.url)}`} 
                                autoPlay
                            />
                        )}
                    </>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}