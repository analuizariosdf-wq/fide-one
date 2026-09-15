import { editorialContents } from "@/lib/mock-data/contents";
import type { Content } from "@/lib/types";
import { createEntityStore } from "@/lib/store/create-entity-store";

export const contentsStore = createEntityStore<Content>(editorialContents);
