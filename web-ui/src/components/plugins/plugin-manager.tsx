import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { ShellPlugin } from '../../lib/plugins/plugin-context'
import { PluginEngine } from '../../lib/plugins/plugin-engine'

type Props = {
  context: any
}

export const PluginManagerView: React.FC<Props> = ({ context }) => {
  const engineRef = useRef<PluginEngine | null>(null)
  const [plugins, setPlugins] = useState<ShellPlugin[]>([])
  const [path, setPath] = useState<string>('')

  useEffect(() => {
    const eng = new PluginEngine(context)
    engineRef.current = eng
    setPlugins(eng.getRegistered())
  }, [context])

  const loadPlugin = async () => {
    if (!engineRef.current) return
    try {
      // Resolve relative to this file: web-ui/src/components/plugins/../.. -> web-ui/src/lib/plugins
      await engineRef.current.loadAndRegister(path)
      setPlugins(engineRef.current.getRegistered())
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load plugin', e)
    }
  }

  const activateAll = () => {
    engineRef.current?.activateAll()
  }

  return (
    <div className="plugin-manager" style={{ padding: 12 }}>
      <h3>Plugin Manager</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="Module path (e.g. ./plugins/my-plugin)"
          style={{ flex: 1 }}
        />
        <button onClick={loadPlugin}>Load</button>
        <button onClick={activateAll}>Activate All</button>
      </div>
      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
        {plugins.map((p) => (
          <li key={p.id}>{p.name} <span style={{ color: '#666' }}>({p.id})</span></li>
        ))}
      </ul>
    </div>
  )
}

export default PluginManagerView
