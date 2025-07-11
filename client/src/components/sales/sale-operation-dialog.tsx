import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clearHistoryCache } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CheckCircle2, RotateCcw, Send, Truck, Ban, Calendar, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ConfirmNoProviderDialog from "./confirm-no-provider-dialog";

function getStatusLabel(status: string) {
  switch (status) {
    case "pending": return "Pendente";
    case "in_progress": return "Em Execução";
    case "completed": return "Concluído";
    case "returned": return "Devolvido";
    case "corrected": return "Corrigido";
    default: return "Desconhecido";
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "pending": return "default";
    case "in_progress": return "warning";
    case "completed": return "success";
    case "returned": return "destructive";
    case "corrected": return "secondary";
    default: return "default";
  }
}

type SaleOperationDialogProps = {
  open: boolean;
  onClose: () => void;
  saleId?: number;
};

export default function SaleOperationDialog({
  open,
  onClose,
  saleId,
}: SaleOperationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [returnReason, setReturnReason] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [isReturning, setIsReturning] = useState(false);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null);
  const [selectedServiceProviderIds, setSelectedServiceProviderIds] = useState<number[]>([]);
  const [showServiceProviderField, setShowServiceProviderField] = useState(false);
  const [hasPrestadorParceiro, setHasPrestadorParceiro] = useState(false);
  
  // Limpar o cache do histórico quando o diálogo é aberto
  useEffect(() => {
    if (open && saleId) {
      clearHistoryCache(saleId);
      console.log(`[SaleOperationDialog] Cache de histórico limpo para venda #${saleId}`);
    }
  }, [open, saleId]);
  
  // Query para obter dados principais da venda
  const { data: sale, isLoading: saleLoading } = useQuery({
    queryKey: ["/api/sales", saleId],
    queryFn: async () => {
      if (!saleId) return null;
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados da venda");
      }
      const data = await response.json();
      console.log("[SaleOperationDialog] Dados da venda:", data);
      return data;
    },
    enabled: !!saleId && open,
  });
  
  // Query para obter prestadores de serviço já associados a esta venda
  const { data: saleServiceProviders = [] } = useQuery({
    queryKey: ["/api/sales", saleId, "service-providers"],
    queryFn: async () => {
      if (!saleId) return [];
      const response = await fetch(`/api/sales/${saleId}/service-providers`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!saleId && open,
  });
  
  // Mutation para atualizar prestadores de serviço
  const updateServiceProvidersMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("ID da venda não fornecido");
      
      try {
        console.log("Atualizando prestadores de serviço:", selectedServiceProviderIds);
        const response = await fetch(`/api/sales/${saleId}/service-providers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ providerIds: selectedServiceProviderIds }),
        });
        
        if (!response.ok) {
          let errorMsg = "Erro ao atualizar prestadores de serviço";
          
          try {
            // Tentar extrair mensagem de erro do JSON
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            // Se não conseguir extrair JSON, tentar obter o texto simples
            try {
              const text = await response.text();
              // Verificar se há um erro HTML (como erro 500)
              if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                console.error("Resposta HTML recebida:", text.substring(0, 100));
                errorMsg = "Erro interno do servidor ao processar prestadores de serviço";
              } else if (text) {
                errorMsg = text;
              }
            } catch (e) {
              console.error("Erro ao extrair texto da resposta:", e);
            }
          }
          
          throw new Error(errorMsg);
        }
        
        // Tratar resposta que pode ser vazia
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await response.json();
          } else {
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
          }
        } catch (e) {
          console.log("Resposta vazia ou não-JSON, retornando sucesso");
          return { success: true };
        }
      } catch (error) {
        console.error("Erro ao atualizar prestadores:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId, "service-providers"] });
      console.log("Prestadores de serviço atualizados com sucesso");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar prestadores",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Query para obter itens da venda
  const { data: saleItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/sales", saleId, "items"],
    queryFn: async () => {
      if (!saleId) return [];
      const response = await fetch(`/api/sales/${saleId}/items`);
      if (!response.ok) {
        throw new Error("Erro ao carregar itens da venda");
      }
      return response.json();
    },
    enabled: !!saleId && open,
  });
  
  // Query para obter o histórico de status
  const { data: statusHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/sales", saleId, "history"],
    queryFn: async () => {
      if (!saleId) return [];
      console.log(`[SaleOperationDialog] Carregando histórico da venda #${saleId}`);
      const response = await fetch(`/api/sales/${saleId}/history`);
      if (!response.ok) {
        console.error(`[SaleOperationDialog] Erro ao carregar histórico: ${response.status}`);
        throw new Error("Erro ao carregar histórico de status");
      }
      const data = await response.json();
      console.log(`[SaleOperationDialog] Histórico carregado: ${data.length} registros`);
      return data;
    },
    enabled: !!saleId && open,
  });
  
  // Query para obter dados complementares
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Erro ao carregar serviços");
      }
      return response.json();
    },
    enabled: open,
  });
  
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["/api/service-types"],
    queryFn: async () => {
      const response = await fetch("/api/service-types");
      if (!response.ok) {
        throw new Error("Erro ao carregar tipos de serviço");
      }
      return response.json();
    },
    enabled: open,
  });
  
  const { data: serviceProviders = [] } = useQuery({
    queryKey: ["/api/service-providers"],
    queryFn: async () => {
      const response = await fetch("/api/service-providers");
      if (!response.ok) {
        throw new Error("Erro ao carregar prestadores de serviço");
      }
      return response.json();
    },
    enabled: open,
  });
  
  // Dados da venda enriquecidos
  const enrichedSale = sale
    ? {
        ...sale,
        sellerName: sale.seller?.username || "Não informado",
        customerName: sale.customer?.name || "Não informado",
        serviceTypeName: serviceTypes.find((type: any) => type.id === sale.serviceTypeId)?.name,
        serviceProviderName: serviceProviders.find((provider: any) => provider.id === sale.serviceProviderId)?.name,
      }
    : null;

  const startExecutionMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("ID da venda não fornecido");
      
      // Validação obrigatória: tipo de serviço precisa ser selecionado
      if (!selectedServiceTypeId) {
        throw new Error("É necessário selecionar um tipo de execução");
      }
      
      // Preparar dados para envio
      const requestData: any = {
        serviceTypeId: selectedServiceTypeId,
      };
      
      // Se o checkbox estiver marcado, incluir os prestadores selecionados
      if (hasPrestadorParceiro && selectedServiceProviderIds.length > 0) {
        // Se houver apenas um prestador selecionado, enviar como serviceProviderId
        if (selectedServiceProviderIds.length === 1) {
          requestData.serviceProviderId = selectedServiceProviderIds[0];
          console.log("Enviando prestador único:", selectedServiceProviderIds[0]);
        } else {
          // Se houver múltiplos, enviar o primeiro como principal e os demais na relação
          requestData.serviceProviderId = selectedServiceProviderIds[0];
          requestData.additionalProviderIds = selectedServiceProviderIds.slice(1);
          console.log("Enviando prestador principal:", selectedServiceProviderIds[0], 
                     "e adicionais:", selectedServiceProviderIds.slice(1));
        }
      } else if (!hasPrestadorParceiro) {
        // Se o checkbox não está marcado, zeramos a lista de prestadores
        setSelectedServiceProviderIds([]);
      }
      
      try {
        // Atualizar os prestadores de serviço (sempre, independente do checkbox)
        await updateServiceProvidersMutation.mutateAsync();
      } catch (error) {
        console.error("Erro ao atualizar prestadores no fluxo de início de execução:", error);
        // Continue mesmo se der erro para evitar travar o fluxo principal
      }
      
      // Iniciar a execução
      console.log("Iniciando execução com dados:", JSON.stringify(requestData, null, 2));
      const response = await fetch(`/api/sales/${saleId}/start-execution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao iniciar execução da venda");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      // Recarregar dados da venda atual
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId, "history"] });
      toast({
        title: "Execução iniciada",
        description: "A venda foi movida para o status 'Em Execução'",
      });
      // Não fechar a tela automaticamente
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao iniciar execução",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const completeExecutionMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("ID da venda não fornecido");
      
      // Primeiro, garantir que os prestadores estejam atualizados
      try {
        console.log("Atualizando prestadores antes de completar execução:", selectedServiceProviderIds);
        await updateServiceProvidersMutation.mutateAsync();
      } catch (error) {
        console.error("Erro ao atualizar prestadores antes de completar execução:", error);
        // Continue mesmo com erro para não bloquear o fluxo principal
      }
      
      const response = await fetch(`/api/sales/${saleId}/complete-execution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao completar execução da venda");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      // Recarregar dados da venda atual
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId, "history"] });
      toast({
        title: "Execução concluída",
        description: "A venda foi marcada como 'Concluída'",
      });
      // Não fechar a tela automaticamente
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao concluir execução",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const returnToSellerMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("ID da venda não fornecido");
      
      const response = await fetch(`/api/sales/${saleId}/return-to-seller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnReason }),
      });
      
      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || error.message || "Erro ao devolver a venda");
        } catch (parseError) {
          const errorText = await response.text();
          console.error("Erro ao fazer parse da resposta de erro:", parseError);
          console.error("Texto da resposta:", errorText);
          throw new Error(`Erro HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
      }
      
      try {
        return await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error("Erro ao fazer parse da resposta de sucesso:", parseError);
        console.error("Texto da resposta:", responseText);
        throw new Error("Resposta inválida do servidor: " + responseText.substring(0, 100));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      toast({
        title: "Venda devolvida",
        description: "A venda foi devolvida ao vendedor para correção",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao devolver venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const markAsCorrectedMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("ID da venda não fornecido");
      
      const response = await fetch(`/api/sales/${saleId}/mark-as-corrected`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao marcar como corrigida");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      toast({
        title: "Venda corrigida",
        description: "A venda foi marcada como corrigida e está pronta para execução",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao marcar como corrigida",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Manipulador para ações baseadas no status da venda
  const updateExecutionTypeMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("ID da venda não fornecido");
      
      // Validação obrigatória: tipo de serviço precisa ser selecionado
      if (!selectedServiceTypeId) {
        throw new Error("É necessário selecionar um tipo de execução");
      }
      
      // Preparar dados para envio
      const requestData: any = {
        serviceTypeId: selectedServiceTypeId,
      };
      
      const response = await fetch(`/api/sales/${saleId}/update-execution-type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao atualizar tipo de execução");
      }
      
      // Se o checkbox não está marcado, zeramos a lista de prestadores
      if (!hasPrestadorParceiro) {
        setSelectedServiceProviderIds([]);
      }
      
      try {
        // Atualizar os prestadores de serviço (sempre, independente do checkbox)
        await updateServiceProvidersMutation.mutateAsync();
      } catch (error) {
        console.error("Erro ao atualizar prestadores no fluxo principal:", error);
        // Continue mesmo se der erro para evitar travar o fluxo principal
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      toast({
        title: "Tipo de execução atualizado",
        description: "O tipo de execução da venda foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tipo de execução",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Estado para controlar visibilidade do diálogo de confirmação
  const [showNoProviderConfirm, setShowNoProviderConfirm] = useState(false);

  const handleMainAction = () => {
    if (!sale) return;
    
    if (sale.status === "pending" || sale.status === "corrected" || sale.status === "returned") {
      startExecutionMutation.mutate();
    } else if (sale.status === "in_progress") {
      // Verificar se a venda tem prestadores selecionados
      // Só mostra confirmação se checkbox está ativo MAS não tem prestadores selecionados
      if (hasPrestadorParceiro && selectedServiceProviderIds.length === 0) {
        // Mostrar diálogo de confirmação personalizado
        setShowNoProviderConfirm(true);
      } else if (!hasPrestadorParceiro) {
        // Se checkbox "Possui prestadores" não está marcado, também perguntar
        setShowNoProviderConfirm(true);
      } else {
        // Se tiver prestador selecionado, prosseguir com a conclusão
        completeExecutionMutation.mutate();
      }
    }
  };
  
  // Handler para quando o usuário confirma que não quer prestador
  const handleConfirmNoProvider = () => {
    setShowNoProviderConfirm(false);
    completeExecutionMutation.mutate();
  };
  
  // Handler para quando o usuário cancela (quer adicionar prestador)
  const handleCancelNoProvider = () => {
    setShowNoProviderConfirm(false);
  };
  
  // Manipulador para atualizar o tipo de execução
  const handleUpdateExecutionType = () => {
    if (sale) {
      updateExecutionTypeMutation.mutate();
    }
  };
  
  // Manipulador para devolver a venda
  const handleReturnSale = () => {
    if (returnReason.trim() === "") {
      toast({
        title: "Erro",
        description: "É necessário informar o motivo da devolução",
        variant: "destructive",
      });
      return;
    }
    
    returnToSellerMutation.mutate();
  };
  
  // Manipulador para marcar a venda como corrigida (supervisor)
  const handleMarkAsCorrected = () => {
    markAsCorrectedMutation.mutate();
  };

  // Efeito para inicializar o tipo de serviço quando a venda for carregada
  useEffect(() => {
    if (sale && serviceTypes.length > 0) {
      setSelectedServiceTypeId(sale.serviceTypeId);
      
      // Mostrar campo de prestadores para qualquer tipo de serviço
      setShowServiceProviderField(true);
    }
  }, [sale, serviceTypes]);
  
  // Efeito para inicializar os prestadores de serviço selecionados
  useEffect(() => {
    if (saleServiceProviders.length > 0) {
      // Extrair IDs dos prestadores associados à venda
      const ids = saleServiceProviders.map((provider: any) => provider.id);
      setSelectedServiceProviderIds(ids);
      setHasPrestadorParceiro(true); // Se há prestadores associados, ativamos o checkbox
      console.log(`[SaleOperationDialog] Prestadores de serviço carregados: ${ids.length}`);
    } else if (sale?.serviceProviderId && showServiceProviderField) {
      // Compatibilidade com o campo antigo
      setSelectedServiceProviderIds(sale.serviceProviderId ? [sale.serviceProviderId] : []);
      setHasPrestadorParceiro(!!sale.serviceProviderId); // Ativamos o checkbox se há um prestador legado
    } else {
      // Se não há prestadores, o checkbox deve ficar desmarcado por padrão
      setHasPrestadorParceiro(false);
    }
  }, [saleServiceProviders, sale, showServiceProviderField]);

  // Manipulador para alterar o tipo de serviço
  const handleServiceTypeChange = (typeId: string) => {
    const id = parseInt(typeId);
    setSelectedServiceTypeId(id);
    
    // Mostrar campo de prestadores para qualquer tipo de serviço
    setShowServiceProviderField(true);
  };

  // Manipulador para toggle de checkbox de prestador de serviço
  const handleServiceProviderToggle = (providerId: number) => {
    setSelectedServiceProviderIds(prevIds => {
      // Se o ID já estiver selecionado, removê-lo
      if (prevIds.includes(providerId)) {
        return prevIds.filter(id => id !== providerId);
      }
      // Caso contrário, adicioná-lo
      return [...prevIds, providerId];
    });
  };
  
  // Limpar o estado quando o diálogo for fechado
  useEffect(() => {
    if (!open) {
      setReturnReason("");
      setIsReturning(false);
      setActiveTab("summary");
      setSelectedServiceTypeId(null);
      setSelectedServiceProviderIds([]);
      setShowServiceProviderField(false);
    }
  }, [open]);

  // Renderizar componente
  const isLoading = saleLoading || itemsLoading || historyLoading;

  return (
    <>
      {/* Diálogo de confirmação quando não tem prestador selecionado */}
      <ConfirmNoProviderDialog 
        open={showNoProviderConfirm}
        onConfirm={handleConfirmNoProvider}
        onCancel={handleCancelNoProvider}
      />
    
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Tratativa da Venda #{enrichedSale?.orderNumber}</span>
            {enrichedSale && (
              <Badge variant={getStatusVariant(enrichedSale.status) as any}>
                {getStatusLabel(enrichedSale.status)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Acompanhe e gerencie o processo de execução desta venda
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p>Carregando informações da venda...</p>
          </div>
        ) : !enrichedSale ? (
          <div className="flex justify-center items-center py-8">
            <p>Venda não encontrada</p>
          </div>
        ) : (
          <>
            <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="items">Itens ({saleItems.length})</TabsTrigger>
                <TabsTrigger value="history">Histórico ({statusHistory.length})</TabsTrigger>
                <TabsTrigger value="execution">Execução</TabsTrigger>
              </TabsList>
              
              {/* Tab de Resumo */}
              <TabsContent value="summary">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Detalhes da Venda</CardTitle>
                    <CardDescription>
                      Informações gerais sobre a venda e cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-1">Pedido</h3>
                        <p className="text-sm text-muted-foreground">{enrichedSale.orderNumber}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Data</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(enrichedSale.date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Cliente</h3>
                        <p className="text-sm text-muted-foreground overflow-ellipsis overflow-hidden">
                          {enrichedSale.customerName}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Vendedor</h3>
                        <p className="text-sm text-muted-foreground">
                          {enrichedSale.sellerName}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <h3 className="font-medium mb-1">Valor Total</h3>
                        <p className="text-lg">
                          R$ {parseFloat(enrichedSale.totalAmount).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      {enrichedSale.notes && (
                        <div className="col-span-2">
                          <h3 className="font-medium mb-1">Observações</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {enrichedSale.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tab de Execução */}
              <TabsContent value="execution">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Configuração da Execução</CardTitle>
                    <CardDescription>
                      Defina como o serviço será executado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="serviceType">Tipo de Serviço</Label>
                        <Select 
                          value={selectedServiceTypeId?.toString()} 
                          onValueChange={handleServiceTypeChange}
                          disabled={enrichedSale.status === "completed"}
                        >
                          <SelectTrigger id="serviceType">
                            <SelectValue placeholder="Selecione o tipo de serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {showServiceProviderField && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="hasParceiro"
                              checked={hasPrestadorParceiro}
                              onCheckedChange={(checked) => setHasPrestadorParceiro(!!checked)}
                              disabled={enrichedSale.status === "completed"}
                            />
                            <Label htmlFor="hasParceiro">Possui prestadores de serviço parceiros</Label>
                          </div>
                          
                          {hasPrestadorParceiro && (
                            <div className="grid gap-2 mt-3 pl-6">
                              <Label>Selecione os Prestadores de Serviço</Label>
                              <div className="flex flex-col">
                                {selectedServiceProviderIds.length > 0 ? (
                                  <div className="space-y-1">
                                    {serviceProviders.map((provider: any) => (
                                      <div key={provider.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                          id={`provider-${provider.id}`}
                                          checked={selectedServiceProviderIds.includes(provider.id)}
                                          onCheckedChange={() => handleServiceProviderToggle(provider.id)}
                                          disabled={enrichedSale.status === "completed"}
                                        />
                                        <Label htmlFor={`provider-${provider.id}`}>{provider.name}</Label>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {serviceProviders.map((provider: any) => (
                                      <div key={provider.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                          id={`provider-${provider.id}`}
                                          checked={selectedServiceProviderIds.includes(provider.id)}
                                          onCheckedChange={() => handleServiceProviderToggle(provider.id)}
                                          disabled={enrichedSale.status === "completed"}
                                        />
                                        <Label htmlFor={`provider-${provider.id}`}>{provider.name}</Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleUpdateExecutionType}
                      variant="outline"
                      disabled={enrichedSale.status === "completed" || 
                        updateExecutionTypeMutation.isPending}
                      className="mr-2"
                    >
                      {updateExecutionTypeMutation.isPending ? (
                        "Atualizando..."
                      ) : (
                        "Atualizar Tipo de Execução"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Tab de Itens */}
              <TabsContent value="items">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Itens da Venda</CardTitle>
                    <CardDescription>
                      Serviços e produtos incluídos nesta venda
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                              Nenhum item encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          saleItems.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.serviceName || `Serviço #${item.serviceId}`}
                              </TableCell>
                              <TableCell>
                                {serviceTypes.find((t: any) => t.id === item.serviceTypeId)?.name || `Tipo #${item.serviceTypeId}`}
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                R$ {parseFloat(item.totalPrice || '0').toFixed(2).replace('.', ',')}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                      <TableCaption>
                        Total: R$ {enrichedSale ? parseFloat(enrichedSale.totalAmount).toFixed(2).replace('.', ',') : "0,00"}
                      </TableCaption>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tab de Histórico */}
              <TabsContent value="history">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Histórico de Status</CardTitle>
                    <CardDescription>
                      Timeline de alterações de status desta venda
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statusHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum registro de histórico encontrado
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {statusHistory.map((record: any, idx: number) => (
                            <div key={record.id} className="flex items-start space-x-4 pb-4 border-b border-border/60 last:border-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                                record.toStatus === "completed" ? "bg-green-100 text-green-600" :
                                record.toStatus === "in_progress" ? "bg-yellow-100 text-yellow-600" :
                                record.toStatus === "returned" ? "bg-red-100 text-red-600" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {record.toStatus === "completed" ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : record.toStatus === "in_progress" ? (
                                  <Truck className="h-5 w-5" />
                                ) : record.toStatus === "returned" ? (
                                  <Ban className="h-5 w-5" />
                                ) : (
                                  <Calendar className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium">
                                    {record.toStatus ? (
                                      <>
                                        Status alterado para <Badge variant={getStatusVariant(record.toStatus) as any}>{getStatusLabel(record.toStatus)}</Badge>
                                      </>
                                    ) : (
                                      "Venda registrada"
                                    )}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {record.timestamp ? format(new Date(record.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {record.fromStatus ? (
                                    <>
                                      Status anterior: <Badge variant="outline">{getStatusLabel(record.fromStatus)}</Badge>
                                    </>
                                  ) : null}
                                </div>
                                {record.notes && (
                                  <p className="mt-1 text-sm">
                                    {record.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Ações no rodapé */}
            {(enrichedSale.status === "pending" || enrichedSale.status === "in_progress" || enrichedSale.status === "returned" || enrichedSale.status === "corrected") && (
              <DialogFooter className="mt-4">
                {user?.role === "supervisor" && enrichedSale.status === "returned" && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleMarkAsCorrected}
                      disabled={markAsCorrectedMutation.isPending}
                    >
                      {markAsCorrectedMutation.isPending ? "Marcando..." : "Marcar como Corrigido"}
                    </Button>
                  </>
                )}
                
                {user?.role !== "supervisor" && (
                  <>
                    {(user?.role === "operacional") && (enrichedSale.status === "pending" || enrichedSale.status === "corrected" || enrichedSale.status === "in_progress") && (
                      <Button
                        variant={isReturning ? "outline" : "destructive"}
                        size="sm"
                        className="mr-auto"
                        onClick={() => setIsReturning(!isReturning)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Devolver ao Vendedor
                      </Button>
                    )}
                    
                    {isReturning ? (
                      <div className="grid gap-2 w-full">
                        <Label htmlFor="returnReason">Motivo da Devolução</Label>
                        <Textarea
                          id="returnReason"
                          placeholder="Descreva o motivo para devolver esta venda..."
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          rows={2}
                          className="mb-2"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsReturning(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleReturnSale}
                            disabled={returnToSellerMutation.isPending}
                          >
                            {returnToSellerMutation.isPending ? "Devolvendo..." : "Confirmar Devolução"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleMainAction}
                        disabled={
                          startExecutionMutation.isPending || 
                          completeExecutionMutation.isPending ||
                          !selectedServiceTypeId ||
                          (hasPrestadorParceiro && selectedServiceProviderIds.length === 0)
                        }
                      >
                        {enrichedSale.status === "pending" || enrichedSale.status === "corrected" || enrichedSale.status === "returned" ? (
                          <>
                            <Truck className="mr-2 h-4 w-4" />
                            {startExecutionMutation.isPending ? "Iniciando..." : "Iniciar Execução"}
                          </>
                        ) : enrichedSale.status === "in_progress" ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completeExecutionMutation.isPending ? "Concluindo..." : "Concluir Execução"}
                          </>
                        ) : null}
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}