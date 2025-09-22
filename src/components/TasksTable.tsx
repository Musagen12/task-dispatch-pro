import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Camera, RefreshCw, FileImage, Download } from 'lucide-react';
import { formatDateTime } from '@/lib/dateUtils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  created_at: string;
  worker_name?: string;
  photo_url?: string;
  evidence_count?: number;
  evidence_urls?: string[];
}

interface TasksTableProps {
  tasks: Task[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onPhotoUpload?: (taskId: string, files: File[]) => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

export const TasksTable = ({ tasks, onStatusUpdate, onPhotoUpload, onRefresh, isAdmin }: TasksTableProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              {isAdmin ? 'Manage all tasks and assignments' : 'Your task history and current assignments'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Worker</TableHead>}
                <TableHead>Evidence</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                   <TableCell>
                     <StatusBadge status={task.status} />
                   </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {task.assigned_to ? (
                          <Badge variant="outline">{task.assigned_to}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                    )}
                   <TableCell>
                     <div className="flex items-center gap-2">
                       {task.evidence_count && task.evidence_count > 0 ? (
                         <>
                           <Badge variant="secondary" className="text-xs">
                             <FileImage className="h-3 w-3 mr-1" />
                             {task.evidence_count}
                           </Badge>
                           {task.evidence_urls && task.evidence_urls.length > 0 && (
                             <Button 
                               variant="ghost" 
                               size="sm"
                               onClick={() => {
                                 task.evidence_urls?.forEach((url, index) => {
                                   const link = document.createElement('a');
                                   link.href = url;
                                   link.download = `evidence-${task.id}-${index + 1}`;
                                   link.target = '_blank';
                                   document.body.appendChild(link);
                                   link.click();
                                   document.body.removeChild(link);
                                 });
                               }}
                             >
                               <Download className="h-3 w-3" />
                             </Button>
                           )}
                         </>
                       ) : (
                         <span className="text-muted-foreground text-xs">No evidence</span>
                       )}
                     </div>
                   </TableCell>
                   <TableCell>
                     {formatDateTime(task.created_at)}
                   </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{task.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Description</h4>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="font-medium">Status</h4>
                                <StatusBadge status={task.status} />
                              </div>
                              <div>
                                <h4 className="font-medium">Created</h4>
                                <p className="text-sm">{formatDateTime(task.created_at)}</p>
                              </div>
                            </div>
                             {task.photo_url && (
                               <div>
                                 <h4 className="font-medium mb-2">Completion Photo</h4>
                                 <img 
                                   src={task.photo_url} 
                                   alt="Task completion" 
                                   className="max-w-full h-64 object-cover rounded-md border"
                                 />
                               </div>
                             )}
                             {task.evidence_urls && task.evidence_urls.length > 0 && (
                               <div>
                                 <h4 className="font-medium mb-2">Evidence ({task.evidence_count || task.evidence_urls.length})</h4>
                                 <div className="grid grid-cols-2 gap-2">
                                   {task.evidence_urls.map((url, index) => (
                                     <img 
                                       key={index}
                                       src={url} 
                                       alt={`Evidence ${index + 1}`} 
                                       className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80"
                                       onClick={() => window.open(url, '_blank')}
                                     />
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {task.photo_url && (
                        <Badge variant="secondary" className="text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          Photo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};