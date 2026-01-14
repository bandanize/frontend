import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card';
import { Check, X, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function InvitationsPage() {
  const { invitations, acceptInvitation, rejectInvitation } = useProjects();
  const navigate = useNavigate();

  const handleAccept = async (id: string, bandName: string) => {
    try {
      await acceptInvitation(id);
      toast.success(`Te has unido a ${bandName}`);
    } catch (error) {
      toast.error('Error al aceptar la invitación');
    }
  };

  const handleReject = async (id: string, bandName: string) => {
    try {
      await rejectInvitation(id);
      toast.success(`Has rechazado la invitación de ${bandName}`);
    } catch (error) {
      toast.error('Error al rechazar la invitación');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="size-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Invitaciones de Proyecto</h1>
      </div>

      {!invitations?.length ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Mail className="size-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No tienes invitaciones pendientes</h2>
          <p className="text-gray-500">
            Cuando te inviten a un proyecto, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardHeader>
                <CardTitle>{inv.bandName}</CardTitle>
                <CardDescription>Te han invitado a colaborar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="size-4" />
                  <span>Invitación pendiente</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={() => handleAccept(inv.id, inv.bandName)}
                >
                  <Check className="size-4 mr-2" />
                  Aceptar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-red-600 hover:bg-red-50"
                  onClick={() => handleReject(inv.id, inv.bandName)}
                >
                  <X className="size-4 mr-2" />
                  Rechazar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
