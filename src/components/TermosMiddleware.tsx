import { useTermosMiddleware } from "@/hooks/useTermosMiddleware";

interface TermosMiddlewareProps {
  children: React.ReactNode;
}

export function TermosMiddleware({ children }: TermosMiddlewareProps) {
  const { verificando } = useTermosMiddleware();

  // Enquanto verifica, pode mostrar loading ou simplesmente renderizar children
  // O hook já redireciona se necessário
  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return <>{children}</>;
}
