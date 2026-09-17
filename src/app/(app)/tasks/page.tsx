"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/lib/types";
import { useTasks, filterTasks, removeTask, type TaskFilters } from "@/lib/data/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskFiltersBar } from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskKanbanView } from "@/components/tasks/task-kanban-view";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";

export default function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const { tasks, clients, projects, profiles, loading, error, refetch } = useTasks();
  const filteredTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  async function handleConfirmDelete() {
    if (!deletingTask) return;
    try {
      await removeTask(deletingTask.id);
      toast.success("Tarefa excluída.");
      refetch();
    } catch {
      toast.error("Não foi possível excluir a tarefa. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tarefas"
        description="Acompanhe tudo o que precisa ser feito pela equipe."
        action={
          <Button
            onClick={() => {
              setEditingTask(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        }
      />

      <TaskFiltersBar filters={filters} onChange={setFilters} clients={clients} projects={projects} profiles={profiles} />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : (
        <Tabs defaultValue="lista">
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <Card>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-11 w-full" />
                    ))}
                  </div>
                ) : (
                  <TaskListView
                    tasks={filteredTasks}
                    clients={clients}
                    projects={projects}
                    profiles={profiles}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setDrawerOpen(true);
                    }}
                    onDelete={(task) => setDeletingTask(task)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban">
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <TaskKanbanView
                tasks={filteredTasks}
                clients={clients}
                projects={projects}
                profiles={profiles}
                onChanged={refetch}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      <TaskFormDrawer
        key={editingTask?.id ?? "new"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={editingTask}
        clients={clients}
        projects={projects}
        profiles={profiles}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deletingTask?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
