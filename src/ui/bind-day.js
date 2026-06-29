import { ui } from '../lib/dom.js'
import { confirmCloseDay, reopenDay } from '../api/reflections.js'
import {
  closeCloseDayPanel,
  openCloseDayPanel,
} from './render-day-panel.js'

export function bindDayEvents() {
  ui.closeDayButton.addEventListener('click', () => {
    openCloseDayPanel()
  })

  ui.closeDayCancelBtn.addEventListener('click', () => {
    closeCloseDayPanel()
  })

  ui.closeDayConfirmBtn.addEventListener('click', () => {
    confirmCloseDay()
  })

  ui.dayClosedBadgeEl.addEventListener('click', () => {
    reopenDay()
  })
}
