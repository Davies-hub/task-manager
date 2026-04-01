const API = '/api';
const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const statusOrder = ['pending', 'in_progress', 'done'];
let currentFilter = '';
let allTasks = [];

async function loadTasks() {
  const url = currentFilter
    ? `${API}/tasks?status=${currentFilter}`
    : `${API}/tasks`;

  const res = await fetch(url, { headers: HEADERS });
  const data = await res.json();
  allTasks = Array.isArray(data) ? data : [];
  renderTable(allTasks);
  updateMetrics();
}

function updateMetrics() {
  document.getElementById('m-total').textContent = allTasks.length;
  document.getElementById('m-high').textContent = allTasks.filter(t => t.priority === 'high').length;
  document.getElementById('m-progress').textContent = allTasks.filter(t => t.status === 'in_progress').length;
  document.getElementById('m-done').textContent = allTasks.filter(t => t.status === 'done').length;
}

function renderTable(tasks) {
  const tbody = document.getElementById('task-table-body');

  if (!tasks.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No tasks found.</td></tr>`;
    return;
  }

  tbody.innerHTML = tasks.map(task => {
    const due = new Date(task.due_date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const canAdvance = task.status !== 'done';
    const canDelete = task.status === 'done';
    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    const statusLabel = task.status.replace('_', ' ');

    return `
      <tr>
        <td>${task.title}</td>
        <td style="color:#888">${due}</td>
        <td><span class="badge badge-${task.priority}">${priorityLabel}</span></td>
        <td><span class="badge badge-${task.status}">${statusLabel}</span></td>
        <td>
          ${canAdvance ? `<button class="btn" data-id="${task.id}" data-status="${task.status}" data-action="advance">Advance</button>` : ''}
          ${canDelete ? `<button class="btn btn-danger" data-id="${task.id}" data-action="delete">Delete</button>` : ''}
        </td>
      </tr>`;
  }).join('');
}

async function createTask() {
  const title = document.getElementById('new-title').value.trim();
  const due_date = document.getElementById('new-date').value;
  const priority = document.getElementById('new-priority').value;

  if (!title || !due_date || !priority) {
    showToast('Please fill in all fields.');
    return;
  }

  const res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ title, due_date, priority })
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById('new-title').value = '';
    document.getElementById('new-date').value = '';
    document.getElementById('new-priority').value = '';
    showToast('Task created successfully.');
    loadTasks();
  } else {
    showToast(data.message || 'Failed to create task.');
  }
}

async function advanceStatus(id, currentStatus) {
  const next = statusOrder[statusOrder.indexOf(currentStatus) + 1];

  const res = await fetch(`${API}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ status: next })
  });

  const data = await res.json();

  if (res.ok) {
    showToast(`Status updated to "${next.replace('_', ' ')}".`);
    loadTasks();
  } else {
    showToast(data.message || 'Failed to update status.');
  }
}

async function deleteTask(id) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: 'DELETE',
    headers: HEADERS
  });

  const data = await res.json();

  if (res.ok) {
    showToast('Task deleted.');
    loadTasks();
  } else {
    showToast(data.message || 'Failed to delete task.');
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Event delegation for table buttons
document.getElementById('task-table-body').addEventListener('click', function(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const status = btn.dataset.status;

  if (action === 'advance') advanceStatus(id, status);
  if (action === 'delete') deleteTask(id);
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    loadTasks();
  });
});

// Add task button
document.getElementById('add-task-btn').addEventListener('click', createTask);

// Initial load
loadTasks();