class EventSystemSW {
  constructor() {
    this.serviceWorker = navigator.serviceWorker.controller;
    this.channel = new BroadcastChannel("global-events");

    if (this.serviceWorker) {
      this.serviceWorker.addEventListener(
        "message",
        this.handleServiceWorkerMessage.bind(this),
      );
    }

    this.channel.addEventListener("message", this.handleBroadcast.bind(this));
  }

  emit(eventName, data) {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ eventName, data });
    }

    this.channel.postMessage({ eventName, data });
  }

  handleServiceWorkerMessage(event) {
    const { eventName, data } = event.data || {};
    if (eventName) {
      this.dispatchEvent(eventName, data);
    }
  }

  handleBroadcast(event) {
    const { eventName, data } = event.data || {};
    if (eventName) {
      this.dispatchEvent(eventName, data);
    }
  }

  addEventListener(eventName, callback) {
    document.addEventListener(eventName, callback);
  }

  removeEventListener(eventName, callback) {
    document.removeEventListener(eventName, callback);
  }

  dispatchEvent(eventName, data) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}
