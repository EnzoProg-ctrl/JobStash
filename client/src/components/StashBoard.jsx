import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import BoardCard, { BoardCardPreview } from './BoardCard.jsx'

// The Kanban board on My Stash: one column per stage of a job hunt. Dragging a
// card to another column changes the job, exactly like the ⋮ menu would
// (StashPage's handleSetStatus).
//
// Uses dnd-kit (@dnd-kit/core) for dragging with a mouse, a finger (press and
// hold, so the page still scrolls normally) and the keyboard, and for telling
// screen readers what is happening.

const COLUMNS = [
  { id: 'to_apply', title: 'To Apply', status: 'to_apply', outcome: null, dot: 'bg-todo' },
  { id: 'pending', title: 'Pending', status: 'done', outcome: 'pending', dot: 'bg-slate-500' },
  { id: 'accepted', title: 'Accepted', status: 'done', outcome: 'accepted', dot: 'bg-done' },
  { id: 'rejected', title: 'Rejected', status: 'done', outcome: 'rejected', dot: 'bg-error' },
]
const TITLES = Object.fromEntries(COLUMNS.map((column) => [column.id, column.title]))

function columnOf(job) {
  if (job.status !== 'done') return 'to_apply'
  return job.outcome === 'accepted' || job.outcome === 'rejected' ? job.outcome : 'pending'
}

// The keyboard moves a picked-up card a whole column at a time (left/right or
// up/down arrows), instead of a few pixels per key press.
function columnKeys(event, { context }) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.code]
  const { active, over, droppableRects, collisionRect } = context
  if (!step || !active || !collisionRect) return undefined
  event.preventDefault()
  const ids = COLUMNS.map((column) => column.id)
  const current = ids.indexOf(over?.id ?? active.data.current.column)
  const next = ids[Math.min(ids.length - 1, Math.max(0, current + step))]
  const rect = droppableRects.get(next)
  if (!rect) return undefined
  return { x: rect.left + Math.max(0, (rect.width - collisionRect.width) / 2), y: rect.top + 56 }
}

const accessibility = {
  screenReaderInstructions: {
    draggable:
      'To move this job, press Space or Enter, use the arrow keys to choose a column, ' +
      'then press Space or Enter again. Press Escape to cancel.',
  },
  announcements: {
    onDragStart: ({ active }) => `Picked up ${name(active)} from ${TITLES[active.data.current.column]}.`,
    onDragOver: ({ active, over }) => (over ? `${name(active)} is over ${TITLES[over.id]}.` : `${name(active)} is not over a column.`),
    onDragEnd: ({ active, over }) => (over ? `${name(active)} moved to ${TITLES[over.id]}.` : `${name(active)} put back.`),
    onDragCancel: ({ active }) => `Cancelled. ${name(active)} stays in ${TITLES[active.data.current.column]}.`,
  },
}
function name({ data }) {
  const job = data.current.job
  return job.job_title || job.company_name
}

export default function StashBoard({ jobs, onSetStatus, onDelete, onToggleFavorite }) {
  const [dragging, setDragging] = useState(null)
  const sensors = useSensors(
    // A mouse drag starts after moving 6px, so a plain click still clicks.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A finger has to press and hold for a moment, so swiping still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeys }),
  )

  function handleDragEnd({ active, over }) {
    setDragging(null)
    if (!over || over.id === active.data.current.column) return
    const target = COLUMNS.find((column) => column.id === over.id)
    // instant: the dragged card is already where it was dropped, so no slide.
    onSetStatus(active.data.current.job, target.status, target.outcome, { instant: true })
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={accessibility}
      onDragStart={({ active }) => setDragging(active.data.current.job)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {/* Phones: the columns sit side by side and scroll sideways, one at a
          time. Tablets: two by two. Laptops: all four in a row. */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            jobs={jobs.filter((job) => columnOf(job) === column.id)}
            onSetStatus={onSetStatus}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging ? <BoardCardPreview job={dragging} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({ column, jobs, onSetStatus, onDelete, onToggleFavorite }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <section
      ref={setNodeRef}
      aria-label={`${column.title}, ${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`}
      className={`flex w-[85%] shrink-0 snap-start flex-col rounded-card border p-2 md:w-auto ${
        isOver ? 'border-brand-blue bg-todo-bg' : 'border-line bg-subtle'
      }`}
    >
      <h2 className="flex items-center gap-2 px-1 py-2 text-sm font-bold">
        <span className={`size-2 rounded-full ${column.dot}`} aria-hidden="true" />
        {column.title}
        <span className="rounded-full bg-surface px-2 text-xs font-semibold text-muted">{jobs.length}</span>
      </h2>
      {jobs.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <BoardCard
              key={job.id}
              job={job}
              column={column.id}
              onSetStatus={onSetStatus}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </ul>
      ) : (
        <p className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-line px-3 text-center text-sm text-muted">
          Drop a job here
        </p>
      )}
    </section>
  )
}
