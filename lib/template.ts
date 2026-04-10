import { ProposalData } from "./types";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function formatCurrencyWords(value: number): string {
  // Basic number-to-words for BRL — handles most proposal values
  const units = [
    "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis",
    "dezessete", "dezoito", "dezenove",
  ];
  const tens = [
    "", "", "vinte", "trinta", "quarenta", "cinquenta",
    "sessenta", "setenta", "oitenta", "noventa",
  ];
  const hundreds = [
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos",
  ];

  if (value === 0) return "zero";
  if (value === 100) return "cem";

  const intVal = Math.round(value);
  const cents = Math.round((value - intVal) * 100);

  function threeDigits(n: number): string {
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    const parts: string[] = [];
    if (h > 0) parts.push(h === 1 && (t > 0 || u > 0) ? "cento" : hundreds[h]);
    if (t === 1) {
      parts.push(units[10 + u]);
    } else {
      if (t > 0) parts.push(tens[t]);
      if (u > 0) parts.push(units[u]);
    }
    return parts.join(" e ");
  }

  const parts: string[] = [];
  const millions = Math.floor(intVal / 1_000_000);
  const thousands = Math.floor((intVal % 1_000_000) / 1_000);
  const remainder = intVal % 1_000;

  if (millions > 0) {
    parts.push(threeDigits(millions) + (millions === 1 ? " milhão" : " milhões"));
  }
  if (thousands > 0) {
    parts.push(threeDigits(thousands) + (thousands === 1 ? " mil" : " mil"));
  }
  if (remainder > 0) {
    parts.push(threeDigits(remainder));
  }

  let result = parts.join(" e ") + " reais";

  if (cents > 0) {
    result += ` e ${threeDigits(cents)} centavos`;
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function generateProposalHTML(data: ProposalData, logoBase64: string): string {
  const total = data.precoItens.reduce((sum, item) => sum + item.valor, 0);
  const totalWords = formatCurrencyWords(total);
  const softwares = data.softwareCalculo.length > 0
    ? data.softwareCalculo.join(", ")
    : "TQS, SAP2000, planilhas próprias";

  const headerRef = data.revisao
    ? `${data.numero} — ${data.revisao}`
    : data.numero;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta ${data.numero}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --verde: #7BAF7A;
    --verde-light: #EBF4EB;
    --cinza-escuro: #1A1A1A;
    --cinza-medio: #555555;
    --cinza-claro: #F8F8F8;
    --borda: #E0E0E0;
    --branco: #FFFFFF;
  }

  html, body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 10.5pt;
    color: var(--cinza-escuro);
    background: var(--branco);
    line-height: 1.6;
  }

  /* ── PAGE LAYOUT ── */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 20mm 22mm 20mm;
    position: relative;
    page-break-after: always;
  }

  .page:last-child { page-break-after: auto; }

  /* ── WATERMARK ── */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 160mm;
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
    filter: invert(1);
  }

  /* ── HEADER ── */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--verde);
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }

  .logo-wrap {
    background: #1A1A1A;
    border-radius: 6px;
    padding: 5px 10px;
    display: inline-flex;
    align-items: center;
  }

  .logo-wrap img {
    height: 32px;
    width: auto;
  }

  .header-ref {
    text-align: right;
  }

  .header-ref .ref-number {
    font-size: 11pt;
    font-weight: 700;
    color: var(--cinza-escuro);
    letter-spacing: 0.03em;
  }

  .header-ref .ref-date {
    font-size: 8.5pt;
    color: var(--cinza-medio);
    margin-top: 2px;
  }

  /* ── COVER INFO (first page only) ── */
  .cover-info {
    margin: 28px 0 32px 0;
    position: relative;
    z-index: 1;
  }

  .cover-title {
    font-size: 9pt;
    font-weight: 600;
    color: var(--verde);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .cover-subject {
    font-size: 16pt;
    font-weight: 700;
    color: var(--cinza-escuro);
    line-height: 1.3;
    margin-bottom: 20px;
    max-width: 140mm;
  }

  .cover-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 32px;
    border-top: 1px solid var(--borda);
    padding-top: 16px;
  }

  .meta-item label {
    display: block;
    font-size: 7.5pt;
    font-weight: 600;
    color: var(--verde);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .meta-item span {
    font-size: 10pt;
    color: var(--cinza-escuro);
    font-weight: 500;
  }

  /* ── SECTION ── */
  .section {
    margin-bottom: 24px;
    position: relative;
    z-index: 1;
  }

  .section-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--borda);
    padding-bottom: 6px;
  }

  .section-letter {
    font-size: 9pt;
    font-weight: 700;
    color: var(--verde);
    letter-spacing: 0.08em;
    min-width: 16px;
  }

  .section-title {
    font-size: 10pt;
    font-weight: 700;
    color: var(--cinza-escuro);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .section-body {
    padding-left: 6px;
  }

  .section-body p {
    margin-bottom: 6px;
    color: var(--cinza-escuro);
    font-size: 10pt;
  }

  /* ── SCOPE LIST ── */
  .scope-list {
    list-style: none;
    padding: 0;
  }

  .scope-list li {
    padding: 7px 0 7px 16px;
    border-bottom: 1px solid var(--borda);
    position: relative;
    font-size: 10pt;
  }

  .scope-list li:last-child { border-bottom: none; }

  .scope-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border: 1.5px solid var(--verde);
    border-radius: 50%;
  }

  .scope-item-label {
    font-size: 8pt;
    font-weight: 600;
    color: var(--verde);
    letter-spacing: 0.06em;
    margin-right: 6px;
  }

  /* ── PRICING TABLE ── */
  .pricing-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }

  .pricing-table thead tr {
    background: var(--cinza-escuro);
    color: var(--branco);
  }

  .pricing-table thead th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 8.5pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .pricing-table thead th:last-child { text-align: right; }

  .pricing-table tbody tr:nth-child(even) {
    background: var(--cinza-claro);
  }

  .pricing-table tbody td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--borda);
    font-size: 10pt;
  }

  .pricing-table tbody td:last-child {
    text-align: right;
    font-weight: 500;
  }

  .pricing-table tfoot tr {
    background: var(--verde-light);
  }

  .pricing-table tfoot td {
    padding: 10px 12px;
    font-weight: 700;
    font-size: 10.5pt;
    border-top: 2px solid var(--verde);
  }

  .pricing-table tfoot td:last-child { text-align: right; }

  .total-words {
    margin-top: 6px;
    font-size: 9pt;
    color: var(--cinza-medio);
    font-style: italic;
    padding-left: 2px;
  }

  /* ── HOURLY TABLE ── */
  .hourly-title {
    font-size: 9pt;
    font-weight: 600;
    color: var(--cinza-medio);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 20px 0 8px 0;
  }

  .hourly-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }

  .hourly-table thead tr {
    background: var(--cinza-claro);
    border-bottom: 1.5px solid var(--borda);
  }

  .hourly-table thead th {
    padding: 7px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 8.5pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--cinza-medio);
  }

  .hourly-table thead th:last-child { text-align: right; }

  .hourly-table tbody td {
    padding: 7px 12px;
    border-bottom: 1px solid var(--borda);
  }

  .hourly-table tbody td:last-child {
    text-align: right;
    font-weight: 500;
  }

  /* ── FOOTER ── */
  .page-footer {
    position: fixed;
    bottom: 10mm;
    left: 20mm;
    right: 20mm;
    border-top: 1px solid var(--borda);
    padding-top: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #AAAAAA;
    z-index: 1;
  }

  /* ── PRINT ── */
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- Watermark -->
<img class="watermark" src="${logoBase64}" alt="" aria-hidden="true" />

