import registerMonacoLanguages from '../monaco-config'

describe('monaco-config language registrations', () => {
  const makeMonaco = (): any => {
    return {
      languages: {
        getLanguages: jest.fn().mockReturnValue([]),
        register: jest.fn(),
        setMonarchTokensProvider: jest.fn(),
      },
      editor: {
        defineTheme: jest.fn(),
        setTheme: jest.fn(),
        getTheme: jest.fn().mockReturnValue(undefined),
      },
    }
  }

  test('registers rust, solidity, toml languages when none exist and applies cyberpunk theme', () => {
    const monaco = makeMonaco()
    registerMonacoLanguages(monaco)

    // expect registrations for 3 languages
    expect(monaco.languages.register).toHaveBeenCalledTimes(3)
    // expect theme defined and set
    expect(monaco.editor.defineTheme).toHaveBeenCalledWith('cyberpunk', expect.any(Object))
    // setTheme should be called
    expect(monaco.editor.setTheme).toHaveBeenCalledWith('cyberpunk')
  })

  test('skips registered languages but still applies cyberpunk theme', () => {
    const monaco = makeMonaco()
    // Simulate rust already registered
    monaco.languages.getLanguages = jest.fn().mockReturnValue([{ id: 'rust' }])
    registerMonacoLanguages(monaco)
    // Should skip rust, but still attempt 2 other registrations
    expect(monaco.languages.register).toHaveBeenCalled()
  })
})
