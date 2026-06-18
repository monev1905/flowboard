import {
  Chart,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(BarController, BarElement, DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend)

function readColors() {
  const styles = getComputedStyle(document.documentElement)
  return {
    primary: styles.getPropertyValue('--color-primary').trim() || '#4f46e5',
    success: styles.getPropertyValue('--color-success').trim() || '#16a34a',
    warning: styles.getPropertyValue('--color-warning').trim() || '#d97706',
    info: styles.getPropertyValue('--color-info').trim() || '#0284c7',
    border: styles.getPropertyValue('--color-border').trim() || '#e4e7ee',
    text: styles.getPropertyValue('--color-text').trim() || '#1c1f26',
    textMuted: styles.getPropertyValue('--color-text-muted').trim() || '#5b6271',
  }
}

export function createWorkloadChart(canvas, members, tasks) {
  const colors = readColors()
  const labels = members.map((m) => m.name.split(' ')[0])
  const data = members.map((m) => tasks.filter((t) => t.assigneeId === m.id && t.status !== 'completed').length)
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Open tasks',
        data,
        backgroundColor: colors.primary,
        borderRadius: 6,
        maxBarThickness: 36,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { intersect: false },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: colors.textMuted } },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: colors.textMuted },
          grid: { color: colors.border },
        },
      },
    },
  })
}

export function createStatusChart(canvas, tasks) {
  const colors = readColors()
  const buckets = { backlog: 0, in_progress: 0, review: 0, completed: 0 }
  tasks.forEach((t) => { if (t.status in buckets) buckets[t.status]++ })
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Backlog', 'In progress', 'Review', 'Completed'],
      datasets: [{
        data: [buckets.backlog, buckets.in_progress, buckets.review, buckets.completed],
        backgroundColor: [colors.textMuted, colors.info, colors.warning, colors.success],
        borderColor: 'transparent',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.text, padding: 12, boxWidth: 12 } },
      },
    },
  })
}
