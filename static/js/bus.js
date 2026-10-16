class GameShowBus {
    constructor() {
        this.listeners = new Map();
        this.closed = false;
        this.requests = new Set();
        this.clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        this.sequence = 0;
        this.cursor = null;
        this.outbox = [];
        this.sending = false;
        this.ready = false;
        this.needsSync = true;
        this.received = new Set();
        this.poll();
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.ready) this.requestSync();
        });
    }

    async request(url, options = {}) {
        const abort = new AbortController();
        this.requests.add(abort);
        const timer = setTimeout(() => abort.abort(), 25000);
        try {
            const response = await fetch(url, { ...options, signal: abort.signal, cache: 'no-store' });
            if (!response.ok) throw new Error(`Event relay: HTTP ${response.status}`);
            return await response.json();
        } finally {
            clearTimeout(timer);
            this.requests.delete(abort);
        }
    }

    close() {
        this.closed = true;
        for (const request of this.requests) request.abort();
    }

    connectionStatus(connected) {
        let status = document.getElementById('network-status');
        if (!status && document.body) {
            status = document.createElement('div');
            status.id = 'network-status';
            status.setAttribute('role', 'status');
            status.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:10000;background:#842029;color:white;padding:8px 12px;border-radius:6px;font:14px sans-serif;pointer-events:none';
            document.body.appendChild(status);
        }
        if (status) {
            status.textContent = connected ? '' : 'Connection lost — reconnecting…';
            status.hidden = connected;
        }
    }

    requestSync() {
        this.send('SYNC_REQUEST', { clientId: this.clientId });
    }

    async poll() {
        while (!this.closed) {
            try {
                const query = this.cursor ? `?cursor=${encodeURIComponent(this.cursor)}` : '';
                const batch = await this.request(`/api/events${query}`);
                this.cursor = batch.cursor;
                this.ready = true;
                this.connectionStatus(true);
                for (const message of batch.events) {
                    if (message.clientId === this.clientId || this.received.has(message.id)) continue;
                    this.received.add(message.id);
                    if (this.received.size > 1024) this.received.delete(this.received.values().next().value);
                    this.handleMessage(message);
                }
                this.flush();
                if (batch.reset || this.needsSync) {
                    this.needsSync = false;
                    this.requestSync();
                    this.handleMessage({ type: 'NETWORK_CONNECTED', payload: {} });
                }
            } catch (error) {
                if (this.closed) return;
                this.ready = false;
                this.needsSync = true;
                this.cursor = null;
                this.connectionStatus(false);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    send(type, payload = {}) {
        if (type === 'SYNC_REQUEST' || type === 'STAGE_READY') {
            payload = { ...payload, clientId: this.clientId };
        }
        const message = {
            id: `${this.clientId}:${++this.sequence}`, clientId: this.clientId,
            type, payload, timestamp: Date.now()
        };
        if (this.outbox.length >= 128) this.outbox.splice(this.sending ? 1 : 0, 1);
        this.outbox.push(JSON.stringify(message));
        this.flush();
        return message;
    }

    async flush() {
        if (this.closed || this.sending || !this.ready) return;
        this.sending = true;
        try {
            while (!this.closed && this.outbox.length && this.ready) {
                const body = this.outbox[0];
                if (Date.now() - JSON.parse(body).timestamp > 10000) {
                    this.outbox.shift();
                    this.needsSync = true;
                    continue;
                }
                await this.request('/api/events', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body
                });
                this.outbox.shift();
            }
        } catch (error) {
            this.ready = false;
            this.needsSync = true;
            this.cursor = null;
            this.connectionStatus(false);
        } finally {
            this.sending = false;
        }
    }

    on(type, handler) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(handler);
        return () => this.off(type, handler);
    }

    off(type, handler) {
        this.listeners.get(type)?.delete(handler);
    }

    handleMessage(data) {
        if (!data || !data.type) return;
        if (data.payload?.targetClientId && data.payload.targetClientId !== this.clientId) return;
        for (const handler of this.listeners.get(data.type) || []) {
            try { handler(data.payload, data.timestamp); }
            catch (error) { console.error(`[GameShowBus] ${data.type}:`, error); }
        }
        for (const handler of this.listeners.get('*') || []) {
            try { handler(data.type, data.payload, data.timestamp); }
            catch (error) { console.error('[GameShowBus] Listener:', error); }
        }
    }
}

window.gameBus = new GameShowBus();
