import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import multer from "multer"
import OpenAI from "openai"

dotenv.config()

const app = express()

const upload = multer({
  storage: multer.memoryStorage()
})

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

app.use(cors())
app.use(express.json())


/*
  1. IDENTIFICAR ALIMENTOS
*/

app.post(
  "/api/analisar",
  upload.single("imagem"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          erro: "Nenhuma imagem enviada"
        })
      }

      const imagemBase64 =
        req.file.buffer.toString("base64")

      const tipoImagem =
        req.file.mimetype


      const resposta =
        await openai.chat.completions.create({

          model: "openrouter/free",

          messages: [
            {
              role: "user",

              content: [

                {
                  type: "text",

                 text: `
Analise a imagem e identifique exclusivamente os alimentos sólidos visíveis nela.

Ignore:
- bebidas;
- sucos;
- água;
- refrigerantes;
- café;
- molhos;
- condimentos;
- talheres;
- pratos;
- copos;
- embalagens;
- objetos que não sejam alimentos.

Para cada alimento identificado, estime visualmente sua quantidade em gramas.

A estimativa deve considerar a quantidade aparente do alimento na imagem.

Retorne APENAS um JSON válido.
Não use markdown.
Não escreva explicações.
Não escreva texto antes ou depois do JSON.

Use EXATAMENTE esta estrutura:

{
  "alimentos": {
    "itens": [
      {
        "nome": "arroz branco",
        "peso": 180
      },
      {
        "nome": "feijão",
        "peso": 100
      }
    ]
  }
}

REGRAS:

1. A chave raiz deve ser exatamente "alimentos".
2. Dentro de "alimentos", deve existir exatamente "itens".
3. "itens" deve ser sempre um array.
4. Cada item deve possuir exatamente "nome" e "peso".
5. "nome" deve ser uma string.
6. "peso" deve ser um número inteiro em gramas.
7. Não adicione outras propriedades.
8. Não inclua bebidas.
9. Não inclua objetos.
10. Se não identificar alimentos, retorne:

{
  "alimentos": {
    "itens": []
  }
}
`
                },

                {
                  type: "image_url",

                  image_url: {
                    url:
                      `data:${tipoImagem};base64,${imagemBase64}`
                  }
                }

              ]
            }
          ]
        })


      const resultado =
        resposta.choices[0].message.content


      res.json({
        resultado
      })

    } catch (erro) {

      console.error(erro)

      res.status(500).json({
        erro: "Erro ao analisar imagem"
      })
    }
  }
)


/*
  2. CALCULAR CALORIAS
*/

app.post("/api/calorias", async (req, res) => {
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

    const conteudo = resposta.choices[0]?.message?.content

    console.log("Resposta da IA:")
    console.log(conteudo)

    if (!conteudo) {
      throw new Error("A IA não retornou conteúdo")
    }

    const resultado = JSON.parse(conteudo)

    res.json(resultado)

  } catch (erro) {

    console.error("ERRO AO CALCULAR CALORIAS:")
    console.error(erro)

    res.status(500).json({
      erro: "Erro ao calcular calorias"
    })
  }
})


/*
  SERVIDOR
*/

app.listen(3001, () => {
  console.log(
    "Servidor rodando na porta 3001"
  )
})