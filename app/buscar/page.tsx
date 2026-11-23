"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CATEGORIAS, Cidade, EstadoBusca, Negocio, buscarCidades, buscarNegocios, linkMaps, semAcento, temMais } from "@/lib/osm";

export default function Buscar() {
  const [textoCidade, setTextoCidade] = useState("");
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [cidade, setCidade] = useState<Cidade | null>(null);
  const [categoria, setCategoria] = useState(CATEGORIAS[0].id);
  const [nome, setNome] = useState("");
  const [resultados, setResultados] = useState<Negocio[]>([]);
  const [jaImportados, setJaImportados] = useState<Set<string>>(new Set());
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [soSemSite, setSoSemSite] = useState(false);
  const [soComContato, setSoComContato] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState("");
  const [estado, setEstado] = useState<EstadoBusca>({});

  useEffect(() => {
    supabase.from("leads").select("id_externo").not("id_externo", "is", null)
      .then(({ data }) => setJaImportados(new Set((data ?? []).map((d) => d.id_externo as string))));
  }, []);

  const nomeCidade = cidade?.nome.split(",")[0] ?? "";
  const labelCategoria = CATEGORIAS.find((c) => c.id === categoria)?.label ?? "";

  async function procurarCidade(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setCidade(null); setCidades([]);
    try {
      const lista = await buscarCidades(textoCidade);
      if (!lista.length) setMsg("Cidade não encontrada. Tente incluir o estado, ex: Campinas, SP.");
      else if (lista.length === 1) setCidade(lista[0]);
      else setCidades(lista);
    } catch (err) { setMsg((err as Error).message); }
  }

  async function carregar(novo: boolean) {
    if (!cidade) return;
    const est: EstadoBusca = novo ? {} : estado;
    setCarregando(true); setMsg("");
    if (novo) { setResultados([]); setSelecionados(new Set()); }
    try {
      const r = await buscarNegocios(cidade, categoria, est);
      const base = novo ? [] : resultados;
      const ids = new Set(base.map((n) => n.idExterno));
      const juntos = [...base, ...r.filter((n) => !ids.has(n.idExterno))].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setResultados(juntos);
      if (!juntos.length) setMsg("Nada encontrado no OpenStreetMap para essa busca. Use o link do Google Maps acima para procurar manualmente.");
    } catch (err) { setMsg((err as Error).message); }
    setEstado({ ...est });
    setCarregando(false);
  }

  function procurar(e: React.FormEvent) {
    e.preventDefault();
    carregar(true);
  }

  const visiveis = useMemo(() => resultados.filter((n) =>
    (!soSemSite || !n.site) && (!soComContato || n.telefone || n.whatsapp || n.instagram) &&
    (!nome.trim() || semAcento(n.nome).includes(semAcento(nome.trim())))), [resultados, soSemSite, soComContato, nome]);

  const selecionaveis = visiveis.filter((n) => !jaImportados.has(n.idExterno));

  function alternar(id: string) {
    const s = new Set(selecionados);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelecionados(s);
  }

  async function importar() {
    const novos = resultados.filter((n) => selecionados.has(n.idExterno) && !jaImportados.has(n.idExterno));
    if (!novos.length) return;
    const linhas = novos.map((n) => ({
      nome: n.nome,
      categoria: labelCategoria,
      telefone: n.telefone,
      whatsapp: n.whatsapp,
      site: n.site,
      instagram: n.instagram,
      facebook: n.facebook,
      email: n.email,
      cidade: nomeCidade,
      endereco: n.endereco,
      origem: "maps",
      status: "novo",
      id_externo: n.idExterno,
      observacoes: n.site ? null : "Sem site cadastrado no mapa.",
    }));
    const { error } = await supabase.from("leads").insert(linhas);
    if (error) return setMsg(error.message);
    setJaImportados(new Set([...jaImportados, ...novos.map((n) => n.idExterno)]));
    setSelecionados(new Set());
    setMsg(`${novos.length} lead(s) importado(s). Eles estão na coluna Novo do funil.`);
  }

  const buscaGoogle = cidade
    ? `https://www.google.com/maps/search/${encodeURIComponent(`${labelCategoria.split(" /")[0]} em ${nomeCidade}`)}`
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Buscar clientes no mapa</h1>

      <div className="card space-y-3">
        <form onSubmit={procurarCidade} className="flex flex-wrap gap-2">
          <input className="input max-w-sm" placeholder="Cidade, ex: Sorocaba, SP" required value={textoCidade} onChange={(e) => setTextoCidade(e.target.value)} />
          <button className="btn-sec">Achar cidade</button>
          {cidade && <span className="self-center text-sm text-green-700">{cidade.nome}</span>}
        </form>
        {cidades.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Qual delas?</p>
            {cidades.map((c) => (
              <button key={c.viewbox} className="block text-left text-sm text-indigo-700 hover:underline" onClick={() => { setCidade(c); setCidades([]); setResultados([]); setEstado({}); }}>{c.nome}</button>
            ))}
          </div>
        )}

        <form onSubmit={procurar} className="flex flex-wrap gap-2">
          <select className="input w-auto" value={categoria} onChange={(e) => { setCategoria(e.target.value); setResultados([]); setEstado({}); }}>
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input className="input max-w-xs" placeholder="Filtrar por nome (opcional)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <button className="btn" disabled={!cidade || carregando}>{carregando ? "Buscando..." : "Buscar"}</button>
        </form>
        <p className="text-xs text-slate-500">
          Os dados vêm do OpenStreetMap, que é grátis mas não tem todos os negócios pequenos. Cada busca traz até 40 lugares por tipo; use "Carregar mais" para ver o resto.
          {buscaGoogle && <> Para completar, <a className="text-indigo-700 underline" href={buscaGoogle} target="_blank">abra a mesma busca no Google Maps</a> e cadastre os que faltarem em <Link className="text-indigo-700 underline" href="/leads">Leads</Link>.</>}
        </p>
      </div>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {resultados.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium">{visiveis.length} de {resultados.length} resultados</span>
            <label className="flex items-center gap-1"><input type="checkbox" checked={soSemSite} onChange={(e) => setSoSemSite(e.target.checked)} /> Só sem site</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={soComContato} onChange={(e) => setSoComContato(e.target.checked)} /> Só com telefone ou Instagram</label>
            <button className="text-indigo-700 hover:underline" onClick={() => setSelecionados(new Set(selecionaveis.map((n) => n.idExterno)))}>Selecionar todos</button>
            <button className="btn ml-auto" disabled={!selecionados.size} onClick={importar}>Importar {selecionados.size || ""} como lead</button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr><th className="p-2"></th><th className="p-2">Nome</th><th className="p-2">Contato</th><th className="p-2">Site</th><th className="p-2">Endereço</th><th className="p-2"></th></tr>
              </thead>
              <tbody>
                {visiveis.map((n) => {
                  const importado = jaImportados.has(n.idExterno);
                  return (
                    <tr key={n.idExterno} className={`border-t border-slate-100 ${importado ? "opacity-50" : ""}`}>
                      <td className="p-2">
                        {importado ? <span className="text-xs text-green-700">Importado</span>
                          : <input type="checkbox" checked={selecionados.has(n.idExterno)} onChange={() => alternar(n.idExterno)} />}
                      </td>
                      <td className="p-2 font-medium">{n.nome}</td>
                      <td className="p-2 text-xs">{[n.whatsapp || n.telefone, n.instagram].filter(Boolean).join(" · ") || "-"}</td>
                      <td className="p-2 text-xs">{n.site ? <a className="text-indigo-700 underline" href={n.site.startsWith("http") ? n.site : `https://${n.site}`} target="_blank">tem</a> : <span className="font-semibold text-amber-700">não tem</span>}</td>
                      <td className="p-2 text-xs">{n.endereco ?? "-"}</td>
                      <td className="p-2 text-xs"><a className="text-indigo-700 underline" href={linkMaps(n)} target="_blank">Google Maps</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {temMais(estado) && (
            <button className="btn-sec" disabled={carregando} onClick={() => carregar(false)}>
              {carregando ? "Buscando..." : "Carregar mais resultados"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
