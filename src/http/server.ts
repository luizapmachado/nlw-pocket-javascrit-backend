import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { createGoalRoute } from './routes/create-goals'
import { createCompletionRoute } from './routes/create-completion'
import { createPendingGoalsRoute } from './routes/get-pending-goals'
import { getWeekSummaryRoute } from './routes/get-week-summary'
import fastifyCors from '@fastify/cors'

const app = fastify().withTypeProvider<ZodTypeProvider>()

//configuracao do cors para qualquer frontend conseguir acessar o backend (em prod colocar a url do frontend ao inves de *)
app.register(fastifyCors, {
  origin: '*',
})

//fazendo a validação com a biblioteca especifica do zod
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

//registar plugin com as rotas criadas
app.register(createGoalRoute)
app.register(createCompletionRoute)
app.register(createPendingGoalsRoute)
app.register(getWeekSummaryRoute)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
