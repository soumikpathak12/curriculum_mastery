"use client"

import { useCallback, useEffect, useState } from 'react'

type Resource = {
  id: string
  type: string
  filename: string
}

type Lesson = {
  id: string
  title: string
  order: number
  resources: Resource[]
}

type Module = {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  slug: string
  modules: Module[]
}

export default function AdminCoursePage() {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({})
  const [editingModule, setEditingModule] = useState<Record<string, string>>({})
  const [editingLesson, setEditingLesson] = useState<Record<string, string>>({})
  const [resourcePanels, setResourcePanels] = useState<Record<string, boolean>>({})
  const [resources, setResources] = useState<Record<string, Resource[]>>({})
  const [newRes, setNewRes] = useState<Record<string, { filename: string; type: 'PDF' | 'DOC' | 'DOCX'; size: number }>>({})

  const loadTree = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/course/tree')
      if (!res.ok) throw new Error('Failed to load course')
      const data = await res.json()
      setCourse(data.course)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])
  async function updateModuleTitle(id: string) {
    const title = (editingModule[id] || '').trim()
    if (!title) return
    const res = await fetch(`/api/admin/modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) alert('Failed to update module')
    setEditingModule(prev => ({ ...prev, [id]: '' }))
    await loadTree()
  }

  async function deleteModule(id: string) {
    if (!confirm('Delete module and its lessons?')) return
    const res = await fetch(`/api/admin/modules/${id}`, { method: 'DELETE' })
    if (!res.ok) alert('Failed to delete module')
    await loadTree()
  }

  async function reorderModule(id: string, dir: 'up' | 'down') {
    const res = await fetch(`/api/admin/modules/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: id, direction: dir }),
    })
    if (!res.ok) alert('Failed to reorder module')
    await loadTree()
  }

  async function updateLessonTitle(id: string) {
    const title = (editingLesson[id] || '').trim()
    if (!title) return
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) alert('Failed to update lesson')
    setEditingLesson(prev => ({ ...prev, [id]: '' }))
    await loadTree()
  }

  async function deleteLesson(id: string) {
    if (!confirm('Delete lesson and its resources?')) return
    const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' })
    if (!res.ok) alert('Failed to delete lesson')
    await loadTree()
  }

  async function reorderLesson(id: string, dir: 'up' | 'down') {
    const res = await fetch(`/api/admin/lessons/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: id, direction: dir }),
    })
    if (!res.ok) alert('Failed to reorder lesson')
    await loadTree()
  }

  async function loadResources(lessonId: string) {
    const res = await fetch(`/api/admin/resources/list?lessonId=${encodeURIComponent(lessonId)}`)
    if (!res.ok) {
      alert('Failed to load resources')
      return
    }
    const data = await res.json()
    setResources(prev => ({ ...prev, [lessonId]: data.resources || [] }))
  }

  function toggleResourcePanel(lessonId: string) {
    setResourcePanels(prev => ({ ...prev, [lessonId]: !prev[lessonId] }))
    // If opening, fetch resources
    const willOpen = !resourcePanels[lessonId]
    if (willOpen) void loadResources(lessonId)
  }

  async function addResource(lessonId: string) {
    const cfg = newRes[lessonId]
    if (!cfg?.filename || !cfg.type || !Number.isFinite(cfg.size)) {
      alert('Please provide filename, type and size')
      return
    }
    // Mock: request a signed URL and fileKey, skip actual upload for groundwork
    const signRes = await fetch('/api/admin/resources/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: cfg.filename }),
    })
    if (!signRes.ok) {
      alert('Failed to sign upload')
      return
    }
    const { fileKey } = await signRes.json()
    const createRes = await fetch('/api/admin/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, type: cfg.type, fileKey, filename: cfg.filename, size: Number(cfg.size) }),
    })
    if (!createRes.ok) {
      alert('Failed to create resource')
      return
    }
    setNewRes(prev => ({ ...prev, [lessonId]: { filename: '', type: 'PDF', size: 0 } }))
    await loadResources(lessonId)
  }

  async function deleteResource(resourceId: string, lessonId: string) {
    const res = await fetch(`/api/admin/resources/${resourceId}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('Failed to delete resource')
      return
    }
    await loadResources(lessonId)
  }

  useEffect(() => {
    loadTree()
  }, [loadTree])

  async function createModule() {
    if (!course?.id || !newModuleTitle.trim()) return
    const res = await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id, title: newModuleTitle.trim() }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data?.error || 'Failed to create module')
      return
    }
    setNewModuleTitle("")
    await loadTree()
  }

  async function createLesson(moduleId: string) {
    const title = (lessonTitles[moduleId] || '').trim()
    if (!title) return
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, title }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data?.error || 'Failed to create lesson')
      return
    }
    setLessonTitles(prev => ({ ...prev, [moduleId]: '' }))
    await loadTree()
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Manage Course</h1>
      <p className="mt-2 text-gray-600">Create modules and lessons. Upload resources (PDF/DOC).</p>

      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {course && (
        <div className="mt-6 space-y-6">
          <div className="rounded-md border p-4">
            <h2 className="text-lg font-medium">Course</h2>
            <p className="text-sm text-gray-600">{course.title} ({course.slug})</p>

            <div className="mt-4 flex gap-2">
              <input
                placeholder="New module title"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="w-full max-w-sm rounded-md border px-3 py-2"
              />
              <button onClick={createModule} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105">Add Module</button>
            </div>
          </div>

          <div className="space-y-4">
            {course.modules.map((m) => (
              <div key={m.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Module {m.order}:</span>
                    {editingModule[m.id] !== undefined && editingModule[m.id] !== '' ? (
                      <>
                        <input
                          value={editingModule[m.id]}
                          onChange={(e) => setEditingModule(prev => ({ ...prev, [m.id]: e.target.value }))}
                          className="rounded border px-2 py-1"
                        />
                        <button onClick={() => updateModuleTitle(m.id)} className="rounded-lg bg-brand-primary px-3 py-1 text-xs font-medium text-white shadow-sm hover:shadow-md transition-all">Save</button>
                      </>
                    ) : (
                      <>
                        <span>{m.title}</span>
                        <button onClick={() => setEditingModule(prev => ({ ...prev, [m.id]: m.title }))} className="rounded border px-2 py-1 text-xs">Edit</button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button onClick={() => reorderModule(m.id, 'up')} className="rounded border px-2 py-1">Up</button>
                    <button onClick={() => reorderModule(m.id, 'down')} className="rounded border px-2 py-1">Down</button>
                    <button onClick={() => deleteModule(m.id)} className="rounded border border-red-600 px-2 py-1 text-red-600">Delete</button>
                  </div>
                </div>
                <ul className="mt-3 list-disc pl-6">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span>Lesson {l.order}:</span>
                          {editingLesson[l.id] !== undefined && editingLesson[l.id] !== '' ? (
                            <>
                              <input
                                value={editingLesson[l.id]}
                                onChange={(e) => setEditingLesson(prev => ({ ...prev, [l.id]: e.target.value }))}
                                className="rounded border px-2 py-1 text-sm"
                              />
                              <button onClick={() => updateLessonTitle(l.id)} className="rounded-lg bg-brand-primary px-3 py-1 text-xs font-medium text-white shadow-sm hover:shadow-md transition-all">Save</button>
                            </>
                          ) : (
                            <>
                              <span>{l.title}</span>
                              <button onClick={() => setEditingLesson(prev => ({ ...prev, [l.id]: l.title }))} className="rounded border px-2 py-1 text-xs">Edit</button>
                            </>
                          )}
                          {l.resources.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">{l.resources.length} resources</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button onClick={() => reorderLesson(l.id, 'up')} className="rounded border px-2 py-1">Up</button>
                          <button onClick={() => reorderLesson(l.id, 'down')} className="rounded border px-2 py-1">Down</button>
                          <button onClick={() => toggleResourcePanel(l.id)} className="rounded border px-2 py-1">Manage resources</button>
                          <button onClick={() => deleteLesson(l.id)} className="rounded border border-red-600 px-2 py-1 text-red-600">Delete</button>
                        </div>
                      </div>
                      {resourcePanels[l.id] && (
                        <div className="mt-2 rounded border p-3 text-sm">
                          <div className="font-medium">Resources</div>
                          <ul className="mt-2 space-y-1">
                            {(resources[l.id] || []).map((r) => (
                              <li key={r.id} className="flex items-center justify-between">
                                <span>{r.filename} <span className="text-gray-500">({r.type})</span></span>
                                <button onClick={() => deleteResource(r.id, l.id)} className="rounded border border-red-600 px-2 py-1 text-xs text-red-600">Delete</button>
                              </li>
                            ))}
                            {(!resources[l.id] || resources[l.id].length === 0) && (
                              <li className="text-gray-500">No resources yet.</li>
                            )}
                          </ul>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <input
                              placeholder="Filename (example.pdf)"
                              value={newRes[l.id]?.filename || ''}
                              onChange={(e) => setNewRes(prev => ({ ...prev, [l.id]: { filename: e.target.value, type: prev[l.id]?.type || 'PDF', size: prev[l.id]?.size || 0 } }))}
                              className="w-56 rounded border px-2 py-1"
                            />
                            <select
                              value={newRes[l.id]?.type || 'PDF'}
                              onChange={(e) => setNewRes(prev => ({ ...prev, [l.id]: { filename: prev[l.id]?.filename || '', type: e.target.value as 'PDF' | 'DOC' | 'DOCX', size: prev[l.id]?.size || 0 } }))}
                              className="rounded border px-2 py-1"
                            >
                              <option value="PDF">PDF</option>
                              <option value="DOC">DOC</option>
                              <option value="DOCX">DOCX</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Size (bytes)"
                              value={Number.isFinite(newRes[l.id]?.size) ? newRes[l.id]?.size : ''}
                              onChange={(e) => setNewRes(prev => ({ ...prev, [l.id]: { filename: prev[l.id]?.filename || '', type: prev[l.id]?.type || 'PDF', size: Number(e.target.value || 0) } }))}
                              className="w-40 rounded border px-2 py-1"
                            />
                            <button onClick={() => addResource(l.id)} className="rounded-lg bg-brand-primary px-3 py-1 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all hover:scale-105">Add resource</button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex gap-2">
                  <input
                    placeholder="New lesson title"
                    value={lessonTitles[m.id] || ''}
                    onChange={(e) => setLessonTitles(prev => ({ ...prev, [m.id]: e.target.value }))}
                    className="w-full max-w-sm rounded-md border px-3 py-2"
                  />
                  <button onClick={() => createLesson(m.id)} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105">Add Lesson</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
