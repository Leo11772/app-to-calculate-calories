import { useState } from "react"

type Alimento = {
  nome: string
  peso: number
}

type Resultado = {
  itens: {
    nome: string
    calorias: number
  }[]
  total: number
}

function App() {
  const [imagem, setImagem] = useState<File | null>(null)
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [loading, setLoading] = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  async function analisarImagem() {
    if (!imagem) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("imagem", imagem)

      const resposta = await fetch("/api/analisar", {
        method: "POST",
        body: formData
      })

      if (!resposta.ok) {
        throw new Error()
      }

      const dados = await resposta.json()
      const json = JSON.parse(dados.resultado)

      setAlimentos(json.alimentos.itens)
      setResultado(null)

    } catch (erro) {
      console.error(erro)
      alert("Não foi possível analisar a imagem.")
    } finally {
      setLoading(false)
    }
  }

  function handleImagem(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0]

    if (!arquivo) return

    setImagem(arquivo)
    setAlimentos([])
    setResultado(null)
  }

  function alterarPeso(index: number, valor: number) {
    setAlimentos(
      alimentos.map((alimento, i) =>
        i === index
          ? {
              ...alimento,
              peso: Math.max(0, alimento.peso + valor)
            }
          : alimento
      )
    )

    setResultado(null)
  }

  function definirPeso(index: number, multiplicador: number) {
    setAlimentos(
      alimentos.map((alimento, i) =>
        i === index
          ? {
              ...alimento,
              peso: Math.max(
                10,
                Math.round(alimento.peso * multiplicador)
              )
            }
          : alimento
      )
    )

    setResultado(null)
  }

  async function calcularCalorias() {
    if (!alimentos.length) return

    setCalculando(true)

    try {
      const resposta = await fetch("/api/calorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          alimentos
        })
      })

      if (!resposta.ok) {
        throw new Error()
      }

      const dados: Resultado = await resposta.json()

      setResultado(dados)

    } catch (erro) {
      console.error(erro)
      alert("Não foi possível calcular as calorias.")
    } finally {
      setCalculando(false)
    }
  }

  function novaAnalise() {
    setImagem(null)
    setAlimentos([])
    setResultado(null)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">

      {/* HEADER */}

      <header className="fixed left-0 top-0 z-30 w-full border-b border-zinc-200/70 bg-[#f7f7f5]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">

          <div className="flex items-center gap-2.5">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
              N
            </div>

            <span className="text-sm font-semibold tracking-tight">
              NutriVision
            </span>

          </div>

          <span className="hidden text-xs text-zinc-400 sm:block">
            Análise de refeições
          </span>

        </div>

      </header>


      {/* CONTEÚDO */}

      <main className="flex min-h-screen items-center justify-center px-5 pt-16">

        {!imagem ? (

          /* UPLOAD */

          <div className="w-full max-w-xl">

            <div className="mb-8 text-center">

              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                Nutrição simplificada
              </p>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Saiba o que tem
                <br />
                no seu prato.
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-500">
                Envie uma foto da sua refeição e obtenha uma estimativa
                rápida das calorias.
              </p>

            </div>


            <label
              htmlFor="imagem"
              className="group flex h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white shadow-sm transition duration-200 hover:border-zinc-500 hover:shadow-md"
            >

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl transition group-hover:scale-105">
                +
              </div>

              <p className="mt-5 text-sm font-medium">
                Adicionar foto
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                PNG, JPG ou WEBP
              </p>

              <input
                id="imagem"
                type="file"
                accept="image/*"
                onChange={handleImagem}
                className="hidden"
              />

            </label>

          </div>

        ) : (

          /* FOTO PRINCIPAL */

          <div className="w-full max-w-2xl">

            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">

              <img
                src={URL.createObjectURL(imagem)}
                alt="Refeição"
                className="h-[55vh] max-h-[520px] w-full object-cover"
              />

              <div className="flex items-center justify-between gap-4 p-5">

                <div className="min-w-0">

                  <p className="text-sm font-medium">
                    Refeição selecionada
                  </p>

                  <p className="mt-1 truncate text-xs text-zinc-400">
                    {imagem.name}
                  </p>

                </div>

                {alimentos.length === 0 && (
                  <button
                    onClick={analisarImagem}
                    disabled={loading}
                    className="shrink-0 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Analisando..." : "Analisar"}
                  </button>
                )}

              </div>

            </div>

          </div>

        )}

      </main>


      {/* MODAL DE QUANTIDADES */}

      {alimentos.length > 0 && !resultado && (

        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5">

          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-[#f7f7f5] shadow-2xl sm:max-w-lg sm:rounded-3xl">

            <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-[#f7f7f5]/95 px-5 py-5 backdrop-blur">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Etapa 2
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Confira as quantidades
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Ajuste apenas se necessário.
                  </p>

                </div>

                <button
                  onClick={novaAnalise}
                  className="text-xs font-medium text-zinc-400 transition hover:text-zinc-900"
                >
                  Nova foto
                </button>

              </div>

            </div>


            <div className="space-y-2 p-5">

              {alimentos.map((alimento, index) => (

                <div
                  key={`${alimento.nome}-${index}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-4"
                >

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-medium capitalize">
                      {alimento.nome}
                    </span>

                    <span className="text-xs text-zinc-400">
                      estimativa
                    </span>

                  </div>


                  <div className="mt-4 flex items-center justify-between">

                    <button
                      onClick={() =>
                        alterarPeso(index, -25)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-lg transition hover:bg-zinc-200"
                    >
                      −
                    </button>


                    <div className="text-center">

                      <span className="text-2xl font-semibold tracking-tight">
                        {alimento.peso}
                      </span>

                      <span className="ml-1 text-sm text-zinc-400">
                        g
                      </span>

                    </div>


                    <button
                      onClick={() =>
                        alterarPeso(index, 25)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-lg transition hover:bg-zinc-200"
                    >
                      +
                    </button>

                  </div>


                  <div className="mt-3 grid grid-cols-3 gap-1.5">

                    <button
                      onClick={() =>
                        definirPeso(index, 0.7)
                      }
                      className="rounded-lg bg-zinc-50 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100"
                    >
                      Menos
                    </button>

                    <button
                      onClick={() =>
                        definirPeso(index, 1)
                      }
                      className="rounded-lg bg-zinc-900 py-2 text-xs text-white"
                    >
                      Estimativa
                    </button>

                    <button
                      onClick={() =>
                        definirPeso(index, 1.3)
                      }
                      className="rounded-lg bg-zinc-50 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100"
                    >
                      Mais
                    </button>

                  </div>

                </div>

              ))}


              <button
                onClick={calcularCalorias}
                disabled={calculando}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >

                {calculando && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}

                {calculando
                  ? "Calculando..."
                  : "Calcular calorias"
                }

              </button>

            </div>

          </div>

        </div>

      )}


      {/* MODAL RESULTADO */}

      {resultado && (

        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-5">

          <div className="w-full overflow-hidden rounded-t-3xl bg-[#f7f7f5] shadow-2xl sm:max-w-lg sm:rounded-3xl">

            {/* TOTAL */}

            <div className="bg-zinc-900 px-6 py-8 text-white">

              <div className="flex items-center justify-between">

                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Resultado
                </p>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                  Estimativa
                </span>

              </div>

              <p className="mt-5 text-5xl font-semibold tracking-tight">
                {resultado.total}
                <span className="ml-2 text-lg font-normal text-zinc-400">
                  kcal
                </span>
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Total estimado da refeição
              </p>

            </div>


            {/* ITENS */}

            <div className="max-h-[45vh] overflow-y-auto p-5">

              <div className="space-y-1">

                {resultado.itens.map((item, index) => (

                  <div
                    key={`${item.nome}-${index}`}
                    className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-white"
                  >

                    <span className="text-sm capitalize">
                      {item.nome}
                    </span>

                    <span className="text-sm font-medium">
                      {item.calorias} kcal
                    </span>

                  </div>

                ))}

              </div>

            </div>


            {/* AÇÕES */}

            <div className="border-t border-zinc-200 p-5">

              <button
                onClick={novaAnalise}
                className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Analisar outra refeição
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default App