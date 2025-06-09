import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Server, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Activity,
  Clock,
  Database,
  MemoryStick
} from "lucide-react";

interface CacheStats {
  totalCleanups: number;
  lastCleanup: Date | null;
  memoryBefore: number;
  memoryAfter: number;
  queryCacheSize: number;
  sessionCacheSize: number;
  temporaryDataSize: number;
  currentMemoryUsage: number;
}

interface MemoryInfo {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  uptime: number;
  nodeVersion: string;
}

export default function SystemAdminPage() {
  const { toast } = useToast();

  // Buscar estatísticas do cache
  const { data: cacheStats, isLoading: loadingStats, refetch: refetchStats } = useQuery<CacheStats>({
    queryKey: ["/api/system/cache/stats"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar informações de memória
  const { data: memoryInfo, isLoading: loadingMemory, refetch: refetchMemory } = useQuery<MemoryInfo>({
    queryKey: ["/api/system/memory"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Mutation para limpar cache
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/system/cache/clear");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cache limpo",
        description: "Todo o cache foi limpo com sucesso",
      });
      refetchStats();
      refetchMemory();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar cache",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para executar limpeza
  const cleanupCacheMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/system/cache/cleanup");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Limpeza executada",
        description: "Limpeza de cache executada com sucesso",
      });
      refetchStats();
      refetchMemory();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na limpeza",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração do Sistema</h1>
          <p className="text-muted-foreground">Monitoramento e controle do cache e performance</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchStats();
              refetchMemory();
            }}
            disabled={loadingStats || loadingMemory}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Informações de Memória */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MemoryStick className="h-5 w-5 mr-2" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMemory ? (
            <div className="text-center py-4">Carregando informações...</div>
          ) : memoryInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{memoryInfo.heapUsed}</div>
                <div className="text-sm text-muted-foreground">Heap Usado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{memoryInfo.heapTotal}</div>
                <div className="text-sm text-muted-foreground">Heap Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{memoryInfo.rss}</div>
                <div className="text-sm text-muted-foreground">RSS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{memoryInfo.external}</div>
                <div className="text-sm text-muted-foreground">Externo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{formatUptime(memoryInfo.uptime)}</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{memoryInfo.nodeVersion}</div>
                <div className="text-sm text-muted-foreground">Node.js</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Erro ao carregar informações do sistema
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas do Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Estatísticas do Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="text-center py-4">Carregando estatísticas...</div>
          ) : cacheStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cacheStats.queryCacheSize}</div>
                <div className="text-sm text-muted-foreground">Queries em Cache</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{cacheStats.sessionCacheSize}</div>
                <div className="text-sm text-muted-foreground">Sessões Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{cacheStats.temporaryDataSize}</div>
                <div className="text-sm text-muted-foreground">Dados Temporários</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{cacheStats.totalCleanups}</div>
                <div className="text-sm text-muted-foreground">Total Limpezas</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Erro ao carregar estatísticas do cache
            </div>
          )}

          {cacheStats && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium">Última Limpeza</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(cacheStats.lastCleanup)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Memória Atual</div>
                  <div className="text-sm text-muted-foreground">
                    {cacheStats.currentMemoryUsage.toFixed(2)} MB
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => cleanupCacheMutation.mutate()}
                  disabled={cleanupCacheMutation.isPending}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Executar Limpeza
                </Button>
                
                <Button
                  onClick={() => clearCacheMutation.mutate()}
                  disabled={clearCacheMutation.isPending}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Todo Cache
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Limpeza Automática</span>
                <Badge variant="secondary">A cada 30 minutos</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TTL Queries</span>
                <Badge variant="outline">1 hora</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TTL Sessões</span>
                <Badge variant="outline">24 horas</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TTL Temporários</span>
                <Badge variant="outline">2 horas</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Histórico de Limpeza
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cacheStats && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Execução</span>
                  <span className="text-sm">{formatDate(cacheStats.lastCleanup)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de Limpezas</span>
                  <span className="text-sm">{cacheStats.totalCleanups}</span>
                </div>
                {cacheStats.lastCleanup && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Memória Antes</span>
                      <span className="text-sm">{cacheStats.memoryBefore.toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Memória Depois</span>
                      <span className="text-sm">{cacheStats.memoryAfter.toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Liberado</span>
                      <span className="text-sm font-medium text-green-600">
                        {(cacheStats.memoryBefore - cacheStats.memoryAfter).toFixed(2)} MB
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}