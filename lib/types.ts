export interface ScopeImage {
  id: string;
  path?: string;      // storage path após upload (Supabase)
  dataUrl?: string;   // base64 antes do upload, OU signed URL pro PDF
  fonte: string;
  descricao: string;
}

export interface ScopeItem {
  id: string;
  descricao: string;
  imagens?: ScopeImage[];
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
  // Assinatura (signatário Tech-Estrutural)
  assinaturaNome?: string;
  assinaturaCrea?: string;
}

export const DEFAULT_HOURLY_RATES: HourlyRate[] = [
  { cargo: "Engenheiro Consultor", valorHora: 500 },
  { cargo: "Engenheiro Sênior", valorHora: 345 },
  { cargo: "Engenheiro", valorHora: 255 },
  { cargo: "Projetista", valorHora: 180 },
];

export const DEFAULT_SECAO_B =
  `Os serviços serão executados pela Tech-Estrutural Projetos de Engenharia, com sede em Belo Horizonte/MG, por equipe técnica especializada, sob a coordenação de Engenheiro Sênior responsável.\n\nOs entregáveis serão disponibilizados em formato digital, nos padrões DWG e PDF, salvo disposição específica em contrário.`;

export const DEFAULT_SECAO_C =
  `Todos os projetos serão elaborados em conformidade com as normas da ABNT vigentes, considerando suas versões mais atualizadas à época do desenvolvimento dos trabalhos.\nSerão adotados critérios de dimensionamento, análise e detalhamento compatíveis com as boas práticas da engenharia estrutural, garantindo segurança, funcionalidade e desempenho das soluções propostas.\nQuando aplicável ou na ausência de normalização específica, poderão ser utilizados referenciais técnicos e normas internacionais reconhecidas.`;

export const DEFAULT_SECAO_D =
  `Os cálculos estruturais serão desenvolvidos com o auxílio de softwares especializados, tais como TQS e SAP2000, complementados por programas auxiliares e planilhas de cálculo próprias, devidamente validadas.\nAs análises contemplarão modelagem estrutural compatível com o comportamento real da estrutura, incluindo a consideração das ações atuantes, combinações de carregamento e verificações de segurança e desempenho, em conformidade com as normas vigentes.`;

export const DEFAULT_SECAO_E =
  `Para o adequado desenvolvimento dos serviços, o contratante deverá disponibilizar, quando aplicável:\n\n• Sondagens geotécnicas e respectivos laudos interpretativos\n• Perfil estratigráfico do solo e nível do lençol freático\n• Ensaios geotécnicos complementares\n• Histórico de uso da área (aterros, contaminações, escavações prévias, etc.)\n• Levantamento topográfico planialtimétrico cadastral\n• Planta de implantação com sistema de coordenadas e níveis de referência\n• Locação de eixos e identificação de interferências existentes\n• Projeto arquitetônico atualizado e compatibilizado\n• Projetos complementares (hidrossanitário, elétrico, combate a incêndio, entre outros)\n• Definição das cargas de utilização (sobrecargas, equipamentos, reservatórios, etc.)\n• Layouts operacionais, quando aplicável\n• Mapeamento de cargas especiais (equipamentos, impactos, vibrações, etc.)\n• Projetos, levantamentos ou diretrizes de estruturas existentes (em casos de ampliação ou reforço)\n• Projeto geométrico (quando aplicável)\n• Dados hidrológicos e hidráulicos (vazões de projeto, níveis d'água, cheias, etc.)\n• Estudos de tráfego (para obras de infraestrutura)\n• Batimetria e levantamentos hidrográficos, quando aplicável\n• Interferências com redes públicas e concessionárias\n• Padrões, diretrizes e premissas técnicas do contratante, quando existentes\n\nA ausência, insuficiência ou inconsistência das informações acima poderá impactar prazos, custos e soluções adotadas, sendo passível de revisão das condições ora propostas.`;

export const DEFAULT_SECAO_F =
  `Alterações de caráter conceitual ou inclusão de novos escopos serão consideradas serviços adicionais, não contemplados no escopo original, e objeto de nova proposta comercial.

   Revisões decorrentes de alterações nos projetos de terceiros (arquitetônico, instalações, entre outros), mudanças de premissas ou fornecimento posterior de informações por parte do contratante poderão implicar na reavaliação de prazos e custos.

   Visitas técnicas à obra e deslocamentos não previstos no escopo serão cobrados com base em horas técnicas, conforme tabela apresentada na Seção G, acrescidos das despesas de deslocamento, alimentação e hospedagem, quando aplicáveis.`;

export const DEFAULT_PAGAMENTO =
  `30% (trinta por cento) na aceitação da proposta e 70% (setenta por cento) em faturas mensais durante o desenvolvimento dos serviços.`;

export const DEFAULT_PRAZO =
  `A ser definido em comum acordo entre as partes.`;
