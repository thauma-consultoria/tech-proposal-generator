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

export interface ProposalData {
  numero: string;
  revisao?: string;
  cidade: string;
  data: string;
  cliente: string;
  contato: string;
  assunto: string;
  escopoItens: ScopeItem[];
  softwareCalculo: string[];
  precoItens: PriceItem[];
  horasTecnicas: HourlyRate[];
  pagamento: string;
  prazo: string;
}

export const DEFAULT_HOURLY_RATES: HourlyRate[] = [
  { cargo: "Engenheiro Consultor", valorHora: 400 },
  { cargo: "Engenheiro Sênior", valorHora: 250 },
  { cargo: "Engenheiro", valorHora: 190 },
  { cargo: "Projetista", valorHora: 130 },
];

export const SOFTWARES_DISPONIVEIS = [
  "TQS",
  "SAP2000",
  "CSi Bridge",
  "Mudados Informática",
  "Planilhas Próprias",
];
