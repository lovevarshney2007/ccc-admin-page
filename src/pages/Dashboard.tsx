import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRegistrations, fetchBlockedIPs, blockIP, unblockIP, bulkResendMails, sendBulkReminders, type Registration } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, CalendarDays, TrendingUp, ShieldBan, Plus, Trash2, Loader2, Mail, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

const CYBER_COLORS = [
  'hsl(184, 100%, 50%)', // Cyber Cyan
  'hsl(212, 100%, 50%)', // Electric Blue
  'hsl(266, 100%, 50%)', // Neon Violet
  'hsl(330, 100%, 50%)', // Electric Pink
  'hsl(142, 70%, 50%)',  // Neon Green
  'hsl(43, 96%, 56%)',   // Cyber Gold
];

const Dashboard = () => {
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data: registrations, isLoading: isRegsLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: fetchRegistrations,
    refetchInterval: 15000,
  });

  const { data: blockedIPs, isLoading: isIPsLoading } = useQuery({
    queryKey: ['blockedIPs'],
    queryFn: fetchBlockedIPs,
    refetchInterval: 10000,
  });

  const blockMutation = useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason: string }) => blockIP(ip, reason),
    onSuccess: () => {
      toast.success('IP blocked successfully from dashboard');
      setNewIP('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['blockedIPs'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to block IP');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (ip: string) => unblockIP(ip),
    onSuccess: () => {
      toast.success('IP unblocked successfully');
      queryClient.invalidateQueries({ queryKey: ['blockedIPs'] });
    },
    onError: () => {
      toast.error('Failed to unblock IP');
    },
  });

  const bulkResendMutation = useMutation({
    mutationFn: bulkResendMails,
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Bulk confirmation emails queued');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to trigger bulk emails');
    },
  });

  const bulkReminderMutation = useMutation({
    mutationFn: sendBulkReminders,
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Bulk reminder emails queued');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send bulk reminders');
    },
  });

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIP.trim()) return;
    blockMutation.mutate({ ip: newIP.trim(), reason: reason.trim() || 'Blocked via Dashboard' });
  };

  if (isRegsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const regs = (registrations as Registration[]) ?? [];
  const totalRegistrations = regs.length;
  const verifiedCount = regs.filter((r) => r.isVerified !== false).length;
  const day1Present = regs.filter((r) => r.day1Present || r.isPresentDay1).length;
  const day2Present = regs.filter((r) => r.day2Present || r.isPresentDay2).length;
  const attendanceRate = totalRegistrations > 0 ? Math.round(((day1Present + day2Present) / (totalRegistrations * 2)) * 100) : 0;

  const stats = [
    { label: 'Total Registrations', value: totalRegistrations, icon: Users, color: 'text-cyan-400', border: 'border-cyan-500/20' },
    { label: 'Verified Payments', value: verifiedCount, icon: UserCheck, color: 'text-blue-500', border: 'border-blue-500/20' },
    { label: 'Day 1 Present', value: day1Present, icon: CalendarDays, color: 'text-purple-400', border: 'border-purple-500/20' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'text-pink-500', border: 'border-pink-500/20' },
  ];

  // Department/Branch breakdown
  const deptMap = new Map<string, number>();
  regs.forEach((r) => {
    const dept = r.branch || r.department || 'Unknown';
    deptMap.set(dept, (deptMap.get(dept) ?? 0) + 1);
  });
  const deptData = Array.from(deptMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Residence or Year breakdown
  const resMap = new Map<string, number>();
  regs.forEach((r) => {
    const res = r.residence || r.year || 'Hosteller';
    resMap.set(res, (resMap.get(res) ?? 0) + 1);
  });
  const resData = Array.from(resMap.entries()).map(([name, value]) => ({ name, value }));

  const ips = (blockedIPs as any[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Quick Action Toolbar */}
      <Card className="glass-card bg-gradient-to-r from-card/90 via-primary/5 to-card/90 border-primary/20">
        <CardContent className="py-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-semibold text-sm flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              CCC SPOCC 2026 Live Command Center
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage real-time event registrations, security, and broadcast emails.</p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkResendMutation.mutate()}
              disabled={bulkResendMutation.isPending}
              className="gap-2 border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all text-xs"
            >
              {bulkResendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-cyan-400" />}
              Resend Confirmation Mails
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkReminderMutation.mutate()}
              disabled={bulkReminderMutation.isPending}
              className="gap-2 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400 transition-all text-xs"
            >
              {bulkReminderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5 text-purple-400" />}
              Send Bulk Reminders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`glass-card hover:scale-[1.02] transition-transform ${stat.border}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-heading font-bold mt-1.5 tracking-tight text-foreground">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DIRECT IP CONTROL CENTER (User's Special Request) */}
      <Card className="glass-card border-destructive/30 bg-gradient-to-br from-card/90 via-destructive/5 to-card/90">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base flex items-center gap-2.5 text-foreground">
              <div className="p-1.5 rounded-lg bg-destructive/20 text-destructive">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span>Direct Security & IP Control Center</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Block suspicious IPs or unblock users instantly from the dashboard overview.</p>
              </div>
            </CardTitle>
            <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10">
              {ips.length} Blocked
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          {/* Block Input Bar */}
          <form onSubmit={handleBlock} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex-1">
              <Input
                placeholder="Enter IP Address to Block (e.g., 192.168.1.50)..."
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                className="bg-background/80 border-border font-mono text-sm"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Reason (optional, defaults to Dashboard Block)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-background/80 border-border text-sm"
              />
            </div>
            <Button type="submit" variant="destructive" disabled={blockMutation.isPending} className="gap-2 shadow-lg shadow-destructive/20 font-medium">
              {blockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
              Block IP Now
            </Button>
          </form>

          {/* Mini Real-Time Table of Blocked IPs */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-xs">#</TableHead>
                  <TableHead className="text-xs font-semibold">IP Address</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Blocked Date</TableHead>
                  <TableHead className="w-24 text-right text-xs font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isIPsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-primary" />
                      Loading live security data...
                    </TableCell>
                  </TableRow>
                ) : ips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-success opacity-80" />
                      No IP addresses are currently blocked. Security clear.
                    </TableCell>
                  </TableRow>
                ) : (
                  ips.slice(0, 5).map((ip: any, index: number) => (
                    <TableRow key={ip._id || ip.ipAddress} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-foreground">{ip.ipAddress}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ip.reason || 'Manually blocked'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {ip.blockedAt || ip.updatedAt ? new Date(ip.blockedAt || ip.updatedAt).toLocaleDateString() : 'Just now'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unblockMutation.mutate(ip.ipAddress)}
                          disabled={unblockMutation.isPending}
                          className="text-success hover:text-success hover:bg-success/10 h-8 px-2.5 gap-1 text-xs font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {ips.length > 5 && (
              <div className="py-2.5 px-4 bg-muted/20 text-center border-t border-border/40">
                <span className="text-xs text-muted-foreground">Showing top 5 of {ips.length} blocked IPs. Visit IP Management tab for full records.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-cyan-500/20">
          <CardHeader>
            <CardTitle className="font-heading text-base text-foreground flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-cyan-400" />
              Registrations by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(222, 47%, 7%)',
                    border: '1px solid hsl(217, 33%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={CYBER_COLORS[i % CYBER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="font-heading text-base text-foreground flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-purple-500" />
              Residence / Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={resData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {resData.map((_, i) => (
                    <Cell key={i} fill={CYBER_COLORS[(i + 2) % CYBER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(222, 47%, 7%)',
                    border: '1px solid hsl(217, 33%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
