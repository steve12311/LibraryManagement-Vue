type EventName = string;
type EventArgs = unknown[];
type EventListener = (...args: EventArgs) => void;

/**
 * 支持"先发后订阅"的事件总线：emit 时若尚无监听者，事件会被暂存，
 * 待后续 on 时立即回放。适合跨组件解耦场景。
 */
class EventEmitter {
    events: Record<EventName, Set<EventListener>> = {};
    pendingEvent: Record<EventName, EventArgs[]> = {};

    on(event: EventName, fn: EventListener): void {
        if (!this.events[event]) {
            this.events[event] = new Set();
        }
        this.events[event].add(fn);
        if (this.pendingEvent[event]) {
            this.pendingEvent[event].forEach((args) => fn(...args));
            delete this.pendingEvent[event];
        }
    }

    emit(event: EventName, ...args: EventArgs): void {
        if (this.events[event]) {
            this.events[event]?.forEach(fn => fn(...args));
        } else {
            if (!this.pendingEvent[event]) {
                this.pendingEvent[event] = [];
            }
            this.pendingEvent[event].push(args);
        }
    }

    off(event: EventName): void {
        this.events[event]?.clear()
        delete this.pendingEvent[event];
    }
}

export const eventManager = new EventEmitter();
