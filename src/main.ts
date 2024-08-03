/*
 * Copyright 2024 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
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
  faQuestionCircle,
  faLayerGroup,
  faTree,
  faSun,
  faMoon,
  faWindowMaximize,
  faWindowRestore,
  faRoute
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
  faQuestionCircle,
  faLayerGroup,
  faTree,
  faSun,
  faMoon,
  faWindowMaximize,
  faWindowRestore,
  faRoute
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
