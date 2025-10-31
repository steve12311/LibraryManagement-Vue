class EventEmitter {
    events: { [key: string]: Set<(...args: any[]) => void> } = {};
    pendingEvent: { [key: string]: any[] } = {};

    on(event: string, fn: (...args: any[]) => void): void {
        if (!this.events[event]) {
            this.events[event] = new Set();
        }
        this.events[event].add(fn);
        if (this.pendingEvent[event]) {
            this.pendingEvent[event].forEach((args) => fn(...args));
            delete this.pendingEvent[event];
        }
    }

    emit(event: string, ...args: any[]): void {
        if (this.events[event]) {
            this.events[event]?.forEach(fn => fn(...args));
        } else {
            if (!this.pendingEvent[event]) {
                this.pendingEvent[event] = [];
            }
            this.pendingEvent[event].push(args);
        }
    }

    off(event: string): void {
        this.events[event]?.clear()
    }
}

export const eventManager = new EventEmitter();