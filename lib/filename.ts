// Sanitiza e monta o nome do arquivo PDF no padrão NÚMERO-REVISÃO-CLIENTE-ASSUNTO.
// Preserva acentos, vírgulas, pontos e espaços (nome legível); só remove o que é
// ilegal em nome de arquivo.

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "-") // caracteres ilegais → hífen
    .replace(/\s+/g, " ") // colapsa espaços repetidos
    .replace(/-+/g, "-") // colapsa hifens repetidos
    .trim()
    .slice(0, 200); // respeita o limite de ~255 chars do sistema de arquivos
}

export function buildPdfFilename(data: {
  numero: string;
  revisao?: string;
  cliente: string;
  assunto: string;
}): string {
  const partes = [data.numero, data.revisao, data.cliente, data.assunto].filter(
    Boolean,
  );
  return sanitizeFilename(partes.join("-")) + ".pdf";
}
