const base = {
  formatOptions: { snippetInterface: 'async-await' },
  import: ['test/integration/features/**/*.mjs']
}

export default base

export const wip = {
  ...base,
  tags: '@wip and not @skip'
}

export const noWip = {
  ...base,
  tags: 'not @skip and not @wip'
}

export const focus = {
  ...base,
  tags: '@focus'
}
