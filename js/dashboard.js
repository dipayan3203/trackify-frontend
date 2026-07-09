// ============================================
// Dashboard Module - Stats, charts, recommendations
// ============================================

class DashboardController {
    constructor() {
        this.api = getAPI();
        this.updateInterval = null;
        this.isUpdating = false;

        this.elements = {
            statTotal: document.getElementById('statTotal'),
            statTotalBar: document.getElementById('statTotalBar'),
            statInterview: document.getElementById('statInterview'),
            statInterviewBar: document.getElementById('statInterviewBar'),
            statOffer: document.getElementById('statOffer'),
            statOfferBar: document.getElementById('statOfferBar'),
            statScore: document.getElementById('statScore'),
            statScoreBar: document.getElementById('statScoreBar'),
            recentBody: document.getElementById('recentBody'),
            recentEmpty: document.getElementById('recentEmpty'),
            chart: document.getElementById('chart'),
            chartLoading: document.getElementById('chartLoading'),
            recommendedList: document.getElementById('recommendedList'),
            recommendedEmpty: document.getElementById('recommendedEmpty'),
        };

        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshRecent');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('spinning');
                this.loadData(true);
                setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
            });
        }
    }

    async loadData(force = false) {
        if (this.isUpdating && !force) return;
        this.isUpdating = true;

        try {
            const [jobs, matches] = await Promise.all([
                this.api.getJobs(),
                this.api.getMatches().catch(() => []),
            ]);

            this.jobs = jobs;
            this.matches = matches;

            this.renderStats(jobs);
            this.renderRecent(jobs);
            this.renderChart(jobs);
            this.renderRecommendations(matches);

            // Update job count badge
            const badge = document.getElementById('jobsCount');
            if (badge) badge.textContent = jobs.length;

        } catch (error) {
            console.error('Dashboard load error:', error);
            UIHelper.showToast('Failed to load dashboard data', 'error');
        } finally {
            this.isUpdating = false;
        }
    }

    renderStats(jobs) {
        const total = jobs.length;
        const interview = jobs.filter(j => j.status === 'interview').length;
        const offer = jobs.filter(j => j.status === 'offer').length;
        const scored = jobs.filter(j => typeof j.score === 'number');
        const avgScore = scored.length
            ? Math.round(scored.reduce((s, j) => s + j.score, 0) / scored.length)
            : null;

        this.setStat(this.elements.statTotal, total);
        this.setStat(this.elements.statInterview, interview);
        this.setStat(this.elements.statOffer, offer);
        this.setStat(this.elements.statScore, avgScore !== null ? avgScore + '%' : '—');

        this.elements.statTotalBar.style.width = total ? '100%' : '0%';
        this.elements.statInterviewBar.style.width = total ? Math.round((interview / total) * 100) + '%' : '0%';
        this.elements.statOfferBar.style.width = total ? Math.round((offer / total) * 100) + '%' : '0%';
        this.elements.statScoreBar.style.width = avgScore !== null ? avgScore + '%' : '0%';
    }

    setStat(element, value) {
        if (!element) return;
        element.textContent = value;
        // Simple animation effect
        element.style.transform = 'scale(0.8)';
        requestAnimationFrame(() => {
            element.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
            element.style.transform = 'scale(1)';
        });
    }

    renderRecent(jobs) {
        const recent = [...jobs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        const tbody = this.elements.recentBody;
        const empty = this.elements.recentEmpty;

        if (recent.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = recent.map(job => `
            <tr>
                <td>${this.escapeHtml(job.company)}</td>
                <td>${this.escapeHtml(job.title)}</td>
                <td><span class="badge badge-${job.status}">${job.status}</span></td>
                <td>${job.score != null ? Math.round(job.score) + '%' : '—'}</td>
            </tr>
        `).join('');
    }

    renderChart(jobs) {
        const statuses = ['saved', 'applied', 'interview', 'offer', 'rejected'];
        const labels = { saved: 'Saved', applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' };
        const max = Math.max(1, ...statuses.map(s => jobs.filter(j => j.status === s).length));

        const chart = this.elements.chart;
        chart.innerHTML = statuses.map(status => {
            const count = jobs.filter(j => j.status === status).length;
            const pct = Math.round((count / max) * 100);
            return `
                <div class="bar-col">
                    <div class="bar bar-grow" style="height:${Math.max(pct, 2)}%; transition-delay: ${statuses.indexOf(status) * 0.05}s;"></div>
                    <span class="bar-count">${count}</span>
                    <span class="bar-label">${labels[status]}</span>
                </div>
            `;
        }).join('');
    }

    renderRecommendations(matches) {
        const list = this.elements.recommendedList;
        const empty = this.elements.recommendedEmpty;

        const topMatches = matches.slice(0, 5);

        if (topMatches.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = topMatches.map(m => `
            <div class="recommended-job fade-in" style="animation-delay: ${topMatches.indexOf(m) * 0.05}s;">
                <div class="job-info">
                    <h4>${this.escapeHtml(m.title)}</h4>
                    <p>${this.escapeHtml(m.company)}</p>
                </div>
                <div class="job-score">
                    <span class="score-value">${m.score != null ? Math.round(m.score) : '—'}</span>
                    <span class="score-label">fit</span>
                </div>
                <button class="glass-btn apply-btn" data-id="${m.id}">
                    <i class="fas fa-check"></i> Apply
                </button>
            </div>
        `).join('');

        // Bind apply buttons
        list.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                try {
                    await this.api.updateJobStatus(id, 'applied');
                    UIHelper.showToast('Marked as applied!', 'success');
                    this.loadData(true);
                } catch (error) {
                    UIHelper.showToast('Failed to update status', 'error');
                }
            });
        });
    }

    escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str ?? '';
        return d.innerHTML;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

window.DashboardController = DashboardController;
