var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/deepmerge/dist/cjs.js
var require_cjs = __commonJS({
  "node_modules/deepmerge/dist/cjs.js"(exports, module2) {
    "use strict";
    var isMergeableObject = function isMergeableObject2(value) {
      return isNonNullObject(value) && !isSpecial(value);
    };
    function isNonNullObject(value) {
      return !!value && typeof value === "object";
    }
    function isSpecial(value) {
      var stringValue = Object.prototype.toString.call(value);
      return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
    }
    var canUseSymbol = typeof Symbol === "function" && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
    function isReactElement(value) {
      return value.$$typeof === REACT_ELEMENT_TYPE;
    }
    function emptyTarget(val) {
      return Array.isArray(val) ? [] : {};
    }
    function cloneUnlessOtherwiseSpecified(value, options) {
      return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
    }
    function defaultArrayMerge(target, source, options) {
      return target.concat(source).map(function(element) {
        return cloneUnlessOtherwiseSpecified(element, options);
      });
    }
    function getMergeFunction(key, options) {
      if (!options.customMerge) {
        return deepmerge;
      }
      var customMerge = options.customMerge(key);
      return typeof customMerge === "function" ? customMerge : deepmerge;
    }
    function getEnumerableOwnPropertySymbols(target) {
      return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
        return target.propertyIsEnumerable(symbol);
      }) : [];
    }
    function getKeys(target) {
      return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
    }
    function propertyIsOnObject(object, property) {
      try {
        return property in object;
      } catch (_) {
        return false;
      }
    }
    function propertyIsUnsafe(target, key) {
      return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
    }
    function mergeObject(target, source, options) {
      var destination = {};
      if (options.isMergeableObject(target)) {
        getKeys(target).forEach(function(key) {
          destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
        });
      }
      getKeys(source).forEach(function(key) {
        if (propertyIsUnsafe(target, key)) {
          return;
        }
        if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
          destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
        } else {
          destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
        }
      });
      return destination;
    }
    function deepmerge(target, source, options) {
      options = options || {};
      options.arrayMerge = options.arrayMerge || defaultArrayMerge;
      options.isMergeableObject = options.isMergeableObject || isMergeableObject;
      options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
      var sourceIsArray = Array.isArray(source);
      var targetIsArray = Array.isArray(target);
      var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
      if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
      } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
      } else {
        return mergeObject(target, source, options);
      }
    }
    deepmerge.all = function deepmergeAll(array, options) {
      if (!Array.isArray(array)) {
        throw new Error("first argument should be an array");
      }
      return array.reduce(function(prev, next) {
        return deepmerge(prev, next, options);
      }, {});
    };
    var deepmerge_1 = deepmerge;
    module2.exports = deepmerge_1;
  }
});

// index.js
var settings_exports = {};
__export(settings_exports, {
  default: () => settings_default
});
module.exports = __toCommonJS(settings_exports);

// lib/mergeArrayByName.js
var import_deepmerge = __toESM(require_cjs(), 1);
function findMatchingIndex(sourceItem, target) {
  if (Object.prototype.hasOwnProperty.call(sourceItem, "name")) {
    return target.filter((targetItem) => Object.prototype.hasOwnProperty.call(targetItem, "name")).findIndex((targetItem) => sourceItem.name === targetItem.name);
  }
}
function mergeByName(target, source, options) {
  const destination = target.slice();
  source.forEach((sourceItem) => {
    const matchingIndex = findMatchingIndex(sourceItem, target);
    if (matchingIndex > -1) {
      destination[matchingIndex] = (0, import_deepmerge.default)(target[matchingIndex], sourceItem, options);
    } else {
      destination.push(sourceItem);
    }
  });
  return destination;
}

// lib/plugins/repository.js
var enableAutomatedSecurityFixes = ({ github, settings, enabled }) => {
  if (enabled === void 0) {
    return Promise.resolve();
  }
  const args = {
    owner: settings.owner,
    repo: settings.repo,
    mediaType: {
      previews: ["london"]
    }
  };
  const methodName = enabled ? "enableAutomatedSecurityFixes" : "disableAutomatedSecurityFixes";
  return github.repos[methodName](args);
};
var enableVulnerabilityAlerts = ({ github, settings, enabled }) => {
  if (enabled === void 0) {
    return Promise.resolve();
  }
  const args = {
    owner: settings.owner,
    repo: settings.repo,
    mediaType: {
      previews: ["dorian"]
    }
  };
  const methodName = enabled ? "enableVulnerabilityAlerts" : "disableVulnerabilityAlerts";
  return github.repos[methodName](args);
};
var Repository = class {
  constructor(github, repo, settings) {
    this.github = github;
    this.settings = Object.assign({ mediaType: { previews: ["baptiste"] } }, settings, repo);
    this.topics = this.settings.topics;
    delete this.settings.topics;
    this.enableVulnerabilityAlerts = this.settings.enable_vulnerability_alerts;
    delete this.settings.enable_vulnerability_alerts;
    this.enableAutomatedSecurityFixes = this.settings.enable_automated_security_fixes;
    delete this.settings.enable_automated_security_fixes;
  }
  sync() {
    this.settings.name = this.settings.name || this.settings.repo;
    return this.github.repos.update(this.settings).then(() => {
      if (this.topics) {
        return this.github.repos.replaceAllTopics({
          owner: this.settings.owner,
          repo: this.settings.repo,
          names: this.topics.split(/\s*,\s*/),
          mediaType: {
            previews: ["mercy"]
          }
        });
      }
    }).then(() => enableVulnerabilityAlerts({ enabled: this.enableVulnerabilityAlerts, ...this })).then(() => enableAutomatedSecurityFixes({ enabled: this.enableAutomatedSecurityFixes, ...this }));
  }
};

