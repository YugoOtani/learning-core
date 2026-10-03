import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('displays the backend health response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('バックエンド応答: ok');
    });

    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:3000/health');
  });
});
