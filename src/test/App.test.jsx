import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../context/AppProviders.jsx';
import App from '../App.jsx';

// jsdom doesn't ship IndexedDB, so we stub the repository modules to
// return empty data immediately. The behaviour of the data layer itself
// is covered by planModel.test.js.
vi.mock('../data/planRepository.js', () => ({
  getActivePlan: async () => null,
  savePlan: async (plan) => plan,
  clearPlan: async () => {},
  newId: () => 'test-id',
  makeBlankExercise: () => ({
    id: 'test-id',
    name: '',
    sets: 3,
    reps: 10,
    instructions: '',
    restSeconds: 60,
  }),
}));

vi.mock('../data/historyRepository.js', () => ({
  listSessions: async () => [],
  getSession: async () => null,
  addSession: async (s) => s,
  deleteSession: async () => {},
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('App shell routing', () => {
  it('renders the home page at "/"', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it('renders the plan editor at "/plan"', async () => {
    renderAt('/plan');
    expect(
      await screen.findByRole('heading', { name: /your workout plan/i }),
    ).toBeInTheDocument();
  });

  it('renders the history page at "/history"', async () => {
    renderAt('/history');
    // With no sessions persisted, the page shows the empty-state heading.
    expect(
      await screen.findByRole('heading', { name: /no sessions yet/i }),
    ).toBeInTheDocument();
  });

  it('redirects unknown routes back to "/"', async () => {
    renderAt('/this-does-not-exist');
    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });
});