// lib/plugins/diffable.js
var Diffable = class {
  constructor(github, repo, entries) {
    this.github = github;
    this.repo = repo;
    this.entries = entries;
  }
  sync() {
    if (this.entries) {
      return this.find().then((existingRecords) => {
        const changes = [];
        this.entries.forEach((attrs) => {
          const existing = existingRecords.find((record) => {
            return this.comparator(record, attrs);
          });
          if (!existing) {
            changes.push(this.add(attrs));
          } else if (this.changed(existing, attrs)) {
            changes.push(this.update(existing, attrs));
          }
        });
        existingRecords.forEach((x) => {
          if (!this.entries.find((y) => this.comparator(x, y))) {
            changes.push(this.remove(x));
          }
        });
        return Promise.all(changes);
      });
    }
  }
};

// lib/plugins/labels.js
var previewHeaders = { accept: "application/vnd.github.symmetra-preview+json" };
var Labels = class extends Diffable {
  constructor(...args) {
    super(...args);
    if (this.entries) {
      this.entries.forEach((label) => {
        if (label.color) {
          label.color = String(label.color).replace(/^#/, "");
          if (label.color.length < 6) {
            label.color.padStart(6, "0");
          }
        }
      });
    }
  }
  find() {
    const options = this.github.issues.listLabelsForRepo.endpoint.merge(this.wrapAttrs({ per_page: 100 }));
    return this.github.paginate(options);
  }
  comparator(existing, attrs) {
    return existing.name === attrs.name;
  }
  changed(existing, attrs) {
    return "new_name" in attrs || existing.color !== attrs.color || existing.description !== attrs.description;
  }
  update(existing, attrs) {
    return this.github.issues.updateLabel(this.wrapAttrs(attrs));
  }
  add(attrs) {
    return this.github.issues.createLabel(this.wrapAttrs(attrs));
  }
  remove(existing) {
    return this.github.issues.deleteLabel(this.wrapAttrs({ name: existing.name }));
  }
  wrapAttrs(attrs) {
    return Object.assign({}, attrs, this.repo, { headers: previewHeaders });
  }
};

// lib/plugins/collaborators.js
var Collaborators = class extends Diffable {
  constructor(...args) {
    super(...args);
    if (this.entries) {
      this.entries.forEach((collaborator) => {
        collaborator.username = collaborator.username.toLowerCase();
      });
    }
  }
  find() {
    return this.github.repos.listCollaborators({ repo: this.repo.repo, owner: this.repo.owner, affiliation: "direct" }).then((res) => {
      return res.data.map((user) => {
        return {
          username: user.login.toLowerCase(),
          permission: user.permissions.admin && "admin" || user.permissions.push && "push" || user.permissions.pull && "pull"
        };
      });
    });
  }
  comparator(existing, attrs) {
    return existing.username === attrs.username;
  }
  changed(existing, attrs) {
    return existing.permission !== attrs.permission;
  }
  update(existing, attrs) {
    return this.add(attrs);
  }
  add(attrs) {
    return this.github.repos.addCollaborator(Object.assign({}, attrs, this.repo));
  }
  remove(existing) {
    return this.github.repos.removeCollaborator(Object.assign({ username: existing.username }, this.repo));
  }
};

// lib/plugins/teams.js
var teamRepoEndpoint = "/teams/:team_id/repos/:owner/:repo";
var Teams = class extends Diffable {
  find() {
    return this.github.repos.listTeams(this.repo).then((res) => res.data);
  }
  comparator(existing, attrs) {
    return existing.slug === attrs.name;
  }
  changed(existing, attrs) {
    return existing.permission !== attrs.permission;
  }
  update(existing, attrs) {
    return this.github.request(`PUT ${teamRepoEndpoint}`, this.toParams(existing, attrs));
  }
  async add(attrs) {
    const { data: existing } = await this.github.request("GET /orgs/:org/teams/:team_slug", {
      org: this.repo.owner,
      team_slug: attrs.name
    });
    return this.github.request(`PUT ${teamRepoEndpoint}`, this.toParams(existing, attrs));
  }
  remove(existing) {
    return this.github.request(`DELETE ${teamRepoEndpoint}`, {
      team_id: existing.id,
      ...this.repo,
      org: this.repo.owner
    });
  }
  toParams(existing, attrs) {
    return {
      team_id: existing.id,
      owner: this.repo.owner,
      repo: this.repo.repo,
      org: this.repo.owner,
      permission: attrs.permission
    };
  }
};

// lib/plugins/milestones.js
var Milestones = class extends Diffable {
  constructor(...args) {
    super(...args);
    if (this.entries) {
      this.entries.forEach((milestone) => {
        if (milestone.due_on) {
          delete milestone.due_on;
        }
      });
    }
  }
  find() {
    const options = this.github.issues.listMilestones.endpoint.merge(Object.assign({ per_page: 100, state: "all" }, this.repo));
    return this.github.paginate(options);
  }
  comparator(existing, attrs) {
    return existing.title === attrs.title;
  }
  changed(existing, attrs) {
    return existing.description !== attrs.description || existing.state !== attrs.state;
  }
  update(existing, attrs) {
    const { owner, repo } = this.repo;
    return this.github.issues.updateMilestone(Object.assign({ milestone_number: existing.number }, attrs, { owner, repo }));
  }
  add(attrs) {
    const { owner, repo } = this.repo;
    return this.github.issues.createMilestone(Object.assign({}, attrs, { owner, repo }));
  }
  remove(existing) {
    const { owner, repo } = this.repo;
    return this.github.issues.deleteMilestone(Object.assign({ milestone_number: existing.number }, { owner, repo }));
  }
};

// lib/plugins/branches.js
var previewHeaders2 = {
  accept: "application/vnd.github.hellcat-preview+json,application/vnd.github.luke-cage-preview+json,application/vnd.github.zzzax-preview+json"
};
var Branches = class {
  constructor(github, repo, settings) {
    this.github = github;
    this.repo = repo;
    this.branches = settings;
  }
  sync() {
    return Promise.all(this.branches.filter((branch) => branch.protection !== void 0).map((branch) => {
      const params = Object.assign(this.repo, { branch: branch.name });
      if (this.isEmpty(branch.protection)) {
        return this.github.repos.deleteBranchProtection(params);
      } else {
        Object.assign(params, branch.protection, { headers: previewHeaders2 });
        return this.github.repos.updateBranchProtection(params);
      }
    }));
  }
  isEmpty(maybeEmpty) {
    return maybeEmpty === null || Object.keys(maybeEmpty).length === 0;
  }
};

// lib/settings.js
var Settings = class {
  static sync(github, repo, config) {
    return new Settings(github, repo, config).update();
  }
  constructor(github, repo, config) {
    this.github = github;
    this.repo = repo;
    this.config = config;
  }
  update() {
    return Promise.all(Object.entries(this.config).map(([section, config]) => {
      const debug = { repo: this.repo };
      debug[section] = config;
      const Plugin = Settings.PLUGINS[section];
      return new Plugin(this.github, this.repo, config).sync();
    }));
  }
};
Settings.FILE_NAME = ".github/settings.yml";
Settings.PLUGINS = {
  repository: Repository,
  labels: Labels,
  collaborators: Collaborators,
  teams: Teams,
  milestones: Milestones,
  branches: Branches
};

// index.js
var settings_default = (robot, _, Settings2 = Settings) => {
  async function syncSettings(context, repo = context.repo()) {
    const config = await context.config("settings.yml", {}, { arrayMerge: mergeByName });
    return Settings2.sync(context.octokit, repo, config);
  }
  robot.on("push", async (context) => {
    const { payload } = context;
    const { repository } = payload;
    const defaultBranch = payload.ref === "refs/heads/" + repository.default_branch;
    if (!defaultBranch) {
      robot.log.debug("Not working on the default branch, returning...");
      return;
    }
    const settingsModified = payload.commits.find((commit) => {
      return commit.added.includes(Settings2.FILE_NAME) || commit.modified.includes(Settings2.FILE_NAME);
    });
    if (!settingsModified) {
      robot.log.debug(`No changes in '${Settings2.FILE_NAME}' detected, returning...`);
      return;
    }
    return syncSettings(context);
  });
  robot.on("repository.edited", async (context) => {
    const { payload } = context;
    const { changes, repository } = payload;
    if (!Object.prototype.hasOwnProperty.call(changes, "default_branch")) {
      robot.log.debug("Repository configuration was edited but the default branch was not affected, returning...");
      return;
    }
    robot.log.debug(`Default branch changed from '${changes.default_branch.from}' to '${repository.default_branch}'`);
    return syncSettings(context);
  });
  robot.on("repository.created", async (context) => {
    return syncSettings(context);
  });
};
