"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Servico, brl } from "@/lib/types";
import { MENSAGENS_PADRAO } from "@/lib/abordagem";

const SUGESTOES = ["Site institucional", "Landing page", "Aplicativo", "Kit de fotos", "Documentos", "Currículo", "Edição de vídeo", "Edição de foto"];
const vazio = { nome: "", descricao: "", preco: "", mensagem_padrao: "" };

export default function Servicos() {
  const [lista, setLista] = useState<Servico[]>([]);
  const [f, setF] = useState<typeof vazio & { id?: string }>(vazio);

  const carregar = () => supabase.from("servicos").select("*").order("nome").then(({ data }) => setLista(data ?? []));
  useEffect(() => { carregar(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const dados = {
      nome: f.nome,
      descricao: f.descricao || null,
      preco: f.preco === "" ? null : Number(f.preco),
      mensagem_padrao: f.mensagem_padrao || null,
    };
    if (f.id) await supabase.from("servicos").update(dados).eq("id", f.id);
    else await supabase.from("servicos").insert(dados);
    setF(vazio);
    carregar();
  }

  async function criarSugestoes() {
    const existentes = new Set(lista.map((s) => s.nome));
    const novos = SUGESTOES.filter((n) => !existentes.has(n)).map((nome) => ({ nome, mensagem_padrao: MENSAGENS_PADRAO[nome] ?? null }));
    if (novos.length) await supabase.from("servicos").insert(novos);
    carregar();
  }

  async function alternar(s: Servico) {
    await supabase.from("servicos").update({ ativo: !s.ativo }).eq("id", s.id);
    carregar();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <form onSubmit={salvar} className="card space-y-2">
        <h2 className="font-semibold">{f.id ? "Editar serviço" : "Novo serviço"}</h2>
        <input className="input" placeholder="Nome *" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <input className="input" placeholder="Preço base (R$)" type="number" step="0.01" value={f.preco} onChange={(e) => setF({ ...f, preco: e.target.value })} />
        <textarea className="input" rows={2} placeholder="Descrição" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
        <textarea className="input" rows={4} placeholder="Mensagem de abordagem. Use {nome}, {cidade}, {servico} e {preco}. Se ficar vazia, uso um modelo pronto."
          value={f.mensagem_padrao} onChange={(e) => setF({ ...f, mensagem_padrao: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn">Salvar</button>
          {f.id && <button type="button" className="btn-sec" onClick={() => setF(vazio)}>Cancelar</button>}
        </div>
      </form>

      <div className="space-y-2 lg:col-span-2">
        <div className="flex items-center">
          <h1 className="mr-auto text-lg font-bold">Serviços</h1>
          {!lista.length && <button className="btn-sec" onClick={criarSugestoes}>Criar meus serviços padrão</button>}
        </div>
        {lista.map((s) => (
          <div key={s.id} className={`card flex items-start gap-3 ${s.ativo ? "" : "opacity-50"}`}>
            <div className="mr-auto">
              <p className="font-medium">{s.nome} <span className="text-sm font-normal text-slate-500">{brl(s.preco)}</span></p>
              {s.descricao && <p className="text-sm text-slate-600">{s.descricao}</p>}
            </div>
            <button className="text-sm text-indigo-600" onClick={() => setF({
              id: s.id, nome: s.nome, descricao: s.descricao ?? "", preco: s.preco?.toString() ?? "", mensagem_padrao: s.mensagem_padrao ?? "",
            })}>Editar</button>
            <button className="text-sm text-slate-500" onClick={() => alternar(s)}>{s.ativo ? "Desativar" : "Ativar"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
