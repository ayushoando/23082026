import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'framer-motion'

afterEach(() => {
  cleanup()
})

// Skip WAAPI animations entirely — unmount-time cancels reject unhandled in
// happy-dom ("AbortError: The animation was canceled") and fail the lane.
MotionGlobalConfig.skipAnimations = true

class IntersectionObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn()
  unobserve = vi.fn()
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

// Reduced motion — framer-motion skips WAAPI animations entirely, which
// prevents happy-dom Animation.cancel AbortError unhandled rejections.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Warm the generator model once per worker before heavy suites run.
// Node builtins are externalized under DOM environments (happy-dom), so the
// fs-heavy model import can only load in node-env suites — skip it otherwise.
try {
  const { getSharedRepoModel } = await import('./helpers/shared-repo-model.mjs')
  getSharedRepoModel()
} catch {
  // DOM-environment suite — the model warm-up is not applicable here.
}
