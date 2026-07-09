// ============================================
// Jobs Module - Job list, filters, notes, modals
// ============================================

class JobsController {
    constructor() {
        this.api = getAPI();
        this.jobs = [];
        this.filteredJobs = [];
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.currentNoteJobId = null;

        this.elements = {
            tbody: document.getElementById('jobsTableBody'),
            empty: document.getElementById('jobsEmpty'),
            searchInput: document.getElementById('searchInput'),
            statusFilter: document.getElementById('statusFilter'),
        };

        this.bindEvents();
        this.loadJobs();
    }

    bindEvents() {
        // Search
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterAndRender();
            });
        }

        // Status filter
        if (this.elements.statusFilter) {
            this.elements.statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.filterAndRender();
            });
        }

        // New job modal
        document.getElementById('newJobBtn')?.addEventListener('click', () => {
            this.openJobModal();
        });

        document.getElementById('cancelJobBtn')?.addEventListener('click', () => {
            this.closeJobModal();
        });

        document.getElementById('closeJobModal')?.addEventListener('click', () => {
            this.closeJobModal();
        });

        document.getElementById('jobModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'jobModal') this.closeJobModal();
        });

        document.getElementById('saveJobBtn')?.addEventListener('click', () => {
            this.saveJob();
        });

        // Notes modal
        document.getElementById('closeNotesModal')?.addEventListener('click', () => {
            this.closeNotesModal();
        });

        document.getElementById('notesModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'notesModal') this.closeNotesModal();
        });

        document.getElementById('addNoteBtn')?.addEventListener('click', () => {
            this.addNote();
        });

        document.getElementById('noteInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addNote();
        });
    }

    async loadJobs() {
        try {
            this.jobs = await this.api.getJobs();
            this.filterAndRender();
        } catch (error) {
            console.error('Failed to load jobs:', error);
            UIHelper.showToast('Failed to load jobs', 'error');
            this.jobs = [];
            this.filterAndRender();
        }
    }

    filterAndRender() {
        this.filteredJobs = this.jobs.filter(job => {
            const matchesSearch = !this.searchTerm ||
                job.title.toLowerCase().includes(this.searchTerm) ||
                job.company.toLowerCase().includes(this.searchTerm);
            const matchesStatus = this.statusFilter === 'all' || job.status === this.statusFilter;
            return matchesSearch && matchesStatus;
        });
        this.renderJobs();
    }

    renderJobs() {
        const tbody = this.elements.tbody;
        const empty = this.elements.empty;

        if (this.filteredJobs.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = this.filteredJobs.map(job => `
            <tr>
                <td>${this.escapeHtml(job.company)}</td>
                <td>${this.escapeHtml(job.title)}</td>
                <td>${job.score != null ? Math.round(job.score) + '%' : '—'}</td>
                <td>
                    <select class="glass-select status-select" data-id="${job.id}" style="padding: 4px 8px; font-size: 0.8rem;">
                        ${['saved','applied','interview','offer','rejected'].map(s =>
                            `<option value="${s}" ${s === job.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <button class="glass-btn ghost-btn notes-btn" data-id="${job.id}" style="padding: 4px 8px; font-size: 0.75rem;">
                        <i class="fas fa-sticky-note"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Bind status changes
        tbody.querySelectorAll('.status-select').forEach(el => {
            el.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const status = e.target.value;
                try {
                    await this.api.updateJobStatus(id, status);
                    UIHelper.showToast(`Status updated to ${status}`, 'success');
                    await this.loadJobs();
                } catch (error) {
                    UIHelper.showToast('Failed to update status', 'error');
                }
            });
        });

        // Bind notes buttons
        tbody.querySelectorAll('.notes-btn').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.id;
                this.openNotesModal(id);
            });
        });
    }

    // ============ Job Modal ============
    openJobModal(job = null) {
        const modal = document.getElementById('jobModal');
        modal.classList.add('open');

        if (job) {
            document.getElementById('f-title').value = job.title || '';
            document.getElementById('f-company').value = job.company || '';
            document.getElementById('f-location').value = job.location || '';
            document.getElementById('f-salary').value = job.salary || '';
            document.getElementById('f-url').value = job.url || '';
            document.getElementById('f-description').value = job.description || '';
            modal.dataset.editId = job.id;
        } else {
            ['f-title', 'f-company', 'f-location', 'f-salary', 'f-url', 'f-description'].forEach(id => {
                document.getElementById(id).value = '';
            });
            delete modal.dataset.editId;
        }
    }

    closeJobModal() {
        document.getElementById('jobModal').classList.remove('open');
    }

    async saveJob() {
        const title = document.getElementById('f-title').value.trim();
        const company = document.getElementById('f-company').value.trim();
        const description = document.getElementById('f-description').value.trim();
        const url = document.getElementById('f-url').value.trim();
        const location = document.getElementById('f-location').value.trim() || null;
        const salary = document.getElementById('f-salary').value.trim() || null;

        if (!title || !company || !description || !url) {
            UIHelper.showToast('Title, company, description, and URL are required.', 'error');
            return;
        }

        const payload = { title, company, description, url, location, salary };
        const modal = document.getElementById('jobModal');
        const editId = modal.dataset.editId;

        try {
            if (editId) {
                // Update existing job - you'd need an update endpoint
                UIHelper.showToast('Update not implemented yet', 'warning');
                return;
            }

            await this.api.createJob(payload);
            UIHelper.showToast('Job created successfully!', 'success');
            this.closeJobModal();
            await this.loadJobs();

            // Also refresh dashboard
            if (window.dashboard) {
                window.dashboard.loadData(true);
            }

        } catch (error) {
            UIHelper.showToast(error.message || 'Failed to create job', 'error');
        }
    }

    // ============ Notes Modal ============
    async openNotesModal(jobId) {
        this.currentNoteJobId = jobId;
        const modal = document.getElementById('notesModal');
        modal.classList.add('open');
        await this.loadNotes(jobId);
    }

    closeNotesModal() {
        document.getElementById('notesModal').classList.remove('open');
        this.currentNoteJobId = null;
    }

    async loadNotes(jobId) {
        const list = document.getElementById('notesList');
        list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-secondary);"><div class="spinner"></div></div>';

        try {
            const notes = await this.api.getNotes(jobId);
            if (notes.length === 0) {
                list.innerHTML = `
                    <div style="text-align:center;padding:1rem;color:var(--text-secondary);">
                        <i class="fas fa-sticky-note" style="font-size:1.5rem;display:block;margin-bottom:0.5rem;opacity:0.4;"></i>
                        No notes yet
                    </div>
                `;
                return;
            }

            list.innerHTML = notes.map(n => `
                <div class="note-item">
                    <div class="note-text">${this.escapeHtml(n.note)}</div>
                    <div class="note-time">${UIHelper.timeAgo(n.timestamp)}</div>
                </div>
            `).join('');

        } catch (error) {
            list.innerHTML = `
                <div style="text-align:center;padding:1rem;color:#EF4444;">
                    <i class="fas fa-exclamation-circle"></i>
                    <span> ${this.escapeHtml(error.message)}</span>
                </div>
            `;
        }
    }

    async addNote() {
        const input = document.getElementById('noteInput');
        const text = input.value.trim();
        if (!text || !this.currentNoteJobId) return;

        try {
            await this.api.addNote(this.currentNoteJobId, text);
            input.value = '';
            await this.loadNotes(this.currentNoteJobId);
            UIHelper.showToast('Note added', 'success', 1500);
        } catch (error) {
            UIHelper.showToast('Failed to add note', 'error');
        }
    }

    // ============ Helpers ============
    escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str ?? '';
        return d.innerHTML;
    }

    destroy() {
        // Cleanup if needed
    }
}

window.JobsController = JobsController;
