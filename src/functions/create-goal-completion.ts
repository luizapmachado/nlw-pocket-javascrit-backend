import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'

//criar interface com os dados que eu preciso receber
interface CreateGoalCompletionRequest {
  goalId: string
}

//pode usar tambem a interface toda 'request: CreateGoalCompletionRequest' ou desestruturar
export async function createGoalCompletion({
  goalId,
}: CreateGoalCompletionRequest) {
  //retorna o primeiro dia da seman
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  //retorna o ultimo dia da semana atual
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  //retorna a contagem de metas concluidas dentro da semana
  //sempre que fizer uma agregação (count, sum) precisa das um nome a ela
  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  //fazer uma common table
  const result = await db
    .with(goalCompletionCounts)
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql /*sql*/`
      COALESCE(${goalCompletionCounts.completionCount}, 0) 
      `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

  const { completionCount, desiredWeeklyFrequency } = result[0]

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already completed this week')
  }

  //inserir um objeto no banco de dados
  const insertResult = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning()

  const goalCompletion = insertResult[0]

  return { goalCompletion }
}
