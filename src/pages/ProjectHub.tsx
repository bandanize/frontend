import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { ArrowLeft, MessageSquare, Music, Users, Settings } from 'lucide-react';
import { ProjectChat } from '@/app/components/ProjectChat';
import { SongManager } from '@/app/components/SongManager';
import { MembersPanel } from '@/app/components/MembersPanel';
import { toast } from 'sonner';

export function ProjectHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, updateProject } = useProjects();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('songs');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: currentProject?.name || '',
    description: currentProject?.description || '',
    imageUrl: currentProject?.imageUrl || '',
  });

  const handleUpdateProject = () => {
    if (!currentProject) return;
    updateProject(currentProject.id, editData);
    setEditDialogOpen(false);
    toast.success('Proyecto actualizado');
  };

  if (!currentProject || currentProject.id !== projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando proyecto...</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Volver al dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
              <p className="text-sm text-gray-600">{currentProject.description}</p>
            </div>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setEditData({
                  name: currentProject.name,
                  description: currentProject.description,
                  imageUrl: currentProject.imageUrl || '',
                })}>
                  <Settings className="size-4 mr-2" />
                  Editar proyecto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar proyecto</DialogTitle>
                  <DialogDescription>
                    Actualiza la información del proyecto
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre del proyecto</Label>
                    <Input
                      id="edit-name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descripción</Label>
                    <Textarea
                      id="edit-description"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-image">URL de imagen (opcional)</Label>
                    <Input
                      id="edit-image"
                      value={editData.imageUrl}
                      onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleUpdateProject} className="w-full">
                    Guardar cambios
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="songs">
              <Music className="size-4 mr-2" />
              Canciones
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="size-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="size-4 mr-2" />
              Miembros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="songs">
            <SongManager />
          </TabsContent>

          <TabsContent value="chat">
            <ProjectChat />
          </TabsContent>

          <TabsContent value="members">
            <MembersPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}