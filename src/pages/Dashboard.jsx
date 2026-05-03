import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plus, Folder } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [activeTab, setActiveTab] = useState('projects') // 'projects' or 'tasks'

  useEffect(() => {
    fetchProjectsAndTasks()
  }, [])

  const fetchProjectsAndTasks = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (projectsError) throw projectsError

      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', user.id)

      if (membersError) console.error('Error fetching roles:', membersError.message)

      const projectsWithRoles = (projectsData || []).map(p => {
        const memberInfo = membersData?.find(m => m.project_id === p.id)
        return {
          ...p,
          userRole: memberInfo ? memberInfo.role : (p.created_by === user.id ? 'admin' : 'member')
        }
      })

      setProjects(projectsWithRoles)

      const { data: tasksData, error: tasksError } = await supabase
        .rpc('get_user_dashboard_tasks')

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          { name: newProjectName, description: newProjectDesc, created_by: user.id, admin_name: newAdminName }
        ])
        .select()

      if (error) throw error
      const newProjectWithRole = { ...data[0], userRole: 'admin' }
      setProjects([newProjectWithRole, ...projects])
      setNewProjectName('')
      setNewProjectDesc('')
      setNewAdminName('')
    } catch (error) {
      console.error('Error creating project:', error)
      alert(`Error creating project: ${error.message || JSON.stringify(error)}`)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <div className="dashboard-tabs" style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'projects' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button 
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            My Tasks
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'projects' && (
          <>
            <div className="create-project-card card">
          <h3>Create New Project</h3>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <input 
                type="text" 
                className="input" 
                placeholder="Project Name" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Description (Optional)" 
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Admin Name (Your Name)" 
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              <Plus size={18} /> Create Project
            </button>
          </form>
        </div>

        <div className="projects-grid-container">
          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="empty-state card">
              <Folder size={48} className="empty-icon" />
              <h3>No projects yet</h3>
              <p>Create your first project to get started.</p>
            </div>
          ) : (
            <>
              {projects.filter(p => p.userRole === 'admin').length > 0 && (
                <div className="project-section" style={{ marginBottom: '2rem' }}>
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Projects I Manage (Admin)</h2>
                  <div className="projects-grid">
                    {projects.filter(p => p.userRole === 'admin').map(project => (
                      <Link to={`/project/${project.id}`} key={project.id} className="project-card card">
                        <div className="project-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Folder className="project-icon" size={24} />
                            <h3 style={{ margin: 0 }}>{project.name}</h3>
                          </div>
                          <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#dbeafe', color: '#1e40af', borderRadius: '1rem', fontWeight: '500' }}>Admin</span>
                        </div>
                        {project.admin_name && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Created by: <strong>{project.admin_name}</strong>
                          </div>
                        )}
                        <p className="project-desc">{project.description || 'No description provided.'}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {projects.filter(p => p.userRole !== 'admin').length > 0 && (
                <div className="project-section">
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Projects I Contribute To (Member)</h2>
                  <div className="projects-grid">
                    {projects.filter(p => p.userRole !== 'admin').map(project => (
                      <Link to={`/project/${project.id}`} key={project.id} className="project-card card">
                        <div className="project-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Folder className="project-icon" size={24} />
                            <h3 style={{ margin: 0 }}>{project.name}</h3>
                          </div>
                          <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', color: '#475569', borderRadius: '1rem', fontWeight: '500' }}>Member</span>
                        </div>
                        {project.admin_name && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Created by: <strong>{project.admin_name}</strong>
                          </div>
                        )}
                        <p className="project-desc">{project.description || 'No description provided.'}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </>
        )}

        {activeTab === 'tasks' && (
          <div className="dashboard-tasks card">
            <h2>Assigned Tasks</h2>
            <div className="tasks-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading ? (
                <p>Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <p>No tasks assigned to you right now.</p>
                </div>
              ) : (
                tasks.map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done'
                  return (
                    <div key={task.id} className="task-item" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOverdue ? '#fef2f2' : 'var(--bg-secondary)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{task.title}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Project: <Link to={`/project/${task.project_id}`}>{task.project_name}</Link>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span className="task-status-badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: '#e2e8f0' }}>{task.status}</span>
                        {task.due_date && (
                          <span style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : '#64748b', fontWeight: isOverdue ? 'bold' : 'normal' }}>
                            {isOverdue ? 'Overdue: ' : 'Due: '} {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
