import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    })
  }

  try {
    const { alimentos } = req.body

    console.log("Alimentos recebidos:")
    console.log(alimentos)

    if (!Array.isArray(alimentos)) {
      return res.status(400).json({
        erro: "Alimentos inválidos"
      })
    }

    const resposta = await openai.chat.completions.create({
      model: "openrouter/free",

      messages: [
        {
          role: "user",

          content: `
Calcule as calorias estimadas dos alimentos abaixo.

Para cada alimento:
- considere o nome;
- considere o peso em gramas;
- estime as calorias com base em valores nutricionais médios.

Retorne APENAS JSON válido.

Não use markdown.
Não use blocos de código.
Não escreva explicações.
Não escreva nenhum texto fora do JSON.

O formato OBRIGATÓRIO é:

{
  "itens": [
    {
      "nome": "arroz branco",
      "calorias": 234
    }
  ],
  "total": 234
}

Os alimentos são:

${JSON.stringify(alimentos)}
`
        }
      ]
    })

    let conteudo = resposta.choices[0]?.message?.content

    console.log("Resposta da IA:")
    console.log(conteudo)

    if (!conteudo) {
      throw new Error("A IA não retornou conteúdo")
    }

    conteudo = conteudo
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    const resultado = JSON.parse(conteudo)

    return res.status(200).json(resultado)

  } catch (erro) {
    console.error("ERRO AO CALCULAR CALORIAS:")
    console.error(erro)

    return res.status(500).json({
      erro: "Erro ao calcular calorias"
    })
  }
}