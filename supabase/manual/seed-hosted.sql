-- ============================================================
-- Seed de dados de desenvolvimento — ambiente Supabase hospedado
-- (FASE F do runbook em /docs/supabase-deployment.md)
--
-- Diferente de supabase/seed.sql (usado só no Postgres local de teste),
-- este arquivo NÃO toca em auth.users. Ele resolve o id de cada usuário
-- por e-mail — nunca por um UUID fixo, porque é o Supabase Auth quem
-- gera o UUID de cada usuário quando ele é criado.
--
-- Mesmos clientes/projetos/tarefas/conteúdos/eventos do mock do
-- frontend e do seed local, só que os relacionamentos com usuários são
-- resolvidos dinamicamente. Nenhuma senha aparece neste arquivo.
--
-- Pré-requisito obrigatório: organizations tem uma linha com slug='fide'
-- (falha com mensagem clara se não tiver).
--
-- Os 5 profiles de desenvolvimento (daniel/fernanda/mariana/bruno/camila
-- @fide.com.br) são OPCIONAIS — cada um só passa a existir depois que a
-- pessoa aceita o convite por e-mail enviado por
-- scripts/deploy/create-users.mjs, e esse envio pode esbarrar no limite
-- de e-mail do Supabase (não é um erro do deploy, é um limite externo —
-- ver aquele script). Para os dados de exemplo não dependerem de quantos
-- convites já foram aceitos, este seed usa NULL em
-- responsible_id/assignee_id/creator_id/created_by para qualquer pessoa
-- cujo profile ainda não exista (essas colunas já eram nullable no
-- schema) e só avisa (RAISE NOTICE) quem está faltando. O cliente/
-- projeto/tarefa aparece normalmente na interface, só com "responsável"
-- em branco até alguém atribuir manualmente — não é necessário rodar
-- este seed de novo depois que mais convites forem aceitos.
--
-- Seguro rodar mais de uma vez? Não — os INSERTs abaixo não têm
-- "on conflict", de propósito, para que uma segunda execução acidental
-- pare no primeiro conflito de chave em vez de duplicar silenciosamente
-- todos os clientes/projetos/tarefas. Se precisar re-rodar do zero,
-- apague as linhas destas tabelas primeiro (nunca as de auth.users/
-- profiles/organizations).
-- ============================================================

do $$
declare
  v_org         uuid;
  v_daniel      uuid;
  v_fernanda    uuid;
  v_mariana     uuid;
  v_bruno       uuid;
  v_camila      uuid;
