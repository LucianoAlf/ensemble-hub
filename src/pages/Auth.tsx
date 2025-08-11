import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/useSEO";

const Auth = () => {
  useSEO({
    title: "Entrar ou criar conta | LA Music Hub",
    description: "Autenticação com Supabase: acesse sua conta ou crie uma nova.",
    canonical: "/auth",
  });

  const navigate = useNavigate();
  const location = useLocation() as any;
  const redirectTo = location?.state?.from?.pathname || "/dashboard";

  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (!error) navigate(redirectTo, { replace: true });
      } else {
        const { error } = await signUp(email, password);
        if (!error) {
          navigate("/auth", { replace: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="sr-only">Autenticação Supabase: Entrar ou Criar Conta</h1>
      <section className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Use seu e-mail e senha para acessar."
                : "Crie sua conta para acessar o painel."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 mb-4">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await signInWithGoogle();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <img
                  src="/images/google.svg"
                  alt="Logomarca do Google"
                  className="h-5 w-5"
                  loading="lazy"
                  width={20}
                  height={20}
                />
                <span>Continuar com Google</span>
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="hero" disabled={loading}>
                {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <div className="mt-4 text-sm text-muted-foreground">
              {mode === "login" ? (
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => setMode("register")}
                >
                  Não tem conta? Criar agora
                </button>
              ) : (
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => setMode("login")}
                >
                  Já possui conta? Entrar
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Auth;
