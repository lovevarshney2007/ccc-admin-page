import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBlockedIPs, blockIP, unblockIP } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldBan, Plus, Trash2, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const IPManagementPage = () => {
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data: blockedIPs, isLoading } = useQuery({
    queryKey: ['blockedIPs'],
    queryFn: fetchBlockedIPs,
  });

  const blockMutation = useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason: string }) => blockIP(ip, reason),
    onSuccess: () => {
      toast.success('IP address blocked successfully');
      setNewIP('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['blockedIPs'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to block IP address');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockIP(id),
    onSuccess: () => {
      toast.success('IP address unblocked and restored');
      queryClient.invalidateQueries({ queryKey: ['blockedIPs'] });
    },
    onError: () => {
      toast.error('Failed to unblock IP address');
    },
  });

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIP.trim()) return;
    blockMutation.mutate({ ip: newIP.trim(), reason: reason.trim() || 'Manual Block from Security Center' });
  };

  const ips = (blockedIPs as any[]) ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Block new IP */}
      <Card className="glass-card border-destructive/30 bg-gradient-to-br from-card via-destructive/5 to-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="font-heading text-base flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-destructive/20 text-destructive">
                <ShieldBan className="w-5 h-5" />
              </div>
              <div>
                <span>Block Suspicious IP Address</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Add IP to blacklist to block all registration and API access immediately.</p>
              </div>
            </div>
            <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10">
              Active Blacklist
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleBlock} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="IP address (e.g., 192.168.1.100 or 10.0.0.5)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              className="sm:max-w-xs font-mono text-sm bg-background/80"
            />
            <Input
              placeholder="Reason for block (e.g., OTP rate limit exceeded)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex-1 text-sm bg-background/80"
            />
            <Button type="submit" variant="destructive" disabled={blockMutation.isPending} className="gap-2 shadow-lg shadow-destructive/20 font-medium">
              {blockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Block IP Now
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Blocked IPs list */}
      <Card className="glass-card border-border/50 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="font-heading text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Full Blacklisted IP Directory</span>
            </div>
            <Badge variant="secondary" className="px-2.5 py-0.5 font-mono">
              {ips.length} Records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-xs">#</TableHead>
                  <TableHead className="text-xs">IP Address</TableHead>
                  <TableHead className="text-xs">Reason / Note</TableHead>
                  <TableHead className="text-xs">Blocked Date</TableHead>
                  <TableHead className="w-32 text-right text-xs">Security Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading blacklisted IP addresses...
                    </TableCell>
                  </TableRow>
                ) : ips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-success opacity-80" />
                      <p className="font-medium text-foreground">No IP addresses are currently blocked.</p>
                      <p className="text-xs text-muted-foreground mt-0.5">All incoming traffic is clear and within rate limits.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  ips.map((ip: any, index: number) => (
                    <TableRow key={ip._id || ip.ipAddress} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground text-xs font-mono">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-foreground">{ip.ipAddress}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ip.reason || 'Manual block'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {ip.blockedAt || ip.updatedAt ? new Date(ip.blockedAt || ip.updatedAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unblockMutation.mutate(ip.ipAddress)}
                          disabled={unblockMutation.isPending}
                          className="text-success hover:text-success hover:bg-success/10 h-8 px-3 gap-1.5 font-medium text-xs border border-success/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Unblock IP
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IPManagementPage;
