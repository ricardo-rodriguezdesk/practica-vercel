"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [tareas, setTareas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);

  async function peticion(metodo, url, body) {
    const inicio = performance.now();
    const opciones = { method: metodo };
    if (body) {
      opciones.headers = { "Content-Type": "application/json" };
      opciones.body = JSON.stringify(body);
    }
    const res = await fetch(url, opciones);
    const texto = await res.text();
    let data = null;
    try {
      data = texto ? JSON.parse(texto) : null;
    } catch {
      data = texto;
    }
    const ms = Math.round(performance.now() - inicio);
    setLogs((prev) =>
      [
        { hora: new Date().toLocaleTimeString(), metodo, url, body, status: res.status, ms, respuesta: data },
        ...prev,
      ].slice(0, 20)
    );
    return { res, data };
  }

  async function cargar() {
    const { res, data } = await peticion("GET", "/api/tareas");
    if (!res.ok) return setError(data?.error || "Error al cargar las tareas");
    setError("");
    setTareas(data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const { res, data } = await peticion("POST", "/api/tareas", { titulo });
    if (!res.ok) return setError(data?.error || "Error al crear la tarea");
    setTitulo("");
    cargar();
  }

  async function alternar(tarea) {
    await peticion("PUT", `/api/tareas/${tarea.id}`, { completada: !tarea.completada });
    cargar();
  }

  async function eliminar(id) {
    await peticion("DELETE", `/api/tareas/${id}`);
    cargar();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6 text-neutral-900">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-2xl font-bold">Práctica Vercel - Ricardo Rodriguez</h1>

        <form onSubmit={crear} className="mb-4 flex gap-2">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1 rounded border border-neutral-300 bg-white px-3 py-2"
          />
          <button className="rounded bg-black px-4 py-2 text-white">Agregar</button>
        </form>

        {error && <p className="mb-3 text-red-600">{error}</p>}

        <ul className="space-y-2">
          {tareas.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded bg-white px-3 py-2 shadow"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.completada}
                  onChange={() => alternar(t)}
                />
                <span className={t.completada ? "text-neutral-400 line-through" : ""}>
                  {t.titulo}
                </span>
              </label>
              <button onClick={() => eliminar(t.id)} className="text-red-600">
                Eliminar
              </button>
            </li>
          ))}
        </ul>

        {tareas.length === 0 && (
          <p className="text-neutral-500">No hay tareas todavía.</p>
        )}

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Consola de peticiones</h2>
            <button onClick={() => setLogs([])} className="text-sm text-neutral-600 underline">
              Limpiar
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto rounded bg-neutral-900 p-3 font-mono text-xs text-neutral-100">
            {logs.length === 0 && <p className="text-neutral-400">Sin peticiones todavía.</p>}
            {logs.map((l, i) => (
              <div key={i} className="mb-3 border-b border-neutral-700 pb-2">
                <p>
                  <span className="text-neutral-400">{l.hora}</span>{" "}
                  <span className="font-bold text-yellow-300">{l.metodo}</span> {l.url}{" "}
                  <span className={l.status < 400 ? "text-green-400" : "text-red-400"}>{l.status}</span>{" "}
                  <span className="text-neutral-400">{l.ms} ms</span>
                </p>
                {l.body && (
                  <pre className="mt-1 whitespace-pre-wrap text-blue-300">
                    Solicitud: {JSON.stringify(l.body, null, 2)}
                  </pre>
                )}
                <pre className="mt-1 whitespace-pre-wrap">
                  Respuesta: {l.respuesta ? JSON.stringify(l.respuesta, null, 2) : "(vacía)"}
                </pre>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}