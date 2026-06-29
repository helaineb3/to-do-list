import { escapeHtml } from '../../lib/html.js'
import { getCategoryVariant } from '../../constants/categories.js'
import { COMPLETION_STICKERS } from '../../constants/stickers.js'
import { state } from '../../app/state.js'
import { CATEGORY_ICON, DELETE_ICON } from '../../constants/icons.js'

export function categoryBadgeTemplate(category) {
  const variant = getCategoryVariant(category)
  return `<span class="todo-item-category" data-variant="${variant}">${escapeHtml(category)}</span>`
}

export function completionStickerTemplate(todoId) {
  const sticker = COMPLETION_STICKERS[todoId % COMPLETION_STICKERS.length]
  const isNew = state.recentlyCompletedId === todoId
  return `
    <span
      class="todo-sticker todo-sticker--${sticker.variant}${isNew ? ' todo-sticker--new' : ''}"
      style="--sticker-rotate: ${sticker.rotate}deg"
      aria-hidden="true"
    >${sticker.label}</span>
  `
}

export function categoryOptionsTemplate(todo) {
  return state.userCategories
    .map((category) => {
      const isActive = todo.category === category.name
      const variant = getCategoryVariant(category.name)
      return `
        <div class="todo-category-row">
          <button
            type="button"
            class="todo-category-option${isActive ? ' is-active' : ''}"
            data-variant="${variant}"
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

export function categoryPopoverTemplate(todo) {
  return `
    <div class="todo-category-popover" role="dialog" aria-label="Choose category">
      <p class="todo-category-popover-label">Categories</p>
      <div class="todo-category-options">${categoryOptionsTemplate(todo)}</div>
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
          class="btn btn--primary todo-category-add-button"
          data-category-add="${todo.id}"
        >Add</button>
      </div>
    </div>
  `
}

export function todoItemTemplate(todo, { dayClosed, isEditingCategory }) {
  const completeClass = todo.is_complete ? ' is-complete' : ''
  const completeLabel = todo.is_complete ? 'Mark incomplete' : 'Mark complete'
  const checkMark = todo.is_complete ? '✓' : ''
  const categoryMarkup = todo.category ? categoryBadgeTemplate(todo.category) : ''
  const categoryPopover = isEditingCategory ? categoryPopoverTemplate(todo) : ''
  const contentClass = dayClosed ? 'todo-item-content' : 'todo-item-content todo-item-drag-zone'
  const stickerMarkup = todo.is_complete ? completionStickerTemplate(todo.id) : ''

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
}
