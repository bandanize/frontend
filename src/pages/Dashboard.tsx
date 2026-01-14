import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { LogOut, Plus, Music2, Users, User, Settings, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WelcomeModal } from '@/app/components/WelcomeModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/app/components/ui/dropdown-menu';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { projects, createProject, selectProject, invitations } = useProjects();
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectImage, setProjectImage] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is the first time the user logs in
    const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user?.id}`);
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
    }
  }, [user]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    if (user) {
      localStorage.setItem(`welcome_seen_${user.id}`, 'true');
    }
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      createProject(projectName, projectDescription, projectImage || undefined);
      setProjectName('');
      setProjectDescription('');
      setProjectImage('');
      setOpen(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Music2 className="size-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Proyectos Musicales</h1>
                <p className="text-sm text-gray-600">Bienvenido, {user?.name}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="size-4 mr-2" />
                  {user?.name}
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Tus proyectos</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] rounded-lg">
              <DialogHeader>
                <DialogTitle>Crear nuevo proyecto</DialogTitle>
                <DialogDescription>
                  Crea un proyecto en solitario o una banda musical
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nombre del proyecto</Label>
                  <Input
                    id="project-name"
                    placeholder="Ej: The Sodawaves"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Descripción</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Ej: Banda de alternative rock"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-image">URL de imagen (opcional)</Label>
                  <Input
                    id="project-image"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={projectImage}
                    onChange={(e) => setProjectImage(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Crear proyecto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <Music2 className="size-16 mx-auto text-gray-400 mb-4" />
              <CardTitle>No tienes proyectos aún</CardTitle>
              <CardDescription>
                Crea tu primer proyecto musical para empezar
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                {project.imageUrl ? (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={project.imageUrl}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-400 rounded-t-lg flex items-center justify-center">
                    <Music2 className="size-16 text-white" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="size-4 mr-2" />
                    {project.members.length} {project.members.length === 1 ? 'miembro' : 'miembros'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <WelcomeModal open={showWelcome} onClose={handleCloseWelcome} />
    </div>
  );
}