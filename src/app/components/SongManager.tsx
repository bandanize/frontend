import React, { useState } from 'react';
import { useProjects, Song } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Plus, Trash2, Music, ChevronRight, Edit } from 'lucide-react';
import { SongDetail } from '@/app/components/SongDetail';
import { toast } from 'sonner';

export function SongManager() {
  const { currentProject, createSongList, updateSongList, deleteSongList, createSong } = useProjects();
  const [openListDialog, setOpenListDialog] = useState(false);
  const [openSongDialog, setOpenSongDialog] = useState(false);
  const [openEditListDialog, setOpenEditListDialog] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<{ listId: string; song: Song } | null>(null);
  const [listName, setListName] = useState('');
  const [editListData, setEditListData] = useState({ id: '', name: '' });
  const [songData, setSongData] = useState({
    name: '',
    bandName: '',
    bpm: 120,
    key: 'C',
  });

  const handleCreateList = () => {
    if (!currentProject || !listName.trim()) return;
    createSongList(currentProject.id, listName);
    setListName('');
    setOpenListDialog(false);
    toast.success('Lista creada');
  };

  const handleEditList = (listId: string, currentName: string) => {
    setEditListData({ id: listId, name: currentName });
    setOpenEditListDialog(true);
  };

  const handleUpdateList = () => {
    if (!currentProject || !editListData.name.trim()) return;
    updateSongList(currentProject.id, editListData.id, editListData.name);
    setOpenEditListDialog(false);
    toast.success('Lista actualizada');
  };

  const handleDeleteList = (listId: string) => {
    if (!currentProject) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta lista? Se eliminarán todas las canciones.')) {
      deleteSongList(currentProject.id, listId);
      toast.success('Lista eliminada');
    }
  };

  const handleCreateSong = () => {
    if (!currentProject || !selectedListId || !songData.name.trim()) return;
    createSong(currentProject.id, selectedListId, songData);
    setSongData({ name: '', bandName: '', bpm: 120, key: 'C' });
    setOpenSongDialog(false);
    setSelectedListId(null);
    toast.success('Canción creada');
  };

  const handleSelectSong = (listId: string, song: Song) => {
    setSelectedSong({ listId, song });
  };

  if (!currentProject) return null;

  if (selectedSong) {
    return (
      <SongDetail
        listId={selectedSong.listId}
        song={selectedSong.song}
        onBack={() => setSelectedSong(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Listas de canciones</CardTitle>
            <Dialog open={openListDialog} onOpenChange={setOpenListDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Nueva lista
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear lista de canciones</DialogTitle>
                  <DialogDescription>
                    Agrupa tus canciones por álbum, setlist, etc.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="list-name">Nombre de la lista</Label>
                    <Input
                      id="list-name"
                      placeholder="Ej: Álbum 2024"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateList} className="w-full">
                    Crear lista
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {currentProject.songLists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Music className="size-12 mx-auto mb-2 opacity-50" />
              <p>No hay listas aún</p>
              <p className="text-sm">Crea tu primera lista de canciones</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {currentProject.songLists.map((list) => (
                <AccordionItem key={list.id} value={list.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">{list.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {list.songs.length} {list.songs.length === 1 ? 'canción' : 'canciones'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id);
                          }}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditList(list.id, list.name);
                          }}
                        >
                          <Edit className="size-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedListId(list.id);
                          setOpenSongDialog(true);
                        }}
                      >
                        <Plus className="size-4 mr-2" />
                        Añadir canción
                      </Button>

                      {list.songs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay canciones en esta lista
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {list.songs.map((song) => (
                            <div
                              key={song.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectSong(list.id, song)}
                            >
                              <div className="flex-1">
                                <p className="font-medium">{song.name}</p>
                                <p className="text-sm text-gray-600">
                                  {song.bandName} • {song.bpm} BPM • {song.key}
                                </p>
                              </div>
                              <ChevronRight className="size-5 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={openSongDialog} onOpenChange={setOpenSongDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir canción</DialogTitle>
            <DialogDescription>
              Completa la información de la canción
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="song-name">Nombre de la canción</Label>
              <Input
                id="song-name"
                placeholder="Ej: Wonderwall"
                value={songData.name}
                onChange={(e) => setSongData({ ...songData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="band-name">Nombre de la banda</Label>
              <Input
                id="band-name"
                placeholder="Ej: Oasis"
                value={songData.bandName}
                onChange={(e) => setSongData({ ...songData, bandName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  type="number"
                  value={songData.bpm}
                  onChange={(e) => setSongData({ ...songData, bpm: parseInt(e.target.value) || 120 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Tonalidad</Label>
                <Input
                  id="key"
                  placeholder="Ej: C, Dm, G#"
                  value={songData.key}
                  onChange={(e) => setSongData({ ...songData, key: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreateSong} className="w-full">
              Crear canción
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditListDialog} onOpenChange={setOpenEditListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lista de canciones</DialogTitle>
            <DialogDescription>
              Cambia el nombre de la lista
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">Nombre de la lista</Label>
              <Input
                id="list-name"
                placeholder="Ej: Álbum 2024"
                value={editListData.name}
                onChange={(e) => setEditListData({ ...editListData, name: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdateList} className="w-full">
              Actualizar lista
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}