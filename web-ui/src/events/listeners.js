// Lightweight in-memory event store and export helpers for tests.

class EventStore {
  constructor() {
    this.events = [];
    this.subscribers = new Set();
  }
  addEvent(evt) {
    if (!evt || typeof evt !== 'object' || typeof evt.name !== 'string' || typeof evt.timestamp !== 'number') {
      throw new Error('Invalid event');
    }
    this.events.push(Object.assign({}, evt));
    // Notify subscribers
    for (const sub of this.subscribers) {
      try {
        sub(evt);
      } catch (e) {
        // ignore subscriber errors
      }
    }
  }
  getEvents() {
    return this.events.map(e => Object.assign({}, e));
  }
  clear() {
    this.events = [];
  }
  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
}

function eventsToJSON(events) {
  return JSON.stringify(events);
}

function eventsToCSV(events) {
  const header = ['timestamp', 'name', 'txHash', 'params'];
  const rows = events.map(ev => {
    const params = JSON.stringify(ev.params ?? {});
    // Escape double quotes in params
    const esc = s => String(s).replace(/"/g, '""');
    return [ev.timestamp, ev.name, ev.txHash ?? '', esc(params)].join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

module.exports = {
  EventStore,
  eventsToJSON,
  eventsToCSV
};
