// src/services/toastService.js

const toastService = {
  show: (message, severity = 'success') => {
    const event = new CustomEvent('showGlobalToast', {
      detail: { message, severity },
    });
    window.dispatchEvent(event);
  },
};

export default toastService;