<!-- Footer (fixed, repeats on all pages) -->
<div class="page-footer">
  <span>Alameda Oscar Niemeyer, 1033, portaria 3, sala 427 — Vila da Serra | Nova Lima | MG | 34006-065</span>
  <span><strong>www.estruturalprojetos.com</strong></span>
</div>

<!-- ═══════════════════════════════════════ PAGE 1 ═══════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="page-header">
    <div class="logo-wrap">
      <img src="${logoBase64}" alt="Tech Estrutural Projetos" />
    </div>
    <div class="header-ref">
      <div class="ref-number">${headerRef}</div>
      <div class="ref-date">${data.cidade}, ${data.data}</div>
    </div>
  </div>

  <!-- Cover info -->
  <div class="cover-info">
    <div class="cover-title">Proposta Comercial</div>
    <div class="cover-subject">${data.assunto}</div>
    <div class="cover-meta">
      <div class="meta-item">
        <label>Cliente</label>
        <span>${data.cliente}</span>
      </div>
      <div class="meta-item">
        <label>Responsável Técnico</label>
        <span>${data.contato}</span>
      </div>
      <div class="meta-item">
        <label>Referência</label>
        <span>${data.numero}${data.revisao ? ` — ${data.revisao}` : ""}</span>
      </div>
      <div class="meta-item">
        <label>Data</label>
        <span>${data.cidade}, ${data.data}</span>
      </div>
    </div>
  </div>

  <!-- Section A: Escopo -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">A.</span>
      <span class="section-title">Escopo dos Serviços</span>
    </div>
    <div class="section-body">
      <ul class="scope-list">
        ${data.escopoItens.map((item, idx) => `
          <li>
            <span class="scope-item-label">Item ${idx + 1}</span>${item.descricao}
          </li>
        `).join("")}
      </ul>
    </div>
  </div>

  <!-- Section B: Organização dos Trabalhos -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">B.</span>
      <span class="section-title">Organização dos Trabalhos</span>
    </div>
    <div class="section-body">
      <p>Os serviços serão executados pela <strong>Tech-Estrutural Projetos de Engenharia</strong>, com sede em Belo Horizonte/MG, por equipe especializada sob a direção de Engenheiro Coordenador Sênior.</p>
      <p>Todos os projetos serão entregues em formato DWG e PDF, salvo disposição específica em contrário.</p>
    </div>
  </div>

  <!-- Section C: Normas -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">C.</span>
      <span class="section-title">Normas e Critérios de Cálculo</span>
    </div>
    <div class="section-body">
      <p>Todos os projetos serão elaborados em conformidade com as normas da <strong>ABNT</strong> vigentes, em sua revisão mais recente. Quando necessário, serão adotados procedimentos reconhecidos internacionalmente.</p>
    </div>
  </div>

  <!-- Section D: Metodologia -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">D.</span>
      <span class="section-title">Metodologia de Cálculo</span>
    </div>
    <div class="section-body">
      <p>Os cálculos serão realizados com o auxílio dos programas <strong>${softwares}</strong>, todos em conformidade com as normas vigentes.</p>
    </div>
  </div>

  <!-- Section E: Condições Especiais -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">E.</span>
      <span class="section-title">Condições Especiais</span>
    </div>
    <div class="section-body">
      <p>Para o desenvolvimento dos serviços, o contratante deverá fornecer:</p>
      <ul class="scope-list">
        <li>Sondagens e laudos geotécnicos</li>
        <li>Levantamento topográfico</li>
        <li>Planta de implantação e projetos arquitetônicos</li>
        <li>Pontos de apoio e mapeamento de cargas</li>
        <li>Projeto geométrico e batimetria, quando aplicável</li>
      </ul>
    </div>
  </div>

  <!-- Section F: Revisões -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">F.</span>
      <span class="section-title">Revisões e Serviços Adicionais</span>
    </div>
    <div class="section-body">
      <p>Alterações de caráter conceitual, após início dos serviços, serão objeto de nova proposta. Visitas técnicas à obra e deslocamentos serão cobrados por horas técnicas, conforme tabela da Seção G, acrescidos de reembolso de viagem e hospedagem quando necessário.</p>
    </div>
  </div>

  <!-- Section G: Preço -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">G.</span>
      <span class="section-title">Preço para Elaboração dos Serviços</span>
    </div>
    <div class="section-body">
      <table class="pricing-table">
        <thead>
          <tr>
            <th style="width:40px">Item</th>
            <th>Descrição</th>
            <th style="width:120px">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${data.precoItens.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.descricao}</td>
              <td>${formatCurrency(item.valor)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">TOTAL GERAL</td>
            <td>${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="total-words">${totalWords}</p>

      <div class="hourly-title">Tabela de Horas Técnicas</div>
      <table class="hourly-table">
        <thead>
          <tr>
            <th>Profissional</th>
            <th>Valor/Hora</th>
          </tr>
        </thead>
        <tbody>
          ${data.horasTecnicas.map(rate => `
            <tr>
              <td>${rate.cargo}</td>
              <td>${formatCurrency(rate.valorHora)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Section H: Pagamento -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">H.</span>
      <span class="section-title">Condições de Pagamento</span>
    </div>
    <div class="section-body">
      <p>${data.pagamento}</p>
    </div>
  </div>

  <!-- Section J: Prazos -->
  <div class="section">
    <div class="section-header">
      <span class="section-letter">J.</span>
      <span class="section-title">Prazos de Entrega</span>
    </div>
    <div class="section-body">
      <p>${data.prazo}</p>
    </div>
  </div>

</div>
<!-- ═══════════════════════════════════════ END PAGE ═══════════════════════════════════════ -->

</body>
</html>`;
}
