import { liveReloadEnabled, liveReloadStatus, lastDeployAddress, simulateFileChange, resetLiveReload } from '../../app/lib/stores/livereload'

describe('LiveReload (simplified)', () => {
  beforeEach(() => {
    resetLiveReload()
  })

  test('initial state', () => {
    expect(liveReloadEnabled.get()).toBe(false)
    expect(liveReloadStatus.get()).toBe('idle')
    expect(lastDeployAddress.get()).toBeNull()
  })

  test('pipeline runs on simulated file change when enabled', async () => {
    // enable and drive timers manually
    // @ts-ignore
    liveReloadEnabled.set(true as any)
    expect(liveReloadEnabled.get()).toBe(true)

    jest.useFakeTimers()
    simulateFileChange()
    // advance 1s debounce + 0.1s + 0.3s for deploy steps
    jest.advanceTimersByTime(1400)
    // allow microtasks to flush
    await Promise.resolve()
    // status should be ready and an address deployed
    expect(liveReloadStatus.get()).toBe('ready')
    expect(lastDeployAddress.get()).not.toBeNull()
  })
})
