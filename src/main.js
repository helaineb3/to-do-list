import './style.css'
import { supabase } from './supabase.js'
import {
  addDays,
  addMonths,
  formatDayLabel,
  formatDayNumber,
  formatMonthLabel,
  formatWeekRange,
  getMonthGridDates,
  getWeekDates,
  getWeekdayLabels,
  isSameMonth,
  startOfWeek,
  todayISO,
} from './dates.js'

let todos = []
let dayReflections = {}
let user = null
let editingCategoryId = null
let selectedDate = todayISO()
let weekStart = startOfWeek(selectedDate)
let calendarViewMode = 'week'
let showCloseDayPanel = false

const form = document.getElementById('todo-form')
const input = document.getElementById('todo-input')
const list = document.getElementById('todo-list')
const errorEl = document.getElementById('todo-error')
const authUserSection = document.getElementById('todo-auth-user')
const authEmailEl = document.getElementById('todo-auth-email')
const signOutButton = document.getElementById('todo-sign-out-button')
const authSection = document.getElementById('todo-auth-section')
const signInForm = document.getElementById('todo-sign-in-form')
const signUpForm = document.getElementById('todo-sign-up-form')
const signInTab = document.getElementById('todo-auth-tab-sign-in')
const signUpTab = document.getElementById('todo-auth-tab-sign-up')
const calendarDaysEl = document.getElementById('calendar-days')
const calendarWeekdaysEl = document.getElementById('calendar-weekdays')
const calendarRangeEl = document.getElementById('calendar-range')
const calendarPrevBtn = document.getElementById('calendar-prev')
const calendarNextBtn = document.getElementById('calendar-next')
const calendarViewTabs = document.querySelectorAll('[data-calendar-view]')
const dayPanelTitleEl = document.getElementById('day-panel-title')
const dayClosedBadgeEl = document.getElementById('day-closed-badge')
const dayReflectionDisplayEl = document.getElementById('day-reflection-display')
const dayReflectionTextEl = document.getElementById('day-reflection-text')
const closeDayButton = document.getElementById('close-day-button')
const closeDayPanel = document.getElementById('close-day-panel')
const closeDayReflectionInput = document.getElementById('close-day-reflection')
const closeDayPushSection = document.getElementById('close-day-push-section')
const closeDayPushList = document.getElementById('close-day-push-list')
const closeDayConfirmBtn = document.getElementById('close-day-confirm')
const closeDayCancelBtn = document.getElementById('close-day-cancel')

const DELETE_ICON = `
  <svg class="todo-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M9 10v7" />
    <path d="M15 10v7" />
    <path d="M5 6l1 14h12l1-14" />
  </svg>
`

const CATEGORY_ICON = `
  <svg class="todo-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
    <path d="M4 7h7l2 2h9v10H4z" />
    <path d="M4 7V5h6l2 2" />
  </svg>
`

const STARTER_CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health']

const COMPLETION_STICKERS = [
  { label: 'A+', variant: 'red', rotate: -10 },
  { label: '⭐', variant: 'gold', rotate: 8 },
  { label: '🍎', variant: 'green', rotate: -6 },
  { label: '👍', variant: 'blue', rotate: 12 },
  { label: '✨', variant: 'purple', rotate: -14 },
  { label: '💯', variant: 'pink', rotate: 6 },
  { label: 'GREAT!', variant: 'yellow', rotate: -8 },
  { label: '🌟', variant: 'gold', rotate: 10 },
]

let userCategories = []
let recentlyCompletedId = null

const CATEGORY_CLASS_MAP = {
  work: 'todo-item-category--work',
  personal: 'todo-item-category--personal',
  shopping: 'todo-item-category--shopping',
  health: 'todo-item-category--health',
}

function getCategoryClass(category) {
  const slug = category.trim().toLowerCase()
  return CATEGORY_CLASS_MAP[slug] || 'todo-item-category--custom'
}

function renderCategoryBadge(category) {
  return `<span class="todo-item-category ${getCategoryClass(category)}">${escapeHtml(category)}</span>`
}

