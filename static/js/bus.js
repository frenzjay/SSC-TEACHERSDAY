const CHANNEL_NAME = 'game_show_bus';

class GameShowBus {
    constructor() {
        this.listeners = new Map();
        this.isSupported = typeof BroadcastChannel !== 'undefined';
        
        if (this.isSupported) {
            this.channel = new BroadcastChannel(CHANNEL_NAME);
            this.channel.onmessage = (event) => this.handleMessage(event.data);
        } else {
            console.warn('[GameShowBus] BroadcastChannel not supported; using localStorage fallback.');
            window.addEventListener('storage', (event) => {
                if (event.key === CHANNEL_NAME && event.newValue) {
                    try {
                        const data = JSON.parse(event.newValue);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('[GameShowBus] Error parsing storage message', e);
                    }
                }
            });
        }
    }

    send(type, payload = {}) {
        const message = {
            type,
            payload,
            timestamp: Date.now()
        };

        if (this.isSupported && this.channel) {
            this.channel.postMessage(message);
        } else {
            localStorage.setItem(CHANNEL_NAME, JSON.stringify({ ...message, _rand: Math.random() }));
        }

        return message;
    }

    on(type, handler) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(handler);
        return () => this.off(type, handler);
    }

    off(type, handler) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).delete(handler);
        }
    }

    handleMessage(data) {
        if (!data || !data.type) return;
        
        if (this.listeners.has(data.type)) {
            this.listeners.get(data.type).forEach(handler => {
                try {
                    handler(data.payload, data.timestamp);
                } catch (err) {
                    console.error(`[GameShowBus] Handler error on ${data.type}:`, err);
                }
            });
        }

        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(handler => {
                try {
                    handler(data.type, data.payload, data.timestamp);
                } catch (err) {
                    console.error(`[GameShowBus] Wildcard handler error:`, err);
                }
            });
        }
    }
}

window.gameBus = new GameShowBus();