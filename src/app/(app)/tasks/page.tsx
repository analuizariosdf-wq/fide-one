"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/lib/types";
import { useTasks, type TaskFilters, removeTask } from "@/lib/services/tasks-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskFiltersBar } from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskKanbanView } from "@/components/tasks/task-kanban-view";
import { TaskFormDrawer } from "@/components/tasks/task-form-drawer";

export default function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const tasks = useTasks(filters);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

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

      <TaskFiltersBar filters={filters} onChange={setFilters} />

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardContent className="pt-5">
              <TaskListView
                tasks={tasks}
                onEdit={(task) => {
                  setEditingTask(task);
                  setDrawerOpen(true);
                }}
                onDelete={(task) => setDeletingTask(task)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <TaskKanbanView tasks={tasks} />
        </TabsContent>
      </Tabs>

      <TaskFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} task={editingTask} />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deletingTask?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!deletingTask) return;
          removeTask(deletingTask.id);
          toast.success("Tarefa excluída.");
        }}
      />
    </div>
  );
}
