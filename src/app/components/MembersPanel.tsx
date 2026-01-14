import React, { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { UserPlus, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

export function MembersPanel() {
  const { currentProject, addMember } = useProjects();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const handleAddMember = () => {
    if (!currentProject || !email.trim()) return;

    try {
      addMember(currentProject.id, email);
      toast.success('Miembro añadido correctamente');
      setEmail('');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir miembro');
    }
  };

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Miembros del proyecto</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="size-4 mr-2" />
                  Invitar miembro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar miembro</DialogTitle>
                  <DialogDescription>
                    Introduce el email del músico que quieres invitar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="musico@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddMember} className="w-full">
                    Añadir miembro
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentProject.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="size-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="size-3 mr-1" />
                    {member.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
