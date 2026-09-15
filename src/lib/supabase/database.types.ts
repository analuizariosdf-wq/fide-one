/**
 * Hand-written to mirror supabase/migrations exactly, in the same shape
 * `supabase gen types typescript` produces. Regenerate with that command
 * once this environment (or CI) has Docker access to the local stack —
 * `supabase gen types typescript --local > src/lib/supabase/database.types.ts`
 * — the CLI's own image pulls are blocked by this sandbox's network
 * policy, so this file was verified by hand against a real Postgres 16
 * instance running the same migrations instead (see /supabase/migrations).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      roles: {
        Row: { id: string; slug: string; name: string; created_at: string };
        Insert: { id?: string; slug: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          role_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          role_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "profiles_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "profiles_role_id_fkey"; columns: ["role_id"]; referencedRelation: "roles"; referencedColumns: ["id"] },
          ];
      };
      services: {
        Row: { id: string; organization_id: string; name: string; created_at: string };
        Insert: { id?: string; organization_id: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "services_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
          ];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          trade_name: string | null;
          cnpj: string | null;
          segment: string | null;
          website: string | null;
          instagram: string | null;
          email: string | null;
          phone: string | null;
          responsible_id: string | null;
          start_date: string | null;
          status: "lead" | "ativo" | "pausado" | "encerrado";
          monthly_fee: number;
          due_day: number | null;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          trade_name?: string | null;
          cnpj?: string | null;
          segment?: string | null;
          website?: string | null;
          instagram?: string | null;
          email?: string | null;
          phone?: string | null;
          responsible_id?: string | null;
          start_date?: string | null;
          status?: "lead" | "ativo" | "pausado" | "encerrado";
          monthly_fee?: number;
          due_day?: number | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "clients_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "clients_responsible_id_fkey"; columns: ["responsible_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      client_services: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_services"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "client_services_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "client_services_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "client_services_service_id_fkey"; columns: ["service_id"]; referencedRelation: "services"; referencedColumns: ["id"] },
          ];
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "campaigns_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "campaigns_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          ];
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          campaign_id: string | null;
          name: string;
          description: string | null;
          responsible_id: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "planejamento" | "em_andamento" | "em_pausa" | "concluido" | "cancelado";
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          campaign_id?: string | null;
          name: string;
          description?: string | null;
          responsible_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "planejamento" | "em_andamento" | "em_pausa" | "concluido" | "cancelado";
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "projects_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "projects_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "projects_campaign_id_fkey"; columns: ["campaign_id"]; referencedRelation: "campaigns"; referencedColumns: ["id"] },
            { foreignKeyName: "projects_responsible_id_fkey"; columns: ["responsible_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          project_id: string | null;
          title: string;
          description: string | null;
          status:
            | "backlog"
            | "a_fazer"
            | "em_producao"
            | "em_revisao"
            | "aguardando_cliente"
            | "concluido"
            | "cancelado";
          priority: "baixa" | "normal" | "alta" | "urgente";
          assignee_id: string | null;
          creator_id: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?:
            | "backlog"
            | "a_fazer"
            | "em_producao"
            | "em_revisao"
            | "aguardando_cliente"
            | "concluido"
            | "cancelado";
          priority?: "baixa" | "normal" | "alta" | "urgente";
          assignee_id?: string | null;
          creator_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "tasks_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "tasks_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
            { foreignKeyName: "tasks_assignee_id_fkey"; columns: ["assignee_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
            { foreignKeyName: "tasks_creator_id_fkey"; columns: ["creator_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      task_comments: {
        Row: {
          id: string;
          organization_id: string;
          task_id: string;
          author_id: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          task_id: string;
          author_id?: string | null;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_comments"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "task_comments_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "task_comments_task_id_fkey"; columns: ["task_id"]; referencedRelation: "tasks"; referencedColumns: ["id"] },
            { foreignKeyName: "task_comments_author_id_fkey"; columns: ["author_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      contents: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          project_id: string | null;
          title: string;
          content_type:
            | "Post"
            | "Carrossel"
            | "Reels"
            | "Story"
            | "Vídeo"
            | "Artigo"
            | "Blog"
            | "LinkedIn"
            | "Anúncio";
          channel: "Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "YouTube" | "Site" | "Google";
          status:
            | "ideia"
            | "briefing"
            | "copy"
            | "design"
            | "revisao"
            | "aprovacao"
            | "agendado"
            | "publicado";
          scheduled_date: string | null;
          scheduled_time: string | null;
          description: string | null;
          caption: string | null;
          cta: string | null;
          responsible_id: string | null;
          created_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          project_id?: string | null;
          title: string;
          content_type:
            | "Post"
            | "Carrossel"
            | "Reels"
            | "Story"
            | "Vídeo"
            | "Artigo"
            | "Blog"
            | "LinkedIn"
            | "Anúncio";
          channel: "Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "YouTube" | "Site" | "Google";
          status?:
            | "ideia"
            | "briefing"
            | "copy"
            | "design"
            | "revisao"
            | "aprovacao"
            | "agendado"
            | "publicado";
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          description?: string | null;
          caption?: string | null;
          cta?: string | null;
          responsible_id?: string | null;
          created_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contents"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "contents_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "contents_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "contents_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
            { foreignKeyName: "contents_responsible_id_fkey"; columns: ["responsible_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
            { foreignKeyName: "contents_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      content_tasks: {
        Row: {
          id: string;
          organization_id: string;
          content_id: string;
          task_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          content_id: string;
          task_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_tasks"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "content_tasks_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "content_tasks_content_id_fkey"; columns: ["content_id"]; referencedRelation: "contents"; referencedColumns: ["id"] },
            { foreignKeyName: "content_tasks_task_id_fkey"; columns: ["task_id"]; referencedRelation: "tasks"; referencedColumns: ["id"] },
          ];
      };
      content_comments: {
        Row: {
          id: string;
          organization_id: string;
          content_id: string;
          author_id: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          content_id: string;
          author_id?: string | null;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_comments"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "content_comments_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "content_comments_content_id_fkey"; columns: ["content_id"]; referencedRelation: "contents"; referencedColumns: ["id"] },
            { foreignKeyName: "content_comments_author_id_fkey"; columns: ["author_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      calendar_events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          type: "publication" | "meeting" | "task" | "event" | "deadline";
          event_date: string;
          event_time: string | null;
          client_id: string | null;
          project_id: string | null;
          task_id: string | null;
          content_id: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          type: "publication" | "meeting" | "task" | "event" | "deadline";
          event_date: string;
          event_time?: string | null;
          client_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          content_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "calendar_events_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "calendar_events_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "calendar_events_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
            { foreignKeyName: "calendar_events_task_id_fkey"; columns: ["task_id"]; referencedRelation: "tasks"; referencedColumns: ["id"] },
            { foreignKeyName: "calendar_events_content_id_fkey"; columns: ["content_id"]; referencedRelation: "contents"; referencedColumns: ["id"] },
          ];
      };
      financial_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: "receita" | "despesa";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type: "receita" | "despesa";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_categories"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "financial_categories_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
          ];
      };
      financial_transactions: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          category_id: string | null;
          description: string;
          amount: number;
          due_date: string | null;
          paid_at: string | null;
          status: "previsto" | "proximo" | "pago" | "atrasado";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          category_id?: string | null;
          description: string;
          amount: number;
          due_date?: string | null;
          paid_at?: string | null;
          status?: "previsto" | "proximo" | "pago" | "atrasado";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_transactions"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "financial_transactions_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "financial_transactions_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "financial_transactions_category_id_fkey"; columns: ["category_id"]; referencedRelation: "financial_categories"; referencedColumns: ["id"] },
          ];
      };
      files: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          project_id: string | null;
          content_id: string | null;
          task_id: string | null;
          bucket: string;
          path: string;
          name: string;
          size_bytes: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          project_id?: string | null;
          content_id?: string | null;
          task_id?: string | null;
          bucket: string;
          path: string;
          name: string;
          size_bytes?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "files_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "files_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
            { foreignKeyName: "files_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
            { foreignKeyName: "files_content_id_fkey"; columns: ["content_id"]; referencedRelation: "contents"; referencedColumns: ["id"] },
            { foreignKeyName: "files_task_id_fkey"; columns: ["task_id"]; referencedRelation: "tasks"; referencedColumns: ["id"] },
            { foreignKeyName: "files_uploaded_by_fkey"; columns: ["uploaded_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string;
          message: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          title: string;
          message?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "notifications_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
      activity_logs: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: [
            { foreignKeyName: "activity_logs_organization_id_fkey"; columns: ["organization_id"]; referencedRelation: "organizations"; referencedColumns: ["id"] },
            { foreignKeyName: "activity_logs_actor_id_fkey"; columns: ["actor_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
