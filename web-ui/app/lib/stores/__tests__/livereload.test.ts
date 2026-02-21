import { liveReloadEnabled, liveReloadStatus, lastDeployAddress, deployTo } from '../livereload'

describe('LiveReload stores', () => {
  test('toggle enabled', () => {
    let got: boolean | undefined
    const unsub = liveReloadEnabled.subscribe((v: boolean) => {
      got = v
    })
    // enable
    liveReloadEnabled.set(true)
    expect(got).toBe(true)
    unsub()
  })

  test('deployTo updates address and status to ready', async () => {
    let addr = ''
    const unsubAddr = lastDeployAddress.subscribe((a: string) => {
      addr = a
    })
    let st: string = ''
    const unsubSt = liveReloadStatus.subscribe((s: any) => {
      st = s
    })

    await deployTo('0xABCDEF')

    expect(addr).toBe('0xABCDEF')
    expect(st).toBe('ready')

    unsubAddr()
    unsubSt()
  })
})
