// ================================================================
// STATE & KONSTANTA
// ================================================================
const STORAGE_KEY = 'dm_todos_v1';

let state = {
  todos: [],
  filter: 'all',
};

// ================================================================
// PERSISTENSI — LocalStorage
// ================================================================
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { state.todos = JSON.parse(raw); }
    catch (_) { state.todos = []; }
  }
}

// ================================================================
// VALIDASI INPUT
// ================================================================
const todoInput = document.getElementById('todo-input');
const errorMsg  = document.getElementById('error-msg');

function showInputError() {
  todoInput.classList.add('error');
  errorMsg.classList.add('visible');
}

function clearInputError() {
  todoInput.classList.remove('error');
  errorMsg.classList.remove('visible');
}

todoInput.addEventListener('input', clearInputError);

// ================================================================
// CRUD TODOS
// ================================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function addTodo() {
  const text = todoInput.value.trim();

  if (!text) {
    showInputError();
    todoInput.focus();
    return;
  }

  state.todos.push({ id: generateId(), text, completed: false });
  todoInput.value = '';
  clearInputError();

  saveToLocalStorage();
  renderTodos();
}

function toggleTodo(id) {
  state.todos = state.todos.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveToLocalStorage();
  renderTodos();
}

function deleteTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  saveToLocalStorage();
  renderTodos();
}

function saveEdit(id, li) {
  const editInput = li.querySelector('.edit-input');
  const newText   = editInput.value.trim();

  if (!newText) {
    editInput.classList.add('border-danger', 'shadow-[0_0_0_3px_rgba(255,77,109,0.2)]');
    editInput.focus();
    return;
  }

  state.todos = state.todos.map(t =>
    t.id === id ? { ...t, text: newText } : t
  );
  saveToLocalStorage();
  renderTodos();
}

function cancelEdit() {
  renderTodos();
}

function clearCompleted() {
  state.todos = state.todos.filter(t => !t.completed);
  saveToLocalStorage();
  renderTodos();
}

function getFilteredTodos() {
  switch (state.filter) {
    case 'active':
      return state.todos.filter(t => !t.completed);
    case 'completed':
      return state.todos.filter(t => t.completed);
    case 'all':
    default:
      return state.todos;
  }
}

// ================================================================
// RENDER (Menggunakan Utilitas Tailwind CSS)
// ================================================================
const todoList    = document.getElementById('todo-list');
const taskCountEl = document.getElementById('task-count-text');
const footerInfo  = document.getElementById('footer-info');

