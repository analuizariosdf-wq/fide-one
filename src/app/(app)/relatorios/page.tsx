"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Images,
  ListChecks,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";

import {
  useReportsData,
  useReportCategoriesById,
  filterTasksForReport,
  filterContentsForReport,
  filterTransactionsForReport,
  computeOverview,
  computeClientReports,
  computeProjectReports,
  computeWorkloadReport,
  type ReportFilters,
} from "@/lib/data/reports";
import { formatCurrencyBRL } from "@/lib/format";
import { projectStatusConfig, taskWorkflowConfig, taskWorkflowOrder } from "@/lib/status";
import { PageHeader } from "@/components/shared/page-header";
import { EntityLink } from "@/components/shared/entity-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Progress } from "@/components/ui/progress";
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
import { RelatoriosFiltersBar } from "@/components/relatorios/relatorios-filters";
import { BarRow } from "@/components/relatorios/bar-row";

export default function RelatoriosPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const { clients, projects, tasks, contents, team, transactions, categories, loading, error, refetch } =
    useReportsData();
  const categoriesById = useReportCategoriesById(categories);

  const filteredTasks = useMemo(() => filterTasksForReport(tasks, filters), [tasks, filters]);
  const filteredContents = useMemo(() => filterContentsForReport(contents, filters), [contents, filters]);
  const filteredTransactions = useMemo(
    () => filterTransactionsForReport(transactions, filters),
    [transactions, filters],
  );
  const filteredClients = useMemo(
    () => (filters.clientId && filters.clientId !== "todos" ? clients.filter((c) => c.id === filters.clientId) : clients),
    [clients, filters.clientId],
  );
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (filters.clientId && filters.clientId !== "todos" && project.clientId !== filters.clientId) return false;
        if (filters.projectId && filters.projectId !== "todos" && project.id !== filters.projectId) return false;
        if (
          filters.responsibleId &&
          filters.responsibleId !== "todos" &&
          project.responsibleId !== filters.responsibleId
        ) {
          return false;
        }
        return true;
      }),
    [projects, filters],
  );

  const overview = useMemo(
    () => computeOverview(filteredClients, filteredProjects, filteredTasks, filteredContents, filteredTransactions, categoriesById),
    [filteredClients, filteredProjects, filteredTasks, filteredContents, filteredTransactions, categoriesById],
  );
  const clientReports = useMemo(
    () => computeClientReports(filteredClients, projects, tasks, contents, transactions, categoriesById),
    [filteredClients, projects, tasks, contents, transactions, categoriesById],
  );
  const projectReports = useMemo(
    () => computeProjectReports(filteredProjects, tasks, contents, clients, team),
    [filteredProjects, tasks, contents, clients, team],
  );
  const workload = useMemo(() => computeWorkloadReport(filteredTasks, team), [filteredTasks, team]);

  const tasksByStatus = useMemo(() => {
    const counts = new Map(taskWorkflowOrder.map((status) => [status, 0]));
    for (const task of filteredTasks) counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
    return taskWorkflowOrder.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  }, [filteredTasks]);

  const maxTasksByStatus = Math.max(1, ...tasksByStatus.map((s) => s.count));
  const topClientsByRevenue = useMemo(
    () => [...clientReports].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    [clientReports],
  );
  const maxClientRevenue = Math.max(1, ...topClientsByRevenue.map((row) => row.revenue));
  const maxWorkloadOpen = Math.max(1, ...workload.rows.map((row) => row.open));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatórios"
        description="Indicadores gerenciais derivados dos dados reais do FIDE ONE."
      />

      <RelatoriosFiltersBar
        filters={filters}
        onChange={setFilters}
        clients={clients}
        projects={projects}
        profiles={team}
      />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="visao-geral">
          <TabsList className="flex-wrap">
            <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label="Clientes ativos" value={String(overview.activeClients)} icon={UsersRound} />
              <StatCard label="Projetos ativos" value={String(overview.activeProjects)} icon={ListChecks} />
              <StatCard label="Tarefas abertas" value={String(overview.tasksOpen)} icon={Clock} />
              <StatCard
                label="Tarefas atrasadas"
                value={String(overview.tasksOverdue)}
                helperTone={overview.tasksOverdue > 0 ? "danger" : "neutral"}
                helperText={overview.tasksOverdue > 0 ? "Requer atenção" : "Nenhuma atrasada"}
                icon={AlertTriangle}
              />
              <StatCard label="Tarefas concluídas" value={String(overview.tasksCompleted)} icon={CheckCircle2} />
              <StatCard label="Conteúdos produzidos" value={String(overview.contentsTotal)} icon={Images} />
              <StatCard label="Conteúdos publicados" value={String(overview.contentsPublished)} icon={Images} />
              <StatCard
                label="Aguardando aprovação"
                value={String(overview.contentsAwaitingApproval)}
                icon={Clock}
              />
              <StatCard label="Receitas (pagas)" value={formatCurrencyBRL(overview.cashFlow.entradas)} icon={TrendingUp} />
              <StatCard label="Despesas (pagas)" value={formatCurrencyBRL(overview.cashFlow.saidas)} icon={TrendingDown} />
              <StatCard
                label="Saldo"
                value={formatCurrencyBRL(overview.cashFlow.saldo)}
                helperTone={overview.cashFlow.saldo < 0 ? "danger" : "success"}
                icon={Wallet}
              />
              <StatCard label="A receber" value={formatCurrencyBRL(overview.cashFlow.aReceber)} icon={Wallet} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tarefas por status</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {tasksByStatus.map(({ status, count }) => (
                    <BarRow
                      key={status}
                      label={taskWorkflowConfig[status].label}
                      value={count}
                      maxValue={maxTasksByStatus}
                      displayValue={String(count)}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receitas x despesas (pagas)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <BarRow
                    label="Receitas"
                    value={overview.cashFlow.entradas}
                    maxValue={Math.max(overview.cashFlow.entradas, overview.cashFlow.saidas, 1)}
                    displayValue={formatCurrencyBRL(overview.cashFlow.entradas)}
                  />
                  <BarRow
                    label="Despesas"
                    value={overview.cashFlow.saidas}
                    maxValue={Math.max(overview.cashFlow.entradas, overview.cashFlow.saidas, 1)}
                    displayValue={formatCurrencyBRL(overview.cashFlow.saidas)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes" className="flex flex-col gap-4 pt-4">
            {topClientsByRevenue.some((row) => row.revenue > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Receita por cliente (top 8, pago)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {topClientsByRevenue.map((row) => (
                    <BarRow
                      key={row.client.id}
                      label={row.client.name}
                      value={row.revenue}
                      maxValue={maxClientRevenue}
                      displayValue={formatCurrencyBRL(row.revenue)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-5">
                {clientReports.length === 0 ? (
                  <EmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros aplicados." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Projetos</TableHead>
                        <TableHead className="text-right">Tarefas abertas</TableHead>
                        <TableHead className="text-right">Concluídas</TableHead>
                        <TableHead className="text-right">Atrasadas</TableHead>
                        <TableHead className="text-right">Conteúdos</TableHead>
                        <TableHead className="text-right">Receita (paga)</TableHead>
                        <TableHead className="text-right">A receber</TableHead>
                        <TableHead className="text-right">Despesa (paga)</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientReports.map((row) => (
                        <TableRow key={row.client.id}>
                          <TableCell>
                            <EntityLink href={`/clients/${row.client.id}`}>{row.client.name}</EntityLink>
                          </TableCell>
                          <TableCell className="text-right">{row.projectsCount}</TableCell>
                          <TableCell className="text-right">{row.tasksOpen}</TableCell>
                          <TableCell className="text-right">{row.tasksCompleted}</TableCell>
                          <TableCell className="text-right">{row.tasksOverdue}</TableCell>
                          <TableCell className="text-right">
                            {row.contentsCount} ({row.contentsPublished} publicados)
                          </TableCell>
                          <TableCell className="text-right text-status-success-fg">
                            {formatCurrencyBRL(row.revenue)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrencyBRL(row.pendingRevenue)}
                          </TableCell>
                          <TableCell className="text-right text-status-danger-fg">
                            {formatCurrencyBRL(row.expense)}
                          </TableCell>
                          <TableCell
                            className={
                              row.result < 0
                                ? "text-right font-medium text-status-danger-fg"
                                : "text-right font-medium text-status-success-fg"
                            }
                          >
                            {formatCurrencyBRL(row.result)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projetos" className="flex flex-col gap-4 pt-4">
            <Card className="border-status-info-fg/30 bg-status-info-bg">
              <CardContent className="py-3 text-[13px] text-status-info-fg">
                Rentabilidade financeira por projeto não está disponível: a tabela de lançamentos
                financeiros não tem vínculo com projeto no schema atual. Abaixo, apenas o desempenho
                operacional (tarefas, conteúdos, progresso).
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                {projectReports.length === 0 ? (
                  <EmptyState title="Nenhum projeto encontrado" description="Ajuste os filtros aplicados." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tarefas</TableHead>
                        <TableHead className="text-right">Concluídas</TableHead>
                        <TableHead className="text-right">Atrasadas</TableHead>
                        <TableHead className="text-right">Conteúdos</TableHead>
                        <TableHead>Progresso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectReports.map((row) => (
                        <TableRow key={row.project.id}>
                          <TableCell>
                            <EntityLink href={`/projects/${row.project.id}`}>{row.project.name}</EntityLink>
                          </TableCell>
                          <TableCell>
                            {row.client ? (
                              <EntityLink href={`/clients/${row.client.id}`} muted>
                                {row.client.name}
                              </EntityLink>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.responsible?.name ?? "Sem responsável"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={projectStatusConfig[row.project.status].variant}>
                              {projectStatusConfig[row.project.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{row.tasksTotal}</TableCell>
                          <TableCell className="text-right">{row.tasksCompleted}</TableCell>
                          <TableCell className="text-right">{row.tasksOverdue}</TableCell>
                          <TableCell className="text-right">{row.contentsCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={row.project.progress} className="w-20" />
                              <span className="text-[12px] text-muted-foreground">{row.project.progress}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipe" className="flex flex-col gap-4 pt-4">
            {workload.rows.some((row) => row.total > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Volume de tarefas abertas por responsável</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {workload.rows
                    .filter((row) => row.total > 0)
                    .map((row) => (
                      <BarRow
                        key={row.profile.id}
                        label={row.profile.name}
                        value={row.open}
                        maxValue={maxWorkloadOpen}
                        displayValue={String(row.open)}
                      />
                    ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-5">
                {workload.rows.length === 0 ? (
                  <EmptyState title="Nenhum membro encontrado" description="A equipe aparece aqui assim que houver perfis." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pessoa</TableHead>
                        <TableHead className="text-right">Abertas</TableHead>
                        <TableHead className="text-right">Em andamento</TableHead>
                        <TableHead className="text-right">Atrasadas</TableHead>
                        <TableHead className="text-right">Concluídas</TableHead>
                        <TableHead className="text-right">Total atribuído</TableHead>
                        <TableHead>Volume</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workload.rows.map((row) => (
                        <TableRow key={row.profile.id}>
                          <TableCell className="font-medium text-foreground">{row.profile.name}</TableCell>
                          <TableCell className="text-right">{row.open}</TableCell>
                          <TableCell className="text-right">{row.inProgress}</TableCell>
                          <TableCell className="text-right">{row.overdue}</TableCell>
                          <TableCell className="text-right">{row.completed}</TableCell>
                          <TableCell className="text-right">{row.total}</TableCell>
                          <TableCell>
                            {row.aboveAverageVolume ? (
                              <Badge variant="warning">Volume acima da média</Badge>
                            ) : (
                              <span className="text-muted-foreground">Dentro da média</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <p className="mt-3 text-[12px] text-muted-foreground">
                  &ldquo;Volume&rdquo; indica apenas a quantidade de tarefas abertas hoje em relação à
                  média da equipe — não é uma medida de produtividade, desempenho ou horas trabalhadas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tarefas sem responsável</CardTitle>
              </CardHeader>
              <CardContent>
                {workload.unassignedTasks.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">Todas as tarefas têm um responsável definido.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {workload.unassignedTasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-2 text-[13px]">
                        <EntityLink href={`/tasks/${task.id}`}>{task.title}</EntityLink>
                        <span className="text-muted-foreground">{task.dueDate || "Sem prazo"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
