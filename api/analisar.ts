import OpenAI from "openai"
import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage()
})

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    })
  }

  upload.single("imagem")(req, res, async (erro: any) => {
    try {
      if (erro) {
        console.error(erro)

        return res.status(400).json({
          erro: "Erro ao receber imagem"
        })
      }

      if (!req.file) {
        return res.status(400).json({
          erro: "Nenhuma imagem enviada"
        })
      }

      const imagemBase64 = req.file.buffer.toString("base64")
      const tipoImagem = req.file.mimetype

      const resposta = await openai.chat.completions.create({
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

Se não identificar alimentos, retorne:

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
                  url: `data:${tipoImagem};base64,${imagemBase64}`
                }
              }
            ]
          }
        ]
      })

      const resultado = resposta.choices[0]?.message?.content

      if (!resultado) {
        throw new Error("A IA não retornou conteúdo")
      }

      return res.status(200).json({
        resultado
      })

    } catch (erro) {
      console.error("ERRO AO ANALISAR:")
      console.error(erro)

      return res.status(500).json({
        erro: "Erro ao analisar imagem"
      })
    }
  })
}