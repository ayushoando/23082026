import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InteractiveTools } from '@/components/home/InteractiveTools';

vi.mock('@/components/home/PlannerToolsShowcase', () => ({
  PlannerToolsShowcase: (props: {
    title: { lead: string; accent: string };
    kicker: string;
    primaryCta: { label: string; href: string };
    demoAriaLabel?: string;
  }) => (
    <div data-testid="mock-tools-showcase">
      <span>Title: {props.title.lead} - {props.title.accent}</span>
      <span>Kicker: {props.kicker}</span>
      <span>CTA: {props.primaryCta.label} ({props.primaryCta.href})</span>
      <span>Demo aria: {props.demoAriaLabel ?? ''}</span>
    </div>
  )
}));

describe('InteractiveTools Component', () => {
  it('renders PlannerToolsShowcase delegate with correct props', () => {
    render(<InteractiveTools />);

    expect(screen.getByTestId('mock-tools-showcase')).toBeInTheDocument();
    expect(screen.getByText('Title: Design your - workspace')).toBeInTheDocument();
    expect(screen.getByText('Kicker: Workspace planning')).toBeInTheDocument();
    expect(screen.getByText(/Launch planner/)).toBeInTheDocument();
  });

  it('Launch planner CTA targets planner marketing landing', () => {
    render(<InteractiveTools />);
    expect(
      screen.getByText('CTA: Launch planner (/planner)'),
    ).toBeInTheDocument();
  });

  it('exposes WCAG 2.5.3-compliant floor-plan demo accessible name (action verb + visible text)', () => {
    render(<InteractiveTools />);
    // WCAG 2.5.3 Label in Name: accessible name must contain visible text AND action verb.
    // The mock renders: <span>Demo aria: {demoAriaLabel ?? ''}</span>
    // The value comes from en.json home.tools.demoAriaLabel (loaded via makeTranslator in setup.ts).
    const demoAriaEl = screen.getByText((content) =>
      content.startsWith('Demo aria:') && content.includes('Open interactive floor plan demo'),
    );
    expect(demoAriaEl).toBeInTheDocument();
    // Visible label text must be contained in the accessible name (WCAG 2.5.3)
    expect(demoAriaEl.textContent).toContain('Example 10 by 8 metre office floor plan');
    // Action destination must be stated for screen reader users
    expect(demoAriaEl.textContent).toContain('launch planner');
  });
});
