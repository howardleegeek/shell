import { simpleMerge, createPresence } from '../../collab/core'

describe('collab core', () => {
  test('simpleMerge uses remote when provided', () => {
    const local = 'local content'
    const remote = 'remote content'
    expect(simpleMerge(local, remote)).toBe(remote)
  })

  test('simpleMerge returns local when remote is undefined', () => {
    const local = 'only local'
    // @ts-ignore
    expect(simpleMerge(local, undefined)).toBe(local)
  })

  test('createPresence returns correct shape', () => {
    const p = createPresence('id1', 'Alice', true, '/path/file.ts')
    expect(p).toEqual({ id: 'id1', name: 'Alice', editing: true, filePath: '/path/file.ts' })
  })
})
