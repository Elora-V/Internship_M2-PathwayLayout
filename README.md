# Vue 3 project template

This template includes :

- Vue 3
- [Vuetify 3](https://vuetifyjs.com/en/components/all/)
- Typescript
- ESlint
- npm packaging configuration
- [vitest](https://vitest.dev/guide/)
- [storybook](https://storybook.js.org/docs/vue/get-started/whats-a-story)

## Files to modify for the npm packaging

This template is configured to build and publish an npm package on GitLab, following this [tutorial](https://forgemia.inra.fr/metabohub/mth/-/wikis/mth2-wp5-t3/webcomponents-npm). 

Replace 'ComponentExample' with the name of the component to publish in these files :
- lib/main.js
- package.json
- vite.config.ts

The package will be published with the GitLab CI.

## Use the package in another project

```sh
npm i -D @metabohub/component-example
```

If your project is not using vuetify, you need to import it in `src/main.ts` :
```ts
import { createApp } from 'vue'
import App from './App.vue'
import { vuetify } from "@metabohub/component-example";

createApp(App).use(vuetify).mount('#app')
```

Use the component : 
```ts
<script setup lang="ts">
import { ComponentExample } from "@metabohub/component-example";
import "@metabohub/component-example/dist/style.css";
import type { SomeType } from "@metabohub/component-example";
</script>

<template>
  <ComponentExample />
</template>
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-check

```sh
npm run type-check
```

### Compile for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

Check the coverage :
```sh
npm run coverage
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### View stories with [Storybook](https://storybook.js.org/docs/vue/get-started/whats-a-story)

```sh
npm run storybook
```
