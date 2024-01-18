const previewHeaders = {
  accept:
    "application/vnd.github.hellcat-preview+json,application/vnd.github.luke-cage-preview+json,application/vnd.github.zzzax-preview+json",
};
const fragmentBranchProtectionRule = `
fragment branchProtection on BranchProtectionRule {
  allowsDeletions
  allowsForcePushes
  creator {
    login
  }
  id
  isAdminEnforced
  requiredStatusCheckContexts
  requiredApprovingReviewCount
  requiresApprovingReviews
  requiresCodeOwnerReviews
  requiresStatusChecks
  restrictsPushes
  restrictsReviewDismissals
  dismissesStaleReviews
  pattern
}
`;

const graphqlMutationDeleteBranchProtection = `
mutation deleteBranchProtection($ruleId:ID!) {
  deleteBranchProtectionRule(input:{branchProtectionRuleId:$ruleId}) {
    clientMutationId
  }
}
`;

const graphqlQueryShowBranchProtection = `
  ${fragmentBranchProtectionRule}
  query showBranchProtection($owner:String!, $repo:String!) {
    repository(name: $repo, owner: $owner) {
      id
      name
      branchProtectionRules(first: 10) {
        totalCount
        nodes {
          ...branchProtection
        }
      }
    }
  }
`;
const graphqlMutationAddBranchProtection = `
${fragmentBranchProtectionRule}
mutation addBranchProtection($input: CreateBranchProtectionRuleInput!) {
  createBranchProtectionRule(input: $input) {
    branchProtectionRule {
      ...branchProtection
    }
  }
}

`;
const graphqlMutationUpdateBranchProtection = `
  ${fragmentBranchProtectionRule}
  mutation updateBranchProtection($input: UpdateBranchProtectionRuleInput!) {
    updateBranchProtectionRule(input: $input) {
      branchProtectionRule {
        ...branchProtection
      }
    }
  }
`;

const snakeToCamel = (str) =>
  str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", "").replace("_", ""));

const snakeToCamelMap = (mapdata) =>
  Object.keys(mapdata).reduce(
    (all, current) => ({
      ...all,
      [snakeToCamel(current)]: mapdata[current],
    }),
    {}
  );
const blacklistedAttributes = ["owner", "name", "branch", "creator"];

const blacklistBranchProtectionAttributes = (mapdata) =>
  Object.keys(mapdata)
    .filter((f) => !blacklistedAttributes.includes(f))
    .reduce((a, k) => ({ ...a, [k]: mapdata[k] }), {});

module.exports = class Branches2 {
  constructor(github, repo, settings) {
    this.github = github;
    this.repo = repo;
    this.branches = settings;
  }

  async sync() {
    const branchProtectionRulesResponse = await this.github.graphql(graphqlQueryShowBranchProtection, {
      owner: this.repo.owner,
      repo: this.repo.name,
    });
    const repositoryId = branchProtectionRulesResponse.repository.id;
    const existingBranchProtectionRules = branchProtectionRulesResponse.repository.branchProtectionRules.nodes;
    const existingBranchProtectionRulesByBranch = existingBranchProtectionRules.reduce(
      (a, c) => ({
        ...a,
        [c.pattern]: c,
      }),
      {}
    );
    return Promise.all(
      this.branches
        .filter((branch) => branch.protection !== undefined)
        .map((branch) => {
          const params = Object.assign(this.repo, { branch: branch.name });
          const rule = existingBranchProtectionRulesByBranch[branch.name];
          if (!rule) {
            Object.assign(params, branch.protection);
            return this.github.graphql(graphqlMutationAddBranchProtection, {
              input: {
                repositoryId,
                pattern: branch.name,
                ...snakeToCamelMap(blacklistBranchProtectionAttributes(params)),
              },
            });
          }
          const ruleId = rule.id;
          if (this.isEmpty(branch.protection)) {
            return this.github.graphql(graphqlMutationDeleteBranchProtection, {
              ruleId,
            });
          } else {
            Object.assign(params, branch.protection);
            return this.github.graphql(graphqlMutationUpdateBranchProtection, {
              input: {
                branchProtectionRuleId: ruleId,
                pattern: branch.name,
                ...snakeToCamelMap(blacklistBranchProtectionAttributes(params)),
              },
            }); // .updateBranchProtection(params)
          }
        })
    );
  }

  isEmpty(maybeEmpty) {
    return maybeEmpty === null || Object.keys(maybeEmpty).length === 0;
  }
};
