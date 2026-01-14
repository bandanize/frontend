import React, { useState, useEffect } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { UserPlus, Mail, User, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/app/components/ui/utils";
import api from '@/services/api';

export function MembersPanel() {
  const { currentProject, inviteMember } = useProjects();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  
  // Search states
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
        if (!searchValue.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/users/search?query=${searchValue}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error searching users", error);
        } finally {
            setLoading(false);
        }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchValue]);

  const handleInviteMember = async () => {
    if (!currentProject || !email) return;

    try {
      await inviteMember(currentProject.id, email);
      toast.success('Invitación enviada correctamente');
      setEmail('');
      setSearchValue('');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar invitación');
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
              <DialogContent className="sm:max-w-[400px] overflow-visible">
                <DialogHeader>
                  <DialogTitle>Invitar miembro</DialogTitle>
                  <DialogDescription>
                    Busca un usuario por email o nombre para invitarlo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2 flex flex-col">
                    <Label>Usuario</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between"
                        >
                          {email
                            ? searchResults.find((user) => user.email === email)?.name || email
                            : "Buscar usuario..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Buscar por email o nombre..." 
                            value={searchValue}
                            onValueChange={setSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                            <CommandGroup>
                              {searchResults.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.email} // Use email as value for uniqueness in selection
                                  onSelect={(currentValue) => {
                                    setEmail(currentValue === email ? "" : currentValue);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      email === user.email ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                      <span>{user.name}</span>
                                      <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={handleInviteMember} className="w-full" disabled={!email}>
                    Invitar al proyecto
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
