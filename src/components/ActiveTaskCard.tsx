import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Camera, Check, Upload } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  photo_url?: string;
}

interface ActiveTaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, status: string) => void;
  onPhotoUpload: (taskId: string, files: File[]) => void;
}

export const ActiveTaskCard = ({ task, onStatusUpdate, onPhotoUpload }: ActiveTaskCardProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAcknowledge = () => {
    onStatusUpdate(task.id, 'acknowledged');
  };

  const handleComplete = async () => {
    if (!selectedFile) {
      alert('Please upload a photo before completing the task');
      return;
    }

    setIsUploading(true);
    try {
      await onPhotoUpload(task.id, [selectedFile]);
      onStatusUpdate(task.id, 'completed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{task.title}</CardTitle>
            <CardDescription className="mt-2">{task.description}</CardDescription>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Assigned on {new Date(task.created_at).toLocaleDateString()}
        </div>

        {task.status === 'assigned' && (
          <div className="flex gap-4">
            <Button onClick={handleAcknowledge} variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Acknowledge Task
            </Button>
          </div>
        )}

        {task.status === 'acknowledged' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Upload Completion Photo</h4>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Preview:</h5>
                <img 
                  src={previewUrl} 
                  alt="Task completion preview" 
                  className="max-w-full h-48 object-cover rounded-md border"
                />
              </div>
            )}

            <Button 
              onClick={handleComplete}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Task
                </>
              )}
            </Button>
          </div>
        )}

        {task.photo_url && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Completion Photo:</h5>
            <img 
              src={task.photo_url} 
              alt="Task completion" 
              className="max-w-full h-48 object-cover rounded-md border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};