import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getWeekSummary } from '../../functions/get-week-summary'

export const getWeekSummaryRoute: FastifyPluginAsyncZod = async app => {
  //nova rota para pending goals
  app.get('/summary', async () => {
    const { summary } = await getWeekSummary()

    return { summary }
  })
}
