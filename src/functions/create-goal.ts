import { db } from '../db'
import { goals } from '../db/schema'

//criar interface com os dados que eu preciso receber
interface CreateGoalRequest {
  title: string
  desiredWeeklyFrequency: number
}

//pode usar tambem a interface toda 'request: CreateGoalRequest' ou desestruturar
export async function createGoal({
  title,
  desiredWeeklyFrequency,
}: CreateGoalRequest) {
  //inserir um objeto no banco de dados
  const result = await db
    .insert(goals)
    .values({
      title,
      desiredWeeklyFrequency,
    })
    .returning()

  const goal = result[0]
  //retornar um objeto com a informação dentro para permitir acrescimo de informações futuramente sem mudar a estrutura de dados
  return {
    goal,
  }
}
