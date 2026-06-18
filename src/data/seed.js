const today = new Date()
function offset(days) {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

export const seed = {
  members: [
    { id: 'm1', name: 'Ava Reyes', role: 'Product Manager', color: '#4f46e5' },
    { id: 'm2', name: 'Liam Chen', role: 'Frontend Engineer', color: '#0ea5e9' },
    { id: 'm3', name: 'Noor Patel', role: 'Designer', color: '#ec4899' },
    { id: 'm4', name: 'Diego Cruz', role: 'Backend Engineer', color: '#16a34a' },
    { id: 'm5', name: 'Yuki Tanaka', role: 'QA Lead', color: '#f59e0b' },
  ],
  projects: [
    {
      id: 'p1',
      name: 'Acme Website Redesign',
      description: 'Refresh the marketing site with a new visual identity and improved performance.',
      status: 'active',
      dueDate: offset(21),
      members: ['m1', 'm2', 'm3'],
      archived: false,
      createdAt: offset(-30),
    },
    {
      id: 'p2',
      name: 'Mobile App Beta',
      description: 'Ship the public beta release of the customer mobile application.',
      status: 'active',
      dueDate: offset(45),
      members: ['m2', 'm4', 'm5'],
      archived: false,
      createdAt: offset(-50),
    },
    {
      id: 'p3',
      name: 'Q4 Marketing Campaign',
      description: 'Plan and launch the end-of-year promotional campaign.',
      status: 'on_hold',
      dueDate: offset(60),
      members: ['m1', 'm3'],
      archived: false,
      createdAt: offset(-15),
    },
    {
      id: 'p4',
      name: 'Internal Tooling',
      description: 'Build a small dashboard for the operations team.',
      status: 'completed',
      dueDate: offset(-7),
      members: ['m2', 'm4'],
      archived: false,
      createdAt: offset(-90),
    },
  ],
  tasks: [
    { id: 't1', title: 'Audit current site performance', projectId: 'p1', status: 'completed', priority: 'high', assigneeId: 'm2', dueDate: offset(-3), createdAt: offset(-20) },
    { id: 't2', title: 'Draft new homepage wireframes', projectId: 'p1', status: 'completed', priority: 'medium', assigneeId: 'm3', dueDate: offset(-1), createdAt: offset(-18) },
    { id: 't3', title: 'Build hero section component', projectId: 'p1', status: 'in_progress', priority: 'high', assigneeId: 'm2', dueDate: offset(3), createdAt: offset(-7) },
    { id: 't4', title: 'Set up analytics tracking', projectId: 'p1', status: 'backlog', priority: 'low', assigneeId: 'm4', dueDate: offset(10), createdAt: offset(-5) },
    { id: 't5', title: 'QA pass on landing page', projectId: 'p1', status: 'review', priority: 'medium', assigneeId: 'm5', dueDate: offset(5), createdAt: offset(-4) },
    { id: 't6', title: 'Implement push notifications', projectId: 'p2', status: 'in_progress', priority: 'high', assigneeId: 'm4', dueDate: offset(7), createdAt: offset(-10) },
    { id: 't7', title: 'Design onboarding screens', projectId: 'p2', status: 'review', priority: 'medium', assigneeId: 'm3', dueDate: offset(2), createdAt: offset(-9) },
    { id: 't8', title: 'Fix crash on iOS 16', projectId: 'p2', status: 'backlog', priority: 'high', assigneeId: 'm2', dueDate: offset(-2), createdAt: offset(-6) },
    { id: 't9', title: 'Write press release draft', projectId: 'p3', status: 'backlog', priority: 'low', assigneeId: 'm1', dueDate: offset(14), createdAt: offset(-3) },
    { id: 't10', title: 'Schedule social media calendar', projectId: 'p3', status: 'backlog', priority: 'medium', assigneeId: 'm1', dueDate: offset(20), createdAt: offset(-2) },
    { id: 't11', title: 'Ops dashboard handoff', projectId: 'p4', status: 'completed', priority: 'medium', assigneeId: 'm4', dueDate: offset(-12), createdAt: offset(-40) },
    { id: 't12', title: 'Plan post-launch retrospective', projectId: 'p2', status: 'backlog', priority: 'low', assigneeId: 'm5', dueDate: offset(30), createdAt: offset(-1) },
  ],
  activity: [
    { id: 'a1', type: 'task_completed', message: 'Ava Reyes completed "Ops dashboard handoff"', ts: offset(-1) },
    { id: 'a2', type: 'task_created', message: 'Liam Chen created "Build hero section component"', ts: offset(-7) },
    { id: 'a3', type: 'project_updated', message: 'Noor Patel moved "Q4 Marketing Campaign" to on hold', ts: offset(-2) },
  ],
}