function renderCompletionSticker(todoId) {
  const sticker = COMPLETION_STICKERS[todoId % COMPLETION_STICKERS.length]
  const isNew = recentlyCompletedId === todoId
  return `
    <span
      class="todo-sticker todo-sticker--${sticker.variant}${isNew ? ' todo-sticker--new' : ''}"
      style="--sticker-rotate: ${sticker.rotate}deg"
      aria-hidden="true"
    >${sticker.label}</span>
  `
}

function showError(message) {
  errorEl.textContent = message
  errorEl.hidden = false
}

function clearError() {
  errorEl.textContent = ''
  errorEl.hidden = true
}

function escapeHtml(text) {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}

function isAnonymousUser(currentUser) {
  return currentUser?.is_anonymous === true || !currentUser?.email
}

function isDayClosed(dateStr) {
  return Boolean(dayReflections[dateStr])
}

function todosForDay(dateStr) {
  return todos
    .filter((todo) => todo.day_date === dateStr)
    .sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return new Date(a.created_at) - new Date(b.created_at)
    })
}

function nextSortOrderForDay(dateStr) {
  const dayTodos = todosForDay(dateStr)
  if (dayTodos.length === 0) return 1
  return Math.max(...dayTodos.map((todo) => todo.sort_order ?? 0)) + 1
}

function normalizeDate(dateVal) {
  if (!dateVal) return dateVal
  return String(dateVal).slice(0, 10)
}

function updateAuthUI() {
  const isEmailUser = user && !isAnonymousUser(user)

  authUserSection.hidden = !isEmailUser
  authSection.hidden = isEmailUser

  if (isEmailUser) {
    authEmailEl.textContent = user.email
  }
}

function showAuthTab(tab) {
  const isSignIn = tab === 'sign-in'
  signInTab.classList.toggle('is-active', isSignIn)
  signUpTab.classList.toggle('is-active', !isSignIn)
  signInForm.hidden = !isSignIn
  signUpForm.hidden = isSignIn
}

function renderCategoryOptions(todo) {
  return userCategories
    .map((category) => {
      const isActive = todo.category === category.name
      const categoryClass = getCategoryClass(category.name)
      return `
        <div class="todo-category-row">
          <button
            type="button"
            class="todo-category-option ${categoryClass}${isActive ? ' is-active' : ''}"
            data-category-value="${escapeHtml(category.name)}"
          >${escapeHtml(category.name)}</button>
          <button
            type="button"
            class="todo-category-delete"
            data-category-id="${category.id}"
            aria-label="Delete ${escapeHtml(category.name)} category"
          >×</button>
        </div>
      `
    })
    .join('')
}

