import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRegistrations, verifyPayment, resendConfirmationMail, sendSingleReminder, type Registration } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Mail, Bell, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PAGE_SIZE = 15;
const CHECKS_STORAGE_KEY = 'ccc_admin_user_checks';

const UsersPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: fetchRegistrations,
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyPayment(id),
    onSuccess: () => {
      toast.success('Payment verified successfully');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to verify payment');
    },
  });

  const resendMailMutation = useMutation({
    mutationFn: (id: string) => resendConfirmationMail(id),
    onSuccess: () => {
      toast.success('Confirmation email sent');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send confirmation email');
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (id: string) => sendSingleReminder(id),
    onSuccess: () => {
      toast.success('Reminder email sent');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send reminder');
    },
  });

  const filtered = (registrations ?? []).filter((r) => {
    const q = search.toLowerCase();
    const branch = r.branch || r.department || '';
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.studentNumber?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      branch.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleCheck = (id: string) => {
    const newMap = { ...checkedMap, [id]: !checkedMap[id] };
    setCheckedMap(newMap);
    localStorage.setItem(CHECKS_STORAGE_KEY, JSON.stringify(newMap));
  };

  const exportCSV = () => {
    const headers = ['S.No', 'Selected', 'Payment Verified', 'Name', 'Email', 'Phone', 'Student Number', 'Branch', 'Residence', 'Day 1', 'Day 2', 'Transaction ID'];
    const rows = filtered.map((r, index) => [
      index + 1,
      checkedMap[r.studentNumber] ? 'YES' : 'NO',
      r.isVerified !== false ? 'Verified' : 'Pending',
      r.name, r.email, r.phone || '', r.studentNumber, r.branch || r.department || '', r.residence || 'Hosteller',
      (r.day1Present || r.isPresentDay1) ? 'Present' : 'Absent',
      (r.day2Present || r.isPresentDay2) ? 'Present' : 'Absent',
      r.transactionId || ''
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ccc-spocc-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, student #, branch..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-background/80"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportCSV} className="gap-2 flex-1 sm:flex-none border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400">
            <Download className="w-4 h-4" />
            Export CSV ({filtered.length})
          </Button>
        </div>
      </div>

      <Card className="glass-card overflow-hidden border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-xs">#</TableHead>
                  <TableHead className="w-12 px-2 text-center">
                    <CheckCircle2 className="w-4 h-4 mx-auto text-muted-foreground" />
                  </TableHead>
                  <TableHead className="text-xs">Student Info</TableHead>
                  <TableHead className="text-xs">Branch / Res</TableHead>
                  <TableHead className="text-center text-xs">Payment</TableHead>
                  <TableHead className="text-center text-xs">Day 1</TableHead>
                  <TableHead className="text-center text-xs">Day 2</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No registrations found matching criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r, index) => {
                    const recordId = r._id || r.id || '';
                    const isVerified = r.isVerified !== false;
                    const day1 = r.day1Present || r.isPresentDay1;
                    const day2 = r.day2Present || r.isPresentDay2;

                    return (
                      <TableRow key={recordId || r.studentNumber} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-muted-foreground text-xs">
                          {page * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell className="text-center px-2">
                          <Checkbox 
                            checked={!!checkedMap[r.studentNumber]}
                            onCheckedChange={() => toggleCheck(r.studentNumber)}
                            className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground text-sm">{r.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-cyan-400">{r.studentNumber}</span>
                            <span>•</span>
                            <span>{r.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{r.branch || r.department || 'CSE'}</div>
                          <div className="text-xs text-muted-foreground">{r.residence || 'Hosteller'}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isVerified ? (
                            <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20 font-normal">
                              Verified
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => recordId && verifyMutation.mutate(recordId)}
                              disabled={verifyMutation.isPending || !recordId}
                              className="h-7 px-2 text-xs border-warning/50 text-warning hover:bg-warning/10 gap-1"
                            >
                              {verifyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                              Verify
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <AttendanceBadge present={!!day1} />
                        </TableCell>
                        <TableCell className="text-center">
                          <AttendanceBadge present={!!day2} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Resend Confirmation Email"
                              onClick={() => recordId && resendMailMutation.mutate(recordId)}
                              disabled={resendMailMutation.isPending || !recordId || !isVerified}
                              className="h-8 w-8 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Send Reminder Email"
                              onClick={() => recordId && reminderMutation.mutate(recordId)}
                              disabled={reminderMutation.isPending || !recordId}
                              className="h-8 w-8 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10"
                            >
                              <Bell className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>Showing {paginated.length} of {filtered.length} registrations</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const AttendanceBadge = ({ present }: { present: boolean }) => (
  <Badge variant={present ? 'default' : 'secondary'} className={present ? 'bg-success/20 text-success border border-success/30 font-normal hover:bg-success/20' : 'bg-muted text-muted-foreground font-normal hover:bg-muted'}>
    {present ? 'Present' : 'Absent'}
  </Badge>
);

export default UsersPage;
