import { projects } from "@/lib/mock-data/projects";
import type { Project } from "@/lib/types";
import { createEntityStore } from "@/lib/store/create-entity-store";

export const projectsStore = createEntityStore<Project>(projects);
