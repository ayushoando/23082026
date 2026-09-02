import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      label: "Select Language",
      english: "English",
      hindi: "हिन्दी",
      hindiFull: "हिन्दी (Hindi)",
    })[key] ?? key,
}));

describe('LanguageSwitcher Component', () => {
  let mockCookieStore: Record<string, string> = {};
  const originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie');
  const originalReload = window.location.reload;
  const mockReload = vi.fn();

  beforeEach(() => {
    mockCookieStore = {};

    Object.defineProperty(document, 'cookie', {
      get: () =>
        Object.entries(mockCookieStore)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      set: (val: string) => {
        const [kv] = val.split(';');
        const [k, v] = kv.split('=');
        mockCookieStore[k.trim()] = v.trim();
      },
      configurable: true,
    });

    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
    Object.defineProperty(window, 'location', {
      value: {
        reload: originalReload,
      },
      writable: true,
      configurable: true,
    });
  });

  it('defaults to en when no cookie is set', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('reads NEXT_LOCALE cookie on mount and selects matching language', async () => {
    mockCookieStore['NEXT_LOCALE'] = 'hi';

    render(<LanguageSwitcher />);

    await waitFor(() => {
      const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
      expect(select.value).toBe('hi');
    });
  });

  it('sets NEXT_LOCALE cookie and reloads window on change select option', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'hi' } });

    expect(mockCookieStore['NEXT_LOCALE']).toBe('hi');
    expect(mockReload).toHaveBeenCalled();
    expect(select.value).toBe('hi');
  });

  it('renders compact header variant with English and Hindi only', () => {
    render(<LanguageSwitcher variant="header" />);

    expect(screen.getByRole("group", { name: "Select Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveAttribute("aria-pressed", "false");
  });

  it('keeps header language control at 44px touch height', () => {
    render(<LanguageSwitcher variant="header" />);

    expect(screen.getByRole("button", { name: "English" }).className).toMatch(/min-h-11/);
    expect(screen.getByRole("button", { name: "English" }).className).toMatch(/touch-manipulation/);
  });

  it('sets NEXT_LOCALE cookie and reloads from the header toggle', () => {
    render(<LanguageSwitcher variant="header" />);
    fireEvent.click(screen.getByRole("button", { name: "हिन्दी" }));
    expect(mockCookieStore['NEXT_LOCALE']).toBe('hi');
    expect(mockReload).toHaveBeenCalled();
  });

  it('keeps footer language control at 44px touch height', () => {
    render(<LanguageSwitcher variant="footer" />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select.className).toMatch(/min-h-11/);
  });

  it('does not reuse a static id across two footer instances', () => {
    const { container } = render(
      <>
        <LanguageSwitcher />
        <LanguageSwitcher />
      </>,
    );
    const selects = container.querySelectorAll('select');
    expect(selects).toHaveLength(2);
    expect(selects[0].id).toBeTruthy();
    expect(selects[1].id).toBeTruthy();
    expect(selects[0].id).not.toBe(selects[1].id);
  });
});
