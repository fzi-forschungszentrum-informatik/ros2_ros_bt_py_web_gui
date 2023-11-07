# ros_bt_py_web_gui

React implementation of the `ros_bt_py` web gui.
This implementation will be replace with a [vue gui](https://ids-git.fzi.de/ros2/ros_bt_py/ros_bt_py_web_gui_vue) in the future.

## Project Setup

```sh
yarn install
```

### Compile and Hot-Reload for Development

```sh
yarn dev --host
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

### Format with [Prettier](https://prettier.io/)

```sh
yarn format
```

## Development Setup

### ROS2 Components

This GUI requires a running instance of `ros_bt_py` for `ROS2` with a running web gui.
During development a different port will be used so it should not conflict with gui shipped with `ros_bt_py`.
