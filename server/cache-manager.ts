import { log } from "./vite";

interface CacheStats {
  totalCleanups: number;
  lastCleanup: Date | null;
  memoryBefore: number;
  memoryAfter: number;
}

class CacheManager {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats: CacheStats = {
    totalCleanups: 0,
    lastCleanup: null,
    memoryBefore: 0,
    memoryAfter: 0
  };

  // Cache stores
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private sessionCache = new Map<string, { data: any; timestamp: number }>();
  private temporaryData = new Map<string, { data: any; timestamp: number }>();

  constructor() {
    this.startPeriodicCleanup();
  }

  // Iniciar limpeza automática a cada 30 minutos
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performFullCleanup();
    }, 30 * 60 * 1000); // 30 minutos

    log("🧹 Cache Manager: Limpeza automática configurada para cada 30 minutos");
  }

  // Limpeza completa do cache
  public performFullCleanup(): void {
    const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.stats.memoryBefore = memoryBefore;

    log("🧹 Cache Manager: Iniciando limpeza completa do cache...");

    // Limpar cache de queries antigas (mais de 1 hora)
    this.cleanExpiredQueries();

    // Limpar sessões inativas (mais de 24 horas)
    this.cleanInactiveSessions();

    // Limpar dados temporários (mais de 2 horas)
    this.cleanTemporaryData();

    // Forçar garbage collection se disponível
    this.forceGarbageCollection();

    const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.stats.memoryAfter = memoryAfter;
    this.stats.lastCleanup = new Date();
    this.stats.totalCleanups++;

    const memoryFreed = memoryBefore - memoryAfter;
    log(`🧹 Cache Manager: Limpeza concluída. Memória liberada: ${memoryFreed.toFixed(2)}MB`);
  }

  // Limpar queries expiradas
  private cleanExpiredQueries(): void {
    const now = Date.now();
    let cleaned = 0;

    this.queryCache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      log(`🧹 Cache Manager: ${cleaned} queries expiradas removidas`);
    }
  }

  // Limpar sessões inativas
  private cleanInactiveSessions(): void {
    const now = Date.now();
    const sessionTTL = 24 * 60 * 60 * 1000; // 24 horas
    let cleaned = 0;

    this.sessionCache.forEach((value, key) => {
      if (now - value.timestamp > sessionTTL) {
        this.sessionCache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      log(`🧹 Cache Manager: ${cleaned} sessões inativas removidas`);
    }
  }

  // Limpar dados temporários
  private cleanTemporaryData(): void {
    const now = Date.now();
    const tempTTL = 2 * 60 * 60 * 1000; // 2 horas
    let cleaned = 0;

    this.temporaryData.forEach((value, key) => {
      if (now - value.timestamp > tempTTL) {
        this.temporaryData.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      log(`🧹 Cache Manager: ${cleaned} dados temporários removidos`);
    }
  }

  // Forçar garbage collection
  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      log("🧹 Cache Manager: Garbage collection executado");
    }
  }

  // Métodos para gerenciar cache de queries
  public setQuery(key: string, data: any, ttl: number = 60 * 60 * 1000): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  public getQuery(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Métodos para gerenciar cache de sessões
  public setSession(key: string, data: any): void {
    this.sessionCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public getSession(key: string): any | null {
    const cached = this.sessionCache.get(key);
    return cached ? cached.data : null;
  }

  // Métodos para gerenciar dados temporários
  public setTemporaryData(key: string, data: any): void {
    this.temporaryData.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public getTemporaryData(key: string): any | null {
    const cached = this.temporaryData.get(key);
    return cached ? cached.data : null;
  }

  // Obter estatísticas do cache
  public getStats(): CacheStats & {
    queryCacheSize: number;
    sessionCacheSize: number;
    temporaryDataSize: number;
    currentMemoryUsage: number;
  } {
    return {
      ...this.stats,
      queryCacheSize: this.queryCache.size,
      sessionCacheSize: this.sessionCache.size,
      temporaryDataSize: this.temporaryData.size,
      currentMemoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }

  // Limpeza manual do cache
  public clearAll(): void {
    this.queryCache.clear();
    this.sessionCache.clear();
    this.temporaryData.clear();
    this.forceGarbageCollection();
    log("🧹 Cache Manager: Todo o cache foi limpo manualmente");
  }

  // Parar o cache manager
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      log("🧹 Cache Manager: Parado");
    }
  }
}

// Instância singleton
export const cacheManager = new CacheManager();

// Graceful shutdown
process.on('SIGTERM', () => {
  cacheManager.stop();
});

process.on('SIGINT', () => {
  cacheManager.stop();
});