function renderTodos() {
  const dayTodos = todosForDay(selectedDate)
  const dayClosed = isDayClosed(selectedDate)

  list.innerHTML = dayTodos
    .map((todo) => {
      const completeClass = todo.is_complete ? ' is-complete' : ''
      const completeLabel = todo.is_complete ? 'Mark incomplete' : 'Mark complete'
      const checkMark = todo.is_complete ? '✓' : ''
      const isEditingCategory = editingCategoryId === todo.id
      const categoryMarkup = todo.category ? renderCategoryBadge(todo.category) : ''

      const categoryPopover = isEditingCategory
        ? `
          <div class="todo-category-popover" role="dialog" aria-label="Choose category">
            <p class="todo-category-popover-label">Categories</p>
            <div class="todo-category-options">${renderCategoryOptions(todo)}</div>
            <div class="todo-category-add">
              <input
                type="text"
                class="todo-category-new-input"
                data-category-new-input="${todo.id}"
                placeholder="New category"
                aria-label="New category"
              />
              <button
                type="button"
                class="todo-category-add-button"
                data-category-add="${todo.id}"
              >Add</button>
            </div>
          </div>
        `
        : ''

      const contentClass = dayClosed ? 'todo-item-content' : 'todo-item-content todo-item-drag-zone'
      const stickerMarkup = todo.is_complete ? renderCompletionSticker(todo.id) : ''

      return `
        <li class="todo-item${completeClass}${dayClosed ? ' is-day-closed' : ''}" data-id="${todo.id}">
          <button
            type="button"
            class="todo-complete-button"
            aria-label="${completeLabel}"
            aria-pressed="${todo.is_complete}"
            ${dayClosed ? 'disabled' : ''}
          >${checkMark}</button>
          <div
            class="${contentClass}"
            ${dayClosed ? '' : 'draggable="true" title="Drag to reorder"'}
          >
            ${categoryMarkup}
            <span class="todo-item-text">${escapeHtml(todo.text)}</span>
          </div>
          ${stickerMarkup}
          <div class="todo-item-actions">
            <div class="todo-category-anchor">
              <button
                type="button"
                class="todo-icon-button todo-category-button"
                aria-label="${todo.category ? 'Edit category' : 'Add category'}"
                aria-expanded="${isEditingCategory}"
                ${dayClosed ? 'disabled' : ''}
              >${CATEGORY_ICON}</button>
              ${categoryPopover}
            </div>
            <button type="button" class="todo-icon-button todo-delete-button" aria-label="Delete todo" ${dayClosed ? 'disabled' : ''}>${DELETE_ICON}</button>
          </div>
        </li>
      `
    })
    .join('')

  if (editingCategoryId) {
    const newCategoryInput = list.querySelector(`[data-category-new-input="${editingCategoryId}"]`)
    if (newCategoryInput) newCategoryInput.focus()
  }

  recentlyCompletedId = null
}

function moveDraggingTodoBefore(targetItem, clientY) {
  const dragging = list.querySelector('.todo-item.is-dragging')
  if (!dragging || !targetItem || dragging === targetItem) return

  const rect = targetItem.getBoundingClientRect()
  const insertBefore = clientY < rect.top + rect.height / 2

  if (insertBefore) {
    list.insertBefore(dragging, targetItem)
  } else {
    list.insertBefore(dragging, targetItem.nextSibling)
  }
}

async function persistTodoOrderFromDom() {
  const orderedIds = [...list.querySelectorAll('.todo-item')].map((item) => Number(item.dataset.id))

  orderedIds.forEach((id, index) => {
    const todo = todos.find((t) => t.id === id)
    if (todo) todo.sort_order = index + 1
  })

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('todos').update({ sort_order: index + 1 }).eq('id', id)
    )
  )

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    console.error('Failed to reorder todos:', failed.error.message)
    showError(`Could not reorder todos: ${failed.error.message}`)
    await loadCalendarData()
    return false
  }

  return true
}

function getCalendarRange() {
  if (calendarViewMode === 'day') {
    return { start: selectedDate, end: selectedDate }
  }

  if (calendarViewMode === 'week') {
    return { start: weekStart, end: addDays(weekStart, 6) }
  }

  const monthDates = getMonthGridDates(selectedDate)
  return { start: monthDates[0], end: monthDates[monthDates.length - 1] }
}

function renderCalendarDayButton(dateStr, { monthMode = false } = {}) {
  const dayTodos = todosForDay(dateStr)
  const openCount = dayTodos.filter((todo) => !todo.is_complete).length
  const doneCount = dayTodos.length - openCount
  const isSelected = dateStr === selectedDate
  const isClosed = isDayClosed(dateStr)
  const isToday = dateStr === todayISO()
  const outsideMonth = monthMode && !isSameMonth(dateStr, selectedDate)

  const label = monthMode ? formatDayNumber(dateStr) : formatDayLabel(dateStr)
  const countsMarkup = monthMode
    ? openCount > 0
      ? `<span class="calendar-day-open">${openCount} open</span>`
      : ''
    : `
      <span class="calendar-day-counts">
        <span class="calendar-day-open">${openCount} open</span>
        <span class="calendar-day-done">${doneCount} done</span>
      </span>
    `

  return `
    <button
      type="button"
      class="calendar-day${monthMode ? ' calendar-day--month' : ''}${isSelected ? ' is-selected' : ''}${isClosed ? ' is-closed' : ''}${isToday ? ' is-today' : ''}${outsideMonth ? ' is-outside-month' : ''}"
      data-date="${dateStr}"
      aria-pressed="${isSelected}"
      aria-label="${formatDayLabel(dateStr)}"
    >
      <span class="calendar-day-label">${label}</span>
      ${countsMarkup}
    </button>
  `
}

