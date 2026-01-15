import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/app/components/ui/dropdown-menu';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { ArrowLeft, MessageSquare, Music, Users, Settings, LogOut, User, Mail } from 'lucide-react';
import { ProjectChat } from '@/app/components/ProjectChat';
import { SongManager } from '@/app/components/SongManager';
import { MembersPanel } from '@/app/components/MembersPanel';
import { toast } from 'sonner';

import { uploadFile } from '@/services/api';

export function ProjectHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, updateProject, leaveProject, deleteProject, invitations } = useProjects();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('songs');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: currentProject?.name || '',
    description: currentProject?.description || '',
    imageUrl: currentProject?.imageUrl || '',
  });

  // Sync edit data when dialog opens
  React.useEffect(() => {
    if (editDialogOpen && currentProject) {
      setEditData({
        name: currentProject.name,
        description: currentProject.description,
        imageUrl: currentProject.imageUrl || '',
      });
    }
  }, [editDialogOpen, currentProject]);

  const handleUpdateProject = async () => {
    if (!currentProject) return;
    try {
      await updateProject(currentProject.id, editData);
      setEditDialogOpen(false);
      toast.success('Proyecto actualizado');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error al actualizar el proyecto');
    }
  };

  const handleLeaveProject = async () => {
    if (!currentProject || !window.confirm('¿Estás seguro de que quieres abandonar este proyecto?')) return;
    try {
        await leaveProject(currentProject.id);
        toast.success('Has abandonado el proyecto');
        navigate('/dashboard');
    } catch (error) {
        console.error('Error leaving project:', error);
        toast.error('Error al abandonar el proyecto');
    }
  };

  const handleDeleteProject = async () => {
      if (!currentProject) return;
      try {
          await deleteProject(currentProject.id);
          navigate('/dashboard');
      } catch (error) {
          console.error("Error deleting project:", error);
          toast.error("No se pudo eliminar el proyecto");
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
          toast.loading("Subiendo imagen...");
          // Assume image upload
          const filename = await uploadFile(file, 'image');
          // Update local state with new URL (assuming backend returns filename, user needs full URL)
          // The backend returns just the filename. We need to prepend /api/uploads/images/ or similar?
          // Or UploadController might return different path.
          // Checked UploadController: returns `filename`.
          // We likely need to construct the URL. 
          // Assuming /api/uploads/images/{filename} is served by Nginx or static resource handler.
          // Let's assume standard path for now: `/api/uploads/images/${filename}`
          // Construct robust URL matching SongDetail logic
          const baseUrl = import.meta.env.VITE_API_URL || '';
          const fullUrl = `${baseUrl}/api/uploads/images/${filename}`;
          
          setEditData(prev => ({ ...prev, imageUrl: fullUrl }));
          toast.dismiss();
          toast.success("Imagen subida correctamente");
      } catch (error) {
          console.error("Upload error:", error);
          toast.dismiss();
          toast.error("Error al subir la imagen");
      }
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
            <div className="flex gap-2">
            {currentProject.ownerId === user?.id ? (
              <>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="size-4 mr-2" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configuración del Proyecto</DialogTitle>
                    <DialogDescription>
                      Actualiza la información del proyecto o gestionalo.
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
                      <Label htmlFor="edit-image">Imagen del Proyecto</Label>
                      <div className="flex gap-2">
                         <Input
                          id="edit-image"
                          value={editData.imageUrl}
                          onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })}
                          placeholder="URL de la imagen"
                          className="flex-1"
                        />
                      </div>
                       <div className="mt-2">
                           <Label htmlFor="upload-image" className="text-xs text-gray-500 mb-1 block">O subir imagen:</Label>
                           <Input
                              id="upload-image"
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                           />
                       </div>
                    </div>
                    <Button onClick={handleUpdateProject} className="w-full">
                      Guardar cambios
                    </Button>
                    
                    <div className="border-t pt-4 mt-4">
                        <Label className="text-red-600 mb-2 block">Zona de Peligro</Label>
                        <Button variant="destructive" className="w-full" onClick={async () => {
                            if (window.confirm("¿ESTÁS SEGURO? Esta acción borrará el proyecto y todos sus datos permanentemente.")) {
                                try {
                                    // Need to import deleteBand
                                    // For now, I'll use a placeholder handler
                                    await handleDeleteProject(); 
                                } catch (e) {
                                    toast.error("Error al eliminar proyecto");
                                }
                            }
                        }}>
                             Eliminar Proyecto
                        </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <User className="size-4 mr-2" />
                    {user?.username}
                    {(invitations?.length || 0) > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {invitations.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="size-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/invitations')}>
                    <Mail className="size-4 mr-2" />
                    Invitaciones
                    {(invitations?.length || 0) > 0 && (
                      <span className="ml-auto bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">
                        {invitations.length}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="size-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
                <Button variant="destructive" onClick={handleLeaveProject}>
                    <LogOut className="size-4 mr-2" />
                    Abandonar
                </Button>
            )}
            </div>
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