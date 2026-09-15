import { tasks } from "@/lib/mock-data/tasks";
import type { Task } from "@/lib/types";
import { createEntityStore } from "@/lib/store/create-entity-store";

export const tasksStore = createEntityStore<Task>(tasks);
