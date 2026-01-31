import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2, Sparkles, Shield } from 'lucide-react';

const Auth = () => {
    const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupName, setSignupName] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await signIn(loginEmail, loginPassword);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao entrar',
                description: error.message,
            });
        } else {
            toast({
                title: 'Bem-vindo!',
                description: 'Login realizado com sucesso.',
            });
            navigate('/');
        }
        setIsSubmitting(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await signUp(signupEmail, signupPassword, signupName);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao criar conta',
                description: error.message,
            });
        } else {
            toast({
                title: 'Conta criada!',
                description: 'Verifique seu email para confirmar a conta.',
            });
        }
        setIsSubmitting(false);
    };

    const handleGoogleLogin = async () => {
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error.message,
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-md z-10">
                {/* Logo and Title */}
                <div className="flex flex-col items-center mb-8 animate-fade-in">
                    <div className="mb-4">
                        <img
                            src="/zoe-logo.png"
                            alt="Church Logo"
                            className="w-64 h-auto object-contain"
                        />
                    </div>
                    <p className="text-muted-foreground text-center">
                        Sua vida espiritual em um só lugar ✨
                    </p>
                </div>

                <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-4 space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Bem-vindo de volta
                        </CardTitle>
                        <CardDescription className="text-center">
                            Entre ou crie uma conta para começar sua jornada
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login" className="gap-2">
                                    <Shield className="h-4 w-4" />
                                    Entrar
                                </TabsTrigger>
                                <TabsTrigger value="signup" className="gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Criar Conta
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="login" className="space-y-4">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="login-email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                className="pl-10 h-11"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10 h-11"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Entrando...
                                            </>
                                        ) : (
                                            'Entrar'
                                        )}
                                    </Button>
                                </form>

                                <div className="text-center text-sm text-muted-foreground mt-4">
                                    <p>Perfis disponíveis:</p>
                                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                                        <span className="px-2 py-1 bg-primary/10 rounded-full text-xs">SuperUser</span>
                                        <span className="px-2 py-1 bg-secondary/10 rounded-full text-xs">Master</span>
                                        <span className="px-2 py-1 bg-accent/10 rounded-full text-xs">Usuário</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="signup" className="space-y-4">
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Nome Completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-name"
                                                type="text"
                                                placeholder="Seu nome completo"
                                                className="pl-10 h-11"
                                                value={signupName}
                                                onChange={(e) => setSignupName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                className="pl-10 h-11"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="Mínimo 6 caracteres"
                                                className="pl-10 h-11"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Criando conta...
                                            </>
                                        ) : (
                                            'Criar Conta'
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>


                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
            </div>
        </div>
    );
};

export default Auth;
