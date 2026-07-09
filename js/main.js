// ============================================
// Main Entry Point - Initializes all modules
// ============================================

(function() {
    'use strict';

    // ============ Configuration ============
    const CONFIG = {
        refreshInterval: 30000, // 30 seconds
    };

    // ============ State ============
    let dashboard = null;
    let jobs = null;
    let isConnected = false;

    // ============ DOM References ============
    const elements = {
        statusDot: document.getElementById('statusDot'),
        connDot: document.getElementById('connDot'),
        connLabel: document.getElementById('connLabel'),
        connectionStatus: document.getElementById('connectionStatus'),
        latencyValue: document.getElementById('latencyValue'),
        apiBase: document.getElementById('apiBase'),
        apiKey: document.getElementById('apiKey'),
        connectBtn: document.getElementById('connectBtn'),
        connectionDetailStatus: document.getElementById('connectionDetailStatus'),
        uploadArea: document.getElementById('uploadArea'),
        resumeFile: document.getElementById('resumeFile'),
        uploadBtn: document.getElementById('uploadBtn'),
        uploadResumeBtn: document.getElementById('uploadResumeBtn'),
        resumeStatus: document.getElementById('resumeStatus'),
        settingsToggle: document.getElementById('settingsToggle'),
        hamburger: document.getElementById('hamburger'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        sidebarClose: document.getElementById('sidebarClose'),
        navLinks: document.querySelectorAll('.nav-link'),
        themeBtns: document.querySelectorAll('.theme-btn'),
    };

    // ============ Initialization ============
    function init() {
        console.log('🚀 Trackify v1.0.0');
        console.log('📦 Initializing...');

        // Load saved settings
        loadSettings();

        // Initialize API
        const api = getAPI();

        // Initialize modules
        dashboard = new DashboardController();
        jobs = new JobsController();
        window.dashboard = dashboard;

        // Bind UI events
        bindEvents();

        // Test connection
        testConnection();

        // Auto-refresh
        setInterval(() => {
            if (isConnected) {
                dashboard.loadData(true);
                jobs.loadJobs();
            }
        }, CONFIG.refreshInterval);

        console.log('✅ Trackify ready');
    }

    // ============ Settings ============
    function loadSettings() {
        const base = localStorage.getItem('trackify_api_base') || '';
        const key = localStorage.getItem('trackify_api_key') || '';
        if (elements.apiBase) elements.apiBase.value = base;
        if (elements.apiKey) elements.apiKey.value = key;
    }

    function saveSettings(base, key) {
        localStorage.setItem('trackify_api_base', base);
        localStorage.setItem('trackify_api_key', key);
        getAPI().setBaseURL(base);
        getAPI().setApiKey(key);
    }

    // ============ Connection ============
    async function testConnection() {
        try {
            const api = getAPI();
            const base = api.baseURL;
            if (!base) {
                setConnectionStatus(false, 'Not configured');
                return;
            }

            await api.health();
            setConnectionStatus(true, 'Connected');
            isConnected = true;

            // Load data
            dashboard.loadData(true);
            jobs.loadJobs();

        } catch (error) {
            setConnectionStatus(false, error.message);
            isConnected = false;
        }
    }

    function setConnectionStatus(online, message = '') {
        const dot = elements.statusDot || elements.connDot;
        const label = elements.connLabel;
        const status = elements.connectionStatus;
        const detail = elements.connectionDetailStatus;

        if (dot) {
            dot.className = 'status-dot' + (online ? ' online' : '');
            if (dot.id === 'connDot') {
                dot.className = 'conn-dot' + (online ? ' online' : '');
            }
        }

        if (label) {
            label.textContent = online ? 'Connected' : (message || 'Disconnected');
        }

        if (status) {
            status.className = 'status-indicator' + (online ? ' online' : ' offline');
            status.innerHTML = `<i class="fas fa-circle"></i> ${online ? 'Connected' : 'Disconnected'}`;
        }

        if (detail) {
            detail.className = 'status-value' + (online ? ' online' : ' offline');
            detail.textContent = online ? 'Online' : (message || 'Offline');
        }
    }

    // ============ Events ============
    function bindEvents() {
        // Connect button
        elements.connectBtn?.addEventListener('click', async () => {
            const base = elements.apiBase.value.trim();
            const key = elements.apiKey.value.trim();

            if (!base) {
                UIHelper.showToast('Please enter an API URL', 'error');
                return;
            }

            saveSettings(base, key);
            UIHelper.showToast('Connecting...', 'info', 1500);
            await testConnection();
            if (isConnected) {
                UIHelper.showToast('Connected successfully!', 'success');
            } else {
                UIHelper.showToast('Connection failed. Check your API URL.', 'error');
            }
        });

        // Theme
        elements.themeBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                applyTheme(theme);
                localStorage.setItem('trackify_theme', theme);
            });
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('trackify_theme') || 'purple';
        elements.themeBtns?.forEach(btn => {
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active');
            }
        });
        applyTheme(savedTheme);

        // Sidebar toggle (mobile)
        elements.hamburger?.addEventListener('click', () => {
            elements.sidebar?.classList.add('open');
            elements.sidebarOverlay?.classList.add('open');
        });

        elements.sidebarClose?.addEventListener('click', () => {
            elements.sidebar?.classList.remove('open');
            elements.sidebarOverlay?.classList.remove('open');
        });

        elements.sidebarOverlay?.addEventListener('click', () => {
            elements.sidebar?.classList.remove('open');
            elements.sidebarOverlay?.classList.remove('open');
        });

        // Settings toggle
        elements.settingsToggle?.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
            document.getElementById('view-settings')?.classList.add('active');
            const settingsLink = document.querySelector('.nav-link[data-view="settings"]');
            if (settingsLink) settingsLink.classList.add('active');
            document.getElementById('pageTitle').textContent = 'Settings';
            document.getElementById('pageSubtitle').textContent = 'Configure your connection and preferences';
            // Close sidebar on mobile
            elements.sidebar?.classList.remove('open');
            elements.sidebarOverlay?.classList.remove('open');
        });

        // Navigation
        elements.navLinks?.forEach(link => {
            link.addEventListener('click', () => {
                const view = link.dataset.view;
                elements.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                document.getElementById(`view-${view}`)?.classList.add('active');

                // Update page title
                const titles = {
                    dashboard: ['Dashboard', 'Overview of your job applications'],
                    jobs: ['Jobs', 'Manage your job applications'],
                    settings: ['Settings', 'Configure your connection and preferences'],
                };
                const [title, subtitle] = titles[view] || ['Trackify', ''];
                document.getElementById('pageTitle').textContent = title;
                document.getElementById('pageSubtitle').textContent = subtitle;

                // Close sidebar on mobile
                elements.sidebar?.classList.remove('open');
                elements.sidebarOverlay?.classList.remove('open');
            });
        });

        // Resume upload
        elements.uploadBtn?.addEventListener('click', () => {
            elements.resumeFile?.click();
        });

        elements.uploadArea?.addEventListener('click', () => {
            elements.resumeFile?.click();
        });

        elements.uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.uploadArea.classList.add('dragover');
        });

        elements.uploadArea?.addEventListener('dragleave', () => {
            elements.uploadArea.classList.remove('dragover');
        });

        elements.uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                elements.resumeFile.files = e.dataTransfer.files;
                handleResumeUpload();
            }
        });

        elements.resumeFile?.addEventListener('change', handleResumeUpload);

        elements.uploadResumeBtn?.addEventListener('click', handleResumeUpload);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K = Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                elements.searchInput?.focus();
            }

            // Escape = Close modals
            if (e.key === 'Escape') {
                document.getElementById('jobModal')?.classList.remove('open');
                document.getElementById('notesModal')?.classList.remove('open');
            }
        });
    }

    // ============ Theme ============
    function applyTheme(theme) {
        const colors = {
            purple: { primary: '#8B5CF6', dark: '#7C3AED', light: '#A78BFA' },
            blue: { primary: '#3B82F6', dark: '#2563EB', light: '#60A5FA' },
            emerald: { primary: '#10B981', dark: '#059669', light: '#34D399' },
            pink: { primary: '#EC4899', dark: '#DB2777', light: '#F472B6' },
        };

        const color = colors[theme] || colors.purple;
        document.documentElement.style.setProperty('--purple', color.primary);
        document.documentElement.style.setProperty('--purple-dark', color.dark);
        document.documentElement.style.setProperty('--purple-light', color.light);
    }

    // ============ Resume Upload ============
    async function handleResumeUpload() {
        const fileInput = elements.resumeFile;
        const file = fileInput?.files?.[0];

        if (!file) {
            UIHelper.showToast('Please select a PDF file', 'warning');
            return;
        }

        if (file.type !== 'application/pdf') {
            UIHelper.showToast('Please upload a PDF file', 'error');
            return;
        }

        try {
            UIHelper.showToast('Uploading and processing resume...', 'info', 3000);
            const api = getAPI();
            await api.uploadResume(file);

            UIHelper.showToast('Resume uploaded successfully!', 'success');

            // Update status
            const status = await api.getResumeStatus();
            updateResumeStatus(status);

        } catch (error) {
            UIHelper.showToast(error.message || 'Failed to upload resume', 'error');
        }
    }

    async function loadResumeStatus() {
        try {
            const api = getAPI();
            const status = await api.getResumeStatus();
            updateResumeStatus(status);
        } catch (error) {
            // Silent fail
        }
    }

    function updateResumeStatus(status) {
        const el = elements.resumeStatus;
        if (!el) return;

        if (status.chunks_embedded) {
            el.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--emerald);"></i>
                <span>${status.chunks_embedded} chunks embedded</span>
                ${status.last_uploaded_at ? `<span style="color: var(--text-muted);">· ${UIHelper.timeAgo(status.last_uploaded_at)}</span>` : ''}
            `;
        } else {
            el.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>No resume uploaded</span>
            `;
        }
    }

    // ============ Latency Updates ============
    async function updateLatency() {
        try {
            const api = getAPI();
            if (!api.baseURL) return;
            const start = performance.now();
            await api.health();
            const latency = Math.round(performance.now() - start);
            if (elements.latencyValue) {
                elements.latencyValue.textContent = latency;
            }
        } catch (error) {
            if (elements.latencyValue) {
                elements.latencyValue.textContent = '--';
            }
        }
    }

    setInterval(updateLatency, 5000);

    // ============ Online/Offline ============
    window.addEventListener('online', () => {
        UIHelper.showToast('Back online', 'success');
        testConnection();
    });

    window.addEventListener('offline', () => {
        UIHelper.showToast('You are offline', 'warning', 4000);
        setConnectionStatus(false, 'Offline');
    });

    // ============ Page Visibility ============
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isConnected) {
            dashboard.loadData(true);
            jobs.loadJobs();
        }
    });

    // ============ Error Handling ============
    window.addEventListener('error', (event) => {
        console.error('Unhandled error:', event.error || event.message);
        if (event.error?.message?.includes('API')) {
            UIHelper.showToast('API error - check your connection', 'error');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled rejection:', event.reason);
        if (event.reason?.message) {
            UIHelper.showToast(event.reason.message, 'error');
        }
    });

    // ============ Start ============
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============ Debug Helper ============
    window.__trackify = {
        version: '1.0.0',
        getAPI,
        dashboard: () => dashboard,
        jobs: () => jobs,
        refresh: () => {
            dashboard?.loadData(true);
            jobs?.loadJobs();
        },
        connect: testConnection,
    };

    console.log('ℹ️ Use window.__trackify for debugging');

})();
