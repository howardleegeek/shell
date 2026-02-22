import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import UpgradeWizard from '~/app/components/workbench/UpgradeWizard'
import { upgradeStore } from '~/app/lib/stores/upgrade'

describe('UpgradeWizard', () => {
  test('selects a different upgrade mode updates store', async () => {
    // Ensure initial state
    upgradeStore.reset()
    render(<UpgradeWizard />)
    // The first mode is Transparent by default. Click on UUPS Proxy to change to 'uups'
    const btn = screen.getByText(/UUPS Proxy/i)
    fireEvent.click(btn)
    // Verify store updated
    expect(upgradeStore.getState().upgradeMode).toBe('uups')
  })
})
