import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Paperclip, RefreshCw } from 'lucide-react';
import { formatDateTimeString } from '@/lib/dateUtils';

interface Complaint {
  id: string;
  description: string;
  status: string;
  submitted_by: string;
  created_at: string;
  file_url?: string;
  location?: string;
  worker_name?: string;
}

interface ComplaintsTableProps {
  complaints: Complaint[];
  onStatusUpdate: (complaintId: string, status: string) => void;
  onRefresh?: () => void;
  isAdmin: boolean;
}

export const ComplaintsTable = ({ complaints, onStatusUpdate, onRefresh, isAdmin }: ComplaintsTableProps) => {
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Complaints</CardTitle>
            <CardDescription>
              {isAdmin ? 'Manage all worker complaints' : 'Your submitted complaints and their status'}
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell>
                    {formatDateTimeString(complaint.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Complaint Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Description</h4>
                              <p className="text-sm text-muted-foreground">{complaint.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Status</h4>
                                <StatusBadge status={complaint.status} />
                              </div>
                              <div>
                                <h4 className="font-medium">Submitted</h4>
                                <p className="text-sm">{formatDateTimeString(complaint.created_at)}</p>
                              </div>
                            </div>
                            {complaint.file_url && (
                              <div>
                                <h4 className="font-medium mb-2">Attached File</h4>
                                <a 
                                  href={complaint.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-2"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  View Attachment
                                </a>
                              </div>
                            )}
                            {isAdmin && (
                              <div>
                                <h4 className="font-medium mb-2">Update Status</h4>
                                <Select 
                                  value={complaint.status} 
                                  onValueChange={(value) => onStatusUpdate(complaint.id, value)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {complaint.file_url && (
                        <Badge variant="secondary" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          File
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {complaints.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No complaints found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};