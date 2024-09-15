import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { db } from '../db'
import { and, lte, gte, eq, sql } from 'drizzle-orm'
import { goalCompletions, goals } from '../db/schema'
import { count } from 'drizzle-orm'

dayjs.extend(weekOfYear)

export async function getWeekPendingGoals() {
  //retorna o primeiro dia da seman
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  //retorna o ultimo dia da semana atual
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  //primeiro pedaço da query
  //todas as metas criadas ate a semana atual
  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    //selecionar todas as metas em que a data de criacao for menor ou igual a semana atual
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  )

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
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  //criando query que vai usar a common table expression
  //cruzar dados com o leftJoin (pois pode ser que os registros nao existam e mesmo assim sejam retornadas), nao usamos o innerJoin pois ele nao retona caso nao exista
  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalCompletionCounts)
    .select({
      //organizar os dados
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      //fazer uma consulta sql para caso o valor seja nulo ele retorne um numero 0
      //COALESCE permite fazer um if na query caso seja null ele retorna 0 como string e por isso precisa fazer o map
      completionCount: sql /*sql*/`
      COALESCE(${goalCompletionCounts.completionCount}, 0) 
      `.mapWith(Number),
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalCompletionCounts,
      eq(goalCompletionCounts.goalId, goalsCreatedUpToWeek.id)
    )

  return { pendingGoals }
}
