import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});
