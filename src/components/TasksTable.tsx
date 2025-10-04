import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Camera, RefreshCw, FileImage, RotateCcw } from 'lucide-react';
import { formatDateTime } from '@/lib/dateUtils';
import { ImageWithAuth } from '@/components/ImageWithAuth';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { resetTaskStatus } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Evidence {
  id: string;
  file_url: string;
  uploaded_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  created_at: string;
  worker_name?: string;
  photo_url?: string;
  evidence: Evidence[];
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resettingTaskId, setResettingTaskId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const getFullImageUrl = (filePath: string) => {
    // Remove any leading slash and construct the full URL
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const handleResetTask = async () => {
    if (!resettingTaskId || !resetReason.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a reason for resetting the task",
      });
      return;
    }

    setIsResetting(true);
    try {
      await resetTaskStatus(resettingTaskId, resetReason);
      toast({
        title: "Task Reset",
        description: "Task status has been reset and worker has been notified",
      });
      setResetDialogOpen(false);
      setResetReason('');
      setResettingTaskId(null);
      onRefresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error?.message || "Failed to reset task status",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => 
    statusFilter === 'all' || task.status === statusFilter
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
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
              {sortedTasks.map((task) => (
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
                       {task.evidence && task.evidence.length > 0 ? (
                         <Badge 
                           variant="secondary" 
                           className="text-xs cursor-pointer hover:bg-secondary/80"
                           onClick={() => setSelectedImage(task.evidence[0].file_url)}
                         >
                           <FileImage className="h-3 w-3 mr-1" />
                           {task.evidence.length} image{task.evidence.length > 1 ? 's' : ''}
                         </Badge>
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
                                   <ImageWithAuth
                                     srcPath={task.photo_url || ''}
                                     alt="Task completion"
                                     className="max-w-full h-64 object-cover rounded-md border"
                                   />
                                </div>
                              )}
                              {task.evidence && task.evidence.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Evidence ({task.evidence.length})</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {task.evidence.map((evidence, index) => (
                                      <div key={evidence.id} className="relative group">
                                        <ImageWithAuth
                                          srcPath={evidence.file_url}
                                          alt={`Evidence ${index + 1}`}
                                          className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80"
                                          onClick={() => setSelectedImage(evidence.file_url)}
                                        />
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                          {formatDateTime(evidence.uploaded_at)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                           </div>
                         </DialogContent>
                       </Dialog>
                       
                       {isAdmin && task.status === 'completed' && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setResettingTaskId(task.id);
                             setResetDialogOpen(true);
                           }}
                         >
                           <RotateCcw className="h-4 w-4" />
                         </Button>
                       )}
                       
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
          
          {sortedTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          )}
        </div>
      </CardContent>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Evidence Image</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-[calc(95vh-80px)] p-6 pt-2 overflow-auto">
            {selectedImage && (
              <ImageWithAuth
                srcPath={selectedImage || ''}
                alt="Evidence"
                className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform"
                onClick={(e) => {
                  const img = e.currentTarget;
                  if (img.style.transform === 'scale(2)') {
                    img.style.transform = 'scale(1)';
                    img.style.cursor = 'zoom-in';
                  } else {
                    img.style.transform = 'scale(2)';
                    img.style.cursor = 'zoom-out';
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Task Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Task Status</DialogTitle>
            <DialogDescription>
              Provide a reason for resetting this task. The worker will be notified with your message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetReason">Reason for Reset</Label>
              <Textarea
                id="resetReason"
                placeholder="e.g., Work quality doesn't meet standards, please redo..."
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetDialogOpen(false);
                setResetReason('');
                setResettingTaskId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetTask}
              disabled={isResetting || !resetReason.trim()}
            >
              {isResetting ? 'Resetting...' : 'Reset Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};