function renderCalendarNav() {
  let label = ''
  let prevLabel = 'Previous'
  let nextLabel = 'Next'

  if (calendarViewMode === 'day') {
    label = formatDayLabel(selectedDate)
    prevLabel = 'Previous day'
    nextLabel = 'Next day'
  } else if (calendarViewMode === 'week') {
    label = formatWeekRange(weekStart)
    prevLabel = 'Previous week'
    nextLabel = 'Next week'
  } else {
    label = formatMonthLabel(selectedDate)
    prevLabel = 'Previous month'
    nextLabel = 'Next month'
  }

  calendarRangeEl.textContent = label
  calendarPrevBtn.setAttribute('aria-label', prevLabel)
  calendarNextBtn.setAttribute('aria-label', nextLabel)
}

function updateViewTabs() {
  calendarViewTabs.forEach((tab) => {
    const isActive = tab.dataset.calendarView === calendarViewMode
    tab.classList.toggle('is-active', isActive)
    tab.setAttribute('aria-selected', isActive)
  })
}

function renderCalendar() {
  renderCalendarNav()
  updateViewTabs()

  if (calendarViewMode === 'day') {
    calendarWeekdaysEl.hidden = true
    calendarDaysEl.hidden = true
    calendarDaysEl.innerHTML = ''
    return
  }

  calendarDaysEl.hidden = false

  if (calendarViewMode === 'week') {
    calendarWeekdaysEl.hidden = true
    calendarDaysEl.className = 'calendar-days calendar-days--week'
    calendarDaysEl.innerHTML = getWeekDates(weekStart)
      .map((dateStr) => renderCalendarDayButton(dateStr))
      .join('')
    return
  }

  calendarWeekdaysEl.hidden = false
  calendarWeekdaysEl.innerHTML = getWeekdayLabels()
    .map((weekday) => `<span class="calendar-weekday">${weekday}</span>`)
    .join('')

  calendarDaysEl.className = 'calendar-days calendar-days--month'
  calendarDaysEl.innerHTML = getMonthGridDates(selectedDate)
    .map((dateStr) => renderCalendarDayButton(dateStr, { monthMode: true }))
    .join('')
}

function navigateCalendar(direction) {
  if (calendarViewMode === 'day') {
    selectedDate = addDays(selectedDate, direction)
  } else if (calendarViewMode === 'week') {
    selectedDate = addDays(selectedDate, direction * 7)
    weekStart = startOfWeek(selectedDate)
  } else {
    selectedDate = addMonths(selectedDate, direction)
    weekStart = startOfWeek(selectedDate)
  }

  showCloseDayPanel = false
  editingCategoryId = null
  loadCalendarData()
}

function setCalendarViewMode(mode) {
  if (calendarViewMode === mode) return

  calendarViewMode = mode
  weekStart = startOfWeek(selectedDate)
  showCloseDayPanel = false
  editingCategoryId = null
  loadCalendarData()
}

function renderDayPanel() {
  const closed = isDayClosed(selectedDate)
  const reflection = dayReflections[selectedDate]

  dayPanelTitleEl.textContent = formatDayLabel(selectedDate)
  dayClosedBadgeEl.hidden = !closed
  closeDayButton.hidden = closed || showCloseDayPanel
  form.hidden = closed || showCloseDayPanel
  list.hidden = showCloseDayPanel
  closeDayPanel.hidden = !showCloseDayPanel || closed

  if (closed && reflection) {
    dayReflectionDisplayEl.hidden = false
    dayReflectionTextEl.textContent = reflection.reflection
  } else {
    dayReflectionDisplayEl.hidden = true
    dayReflectionTextEl.textContent = ''
  }

  renderTodos()
}

