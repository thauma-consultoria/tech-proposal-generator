export interface ScopeItem {
  id: string;
  descricao: string;
}

export interface PriceItem {
  id: string;
  descricao: string;
  valor: number;
}

export interface HourlyRate {
  cargo: string;
  valorHora: number;
}

export interface CustomSection {
  id: string;
  letra: string;
  titulo: string;
  conteudo: string;
}

export interface ProposalData {
  numero: string;
  revisao?: string;
  cidade: string;
  data: string;
  cliente: string;
  contato: string;
  assunto: string;
  // Seção A
  escopoItens: ScopeItem[];
  // Seções B–F editáveis
  secaoB: string;
  secaoC: string;
  secaoD: string;
  secaoE: string;
  secaoF: string;
  // Seção G
  precoItens: PriceItem[];
  horasTecnicas: HourlyRate[];
  // Seções H e J
  pagamento: string;
  prazo: string;
  // Seções extras personalizadas
  secoesExtras: CustomSection[];
}

export const DEFAULT_HOURLY_RATES: HourlyRate[] = [
  { cargo: "Engenheiro Consultor", valorHora: 400 },
  { cargo: "Engenheiro Sênior", valorHora: 250 },
  { cargo: "Engenheiro", valorHora: 190 },
  { cargo: "Projetista", valorHora: 130 },
];

export const DEFAULT_SECAO_B =
  `Os serviços serão executados pela Tech-Estrutural Projetos de Engenharia, com sede em Belo Horizonte/MG, por equipe especializada sob a direção de Engenheiro Coordenador Sênior.\n\nTodos os projetos serão entregues em formato DWG e PDF, salvo disposição específica em contrário.`;

export const DEFAULT_SECAO_C =
  `Todos os projetos serão elaborados em conformidade com as normas da ABNT vigentes, em sua revisão mais recente. Quando necessário, serão adotados procedimentos reconhecidos internacionalmente.`;

export const DEFAULT_SECAO_D =
  `Os cálculos serão realizados com o auxílio dos programas TQS, SAP2000, Mudados Informática ou planilhas próprias, todos em conformidade com as normas vigentes.`;

export const DEFAULT_SECAO_E =
  `Para o desenvolvimento dos serviços, o contratante deverá fornecer:\n\n• Sondagens e laudos geotécnicos\n• Levantamento topográfico\n• Planta de implantação e projetos arquitetônicos\n• Pontos de apoio e mapeamento de cargas\n• Projeto geométrico e batimetria, quando aplicável`;

export const DEFAULT_SECAO_F =
  `Alterações de caráter conceitual, após início dos serviços, serão objeto de nova proposta. Visitas técnicas à obra e deslocamentos serão cobrados por horas técnicas, conforme tabela da Seção G, acrescidos de reembolso de viagem e hospedagem quando necessário.`;

export const DEFAULT_PAGAMENTO =
  `30% (trinta por cento) na aceitação da proposta e 70% (setenta por cento) em faturas mensais durante o desenvolvimento dos serviços.`;

export const DEFAULT_PRAZO =
  `A ser definido em comum acordo entre as partes.`;
