import type { PostgrestError } from "@supabase/supabase-js";

// Traduz erros comuns do Supabase e sempre mostra o detalhe original.
export function explicarErro(e: PostgrestError | null, tabela: string): string {
  if (!e) return "";
  const falta =
    e.code === "42P01" || e.code === "PGRST205" || /schema cache|does not exist|Could not find/i.test(e.message);
  const dica = falta
    ? `A tabela "${tabela}" não foi encontrada. Rode supabase/migrations/002_propostas.sql no SQL Editor; se já rodou, rode também: notify pgrst, 'reload schema';`
    : "Erro ao ler os dados.";
  return `${dica} (detalhe: ${e.code ?? ""} ${e.message})`;
}
