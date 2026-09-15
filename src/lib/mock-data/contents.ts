import type { Content, ContentChannel, ContentItem, ContentType } from "@/lib/types";

export const contents: ContentItem[] = [
  {
    id: "c1",
    clientId: "inovar",
    title: "Reel — Gestão",
    format: "Reels",
    dueLabel: "Hoje",
    dueDate: "2026-09-15",
    responsibleId: "fernanda",
    status: "aprovacao",
  },
  {
    id: "c2",
    clientId: "pleno",
    title: "Carrossel — Resultados do trimestre",
    format: "Carrossel",
    dueLabel: "Amanhã",
    dueDate: "2026-09-16",
    responsibleId: "camila",
    status: "agendado",
  },
  {
    id: "c3",
    clientId: "conservar",
    title: "Post ASG",
    format: "Feed",
    dueLabel: "17/09",
    dueDate: "2026-09-17",
    responsibleId: "bruno",
    status: "producao",
  },
  {
    id: "c4",
    clientId: "felipe-holanda",
    title: "Reel — CEO",
    format: "Reels",
    dueLabel: "18/09",
    dueDate: "2026-09-18",
    responsibleId: "mariana",
    status: "revisao",
  },
  {
    id: "c5",
    clientId: "vero",
    title: "Stories — Campanha outubro rosa",
    format: "Stories",
    dueLabel: "19/09",
    dueDate: "2026-09-19",
    responsibleId: "fernanda",
    status: "producao",
  },
];

export const CONTENT_TYPE_OPTIONS: ContentType[] = [
  "Post",
  "Carrossel",
  "Reels",
  "Story",
  "Vídeo",
  "Artigo",
  "Blog",
  "LinkedIn",
  "Anúncio",
];

export const CHANNEL_OPTIONS: ContentChannel[] = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "Site",
  "Google",
];

/**
 * Full editorial content set for the Conteúdos module. Separate from
 * `contents` above on purpose — see the `Content` type comment in
 * lib/types for why the Dashboard widget keeps its own lightweight set.
 */
export const editorialContents: Content[] = [
  {
    id: "content-1",
    title: "Reel — Gestão",
    clientId: "inovar",
    projectId: "proj-inovar-gestao-set",
    contentType: "Reels",
    channel: "Instagram",
    status: "revisao",
    responsibleId: "daniel",
    publishDate: "2026-09-15",
    publishTime: "18:00",
    description:
      "Reel institucional sobre boas práticas de gestão de pessoas, com depoimento da equipe de RH.",
    caption:
      "Como estruturar uma gestão de pessoas que realmente funciona. 💜 #GestãoDePessoas #RH",
    cta: "Fale com nosso time comercial.",
    taskIds: ["task-16", "task-17", "task-18", "task-19", "task-1", "task-20"],
  },
  {
    id: "content-2",
    title: "Carrossel — ASG",
    clientId: "conservar",
    projectId: "proj-conservar-gestao-set",
    contentType: "Carrossel",
    channel: "Instagram",
    status: "design",
    responsibleId: "camila",
    publishDate: "2026-09-17",
    publishTime: "12:00",
    description:
      "Carrossel educativo sobre as práticas ASG (Ambiental, Social e Governança) da Conservar.",
    caption: "Sustentabilidade é rotina aqui. Conheça nossas práticas ASG.",
    cta: "Saiba mais no site.",
    taskIds: ["task-12"],
  },
  {
    id: "content-3",
    title: "Post — O Pleno é para todos",
    clientId: "pleno",
    projectId: "proj-pleno-conteudo-set",
    contentType: "Post",
    channel: "Instagram",
    status: "agendado",
    responsibleId: "fernanda",
    publishDate: "2026-09-18",
    publishTime: "09:00",
    description: "Post institucional reforçando o posicionamento de acessibilidade do Pleno.",
    caption: "Cuidar da sua saúde nunca foi tão simples. O Pleno é para todos.",
    cta: "Agende sua consulta.",
    taskIds: ["task-15"],
  },
  {
    id: "content-4",
    title: "Reel — Bastidores de um CEO",
    clientId: "felipe-holanda",
    projectId: "proj-felipe-consultoria-q4",
    contentType: "Reels",
    channel: "Instagram",
    status: "briefing",
    responsibleId: "mariana",
    publishDate: "2026-09-19",
    publishTime: "17:00",
    description: "Bastidores de um dia de trabalho, reforçando a marca pessoal do Felipe Holanda.",
    taskIds: ["task-7"],
  },
  {
    id: "content-5",
    title: "Post — Resultados do trimestre",
    clientId: "pleno",
    projectId: "proj-pleno-conteudo-set",
    contentType: "Post",
    channel: "LinkedIn",
    status: "ideia",
    responsibleId: "mariana",
    publishDate: "2026-09-22",
    description: "Ideia inicial para divulgar os resultados do trimestre em tom institucional.",
    taskIds: ["task-4"],
  },
  {
    id: "content-6",
    title: "Vídeo — Depoimento cliente",
    clientId: "inovar",
    projectId: "proj-inovar-26-anos",
    contentType: "Vídeo",
    channel: "YouTube",
    status: "copy",
    responsibleId: "bruno",
    publishDate: "2026-09-28",
    description: "Depoimento de cliente para a campanha dos 26 anos da Inovar RH.",
    taskIds: ["task-5"],
  },
  {
    id: "content-7",
    title: "Stories — Outubro Rosa",
    clientId: "vero",
    projectId: "proj-vero-outubro-rosa",
    contentType: "Story",
    channel: "Instagram",
    status: "aprovacao",
    responsibleId: "camila",
    publishDate: "2026-09-20",
    publishTime: "10:00",
    caption: "Prevenção é cuidado. Outubro Rosa na Vero Saúde.",
    cta: "Agende seu exame.",
    taskIds: ["task-8", "task-9"],
  },
  {
    id: "content-8",
    title: "Artigo — Terceirização segura",
    clientId: "conservar",
    projectId: "proj-conservar-gestao-set",
    contentType: "Artigo",
    channel: "Site",
    status: "publicado",
    responsibleId: "fernanda",
    publishDate: "2026-09-10",
    description: "Artigo já publicado sobre boas práticas de terceirização segura.",
    taskIds: [],
  },
  {
    id: "content-9",
    title: "LinkedIn — 26 anos de mercado",
    clientId: "inovar",
    projectId: "proj-inovar-26-anos",
    contentType: "LinkedIn",
    channel: "LinkedIn",
    status: "ideia",
    responsibleId: "daniel",
    publishDate: "2026-10-01",
    taskIds: [],
  },
  {
    id: "content-10",
    title: "Anúncio — Campanha institucional",
    clientId: "grupo-almeida",
    projectId: "proj-almeida-rebranding",
    contentType: "Anúncio",
    channel: "Google",
    status: "briefing",
    responsibleId: "fernanda",
    publishDate: "2026-09-30",
    taskIds: [],
  },
];

export function getContent(id: string): Content | undefined {
  return editorialContents.find((content) => content.id === id);
}

export function getContentsByClient(clientId: string): Content[] {
  return editorialContents.filter((content) => content.clientId === clientId);
}

export function getContentsByProject(projectId: string): Content[] {
  return editorialContents.filter((content) => content.projectId === projectId);
}