function renderUI() {
  renderCalendar()
  renderDayPanel()
}

function selectDate(dateStr) {
  selectedDate = dateStr
  weekStart = startOfWeek(dateStr)
  showCloseDayPanel = false
  editingCategoryId = null

  const { start, end } = getCalendarRange()
  if (dateStr < start || dateStr > end) {
    loadCalendarData()
  } else {
    renderUI()
  }
}

function openCloseDayPanel() {
  if (isDayClosed(selectedDate)) return

  const incompleteTodos = todosForDay(selectedDate).filter((todo) => !todo.is_complete)

  closeDayReflectionInput.value = dayReflections[selectedDate]?.reflection || ''

  if (incompleteTodos.length > 0) {
    closeDayPushSection.hidden = false
    closeDayPushList.innerHTML = incompleteTodos
      .map((todo) => `
        <li class="close-day-push-item">
          <label class="close-day-push-label">
            <input type="checkbox" class="close-day-push-checkbox" value="${todo.id}" checked />
            <span>${escapeHtml(todo.text)}</span>
          </label>
        </li>
      `)
      .join('')
  } else {
    closeDayPushSection.hidden = true
    closeDayPushList.innerHTML = ''
  }

  showCloseDayPanel = true
  renderDayPanel()
  closeDayReflectionInput.focus()
}

function closeCloseDayPanel() {
  showCloseDayPanel = false
  renderDayPanel()
}

async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Failed to get session:', error.message)
    showError(`Could not get session: ${error.message}`)
    return false
  }

  if (session) {
    user = session.user
    return true
  }

  const { data, error: signInError } = await supabase.auth.signInAnonymously()

  if (signInError) {
    console.error('Failed to sign in anonymously:', signInError.message)
    showError(`Could not sign in: ${signInError.message}`)
    return false
  }

  user = data.user
  return true
}

async function loadUserCategories() {
  const { data, error } = await supabase
    .from('user_categories')
    .select('id, name, sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load categories:', error.message)
    showError(`Could not load categories: ${error.message}`)
    return false
  }

  userCategories = data

  if (userCategories.length === 0) {
    const { error: seedError } = await supabase.from('user_categories').insert(
      STARTER_CATEGORIES.map((name, index) => ({
        user_id: user.id,
        name,
        sort_order: index + 1,
      }))
    )

    if (seedError) {
      console.error('Failed to seed categories:', seedError.message)
      showError(`Could not create categories: ${seedError.message}`)
      return false
    }

    return loadUserCategories()
  }

  return true
}

async function syncCategoriesFromTodos() {
  const names = [...new Set(todos.map((todo) => todo.category).filter(Boolean))]
  const missing = names.filter(
    (name) =>
      !userCategories.some((category) => category.name.toLowerCase() === name.toLowerCase())
  )

  if (missing.length === 0) return true

  const { error } = await supabase.from('user_categories').insert(
    missing.map((name, index) => ({
      user_id: user.id,
      name,
      sort_order: userCategories.length + index + 1,
    }))
  )

  if (error) {
    console.error('Failed to sync categories from todos:', error.message)
    return false
  }

  return loadUserCategories()
}

async function addUserCategory(name, assignToTodoId = null) {
  const trimmed = name.trim()
  if (!trimmed) return false

  const existing = userCategories.find(
    (category) => category.name.toLowerCase() === trimmed.toLowerCase()
  )

  if (existing) {
    if (assignToTodoId) return saveCategory(assignToTodoId, existing.name)
    return true
  }

  const { data, error } = await supabase
    .from('user_categories')
    .insert({
      user_id: user.id,
      name: trimmed,
      sort_order: userCategories.length + 1,
    })
    .select('id, name, sort_order')
    .single()

  if (error) {
    console.error('Failed to add category:', error.message)
    showError(`Could not add category: ${error.message}`)
    return false
  }

  userCategories.push(data)

  if (assignToTodoId) return saveCategory(assignToTodoId, trimmed)

  if (editingCategoryId) renderTodos()
  return true
}