function renderTodos() {
  const filtered    = getFilteredTodos();
  const activeCount = state.todos.filter(t => !t.completed).length;

  taskCountEl.textContent = `${activeCount} tugas aktif`;
  footerInfo.textContent = `${activeCount} tugas tersisa`;
  todoList.innerHTML = '';

  if (filtered.length === 0) {
    todoList.innerHTML = `
      <li class="text-center py-10 px-5 text-text-muted">
        <div class="text-[2.5rem] mb-2.5 opacity-40">✦</div>
        <p class="text-[0.88rem]">${state.filter === 'completed'
          ? 'Belum ada tugas yang diselesaikan.'
          : state.filter === 'active'
          ? 'Semua tugas sudah selesai! 🎉'
          : 'Tambahkan tugas pertamamu.'
        }</p>
      </li>`;
    return;
  }

  filtered.forEach(todo => {
    const li = document.createElement('li');
    
    // Base class item list dengan animasi Tailwind
    let liClasses = "flex items-center gap-3 p-3.5 px-4 bg-bg-input border border-border rounded-xl transition-all duration-200 hover:border-[#3a3a55] hover:bg-bg-hover animate-[itemIn_0.3s_cubic-bezier(0.16,1,0.3,1)_both]";
    if (todo.completed) {
      liClasses += " border-done-text/10 line-through text-text-muted/60 opacity-60";
    }
    li.className = liClasses;
    li.dataset.id = todo.id;

    // Class checkbox khusus pengganti CSS murni
    const cbCheckedClasses = todo.completed ? "bg-done-text border-done-text shadow-[0_0_10px_rgba(74,222,128,0.33)] after:content-[''] after:absolute after:top-[2px] after:left-[5px] after:w-[5px] after:h-[9px] after:border-b-2 after:border-r-2 after:border-[#0d0d12] after:rotate-45" : "bg-transparent border-border";

    li.innerHTML = `
      <input
        type="checkbox"
        class="todo-checkbox w-5 h-5 shrink-0 appearance-none border-2 rounded-[5px] cursor-pointer relative transition-all duration-200 ${cbCheckedClasses}"
        ${todo.completed ? 'checked' : ''}
        aria-label="Tandai selesai: ${escapeHtml(todo.text)}"
      />
      <span class="todo-text flex-1 text-[0.93rem] text-text-primary break-all transition-all duration-200 ${todo.completed ? 'line-through text-text-muted opacity-60' : ''}">${escapeHtml(todo.text)}</span>
      <div class="item-actions flex gap-1.5 shrink-0 max-sm:gap-1">
        <button class="btn-edit w-[34px] h-[34px] border-none rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 text-[0.95rem] bg-[#2a2a3a] text-text-secondary hover:bg-accent hover:text-white max-sm:w-7 max-sm:h-7 max-sm:text-[0.8rem]" title="Edit tugas" aria-label="Edit: ${escapeHtml(todo.text)}">
          ✎
        </button>
        <button class="btn-delete w-[34px] h-[34px] border-none rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 text-[0.95rem] bg-[#3a1e25] text-danger hover:bg-danger hover:text-white max-sm:w-7 max-sm:h-7 max-sm:text-[0.8rem]" title="Hapus tugas" aria-label="Hapus: ${escapeHtml(todo.text)}">
          ✕
        </button>
      </div>`;

    li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteTodo(todo.id));
    li.querySelector('.btn-edit').addEventListener('click', () => enterEditMode(todo, li));

    todoList.appendChild(li);
  });
}

// ================================================================
// FITUR EDIT INLINE
// ================================================================
function enterEditMode(todo, li) {
  const textSpan = li.querySelector('.todo-text');
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'edit-input flex-1 py-1.5 px-3 bg-bg-root border-1.5 border-accent rounded-lg text-text-primary text-[0.93rem] outline-none shadow-[0_0_0_3px_rgba(108,99,255,0.25)] transition-all duration-200';
  editInput.value     = todo.text;
  editInput.setAttribute('aria-label', 'Edit tugas');

  editInput.addEventListener('input', () => editInput.classList.remove('border-danger', 'shadow-[0_0_0_3px_rgba(255,77,109,0.2)]'));

  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveEdit(todo.id, li);
    if (e.key === 'Escape') cancelEdit();
  });

  li.replaceChild(editInput, textSpan);

  const actionsDiv = li.querySelector('.item-actions');
  const editBtn    = actionsDiv.querySelector('.btn-edit');
  const saveBtn    = document.createElement('button');
  saveBtn.className    = 'btn-save w-[34px] h-[34px] border-none rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 text-[0.95rem] bg-[#1e3a2a] text-done-text hover:bg-done-text hover:text-[#0d0d12] max-sm:w-7 max-sm:h-7 max-sm:text-[0.8rem]';
  saveBtn.title        = 'Simpan';
  saveBtn.setAttribute('aria-label', 'Simpan perubahan');
  saveBtn.innerHTML    = '✔';
  saveBtn.addEventListener('click', () => saveEdit(todo.id, li));

  actionsDiv.replaceChild(saveBtn, editBtn);

  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);
}

function escapeHtml(str) {
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

// ================================================================
// EVENT LISTENERS GLOBAL
// ================================================================
document.getElementById('add-btn').addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveToLocalStorage();
    renderTodos();
  });
});

document.getElementById('clear-done-btn').addEventListener('click', clearCompleted);

// INIT
loadFromLocalStorage();
renderTodos();