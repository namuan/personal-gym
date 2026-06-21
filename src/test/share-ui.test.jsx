import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from '../context/AppProviders.jsx';
import PlanEditorPage from '../pages/PlanEditorPage.jsx';
import SharePage from '../pages/SharePage.jsx';
import { encodePlanToPayload } from '../data/shareCodec.js';

// jsdom doesn't ship IndexedDB. Stub the repository so the share UI
// can be exercised in isolation.
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

function renderPlanEditor() {
  return render(
    <MemoryRouter initialEntries={['/plan']}>
      <AppProviders>
        <Routes>
          <Route path="/plan" element={<PlanEditorPage />} />
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

function renderSharePage() {
  return render(
    <MemoryRouter initialEntries={['/share']}>
      <AppProviders>
        <Routes>
          <Route path="/share" element={<SharePage />} />
          <Route path="/plan" element={<PlanEditorPage />} />
          <Route path="/" element={<div data-testid="home">home</div>} />
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('PlanEditorPage — share button gating', () => {
  it('disables Share when there is no plan loaded yet', async () => {
    renderPlanEditor();
    const share = await screen.findByRole('button', { name: /^share$/i });
    expect(share).toBeDisabled();
  });
});

describe('SharePage — preview + import', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/share');
    window.location.hash = '';
  });

  it('shows a friendly error when there is no data in the hash', async () => {
    renderSharePage();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/invalid or corrupted/i);
  });

  it('shows a friendly error when the payload is corrupt', async () => {
    window.location.hash = '#data=***not-base64***';
    renderSharePage();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/invalid or corrupted/i);
  });

  it('renders a preview and imports on click', async () => {
    const user = userEvent.setup();
    const payload = await encodePlanToPayload({
      exercises: [
        { id: 'x', name: 'Push-ups', sets: 3, reps: 10, instructions: '', restSeconds: 60, order: 0 },
        { id: 'y', name: 'Squats',  sets: 4, reps: 12, instructions: '', restSeconds: 90, order: 1 },
      ],
    });
    window.location.hash = `#data=${payload}`;
    renderSharePage();

    expect(await screen.findByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Squats')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /import this plan/i }));

    // After import, the editor page is rendered.
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /your workout plan/i }),
      ).toBeInTheDocument();
    });
  });

  it('cancel navigates back to home', async () => {
    const user = userEvent.setup();
    const payload = await encodePlanToPayload({
      exercises: [
        { id: 'x', name: 'Lunges', sets: 3, reps: 10, instructions: '', restSeconds: 60, order: 0 },
      ],
    });
    window.location.hash = `#data=${payload}`;
    renderSharePage();

    expect(await screen.findByText('Lunges')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });
  });
});
