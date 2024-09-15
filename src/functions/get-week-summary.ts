import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'

export async function getWeekSummary() {
  //retorna o primeiro dia da seman
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  //retorna o ultimo dia da semana atual
  const lastDayOfWeek = dayjs().endOf('week').toDate()

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
  //sempre que fizer uma agregação (count, sum) precisa das um nome a ela e colocar um groupBy
  const goalsCompletedInWeek = db.$with('goal_completed_in_week').as(
    db
      .select({
        id: goalCompletions.id,
        title: goals.title,
        completedAt: goalCompletions.createdAt,
        completedAtDate: sql /* sql */`
        DATE(${goalCompletions.createdAt})`.as('completedAtDate'),
      })
      .from(goalCompletions)
      .innerJoin(goals, eq(goals.id, goalCompletions.goalId)) //quando fao innerJoin agora tenho a info das duas tabelas para fazer o select
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
      .orderBy(desc(goalCompletions.createdAt))
  )

  //pegar dados da query goalsCompletedInWeek e agrupar pela data
  // no sql fazer a agregação (pegar uma lista e retornar em formato json) em json
  const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
    db
      .select({
        completedAtDate: goalsCompletedInWeek.completedAtDate,
        completions: sql /* sql */`
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ${goalsCompletedInWeek.id},
                        'title', ${goalsCompletedInWeek.title},
                        'completedAt', ${goalsCompletedInWeek.completedAt}
                    )
                )
            `.as('completions'),
      })
      .from(goalsCompletedInWeek)
      .groupBy(goalsCompletedInWeek.completedAtDate)
      .orderBy(desc(goalsCompletedInWeek.completedAtDate))
  )

  //Record == objeto no typescript
  //{}[] -> significa que é um array de objeto
  type GoalsPerDay = Record<
    string,
    {
      id: string
      title: string
      completedAt: string
    }[]
  >

  const result = await db
    .with(goalsCreatedUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
    .select({
      //total de metas concluidas
      completed:
        sql /*sql*/`(SELECT COUNT(*) FROM ${goalsCompletedInWeek})`.mapWith(
          Number
        ),
      total:
        sql /*sql*/`(SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})`.mapWith(
          Number
        ),
      //fazendo uma agragação passando a chave e o valor dentro do json agregate e retorna apenas 1 objeto e nao a quantidade de objetos retornados em goalsCompletedByWeekDay
      goalsPerDay: sql /*sql*/<GoalsPerDay>`
            JSON_OBJECT_AGG(
                ${goalsCompletedByWeekDay.completedAtDate},
                ${goalsCompletedByWeekDay.completions}
            )
        `,
    })
    .from(goalsCompletedByWeekDay)

  return {
    summary: result[0],
  }
}
