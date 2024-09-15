import dayjs from 'dayjs'
import { goals, goalCompletions } from './schema'
import { client, db } from '.'

//apagar dados nessa ordem pois tem chave estrangeira
async function seed() {
  await db.delete(goalCompletions)
  await db.delete(goals)

  //insert na tabela
  const result = await db
    .insert(goals)
    .values([
      { title: 'Acordar cedo', desiredWeeklyFrequency: 5 },
      { title: 'Seexercitar', desiredWeeklyFrequency: 3 },
      { title: 'Meditar', desiredWeeklyFrequency: 2 },
    ])
    .returning() //vai retornar os valores que foram salvos no banco

  //variavel que vai definir 1 dia no inicio da semana
  const startOfWeek = dayjs().startOf('week')

  await db.insert(goalCompletions).values([
    { goalId: result[0].id, createdAt: startOfWeek.toDate() },
    { goalId: result[1].id, createdAt: startOfWeek.add(1, 'day').toDate() },
  ])
}

//finally executa se der certo ou der errado, nesse caso sempre vamos fechar a conexao
seed().finally(() => {
  client.end()
})