begin
  select id into v_org from public.organizations where slug = 'fide';
  if v_org is null then
    raise exception 'Organização com slug=fide não encontrada. Rode a Fase C antes.';
  end if;

  select id into v_daniel   from public.profiles where email = 'daniel@fide.com.br';
  select id into v_fernanda from public.profiles where email = 'fernanda@fide.com.br';
  select id into v_mariana  from public.profiles where email = 'mariana@fide.com.br';
  select id into v_bruno    from public.profiles where email = 'bruno@fide.com.br';
  select id into v_camila   from public.profiles where email = 'camila@fide.com.br';

  -- Opcional, de propósito (ver comentário no topo do arquivo): quem
  -- ainda não aceitou o convite fica como NULL nos campos de
  -- responsável/criador dos registros de exemplo, só isso.
  if v_daniel is null or v_fernanda is null or v_mariana is null
     or v_bruno is null or v_camila is null then
    raise notice 'Profile(s) de desenvolvimento ainda não encontrados (convite pendente ou não aceito ainda): %',
      trim(both ', ' from
        (case when v_daniel is null then 'daniel@fide.com.br, ' else '' end) ||
        (case when v_fernanda is null then 'fernanda@fide.com.br, ' else '' end) ||
        (case when v_mariana is null then 'mariana@fide.com.br, ' else '' end) ||
        (case when v_bruno is null then 'bruno@fide.com.br, ' else '' end) ||
        (case when v_camila is null then 'camila@fide.com.br, ' else '' end)
      );
  end if;

  -- ---------- Clientes ----------
  insert into public.clients (
    id, organization_id, name, trade_name, cnpj, segment, website, instagram,
    email, phone, responsible_id, start_date, status, monthly_fee, due_day, payment_method, notes
  ) values
    ('a0000000-0000-0000-0000-000000000201', v_org,
     'Inovar Recursos Humanos', 'Inovar RH', '12.345.678/0001-90', 'Recursos Humanos',
     'https://inovarrh.com.br', '@inovarrh', 'contato@inovarrh.com.br', '(11) 4002-8922',
     v_mariana, '2025-03-01', 'ativo', 6000, 5, 'Boleto',
     'Cliente estratégico, reuniões quinzenais com o RH corporativo.'),
    ('a0000000-0000-0000-0000-000000000202', v_org,
     'Conservar Terceirização', 'Conservar', '23.456.789/0001-11', 'Facilities',
     'https://conservar.com.br', '@conservarterceirizacao', 'marketing@conservar.com.br', '(11) 3003-1144',
     v_fernanda, '2025-05-12', 'ativo', 4500, 10, 'Pix',
     'Aprovações passam sempre pelo setor de comunicação interna.'),
    ('a0000000-0000-0000-0000-000000000203', v_org,
     'Pleno Hospital Dia', 'Pleno', '34.567.890/0001-22', 'Saúde',
     'https://plenohospitaldia.com.br', '@plenohospitaldia', 'comunicacao@plenohospitaldia.com.br', '(11) 5005-7733',
     v_mariana, '2024-11-20', 'ativo', 5000, 8, 'Boleto',
     'Conteúdo médico precisa de validação do corpo clínico.'),
    ('a0000000-0000-0000-0000-000000000204', v_org,
     'Felipe Holanda', 'Felipe Holanda Consultoria', '45.678.901/0001-33', 'Consultoria',
     'https://felipeholanda.com.br', '@felipeholanda', 'contato@felipeholanda.com.br', '(11) 9 8811-2200',
     v_daniel, '2025-01-15', 'ativo', 3500, 15, 'Cartão de crédito',
     'Marca pessoal — validar tom de voz antes de publicar.'),
    ('a0000000-0000-0000-0000-000000000205', v_org,
     'Vero Saúde', 'Vero', '56.789.012/0001-44', 'Saúde',
     'https://verosaude.com.br', '@verosaude', 'hello@verosaude.com.br', '(11) 4111-9090',
     v_camila, '2025-07-01', 'ativo', 4800, 20, 'Pix',
     'Campanha de Outubro Rosa em produção.'),
    ('a0000000-0000-0000-0000-000000000206', v_org,
     'Nova Educação', 'Nova Educação', '67.890.123/0001-55', 'Educação',
     'https://novaeducacao.com.br', '@novaeducacao', 'parcerias@novaeducacao.com.br', '(11) 3222-4400',
     v_bruno, '2026-08-01', 'lead', 4000, 5, 'Boleto',
     'Proposta enviada, aguardando aprovação do orçamento.'),
    ('a0000000-0000-0000-0000-000000000207', v_org,
     'Grupo Almeida', 'Grupo Almeida', '78.901.234/0001-66', 'Varejo',
     'https://grupoalmeida.com.br', '@grupoalmeida', 'marketing@grupoalmeida.com.br', '(11) 3444-5500',
     v_fernanda, '2024-02-10', 'pausado', 5500, 12, 'Boleto',
     'Contrato pausado enquanto o cliente revisa o orçamento anual.');

  -- ---------- Serviços ----------
  insert into public.services (id, organization_id, name) values
    ('a0000000-0000-0000-0000-000000000301', v_org, 'Gestão Digital'),
    ('a0000000-0000-0000-0000-000000000302', v_org, 'Tráfego'),
    ('a0000000-0000-0000-0000-000000000303', v_org, 'Conteúdo'),
    ('a0000000-0000-0000-0000-000000000304', v_org, 'Consultoria de Marca'),
    ('a0000000-0000-0000-0000-000000000305', v_org, 'Assessoria de Imprensa'),
    ('a0000000-0000-0000-0000-000000000306', v_org, 'SEO'),
    ('a0000000-0000-0000-0000-000000000307', v_org, 'Branding');

  insert into public.client_services (organization_id, client_id, service_id) values
    (v_org, 'a0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000301'),
    (v_org, 'a0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000302'),
    (v_org, 'a0000000-0000-0000-0000-000000000202', 'a0000000-0000-0000-0000-000000000301'),
    (v_org, 'a0000000-0000-0000-0000-000000000203', 'a0000000-0000-0000-0000-000000000301'),
    (v_org, 'a0000000-0000-0000-0000-000000000203', 'a0000000-0000-0000-0000-000000000303'),
    (v_org, 'a0000000-0000-0000-0000-000000000204', 'a0000000-0000-0000-0000-000000000304'),
    (v_org, 'a0000000-0000-0000-0000-000000000204', 'a0000000-0000-0000-0000-000000000305'),
    (v_org, 'a0000000-0000-0000-0000-000000000205', 'a0000000-0000-0000-0000-000000000303'),
    (v_org, 'a0000000-0000-0000-0000-000000000205', 'a0000000-0000-0000-0000-000000000301'),
    (v_org, 'a0000000-0000-0000-0000-000000000206', 'a0000000-0000-0000-0000-000000000301'),
    (v_org, 'a0000000-0000-0000-0000-000000000206', 'a0000000-0000-0000-0000-000000000306'),
    (v_org, 'a0000000-0000-0000-0000-000000000207', 'a0000000-0000-0000-0000-000000000301'),
    (v_org, 'a0000000-0000-0000-0000-000000000207', 'a0000000-0000-0000-0000-000000000307');

  -- ---------- Campanhas + Projetos ----------
  insert into public.campaigns (id, organization_id, client_id, name) values
    ('a0000000-0000-0000-0000-000000000401', v_org, 'a0000000-0000-0000-0000-000000000201', 'Setembro 2026'),
    ('a0000000-0000-0000-0000-000000000402', v_org, 'a0000000-0000-0000-0000-000000000201', 'Aniversário'),
    ('a0000000-0000-0000-0000-000000000403', v_org, 'a0000000-0000-0000-0000-000000000203', 'Setembro 2026'),
    ('a0000000-0000-0000-0000-000000000404', v_org, 'a0000000-0000-0000-0000-000000000203', 'Branding'),
    ('a0000000-0000-0000-0000-000000000405', v_org, 'a0000000-0000-0000-0000-000000000202', 'Setembro 2026'),
    ('a0000000-0000-0000-0000-000000000406', v_org, 'a0000000-0000-0000-0000-000000000202', 'Verão 2026'),
    ('a0000000-0000-0000-0000-000000000407', v_org, 'a0000000-0000-0000-0000-000000000204', 'Q4 2026'),
    ('a0000000-0000-0000-0000-000000000408', v_org, 'a0000000-0000-0000-0000-000000000205', 'Outubro Rosa'),
    ('a0000000-0000-0000-0000-000000000409', v_org, 'a0000000-0000-0000-0000-000000000207', 'Branding');

  insert into public.projects (
    id, organization_id, client_id, campaign_id, name, description,
    responsible_id, start_date, end_date, status, progress
  ) values
    ('a0000000-0000-0000-0000-000000000501', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000401', 'Gestão Digital — Setembro',
     'Gestão das redes sociais da Inovar RH com foco em geração de leads para o time comercial.',
     v_mariana, '2026-09-01', '2026-09-30', 'em_andamento', 68),
    ('a0000000-0000-0000-0000-000000000502', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000402', '26 anos Inovar',
     'Campanha comemorativa dos 26 anos da Inovar RH no mercado.',
     v_daniel, '2026-10-01', '2026-10-31', 'planejamento', 15),
    ('a0000000-0000-0000-0000-000000000503', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000403', 'Conteúdo Setembro',
     'Produção de conteúdo educativo em saúde para o Pleno Hospital Dia.',
     v_fernanda, '2026-09-01', '2026-09-30', 'em_andamento', 72),
    ('a0000000-0000-0000-0000-000000000504', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000404', 'Reposicionamento de marca',
     'Atualização da identidade visual e do tom de voz do Pleno Hospital Dia.',
     v_mariana, '2026-06-01', '2026-08-31', 'concluido', 100),
    ('a0000000-0000-0000-0000-000000000505', v_org, 'a0000000-0000-0000-0000-000000000202',
     'a0000000-0000-0000-0000-000000000405', 'Gestão Setembro',
     'Manutenção das redes sociais e briefings mensais da Conservar.',
     v_fernanda, '2026-09-01', '2026-09-30', 'em_andamento', 55),
    ('a0000000-0000-0000-0000-000000000506', v_org, 'a0000000-0000-0000-0000-000000000202',
     'a0000000-0000-0000-0000-000000000406', 'Campanha de Verão',
     'Campanha sazonal de verão, descontinuada por reformulação de escopo.',
     v_fernanda, '2026-01-01', '2026-02-28', 'cancelado', 20),
    ('a0000000-0000-0000-0000-000000000507', v_org, 'a0000000-0000-0000-0000-000000000204',
     'a0000000-0000-0000-0000-000000000407', 'Consultoria de Marca — Q4',
     'Planejamento de posicionamento pessoal para o último trimestre do ano.',
     v_daniel, '2026-10-01', '2026-12-31', 'planejamento', 10),
    ('a0000000-0000-0000-0000-000000000508', v_org, 'a0000000-0000-0000-0000-000000000205',
     'a0000000-0000-0000-0000-000000000408', 'Campanha Outubro Rosa',
     'Campanha de conscientização sobre prevenção ao câncer de mama.',
     v_camila, '2026-09-15', '2026-10-31', 'em_andamento', 30),
    ('a0000000-0000-0000-0000-000000000509', v_org, 'a0000000-0000-0000-0000-000000000207',
     'a0000000-0000-0000-0000-000000000409', 'Rebranding Institucional',
     'Projeto pausado enquanto o Grupo Almeida revisa o orçamento anual.',
     v_fernanda, '2026-04-01', '2026-11-30', 'em_pausa', 40);

  -- ---------- Tarefas ----------
  insert into public.tasks (
    id, organization_id, client_id, project_id, title, description,
    assignee_id, creator_id, priority, status, due_date
  ) values
    ('a0000000-0000-0000-0000-000000000601', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Revisar copy do Reel',
     'Revisar o roteiro do Reel institucional sobre a área de Gestão antes do envio para produção.',
     v_daniel, v_fernanda, 'alta', 'em_revisao', '2026-09-15'),
    ('a0000000-0000-0000-0000-000000000602', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000503', 'Criar arte do carrossel',
     'Arte do carrossel de resultados do trimestre para o Pleno Hospital Dia.',
     v_camila, v_mariana, 'normal', 'em_producao', '2026-09-17'),
    ('a0000000-0000-0000-0000-000000000603', v_org, 'a0000000-0000-0000-0000-000000000202',
     'a0000000-0000-0000-0000-000000000505', 'Enviar briefing',
     'Coletar informações do mês com o cliente para montar o briefing de setembro.',
     v_fernanda, v_fernanda, 'urgente', 'a_fazer', '2026-09-15'),
    ('a0000000-0000-0000-0000-000000000604', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000503', 'Planejar pauta de conteúdo', null,
     v_bruno, v_mariana, 'normal', 'backlog', '2026-09-18'),
    ('a0000000-0000-0000-0000-000000000605', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000502', 'Aprovar cronograma 26 anos', null,
     v_daniel, v_daniel, 'alta', 'backlog', '2026-09-22'),
    ('a0000000-0000-0000-0000-000000000606', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000504', 'Revisar identidade visual', null,
     v_camila, v_mariana, 'baixa', 'concluido', '2026-08-20'),
    ('a0000000-0000-0000-0000-000000000607', v_org, 'a0000000-0000-0000-0000-000000000204',
     'a0000000-0000-0000-0000-000000000507', 'Roteirizar vídeo institucional', null,
     v_bruno, v_daniel, 'normal', 'backlog', '2026-10-05'),
    ('a0000000-0000-0000-0000-000000000608', v_org, 'a0000000-0000-0000-0000-000000000205',
     'a0000000-0000-0000-0000-000000000508', 'Selecionar pauta Outubro Rosa', null,
     v_camila, v_camila, 'alta', 'em_producao', '2026-09-19'),
    ('a0000000-0000-0000-0000-000000000609', v_org, 'a0000000-0000-0000-0000-000000000205',
     'a0000000-0000-0000-0000-000000000508', 'Enviar posts para aprovação', null,
     v_fernanda, v_camila, 'normal', 'aguardando_cliente', '2026-09-16'),
    ('a0000000-0000-0000-0000-000000000610', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Revisar relatório mensal', null,
     v_mariana, v_mariana, 'normal', 'concluido', '2026-09-12'),
    ('a0000000-0000-0000-0000-000000000611', v_org, 'a0000000-0000-0000-0000-000000000207',
     'a0000000-0000-0000-0000-000000000509', 'Apresentar proposta de rebranding', null,
     v_fernanda, v_fernanda, 'baixa', 'aguardando_cliente', '2026-09-25'),
    ('a0000000-0000-0000-0000-000000000612', v_org, 'a0000000-0000-0000-0000-000000000202',
     'a0000000-0000-0000-0000-000000000505', 'Corrigir arte aprovada', null,
     v_camila, v_fernanda, 'urgente', 'em_revisao', '2026-09-14'),
    ('a0000000-0000-0000-0000-000000000613', v_org, null, null,
     'Organizar biblioteca de assets', null,
     v_bruno, v_daniel, 'baixa', 'backlog', '2026-09-30'),
    ('a0000000-0000-0000-0000-000000000614', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000503', 'Preparar apresentação de resultados', null,
     v_mariana, v_mariana, 'alta', 'a_fazer', '2026-09-15'),
    ('a0000000-0000-0000-0000-000000000615', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000503', 'Publicar carrossel aprovado', null,
     v_camila, v_mariana, 'normal', 'a_fazer', '2026-09-16'),
    ('a0000000-0000-0000-0000-000000000616', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Criar briefing do Reel — Gestão', null,
     v_fernanda, v_fernanda, 'normal', 'concluido', '2026-09-10'),
    ('a0000000-0000-0000-0000-000000000617', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Escrever roteiro do Reel — Gestão', null,
     v_bruno, v_fernanda, 'normal', 'concluido', '2026-09-11'),
    ('a0000000-0000-0000-0000-000000000618', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Gravar Reel — Gestão', null,
     v_camila, v_fernanda, 'alta', 'concluido', '2026-09-13'),
    ('a0000000-0000-0000-0000-000000000619', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Editar vídeo do Reel — Gestão', null,
     v_camila, v_fernanda, 'alta', 'em_producao', '2026-09-14'),
    ('a0000000-0000-0000-0000-000000000620', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Aprovar Reel — Gestão', null,
     v_daniel, v_fernanda, 'alta', 'backlog', '2026-09-15');

  update public.tasks set completed_at = due_date::timestamptz
    where status = 'concluido' and organization_id = v_org;

  -- ---------- Conteúdos ----------
  insert into public.contents (
    id, organization_id, client_id, project_id, title, content_type, channel,
    status, responsible_id, created_by, scheduled_date, scheduled_time,
    description, caption, cta
  ) values
    ('a0000000-0000-0000-0000-000000000701', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000501', 'Reel — Gestão', 'Reels', 'Instagram', 'revisao',
     v_daniel, v_fernanda, '2026-09-15', '18:00',
     'Reel institucional sobre boas práticas de gestão de pessoas, com depoimento da equipe de RH.',
     'Como estruturar uma gestão de pessoas que realmente funciona. 💜 #GestãoDePessoas #RH',
     'Fale com nosso time comercial.'),
    ('a0000000-0000-0000-0000-000000000702', v_org, 'a0000000-0000-0000-0000-000000000202',
     'a0000000-0000-0000-0000-000000000505', 'Carrossel — ASG', 'Carrossel', 'Instagram', 'design',
     v_camila, v_fernanda, '2026-09-17', '12:00',
     'Carrossel educativo sobre as práticas ASG (Ambiental, Social e Governança) da Conservar.',
     'Sustentabilidade é rotina aqui. Conheça nossas práticas ASG.', 'Saiba mais no site.'),
    ('a0000000-0000-0000-0000-000000000703', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000503', 'Post — O Pleno é para todos', 'Post', 'Instagram', 'agendado',
     v_fernanda, v_mariana, '2026-09-18', '09:00',
     'Post institucional reforçando o posicionamento de acessibilidade do Pleno.',
     'Cuidar da sua saúde nunca foi tão simples. O Pleno é para todos.', 'Agende sua consulta.'),
    ('a0000000-0000-0000-0000-000000000704', v_org, 'a0000000-0000-0000-0000-000000000204',
     'a0000000-0000-0000-0000-000000000507', 'Reel — Bastidores de um CEO', 'Reels', 'Instagram', 'briefing',
     v_mariana, v_daniel, '2026-09-19', '17:00',
     'Bastidores de um dia de trabalho, reforçando a marca pessoal do Felipe Holanda.', null, null),
    ('a0000000-0000-0000-0000-000000000705', v_org, 'a0000000-0000-0000-0000-000000000203',
     'a0000000-0000-0000-0000-000000000503', 'Post — Resultados do trimestre', 'Post', 'LinkedIn', 'ideia',
     v_mariana, v_mariana, '2026-09-22', null,
     'Ideia inicial para divulgar os resultados do trimestre em tom institucional.', null, null),
    ('a0000000-0000-0000-0000-000000000706', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000502', 'Vídeo — Depoimento cliente', 'Vídeo', 'YouTube', 'copy',
     v_bruno, v_daniel, '2026-09-28', null,
     'Depoimento de cliente para a campanha dos 26 anos da Inovar RH.', null, null),
    ('a0000000-0000-0000-0000-000000000707', v_org, 'a0000000-0000-0000-0000-000000000205',
     'a0000000-0000-0000-0000-000000000508', 'Stories — Outubro Rosa', 'Story', 'Instagram', 'aprovacao',
     v_camila, v_camila, '2026-09-20', '10:00',
     null, 'Prevenção é cuidado. Outubro Rosa na Vero Saúde.', 'Agende seu exame.'),
    ('a0000000-0000-0000-0000-000000000708', v_org, 'a0000000-0000-0000-0000-000000000202',
     'a0000000-0000-0000-0000-000000000505', 'Artigo — Terceirização segura', 'Artigo', 'Site', 'publicado',
     v_fernanda, v_fernanda, '2026-09-10', null,
     'Artigo já publicado sobre boas práticas de terceirização segura.', null, null),
    ('a0000000-0000-0000-0000-000000000709', v_org, 'a0000000-0000-0000-0000-000000000201',
     'a0000000-0000-0000-0000-000000000502', 'LinkedIn — 26 anos de mercado', 'LinkedIn', 'LinkedIn', 'ideia',
     v_daniel, v_daniel, '2026-10-01', null,
     null, null, null),
    ('a0000000-0000-0000-0000-000000000710', v_org, 'a0000000-0000-0000-0000-000000000207',
     'a0000000-0000-0000-0000-000000000509', 'Anúncio — Campanha institucional', 'Anúncio', 'Google', 'briefing',
     v_fernanda, v_fernanda, '2026-09-30', null,
     null, null, null);

  update public.contents set published_at = scheduled_date::timestamptz
    where status = 'publicado' and organization_id = v_org;

  insert into public.content_tasks (organization_id, content_id, task_id) values
    (v_org, 'a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000616'),
    (v_org, 'a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000617'),
    (v_org, 'a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000618'),
    (v_org, 'a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000619'),
    (v_org, 'a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000601'),
    (v_org, 'a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000620'),
    (v_org, 'a0000000-0000-0000-0000-000000000702', 'a0000000-0000-0000-0000-000000000612'),
    (v_org, 'a0000000-0000-0000-0000-000000000703', 'a0000000-0000-0000-0000-000000000615'),
    (v_org, 'a0000000-0000-0000-0000-000000000704', 'a0000000-0000-0000-0000-000000000607'),
    (v_org, 'a0000000-0000-0000-0000-000000000705', 'a0000000-0000-0000-0000-000000000604'),
    (v_org, 'a0000000-0000-0000-0000-000000000706', 'a0000000-0000-0000-0000-000000000605'),
    (v_org, 'a0000000-0000-0000-0000-000000000707', 'a0000000-0000-0000-0000-000000000608'),
    (v_org, 'a0000000-0000-0000-0000-000000000707', 'a0000000-0000-0000-0000-000000000609');

  -- ---------- Eventos de calendário ----------
  insert into public.calendar_events (id, organization_id, title, type, event_date, event_time, client_id, description) values
    ('a0000000-0000-0000-0000-000000000801', v_org,
     'Reunião de alinhamento — Inovar RH', 'meeting', '2026-09-15', '10:00',
     'a0000000-0000-0000-0000-000000000201',
     'Alinhamento mensal com o time de RH da Inovar sobre o calendário editorial.'),
    ('a0000000-0000-0000-0000-000000000802', v_org,
     'Deadline — Fechamento de pauta Outubro', 'deadline', '2026-09-25', null, null,
     'Prazo final para fechar a pauta de conteúdo de outubro com todos os clientes.'),
    ('a0000000-0000-0000-0000-000000000803', v_org,
     'Reunião de apresentação — Grupo Almeida', 'meeting', '2026-09-18', '14:30',
     'a0000000-0000-0000-0000-000000000207',
     'Apresentação da proposta de rebranding para retomada do contrato.'),
    ('a0000000-0000-0000-0000-000000000804', v_org,
     'Evento — Workshop interno de conteúdo', 'event', '2026-09-22', '09:30', null,
     'Workshop interno da equipe sobre novos formatos de conteúdo em vídeo.'),
    ('a0000000-0000-0000-0000-000000000805', v_org,
     'Deadline — Renovação de contrato Pleno', 'deadline', '2026-09-30', null,
     'a0000000-0000-0000-0000-000000000203',
     'Prazo para envio da proposta de renovação do contrato do Pleno Hospital Dia.');

  raise notice 'Seed hospedado concluído: 7 clientes, 7 serviços, 9 projetos, 20 tarefas, 10 conteúdos, 5 eventos.';
end $$;