async function deleteUserCategory(categoryId) {
  const category = userCategories.find((entry) => entry.id === categoryId)
  if (!category) return false

  const { error: clearTodosError } = await supabase
    .from('todos')
    .update({ category: null })
    .eq('user_id', user.id)
    .eq('category', category.name)

  if (clearTodosError) {
    console.error('Failed to clear category from todos:', clearTodosError.message)
    showError(`Could not clear category from todos: ${clearTodosError.message}`)
    return false
  }

  const { error } = await supabase.from('user_categories').delete().eq('id', categoryId)

  if (error) {
    console.error('Failed to delete category:', error.message)
    showError(`Could not delete category: ${error.message}`)
    return false
  }

  userCategories = userCategories.filter((entry) => entry.id !== categoryId)
  todos.forEach((todo) => {
    if (todo.category === category.name) todo.category = null
  })

  if (editingCategoryId) renderTodos()
  else await loadCalendarData()
  return true
}

async function loadCalendarData() {
  if (!user) return false

  const categoriesLoaded = await loadUserCategories()
  if (!categoriesLoaded) return false

  const { start, end } = getCalendarRange()

  const [todosResult, reflectionsResult] = await Promise.all([
    supabase
      .from('todos')
      .select('id, text, is_complete, category, day_date, sort_order, created_at')
      .eq('user_id', user.id)
      .gte('day_date', start)
      .lte('day_date', end)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('day_reflections')
      .select('day_date, reflection, closed_at')
      .eq('user_id', user.id)
      .gte('day_date', start)
      .lte('day_date', end),
  ])

  if (todosResult.error) {
    console.error('Failed to load todos:', todosResult.error.message)
    showError(`Could not load todos: ${todosResult.error.message}`)
    return false
  }

  if (reflectionsResult.error) {
    console.error('Failed to load reflections:', reflectionsResult.error.message)
    showError(`Could not load reflections: ${reflectionsResult.error.message}`)
    return false
  }

  todos = todosResult.data.map((todo) => ({
    ...todo,
    day_date: normalizeDate(todo.day_date),
  }))
  dayReflections = {}
  for (const row of reflectionsResult.data) {
    dayReflections[normalizeDate(row.day_date)] = row
  }

  await syncCategoriesFromTodos()

  clearError()
  renderUI()
  return true
}

async function addTodo(text) {
  if (isDayClosed(selectedDate)) return false

  const { error } = await supabase
    .from('todos')
    .insert({
      text,
      is_complete: false,
      user_id: user.id,
      day_date: selectedDate,
      sort_order: nextSortOrderForDay(selectedDate),
    })

  if (error) {
    console.error('Failed to add todo:', error.message)
    showError(`Could not add todo: ${error.message}`)
    return false
  }

  return true
}

async function toggleTodo(id) {
  if (isDayClosed(selectedDate)) return false
  const todo = todos.find((t) => t.id === id)
  if (!todo) return false

  if (!todo.is_complete) recentlyCompletedId = id

  const { error } = await supabase
    .from('todos')
    .update({ is_complete: !todo.is_complete })
    .eq('id', id)

  if (error) {
    console.error('Failed to update todo:', error.message)
    showError(`Could not update todo: ${error.message}`)
    return false
  }

  return true
}

async function deleteTodo(id) {
  if (isDayClosed(selectedDate)) return false
  const { error } = await supabase.from('todos').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete todo:', error.message)
    showError(`Could not delete todo: ${error.message}`)
    return false
  }

  return true
}

async function saveCategory(id, category) {
  const trimmed = category.trim()
  const { error } = await supabase
    .from('todos')
    .update({ category: trimmed || null })
    .eq('id', id)

  if (error) {
    console.error('Failed to update category:', error.message)
    showError(`Could not save category: ${error.message}`)
    return false
  }

  editingCategoryId = null
  await loadCalendarData()
  return true
}

