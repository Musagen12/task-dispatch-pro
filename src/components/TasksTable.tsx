import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Camera } from 'lucide-react';
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
}

interface TasksTableProps {
  tasks: Task[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onPhotoUpload?: (taskId: string, files: File[]) => void;
  isAdmin: boolean;
}

export const TasksTable = ({ tasks, onStatusUpdate, onPhotoUpload, isAdmin }: TasksTableProps) => {
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
        <CardTitle>Tasks</CardTitle>
        <CardDescription>
          {isAdmin ? 'Manage all tasks and assignments' : 'Your task history and current assignments'}
        </CardDescription>
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