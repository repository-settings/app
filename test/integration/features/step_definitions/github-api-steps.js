import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber'
import { setupServer } from 'msw/node'
import any from '@travi/any'

const server = setupServer()
export const githubToken = any.word()

BeforeAll(async function () {
  server.listen()
})

Before(function () {
  this.server = server
})

After(function () {
  server.resetHandlers()
})

AfterAll(function () {
  server.close()
})
