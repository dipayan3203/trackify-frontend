// ============================================
// UI Module - Toast notifications, helpers
// ============================================

class UIHelper {
    static showToast(message, type = 'info', duration = 3500) {
        const container = document.getElementById('toastContainer') || (() => {
            const c = document.createElement('div');
            c.id = 'toastContainer';
            c.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 380px;
                width: 100%;
                pointer-events: none;
            `;
            document.body.appendChild(c);
            return c;
        })();

        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#8B5CF6',
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            pointer-events: auto;
            padding: 12px 16px;
            border-radius: 12px;
            background: rgba(10, 10, 15, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid ${colors[type] || colors.info}44;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.9rem;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            transform: translateX(calc(100% + 20px));
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: none;
            min-height: 48px;
        `;

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 1.1rem;"></i>
            <span style="flex: 1;">${message}</span>
            <button style="
                background: none;
                border: none;
                color: rgba(255,255,255,0.4);
                cursor: pointer;
                padding: 4px;
                font-size: 1.2rem;
            ">&times;</button>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Close button
        toast.querySelector('button').addEventListener('click', () => {
            UIHelper.closeToast(toast);
        });

        // Auto close
        const timeout = setTimeout(() => {
            UIHelper.closeToast(toast);
        }, duration);

        toast.dataset.timeout = timeout;

        return toast;
    }

    static closeToast(toast) {
        toast.style.transform = 'translateX(calc(100% + 20px))';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }

    // ============ Loading ============
    static showLoading(container, message = 'Loading...') {
        if (!container) return null;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(10, 10, 15, 0.7);
            backdrop-filter: blur(8px);
            border-radius: inherit;
            z-index: 10;
            gap: 12px;
        `;

        overlay.innerHTML = `
            <div class="spinner spinner-lg"></div>
            <span style="color: var(--text-secondary); font-size: 0.9rem;">${message}</span>
        `;

        container.style.position = 'relative';
        container.appendChild(overlay);
        return overlay;
    }

    static hideLoading(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
    }

    // ============ Formatting ============
    static formatNumber(num) {
        if (num === undefined || num === null) return '—';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    static formatDate(date) {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    static formatTime(date) {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    static timeAgo(date) {
        if (!date) return '—';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 10) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return this.formatDate(date);
    }

    static truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    // ============ Copy ============
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success', 1500);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('Failed to copy', 'error', 2000);
            return false;
        }
    }

    // ============ Debounce ============
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

window.UIHelper = UIHelper;
