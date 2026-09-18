"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useProducts, removeProduct, type Product } from "@/lib/data/products";
import { useContracts } from "@/lib/data/contracts";
import { useGrowthTarget, setMonthlyTarget, setPlannedQuantity } from "@/lib/data/growth";
import { useHasPermission } from "@/lib/auth/current-actor-context";
import { RequirePermission } from "@/components/shared/require-permission";
import { formatCurrencyBRL } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormDrawer } from "@/components/growth/product-form-drawer";

function monthLabel(date: Date): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function GrowthPage() {
  return (
    <RequirePermission permission="growth.view">
      <GrowthContent />
    </RequirePermission>
  );
}

function GrowthContent() {
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const canManage = useHasPermission("growth.manage");

  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();
  const { contracts, loading: contractsLoading, error: contractsError } = useContracts();
  const { period, target, items, loading: targetLoading, error: targetError, refetch: refetchTarget } =
    useGrowthTarget(referenceDate);

  const [targetInput, setTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const soldByProduct = useMemo(() => {
    const map = new Map<string, { quantity: number; revenue: number }>();
    for (const contract of contracts) {
      if (!contract.serviceId || contract.status !== "ativo") continue;
      const current = map.get(contract.serviceId) ?? { quantity: 0, revenue: 0 };
      current.quantity += 1;
      if (contract.monthlyValue) {
        const factor =
          contract.billingPeriod === "trimestral" ? 1 / 3 : contract.billingPeriod === "semestral" ? 1 / 6 : contract.billingPeriod === "anual" ? 1 / 12 : 1;
        current.revenue += contract.billingPeriod === "unico" ? 0 : contract.monthlyValue * factor;
      }
      map.set(contract.serviceId, current);
    }
    return map;
  }, [contracts]);

  const recurringRevenue = useMemo(
    () => Array.from(soldByProduct.values()).reduce((sum, v) => sum + v.revenue, 0),
    [soldByProduct],
  );
  const oneTimeRevenue = useMemo(() => {
    const periodStart = period;
    const periodEnd = new Date(new Date(period).getFullYear(), new Date(period).getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return contracts
      .filter((c) => c.billingPeriod === "unico" && c.startDate >= periodStart && c.startDate <= periodEnd)
      .reduce((sum, c) => sum + (c.monthlyValue ?? 0), 0);
  }, [contracts, period]);

  const targetAmount = target?.targetAmount ?? 0;
  const achieved = recurringRevenue + oneTimeRevenue;
  const gap = Math.max(0, targetAmount - achieved);
  const percentage = targetAmount > 0 ? Math.min(100, Math.round((achieved / targetAmount) * 100)) : 0;

  const plannedByProduct = useMemo(() => new Map(items.map((item) => [item.serviceId, item])), [items]);

  async function handleSaveTarget() {
    const amount = Number(targetInput);
    if (!amount || amount <= 0) {
      toast.error("Informe um valor de meta válido.");
      return;
    }
    setSavingTarget(true);
    try {
      await setMonthlyTarget(period, amount);
      toast.success("Meta salva.");
      setTargetInput("");
      refetchTarget();
    } catch {
      toast.error("Não foi possível salvar a meta. Tente novamente.");
    } finally {
      setSavingTarget(false);
    }
  }

  async function handlePlannedChange(serviceId: string, value: string) {
    if (!target) {
      toast.error("Defina a meta do mês antes de planejar a composição.");
      return;
    }
    const quantity = Number(value) || 0;
    try {
      await setPlannedQuantity(target.id, serviceId, quantity);
      refetchTarget();
    } catch {
      toast.error("Não foi possível salvar a quantidade planejada.");
    }
  }

  const loading = productsLoading || contractsLoading || targetLoading;
  const error = productsError ?? contractsError ?? targetError;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Crescimento"
        description="Metas de faturamento e composição comercial para atingi-las."
      />

      {error ? (
        <ErrorState description={error} onRetry={refetchTarget} />
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="meta">
          <TabsList>
            <TabsTrigger value="meta">Meta e esteira</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="flex flex-col gap-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Mês anterior"
                  onClick={() => setReferenceDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-40 text-center text-[13px] font-medium text-foreground">
                  {monthLabel(referenceDate)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Próximo mês"
                  onClick={() => setReferenceDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder={target ? `Meta atual: ${formatCurrencyBRL(targetAmount)}` : "Definir meta (R$)"}
                    className="w-48"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                  />
                  <Button onClick={handleSaveTarget} disabled={savingTarget}>
                    {savingTarget ? "Salvando..." : "Salvar meta"}
                  </Button>
                </div>
              )}
            </div>

            {!target ? (
              <EmptyState title="Nenhuma meta definida para este mês" description="Defina a meta mensal para começar a montar a esteira." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <StatCard label="Meta mensal" value={formatCurrencyBRL(targetAmount)} />
                  <StatCard label="Receita recorrente atual" value={formatCurrencyBRL(recurringRevenue)} />
                  <StatCard label="Receita pontual no período" value={formatCurrencyBRL(oneTimeRevenue)} />
                  <StatCard label="Gap para a meta" value={formatCurrencyBRL(gap)} helperTone={gap > 0 ? "warning" : "success"} />
                  <StatCard label="Atingido" value={`${percentage}%`} helperTone={percentage >= 100 ? "success" : "neutral"} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Composição da esteira</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeProducts.length === 0 ? (
                      <EmptyState title="Nenhum produto ativo cadastrado" description="Cadastre produtos na aba Produtos para montar a esteira." />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Qtd. planejada</TableHead>
                            <TableHead className="text-right">Qtd. vendida</TableHead>
                            <TableHead className="text-right">Qtd. faltante</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeProducts.map((product) => {
                            const planned = plannedByProduct.get(product.id)?.plannedQuantity ?? 0;
                            const sold = soldByProduct.get(product.id)?.quantity ?? 0;
                            const missing = Math.max(0, planned - sold);
                            return (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {product.defaultPrice ? formatCurrencyBRL(product.defaultPrice) : "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {product.billingType === "recorrente" ? "Recorrente" : "Pontual"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {canManage ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      defaultValue={planned}
                                      className="ml-auto w-20 text-right"
                                      onBlur={(e) => handlePlannedChange(product.id, e.target.value)}
                                    />
                                  ) : (
                                    planned
                                  )}
                                </TableCell>
                                <TableCell className="text-right">{sold}</TableCell>
                                <TableCell className="text-right">
                                  {missing > 0 ? <Badge variant="warning">{missing}</Badge> : <Badge variant="success">0</Badge>}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="produtos" className="flex flex-col gap-4 pt-4">
            <div className="flex justify-end">
              {canManage && (
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setDrawerOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Novo produto
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="pt-5">
                {products.length === 0 ? (
                  <EmptyState title="Nenhum produto cadastrado" description="Cadastre os produtos e serviços vendidos pela agência." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        {canManage && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.category ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.defaultPrice ? formatCurrencyBRL(product.defaultPrice) : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.billingType === "recorrente" ? `Recorrente (${product.billingPeriod ?? "mensal"})` : "Pontual"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.active ? "success" : "neutral"}>
                              {product.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Editar produto"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setDrawerOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Excluir produto"
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <ProductFormDrawer
        key={editingProduct?.id ?? "new"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        product={editingProduct}
        onSaved={refetchProducts}
      />

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${deletingProduct?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingProduct) return;
          try {
            await removeProduct(deletingProduct.id);
            toast.success("Produto excluído.");
            refetchProducts();
          } catch {
            toast.error("Não foi possível excluir o produto. Tente novamente.");
          }
        }}
      />
    </div>
  );
}
