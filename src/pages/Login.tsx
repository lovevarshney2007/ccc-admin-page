import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateApiKey, setApiKey } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await validateApiKey(key.trim());
      setApiKey(key.trim());
      login(key.trim());
      navigate('/dashboard');
    } catch {
      setError('Invalid API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* CCC SPOCC Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <div className="w-3 h-3 rounded-full bg-pink-500" />
          </div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">CCC SPOCC 2026</h1>
          <p className="text-muted-foreground font-mono text-sm tracking-wide">Cloud Computing Cell • Admin Hub</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary">
              <KeyRound className="w-5 h-5" />
              <span className="font-heading font-semibold">Admin Access</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter admin API key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="h-12"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={loading || !key.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Verifying...' : 'Access Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Contact your team lead for API key access
        </p>
      </div>
    </div>
  );
};

export default Login;
