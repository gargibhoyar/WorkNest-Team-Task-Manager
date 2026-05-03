import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Circle, CheckCircle2, MoreVertical, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import './ProjectDetails.css'

export default function ProjectDetails() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [userRole, setUserRole] = useState('none')
  const [members, setMembers] = useState([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const { user } = useAuth()

  useEffect(() => {
    fetchProjectAndTasks()
  }, [id])

  const fetchProjectAndTasks = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (projectError) throw projectError
      setProject(projectData)

      // Fetch tasks using RPC to get assignee emails
      const { data: taskData, error: taskError } = await supabase
        .rpc('get_project_tasks', { p_project_id: id })
      
      if (taskError) throw taskError
      setTasks(taskData || [])
      // Fetch members and role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_project_role', { p_project_id: id })
      
      if (!roleError) setUserRole(roleData)

      const { data: membersData, error: membersError } = await supabase
        .rpc('get_project_members', { p_project_id: id })

      if (!membersError) setMembers(membersData || [])

    } catch (error) {
      console.error('Error fetching details:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return

    try {
      const { error } = await supabase
        .rpc('add_project_member_by_email', {
          p_project_id: id,
          p_email: newMemberEmail,
          p_role: newMemberRole
        })

      if (error) throw error
      alert('Member added successfully!')
      setNewMemberEmail('')
      fetchProjectAndTasks() // refresh members
    } catch (error) {
      console.error('Error adding member:', error.message)
      alert(error.message)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([
          { 
            title: newTaskTitle, 
            project_id: id, 
            status: 'To Do',
            assignee_id: newTaskAssignee || null,
            due_date: newTaskDueDate || null
          }
        ])

      if (error) throw error
      setNewTaskTitle('')
      setNewTaskAssignee('')
      setNewTaskDueDate('')
      fetchProjectAndTasks() // refresh to get the new task with emails
    } catch (error) {
      console.error('Error creating task:', error.message)
    }
  }

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Done' ? 'To Do' : 'Done'
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating task:', error.message)
      // Revert on error
      fetchProjectAndTasks()
    }
  }

  if (loading) return <div>Loading...</div>
  if (!project) return <div>Project not found</div>

  return (
    <div className="project-details">
      <div className="project-header">
        <Link to="/" className="back-link"><ArrowLeft size={18}/> Back to Projects</Link>
        <h1>{project.name} {userRole === 'admin' ? '(Admin)' : '(Member)'}</h1>
        <p>{project.description}</p>
      </div>

      <div className="project-content">
        <div className="tasks-container card">
          <div className="tasks-header">
            <h2>Tasks</h2>
          </div>

        <form onSubmit={handleCreateTask} className="add-task-form">
          <input 
            type="text" 
            className="input flex-2" 
            placeholder="Add a new task..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <select 
            className="input flex-1"
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>{m.email}</option>
            ))}
          </select>
          <input 
            type="date"
            className="input flex-1"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
          />
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Add</button>
        </form>

        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="empty-tasks">No tasks yet. Create one above!</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-item ${task.status === 'Done' ? 'completed' : ''}`}>
                <button 
                  className="task-status-btn"
                  onClick={() => toggleTaskStatus(task.id, task.status)}
                >
                  {task.status === 'Done' ? (
                    <CheckCircle2 size={22} className="status-done" />
                  ) : (
                    <Circle size={22} className="status-todo" />
                  )}
                </button>
                <div className="task-content">
                  <span className="task-title">{task.title}</span>
                  {task.assignee_email && (
                    <span className="task-assignee" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Assigned to: {task.assignee_email}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="task-due-date" style={{ fontSize: '0.8rem', color: new Date(task.due_date) < new Date() && task.status !== 'Done' ? '#ef4444' : '#64748b' }}>
                      Due: {task.due_date}
                    </span>
                  )}
                  <span className="task-status-badge">{task.status}</span>
                </div>
                <button className="task-actions-btn">
                  <MoreVertical size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="members-container card" style={{ marginTop: '2rem' }}>
        <h2>Project Members</h2>
        
        {userRole === 'admin' && (
          <form onSubmit={handleAddMember} className="add-member-form" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="email" 
              className="input" 
              placeholder="User email address" 
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              required
            />
            <select className="input" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary">Add</button>
          </form>
        )}

        <div className="members-list">
          {members.length === 0 ? (
            <p>No extra members yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {members.map(member => (
                <li key={member.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{member.email}</span>
                  <span style={{ fontSize: '0.85rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{member.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
