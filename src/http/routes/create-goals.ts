import z from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

import { createGoal } from '../../functions/create-goal'

export const createGoalRoute: FastifyPluginAsyncZod = async app => {
  //para o endereco e passa a funcao que vai ser executada quando acessar a rota
  //fazer a validação com o zod se a request esta vindo com valores corretos
  app.post(
    '/goals',
    {
      schema: {
        body: z.object({
          title: z.string(),
          desiredWeeklyFrequency: z.number().int().min(1).max(7),
        }),
      },
    },
    async request => {
      //   //como fiz o parse se der erro ele nao vai deixar prosseguir
      //   const body = createGoalSchema.parse(request.body)

      //como ja foi validado no schema acima nao precisa do parse aqui
      const { title, desiredWeeklyFrequency } = request.body

      //chamada para a função criada
      await createGoal({
        title,
        desiredWeeklyFrequency,
      })
    }
  )
}
