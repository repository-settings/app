export default async function findTeam (github, org, slug) {
  const { data } = await github.request('GET /orgs/{org}/teams/{team_slug}', { org, team_slug: slug })

  return data
}
