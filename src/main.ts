import './assets/main.scss'

import 'bootstrap'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'

import App from './App.vue'

import Notifications from '@kyvg/vue3-notification'
import velocity from 'velocity-animate'

import { createVfm } from 'vue-final-modal'
import 'vue-final-modal/style.css'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import {
  faSync,
  faCog,
  faWifi,
  faCheck,
  faPlay,
  faStop,
  faUndo,
  faPowerOff,
  faFile,
  faFolder,
  faFileUpload,
  faFileDownload,
  faSave,
  faStepForward,
  faFolderOpen,
  faFolderTree,
  faAngleDoubleLeft,
  faAngleUp,
  faAngleDown,
  faAngleDoubleRight,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faSync,
  faCog,
  faWifi,
  faCheck,
  faPlay,
  faStop,
  faUndo,
  faPowerOff,
  faFile,
  faFolder,
  faFileUpload,
  faFileDownload,
  faSave,
  faStepForward,
  faFolderOpen,
  faFolderTree,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleUp,
  faAngleDown,
  faQuestionCircle
)

const app = createApp(App)
const vfm = createVfm()

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)

app.use(pinia)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(Notifications, { velocity })
app.use(vfm)

app.mount('#root')
