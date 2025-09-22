import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask, getWorkers, getTasks } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

interface Worker {
  id: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const TaskCreateDialog = ({ open, onOpenChange, onTaskCreated }: TaskCreateDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  useEffect(() => {
    if (open) {
      loadWorkers();
    }
  }, [open]);

  const loadWorkers = async () => {
    try {
      setIsLoadingWorkers(true);
      const [workersData, tasksData] = await Promise.all([
        getWorkers(),
        getTasks()
      ]);
      
      // Get workers who are active and don't have an active task
      const activeWorkers = workersData.filter(worker => worker.status === 'active');
      const activeTasks = tasksData.filter(task => task.status === 'pending' || task.status === 'in_progress');
      const busyWorkerUsernames = new Set(activeTasks.map(task => task.assigned_to));
      
      const availableWorkers = activeWorkers.filter(worker => !busyWorkerUsernames.has(worker.username));
      setWorkers(availableWorkers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workers",
      });
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !assignedTo) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createTask({
        title,
        description,
        assigned_to: assignedTo
      });
      
      toast({
        title: "Success",
        description: "Task created and assigned successfully",
      });
      
      setTitle('');
      setDescription('');
      setAssignedTo('');
      onOpenChange(false);
      onTaskCreated();
    } catch (error) {
      // Error already handled by API layer
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create and assign a new task to a worker
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="worker">Assign to Worker</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={isLoadingWorkers}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingWorkers ? "Loading workers..." : "Select a worker"} />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.username}>
                    {worker.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};