// script.js - EduPortal
(() => {
  const STORAGE_KEY = 'eduportal_students_v1';

  // DOM refs
  const btnAdd = document.getElementById('btnAdd');
  const formPanel = document.getElementById('formPanel');
  const studentForm = document.getElementById('studentForm');
  const btnCancel = document.getElementById('btnCancel');
  const studentsTbody = document.getElementById('studentsTbody');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  // form fields
  const fldId = document.getElementById('studentId');
  const fldName = document.getElementById('name');
  const fldEmail = document.getElementById('email');
  const fldCourse = document.getElementById('course');
  const fldDob = document.getElementById('dob');
  const fldM1 = document.getElementById('m1');
  const fldM2 = document.getElementById('m2');
  const fldM3 = document.getElementById('m3');

  let students = []; // array of student objects
  let editMode = false;

  // --- Storage helpers
  function loadStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      students = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading from storage', e);
      students = [];
    }
  }

  function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }

  // --- Utility functions
  function uid() {
    // small unique id using timestamp + random
    return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function calcStats(s) {
    const m1 = Number(s.m1), m2 = Number(s.m2), m3 = Number(s.m3);
    const total = m1 + m2 + m3;
    const avg = +(total / 3).toFixed(2);
    let grade = 'F';
    if (avg >= 85) grade = 'A';
    else if (avg >= 70) grade = 'B';
    else if (avg >= 50) grade = 'C';
    else grade = 'D';
    return { total, avg, grade };
  }

  // --- Render functions
  function renderStudents(filter = '') {
    const q = filter.trim().toLowerCase();
    // optional sorting based on select
    const sortVal = sortSelect.value;

    let list = students.slice(); // copy
    if (q) {
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.course && s.course.toLowerCase().includes(q)));
    }

    if (sortVal) {
      if (sortVal === 'name_asc') list.sort((a,b) => a.name.localeCompare(b.name));
      if (sortVal === 'name_desc') list.sort((a,b) => b.name.localeCompare(a.name));
      if (sortVal === 'avg_desc') list.sort((a,b) => calcStats(b).avg - calcStats(a).avg);
      if (sortVal === 'avg_asc') list.sort((a,b) => calcStats(a).avg - calcStats(b).avg);
    }

    // build rows
    studentsTbody.innerHTML = '';
    if (list.length === 0) {
      studentsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted)">No students yet.</td></tr>`;
      return;
    }

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const { avg, grade } = calcStats(s);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.course)}</td>
        <td>${avg}</td>
        <td>${grade}</td>
        <td class="actions">
          <button class="edit" data-id="${s.id}">Edit</button>
          <button class="delete" data-id="${s.id}">Delete</button>
          <button class="view" data-id="${s.id}">View</button>
        </td>
      `;
      studentsTbody.appendChild(tr);
    }
  }

  // safe text
  function escapeHtml(text = '') {
    return String(text).replace(/[&<>"'`=\/]/g, function(s) {
      return ({
        '&': '&amp;', '<': '&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;', '`':'&#96;', '=':'&#61;', '/':'&#47;'
      })[s];
    });
  }

  // --- Form control
  function showForm(mode='add', id=null) {
    formPanel.classList.remove('hidden');
    if (mode === 'add') {
      editMode = false;
      studentForm.reset();
      fldId.value = '';
      document.getElementById('formTitle').innerText = 'Add Student';
    } else {
      editMode = true;
      document.getElementById('formTitle').innerText = 'Edit Student';
      const s = students.find(x => x.id === id);
      if (!s) return alert('Student not found');
      fldId.value = s.id;
      fldName.value = s.name;
      fldEmail.value = s.email;
      fldCourse.value = s.course;
      fldDob.value = s.dob || '';
      fldM1.value = s.m1;
      fldM2.value = s.m2;
      fldM3.value = s.m3;
    }
    // focus first field
    fldName.focus();
  }

  function hideForm() {
    formPanel.classList.add('hidden');
    studentForm.reset();
  }

  // --- Validation
  function validateForm() {
    const name = fldName.value.trim();
    const email = fldEmail.value.trim();
    const course = fldCourse.value.trim();
    const m1 = Number(fldM1.value);
    const m2 = Number(fldM2.value);
    const m3 = Number(fldM3.value);

    if (!name) return { ok:false, msg:'Name is required' };
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { ok:false, msg:'Valid email is required' };
    if (!course) return { ok:false, msg:'Course is required' };
    if (![m1,m2,m3].every(n => Number.isFinite(n))) return { ok:false, msg:'All marks must be numbers' };
    if (![m1,m2,m3].every(n => n >= 0 && n <= 100)) return { ok:false, msg:'Marks must be between 0 and 100' };

    return { ok:true };
  }

  // --- CRUD operations
  function addStudentFromForm() {
    const validation = validateForm();
    if (!validation.ok) { alert(validation.msg); return false; }

    const newStudent = {
      id: uid(),
      name: fldName.value.trim(),
      email: fldEmail.value.trim(),
      course: fldCourse.value.trim(),
      dob: fldDob.value || '',
      m1: Number(fldM1.value),
      m2: Number(fldM2.value),
      m3: Number(fldM3.value),
      createdAt: new Date().toISOString()
    };
    students.push(newStudent);
    saveStudents();
    renderStudents(searchInput.value);
    hideForm();
    return true;
  }

  function updateStudentFromForm() {
    const validation = validateForm();
    if (!validation.ok) { alert(validation.msg); return false; }
    const id = fldId.value;
    const idx = students.findIndex(s => s.id === id);
    if (idx < 0) { alert('Student not found'); return false; }
    students[idx] = {
      ...students[idx],
      name: fldName.value.trim(),
      email: fldEmail.value.trim(),
      course: fldCourse.value.trim(),
      dob: fldDob.value || '',
      m1: Number(fldM1.value),
      m2: Number(fldM2.value),
      m3: Number(fldM3.value),
      updatedAt: new Date().toISOString()
    };
    saveStudents();
    renderStudents(searchInput.value);
    hideForm();
    return true;
  }

  function deleteStudentById(id) {
    if (!confirm('Delete this student?')) return;
    students = students.filter(s => s.id !== id);
    saveStudents();
    renderStudents(searchInput.value);
  }

  function viewStudent(id) {
    const s = students.find(x => x.id === id);
    if (!s) return alert('Not found');
    const stats = calcStats(s);
    alert(`Name: ${s.name}\nEmail: ${s.email}\nCourse: ${s.course}\nDOB: ${s.dob || 'N/A'}\n\nMarks: ${s.m1}, ${s.m2}, ${s.m3}\nAvg: ${stats.avg}\nGrade: ${stats.grade}`);
  }

  // --- Event handlers
  btnAdd.addEventListener('click', () => showForm('add'));
  btnCancel.addEventListener('click', hideForm);

  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (fldId.value) {
      updateStudentFromForm();
    } else {
      addStudentFromForm();
    }
  });

  // Delegated events for edit/delete/view
  studentsTbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (btn.classList.contains('edit')) {
      showForm('edit', id);
    } else if (btn.classList.contains('delete')) {
      deleteStudentById(id);
    } else if (btn.classList.contains('view')) {
      viewStudent(id);
    }
  });

  searchInput.addEventListener('input', (e) => renderStudents(e.target.value));
  sortSelect.addEventListener('change', () => renderStudents(searchInput.value));

  // --- Init
  function init() {
    loadStudents();
    // If storage empty, seed with sample
    if (!students || students.length === 0) {
      students = [
        { id: uid(), name:'Asha Kumar', email:'asha@example.com', course:'BSc', dob:'2001-05-12', m1:85, m2:78, m3:92 },
        { id: uid(), name:'Ravi Singh', email:'ravi@example.com', course:'BTech', dob:'2000-01-20', m1:65, m2:72, m3:58 }
      ];
      saveStudents();
    }
    renderStudents();
  }

  // run
  init();

})();