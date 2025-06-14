class EventSystem {
  eventListeners: any;
  channel: any;

  constructor() {
    this.eventListeners = {};
    this.channel = new BroadcastChannel("global-events");

    window.addEventListener("message", this.handleMessage.bind(this));
    this.channel.addEventListener("message", this.handleBroadcast.bind(this));
  }

  emit(eventName: string, data: any) {
    this.dispatchEvent(eventName, data);

    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      iframe.contentWindow!.postMessage({ eventName, data }, "*");
    });

    if (window.parent && window !== window.parent) {
      window.parent.postMessage({ eventName, data }, "*");
    }

    this.channel.postMessage({ eventName, data });
  }

  handleMessage(event: any) {
    const { eventName, data } = event.data || {};
    if (eventName) {
      this.dispatchEvent(eventName, data);
    }
  }

  handleBroadcast(event: any) {
    const { eventName, data } = event.data || {};
    if (eventName) {
      this.dispatchEvent(eventName, data);
    }
  }

  addEventListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
  ) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
    document.addEventListener(eventName, callback);
  }

  removeEventListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
  ) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(
        (cb: any) => cb !== callback,
      );
      document.removeEventListener(eventName, callback);
    }
  }

  dispatchEvent(eventName: string, data: any) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((callback: Function) =>
        callback(data),
      );
    }
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}

export { EventSystem };
