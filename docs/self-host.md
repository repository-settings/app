# Self-Hosted App

<!--consumer-badges start -->

![node][node-badge]

<!--consumer-badges end -->

## Table of Contents

* [Deploy a Self-Hosted Instance](#deploy-a-self-hosted-instance)
  * [Install `@repository-settings/app` as a dependency of your own app (recommended)](#install-repository-settingsapp-as-a-dependency-of-your-own-app-recommended)
    * [Depend on the package from npm](#depend-on-the-package-from-npm)
    * [Example node.js app](#example-nodejs-app)
  * [Deploy a fork of this repository](#deploy-a-fork-of-this-repository)
* [Permissions & events](#permissions--events)
  * [Permissions](#permissions)
  * [Organization Permissions](#organization-permissions)
  * [Events](#events)

## Deploy a Self-Hosted Instance

Multiple options exist for deploying a self-hosted instance:

### Install `@repository-settings/app` as a dependency of your own app (recommended)

This option offers you the most flexibility

#### Depend on the package from npm

```shell
npm install @repository-settings/app
```

#### Example node.js app

```js
import {Server, Probot, ProbotOctokit} from 'probot';
import app from '@repository-settings/app';

async function start() {
  const log = getLog();
  const server = new Server({
    Probot: Probot.defaults({
      appId: process.env.APP_ID,
      privateKey: process.env.PRIVATE_KEY,
      secret: process.env.WEBHOOK_SECRET,
      Octokit: ProbotOctokit.defaults({
        baseUrl: process.env.GH_API
      }),
      log: log.child({
        name: 'repository-settings'
      })
    }),
    log: log.child({
      name: 'server'
    })
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, stopping server!');

    await server.stop();
  });

  await server.load(app);

  await server.start();
};

start();
```

### Deploy a fork of this repository

Alternatively, you can fork this repository and modify to suit your environment.

## Permissions & events

This plugin requires these **Permissions & events** for the GitHub Integration:

### Permissions

- Administration: **Read & Write**
- Contents: **Read only**
- Issues: **Read & Write**
- Single file: **Read & Write**
  - Path: `.github/settings.yml`
- Actions: **Read only**

### Organization Permissions

- Members: **Read & Write**

### Events

- Push
- Repository

[node-badge]: https://img.shields.io/node/v/@repository-settings/app?logo=node.js
