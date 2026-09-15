-- organization_id: every business table is filtered by tenant on every
-- request (RLS enforces it too, so these are load-bearing for performance,
-- not just convenience).
create index idx_clients_organization_id on public.clients (organization_id);
create index idx_campaigns_organization_id on public.campaigns (organization_id);
create index idx_projects_organization_id on public.projects (organization_id);
create index idx_tasks_organization_id on public.tasks (organization_id);
create index idx_contents_organization_id on public.contents (organization_id);
create index idx_calendar_events_organization_id on public.calendar_events (organization_id);
create index idx_financial_transactions_organization_id on public.financial_transactions (organization_id);
create index idx_files_organization_id on public.files (organization_id);
create index idx_notifications_organization_id on public.notifications (organization_id);
create index idx_activity_logs_organization_id on public.activity_logs (organization_id);
create index idx_services_organization_id on public.services (organization_id);
create index idx_profiles_organization_id on public.profiles (organization_id);
create index idx_client_services_organization_id on public.client_services (organization_id);
create index idx_content_tasks_organization_id on public.content_tasks (organization_id);
create index idx_task_comments_organization_id on public.task_comments (organization_id);
create index idx_content_comments_organization_id on public.content_comments (organization_id);

-- client_id: client detail pages (Projetos/Tarefas/Conteúdos tabs) filter by this.
create index idx_campaigns_client_id on public.campaigns (client_id);
create index idx_projects_client_id on public.projects (client_id);
create index idx_tasks_client_id on public.tasks (client_id);
create index idx_contents_client_id on public.contents (client_id);
create index idx_calendar_events_client_id on public.calendar_events (client_id);
create index idx_financial_transactions_client_id on public.financial_transactions (client_id);

-- project_id: project detail pages filter tasks/contents by this.
create index idx_tasks_project_id on public.tasks (project_id);
create index idx_contents_project_id on public.contents (project_id);
create index idx_calendar_events_project_id on public.calendar_events (project_id);

-- assignee_id / responsible_id: "minhas tarefas" style filters.
create index idx_tasks_assignee_id on public.tasks (assignee_id);
create index idx_clients_responsible_id on public.clients (responsible_id);
create index idx_projects_responsible_id on public.projects (responsible_id);
create index idx_contents_responsible_id on public.contents (responsible_id);

-- due_date / scheduled_date: Kanban due-filters, calendar range queries.
create index idx_tasks_due_date on public.tasks (due_date);
create index idx_contents_scheduled_date on public.contents (scheduled_date);
create index idx_calendar_events_event_date on public.calendar_events (event_date);

-- status: Kanban columns and status filters.
create index idx_tasks_status on public.tasks (status);
create index idx_contents_status on public.contents (status);
create index idx_projects_status on public.projects (status);
create index idx_clients_status on public.clients (status);

-- join tables and comment threads.
create index idx_client_services_client_id on public.client_services (client_id);
create index idx_client_services_service_id on public.client_services (service_id);
create index idx_content_tasks_content_id on public.content_tasks (content_id);
create index idx_content_tasks_task_id on public.content_tasks (task_id);
create index idx_task_comments_task_id on public.task_comments (task_id);
create index idx_content_comments_content_id on public.content_comments (content_id);
create index idx_calendar_events_task_id on public.calendar_events (task_id);
create index idx_calendar_events_content_id on public.calendar_events (content_id);
create index idx_notifications_user_id on public.notifications (user_id);