async function confirmCloseDay() {
  const reflection = closeDayReflectionInput.value.trim()
  const pushIds = [...closeDayPushList.querySelectorAll('.close-day-push-checkbox:checked')]
    .map((checkbox) => Number(checkbox.value))

  const { error: reflectionError } = await supabase.from('day_reflections').upsert(
    {
      user_id: user.id,
      day_date: selectedDate,
      reflection,
      closed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_date' }
  )

  if (reflectionError) {
    console.error('Failed to close day:', reflectionError.message)
    showError(`Could not close day: ${reflectionError.message}`)
    return false
  }

  const tomorrow = addDays(selectedDate, 1)

  if (pushIds.length > 0) {
    const startOrder = nextSortOrderForDay(tomorrow)
    const pushResults = await Promise.all(
      pushIds.map((id, index) =>
        supabase
          .from('todos')
          .update({ day_date: tomorrow, sort_order: startOrder + index })
          .eq('id', id)
      )
    )

    const pushError = pushResults.find((result) => result.error)?.error
    if (pushError) {
      console.error('Failed to push todos:', pushError.message)
      showError(`Could not push todos: ${pushError.message}`)
      return false
    }
  }

  showCloseDayPanel = false
  await loadCalendarData()
  return true
}

async function reopenDay() {
  if (!isDayClosed(selectedDate)) return false

  const { error } = await supabase
    .from('day_reflections')
    .delete()
    .eq('user_id', user.id)
    .eq('day_date', selectedDate)

  if (error) {
    console.error('Failed to reopen day:', error.message)
    showError(`Could not reopen day: ${error.message}`)
    return false
  }

  delete dayReflections[selectedDate]
  showCloseDayPanel = false
  editingCategoryId = null
  renderUI()
  return true
}

function closeCategoryPopover() {
  editingCategoryId = null
  renderTodos()
}

function startEditingCategory(id) {
  if (editingCategoryId === id) {
    closeCategoryPopover()
    return
  }

  editingCategoryId = id
  renderTodos()
}

async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Failed to sign in:', error.message)
    showError(`Could not sign in: ${error.message}`)
    return false
  }

  user = data.user
  updateAuthUI()
  await loadCalendarData()
  return true
}

async function signUpWithEmail(email, password) {
  if (isAnonymousUser(user)) {
    const { data, error } = await supabase.auth.updateUser({ email, password })

    if (error) {
      console.error('Failed to create account:', error.message)
      showError(`Could not create account: ${error.message}`)
      return false
    }

    user = data.user
    updateAuthUI()
    await loadCalendarData()

    if (isAnonymousUser(user)) {
      showError('Check your email to confirm your account.')
      return false
    }

    return true
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error('Failed to sign up:', error.message)
    showError(`Could not create account: ${error.message}`)
    return false
  }

  if (data.session) {
    user = data.user
    updateAuthUI()
    await loadCalendarData()
    return true
  }

  showError('Check your email to confirm your account, then sign in.')
  return false
}

async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Failed to sign out:', error.message)
    showError(`Could not sign out: ${error.message}`)
    return false
  }

  const hasSession = await ensureSession()
  if (!hasSession) return false

  updateAuthUI()
  await loadCalendarData()
  return true
}

signInTab.addEventListener('click', () => showAuthTab('sign-in'))
signUpTab.addEventListener('click', () => showAuthTab('sign-up'))

signInForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = document.getElementById('todo-sign-in-email').value.trim()
  const password = document.getElementById('todo-sign-in-password').value

  const success = await signInWithEmail(email, password)
  if (success) signInForm.reset()
})

signUpForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = document.getElementById('todo-sign-up-email').value.trim()
  const password = document.getElementById('todo-sign-up-password').value

  const success = await signUpWithEmail(email, password)
  if (success) signUpForm.reset()
})

signOutButton.addEventListener('click', () => {
  signOut()
})

calendarPrevBtn.addEventListener('click', () => {
  navigateCalendar(-1)
})

calendarNextBtn.addEventListener('click', () => {
  navigateCalendar(1)
})

calendarViewTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setCalendarViewMode(tab.dataset.calendarView)
  })
})

calendarDaysEl.addEventListener('click', (event) => {
  const dayButton = event.target.closest('.calendar-day')
  if (!dayButton) return
  selectDate(dayButton.dataset.date)
})

closeDayButton.addEventListener('click', () => {
  openCloseDayPanel()
})

closeDayCancelBtn.addEventListener('click', () => {
  closeCloseDayPanel()
})

closeDayConfirmBtn.addEventListener('click', () => {
  confirmCloseDay()
})

dayClosedBadgeEl.addEventListener('click', () => {
  reopenDay()
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const text = input.value.trim()
  if (!text) return

  const success = await addTodo(text)
  if (!success) return

  input.value = ''
  await loadCalendarData()
  input.focus()
})

list.addEventListener('dragstart', (event) => {
  const dragZone = event.target.closest('.todo-item-drag-zone')
  if (!dragZone) return

  const item = dragZone.closest('.todo-item')
  if (!item) return

  item.classList.add('is-dragging')
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', item.dataset.id)
})

list.addEventListener('dragend', (event) => {
  const dragZone = event.target.closest('.todo-item-drag-zone')
  if (!dragZone) return

  const item = dragZone.closest('.todo-item')
  if (item) item.classList.remove('is-dragging')
  list.querySelectorAll('.todo-item').forEach((el) => el.classList.remove('is-drag-over'))
})

list.addEventListener('dragover', (event) => {
  const targetItem = event.target.closest('.todo-item')
  if (!targetItem || !list.querySelector('.todo-item.is-dragging')) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  moveDraggingTodoBefore(targetItem, event.clientY)
})

list.addEventListener('drop', async (event) => {
  if (!list.querySelector('.todo-item.is-dragging')) return

  event.preventDefault()
  list.querySelectorAll('.todo-item').forEach((el) => el.classList.remove('is-drag-over'))
  await persistTodoOrderFromDom()
})

list.addEventListener('click', async (event) => {
  if (event.target.closest('.todo-category-popover')) {
    const item = event.target.closest('.todo-item')
    const id = Number(item.dataset.id)

    if (event.target.closest('.todo-category-delete')) {
      const deleteButton = event.target.closest('.todo-category-delete')
      await deleteUserCategory(Number(deleteButton.dataset.categoryId))
      return
    }

    if (event.target.closest('.todo-category-add-button')) {
      const popover = event.target.closest('.todo-category-popover')
      const newInput = popover.querySelector('.todo-category-new-input')
      await addUserCategory(newInput.value, id)
      newInput.value = ''
      return
    }

    if (event.target.closest('.todo-category-option')) {
      const option = event.target.closest('.todo-category-option')
      const value = option.classList.contains('is-active') ? '' : option.dataset.categoryValue
      await saveCategory(id, value)
    }
    return
  }

  const item = event.target.closest('.todo-item')
  if (!item) return

  const id = Number(item.dataset.id)

  if (event.target.closest('.todo-complete-button')) {
    const success = await toggleTodo(id)
    if (success) await loadCalendarData()
  } else if (event.target.closest('.todo-category-button')) {
    startEditingCategory(id)
  } else if (event.target.closest('.todo-delete-button')) {
    const success = await deleteTodo(id)
    if (success) await loadCalendarData()
  }
})

list.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter') return

  const newCategoryInput = event.target.closest('[data-category-new-input]')
  if (!newCategoryInput) return

  event.preventDefault()
  const id = Number(newCategoryInput.dataset.categoryNewInput)
  await addUserCategory(newCategoryInput.value, id)
  newCategoryInput.value = ''
})

document.addEventListener('click', (event) => {
  if (!editingCategoryId) return
  if (event.target.closest('.todo-category-popover') || event.target.closest('.todo-category-button')) return
  closeCategoryPopover()
})

async function init() {
  const hasSession = await ensureSession()
  if (!hasSession) return

  updateAuthUI()
  await loadCalendarData()
}

init()
