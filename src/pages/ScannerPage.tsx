import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAttendance } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CameraOff, CheckCircle2, XCircle, Loader2, Hash, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

interface ScanResult {
  studentNumber: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

const ScannerPage = () => {
  const [scanning, setScanning] = useState(false);
  const [day, setDay] = useState<1 | 2>(1);
  const [manualInput, setManualInput] = useState('');
  const [history, setHistory] = useState<ScanResult[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const dayRef = useRef<1 | 2>(day);
  const queryClient = useQueryClient();

  useEffect(() => {
    dayRef.current = day;
  }, [day]);

  const mutation = useMutation({
    mutationFn: ({ studentNumber, d }: { studentNumber: string; d: 1 | 2 }) =>
      markAttendance(studentNumber, d),
    onSuccess: (_, vars) => {
      const result: ScanResult = {
        studentNumber: vars.studentNumber,
        success: true,
        message: `Marked present for Day ${vars.d}`,
        timestamp: new Date(),
      };
      setHistory((prev) => [result, ...prev]);
      toast.success(`${vars.studentNumber} marked present for Day ${vars.d}`);
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (err: any, vars) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to mark attendance';
      console.error('[Attendance Error]', err?.response?.data || err);
      const result: ScanResult = {
        studentNumber: vars.studentNumber,
        success: false,
        message: msg,
        timestamp: new Date(),
      };
      setHistory((prev) => [result, ...prev]);
      toast.error(msg);
    },
  });

  const handleScan = useCallback(
    (decodedText: string) => {
      const studentNumber = decodedText.trim();
      if (!studentNumber) return;
      
      const now = Date.now();
      const lastScanned = lastScannedRef.current;
      
      // If same code scanned within last 3 seconds, ignore it to prevent spam
      if (lastScanned && lastScanned.code === studentNumber && (now - lastScanned.time < 3000)) {
        return;
      }
      
      lastScannedRef.current = { code: studentNumber, time: now };
      mutation.mutate({ studentNumber, d: dayRef.current });
    },
    [mutation]
  );

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
      setScanning(true);
    } catch (err) {
      toast.error('Failed to access camera. Ensure HTTPS and camera permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    mutation.mutate({ studentNumber: manualInput.trim(), d: day });
    setManualInput('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Day selector banner */}
      <Card className="glass-card bg-gradient-to-r from-card via-cyan-500/10 to-card border-cyan-500/20">
        <CardContent className="py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base">CCC SPOCC QR & ID Scanner</h3>
              <p className="text-xs text-muted-foreground">Scan attendee QR code or enter Student Number / Mongo ObjectId.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50">
            <span className="text-xs font-medium text-muted-foreground px-2">Day:</span>
            <Button
              variant={day === 1 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDay(1)}
              className={day === 1 ? 'bg-cyan-500 text-black hover:bg-cyan-400 font-semibold' : ''}
            >
              Day 1
            </Button>
            <Button
              variant={day === 2 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDay(2)}
              className={day === 2 ? 'bg-cyan-500 text-black hover:bg-cyan-400 font-semibold' : ''}
            >
              Day 2
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="camera" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/40 p-1">
          <TabsTrigger value="camera" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Camera className="w-4 h-4" /> Live Camera Scanner
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Hash className="w-4 h-4" /> Manual ID / Student Number
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <Card className="glass-card border-cyan-500/20">
            <CardContent className="pt-6 space-y-4">
              <div
                id="qr-reader"
                className="mx-auto max-w-sm rounded-xl overflow-hidden bg-muted/30 border border-border/50 shadow-inner"
                style={{ minHeight: scanning ? '300px' : '0' }}
              />
              <div className="flex justify-center">
                {scanning ? (
                  <Button variant="destructive" onClick={stopScanner} className="gap-2 shadow-lg shadow-destructive/20 font-medium">
                    <CameraOff className="w-4 h-4" /> Stop Scanner
                  </Button>
                ) : (
                  <Button onClick={startScanner} className="gap-2 bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 font-medium">
                    <Camera className="w-4 h-4" /> Start Live Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="glass-card border-purple-500/20">
            <CardContent className="pt-6">
              <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter Student Number (e.g., 2500123) or Mongo ObjectId..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 font-mono text-base h-11 bg-background/80"
                  autoFocus
                />
                <Button type="submit" disabled={mutation.isPending} className="gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium h-11 px-6 shadow-lg shadow-purple-500/20">
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Mark Day {day} Present
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scan history */}
      {history.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="font-heading text-base flex items-center justify-between">
              <span>Scan Session History</span>
              <span className="text-xs font-normal text-muted-foreground">{history.length} scans recorded in this session</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.success ? (
                      <div className="p-1.5 rounded-full bg-success/20 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-full bg-destructive/20 text-destructive">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="font-mono text-sm font-semibold text-foreground">{item.studentNumber}</span>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScannerPage;
