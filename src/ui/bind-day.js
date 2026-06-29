import { ui } from '../lib/dom.js'
import { confirmCloseDay, reopenDay } from '../api/reflections.js'
import { safeHandler } from '../lib/errors.js'
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

  ui.closeDayConfirmBtn.addEventListener('click', safeHandler('close day', confirmCloseDay))

  ui.dayClosedBadgeEl.addEventListener('click', safeHandler('reopen day', reopenDay))
}
