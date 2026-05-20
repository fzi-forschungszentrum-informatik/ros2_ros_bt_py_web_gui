# ros_bt_py_web_gui

Vue3 implementation of the `ros_bt_py` web gui.

## Project Setup

```sh
bun install
```

### Compile and Hot-Reload for Development

```sh
bun run dev
```

### Type-Check, Compile and Minify for Production

```sh
bun run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
bun lint
```

### Format with [Prettier](https://prettier.io/)

```sh
bun run format
```

## Development Setup

### ROS2 Components

This GUI requires a running instance of `ros_bt_py` for `ROS2` with a running web gui.
During development a different port will be used so it should not conflict with gui shipped with `ros_bt_py`.

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar).

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking.
