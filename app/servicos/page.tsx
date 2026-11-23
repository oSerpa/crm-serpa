"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Servico, brl } from "@/lib/types";
import { MENSAGENS_PADRAO } from "@/lib/abordagem";
import { explicarErro } from "@/lib/erros";
import PageHeader from "@/components/PageHeader";

const SUGESTOES = ["Site institucional", "Landing page", "Aplicativo", "Kit de fotos", "Documentos", "Currículo", "Edição de vídeo", "Edição de foto"];
const vazio = { nome: "", descricao: "", preco: "", mensagem_padrao: "" };

export default function Servicos() {
  const [lista, setLista] = useState<Servico[]>([]);
  const [f, setF] = useState<typeof vazio & { id?: string }>(vazio);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = () => supabase.from("servicos").select("*").order("nome").then(({ data, error }) => {
    if (error) setErro(explicarErro(error, "servicos"));
    setLista(data ?? []);
    setCarregando(false);
  });
  useEffect(() => { carregar(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const dados = {
      nome: f.nome,
      descricao: f.descricao || null,
      preco: f.preco === "" ? null : Number(f.preco),
      mensagem_padrao: f.mensagem_padrao || null,
    };
    const { error } = f.id
      ? await supabase.from("servicos").update(dados).eq("id", f.id)
      : await supabase.from("servicos").insert(dados);
    if (error) return setErro(explicarErro(error, "servicos"));
    setErro("");
    setF(vazio);
    carregar();
  }

  async function criarSugestoes() {
    const existentes = new Set(lista.map((s) => s.nome));
    const novos = SUGESTOES.filter((n) => !existentes.has(n)).map((nome) => ({ nome, mensagem_padrao: MENSAGENS_PADRAO[nome] ?? null }));
    if (novos.length) {
      const { error } = await supabase.from("servicos").insert(novos);
      if (error) return setErro(explicarErro(error, "servicos"));
    }
    carregar();
  }

  async function alternar(s: Servico) {
    await supabase.from("servicos").update({ ativo: !s.ativo }).eq("id", s.id);
    carregar();
  }

  const editar = (s: Servico) => {
    setF({ id: s.id, nome: s.nome, descricao: s.descricao ?? "", preco: s.preco?.toString() ?? "", mensagem_padrao: s.mensagem_padrao ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <PageHeader titulo="Serviços" sub="O que você vende, com preço base e a mensagem usada na abordagem.">
        {!carregando && lista.length < SUGESTOES.length && (
          <button className="btn-sec" onClick={criarSugestoes}>{lista.length ? "Adicionar os padrão que faltam" : "Criar meus serviços padrão"}</button>
        )}
      </PageHeader>
      {erro && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {carregando ? (
            <p className="text-sm text-zinc-500">Carregando...</p>
          ) : !lista.length ? (
            <div className="card py-12 text-center">
              <p className="font-semibold">Nenhum serviço cadastrado</p>
              <p className="mt-1 text-sm text-zinc-500">Cadastre ao lado ou crie de uma vez os 8 serviços padrão, já com mensagem de abordagem.</p>
              <button className="btn mt-4" onClick={criarSugestoes}>Criar meus serviços padrão</button>
            </div>
          ) : (
            lista.map((s) => (
              <div key={s.id} className={`card flex items-start gap-4 ${s.ativo ? "" : "opacity-50"} ${f.id === s.id ? "ring-2 ring-indigo-500" : ""}`}>
                <div className="mr-auto min-w-0">
                  <p className="font-medium">{s.nome}</p>
                  {s.descricao && <p className="mt-0.5 text-sm text-zinc-600">{s.descricao}</p>}
                  <p className="mt-1 text-xs text-zinc-400">{s.mensagem_padrao ? "Mensagem própria" : "Usa a mensagem modelo"}{s.ativo ? "" : " · Desativado"}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-zinc-800">{brl(s.preco) || <span className="font-normal text-zinc-400">Sem preço</span>}</p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800" onClick={() => editar(s)}>Editar</button>
                  <button className="text-sm text-zinc-500 hover:text-zinc-800" onClick={() => alternar(s)}>{s.ativo ? "Desativar" : "Ativar"}</button>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={salvar} className="card space-y-3 lg:sticky lg:top-6">
          <h2 className="section-title">{f.id ? "Editar serviço" : "Novo serviço"}</h2>
          <input className="input" placeholder="Nome *" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          <input className="input" placeholder="Preço base (R$)" type="number" step="0.01" value={f.preco} onChange={(e) => setF({ ...f, preco: e.target.value })} />
          <textarea className="input" rows={2} placeholder="Descrição" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          <textarea className="input" rows={5} placeholder="Mensagem de abordagem. Use {nome}, {cidade}, {servico} e {preco}. Se ficar vazia, uso um modelo pronto."
            value={f.mensagem_padrao} onChange={(e) => setF({ ...f, mensagem_padrao: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn">{f.id ? "Salvar alterações" : "Adicionar"}</button>
            {f.id && <button type="button" className="btn-sec" onClick={() => setF(vazio)}>Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
