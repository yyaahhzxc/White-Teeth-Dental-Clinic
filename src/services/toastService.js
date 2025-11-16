// src/services/toastService.js

const toastService = {
  show: (message, type = 'success') => {
    const event = new CustomEvent('showGlobalToast', {
      detail: { message, type },
    });
    window.dispatchEvent(event);
  },
};

export default toastService;
