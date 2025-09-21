import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatDateTime } from '@/lib/dateUtils';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  user_id: string;
  created_at: string;
  details?: any;
}

interface AuditLogsTableProps {
  auditLogs: AuditLog[];
}

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return 'bg-success/10 text-success border-success/20';
    case 'update':
      return 'bg-warning/10 text-warning-foreground border-warning/20';
    case 'delete':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const AuditLogsTable = ({ auditLogs }: AuditLogsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          System activity and change history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{log.user_id}</code>
                  </TableCell>
                  <TableCell>
                    {log.details ? (
                      <div className="max-w-xs truncate text-xs">
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details).substring(0, 50) + '...'
                          : String(log.details).substring(0, 50) + '...'
                        }
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Action</h4>
                              <Badge className={getActionColor(log.action)}>
                                {log.action.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-medium">User ID</h4>
                              <code className="text-sm">{log.user_id}</code>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium">Timestamp</h4>
                            <p className="text-sm">{formatDateTime(log.created_at)}</p>
                          </div>
                          {log.details && (
                            <div>
                              <h4 className="font-medium mb-2">Details</h4>
                              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {auditLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};