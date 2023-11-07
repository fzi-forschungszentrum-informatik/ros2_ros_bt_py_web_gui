import './assets/main.scss'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

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
  faStepForward
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
  faStepForward
)

const app = createApp(App)

app.use(createPinia())
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#root')
