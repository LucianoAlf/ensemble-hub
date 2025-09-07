import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2, Calendar, Users, DollarSign, TrendingDown, MapPin, Phone, Guitar } from "lucide-react";

interface StatCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'bandas' | 'eventos' | 'membros' | 'receita' | 'despesa';
  data: any;
}

export function StatCardModal({ isOpen, onClose, type, data }: StatCardModalProps) {
  const getModalConfig = () => {
    switch (type) {
      case 'bandas':
        return {
          title: 'Bandas Ativas - Relatório Detalhado',
          icon: <Music2 className="h-5 w-5" />,
          content: (
            <div className="space-y-4">
              {!data?.bandas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando dados...</div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    Total de {data?.bandas?.length || 0} bandas ativas no sistema
                  </div>
                  <div className="space-y-3">
                    {data?.bandas?.map((banda: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{banda.nome}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {banda.unidade}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {banda.categoria}
                          </Badge>
                        </div>
                        {banda.descricao && (
                          <p className="text-sm text-muted-foreground">{banda.descricao}</p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {banda.membros_count} integrantes
                        </div>
                      </div>
                    </div>
                  </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        };

      case 'eventos':
        return {
          title: 'Próximos Eventos - Lista Completa',
          icon: <Calendar className="h-5 w-5" />,
          content: (
            <div className="space-y-4">
              {!data?.eventos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando dados...</div>
                </div>
              ) : data?.eventos?.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Nenhum evento agendado</div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    {data?.eventos?.length || 0} eventos agendados
                  </div>
                  <div className="space-y-3">
                    {data?.eventos?.map((evento: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-lg">{evento.titulo}</h4>
                        <Badge variant="outline">{evento.tipo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(evento.inicio).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {evento.local && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {evento.local}
                          </div>
                        )}
                      </div>
                      {evento.endereco && (
                        <p className="text-sm text-muted-foreground">{evento.endereco}</p>
                      )}
                      {evento.orcamento && (
                        <div className="text-sm font-medium text-green-600">
                          Orçamento: {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(evento.orcamento)}
                        </div>
                      )}
                    </div>
                  </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        };

      case 'membros':
        return {
          title: 'Total de Membros - Lista Completa',
          icon: <Users className="h-5 w-5" />,
          content: (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {data?.membros?.length || 0} membros cadastrados no sistema
              </div>
              <div className="space-y-3">
                {data?.membros?.map((membro: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">{membro.nome}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {membro.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {membro.telefone}
                          </div>
                        )}
                        {membro.instrumento && (
                          <div className="flex items-center gap-1">
                            <Guitar className="h-4 w-4" />
                            {membro.instrumento}
                          </div>
                        )}
                      </div>
                      {membro.banda && (
                        <Badge variant="secondary" className="text-xs">
                          <Music2 className="h-3 w-3 mr-1" />
                          {membro.banda}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        };

      case 'receita':
        return {
          title: 'Receita Mensal - Detalhamento',
          icon: <DollarSign className="h-5 w-5" />,
          content: (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total de {data?.receitas?.length || 0} receitas no período
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  Total: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data?.total || 0)}
                </div>
              </div>
              <div className="space-y-3">
                {data?.receitas?.map((receita: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{receita.origem}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(receita.data).toLocaleDateString('pt-BR')}
                        </p>
                        {receita.descricao && (
                          <p className="text-xs text-muted-foreground">{receita.descricao}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(receita.valor)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        };

      case 'despesa':
        return {
          title: 'Despesa Mensal - Detalhamento',
          icon: <TrendingDown className="h-5 w-5" />,
          content: (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total de {data?.despesas?.length || 0} despesas no período
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                <div className="text-lg font-bold text-red-700 dark:text-red-300">
                  Total: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data?.total || 0)}
                </div>
              </div>
              <div className="space-y-3">
                {data?.despesas?.map((despesa: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{despesa.descricao}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(despesa.data).toLocaleDateString('pt-BR')}
                        </p>
                        {despesa.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {despesa.categoria}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(despesa.valor)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        };

      default:
        return {
          title: 'Detalhes',
          icon: null,
          content: <div>Dados não disponíveis</div>
        };
    }
  };

  const config = getModalConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {config.content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
