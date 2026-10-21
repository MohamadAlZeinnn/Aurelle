// Demo-mode session token only. In live mode the server must manage the session with an
// httpOnly cookie, so nothing sensitive is readable from JavaScript.
const KEY = 'luma.demo.session';

export const demoSession = {
  get() {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) window.localStorage.setItem(KEY, token);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  },
};
