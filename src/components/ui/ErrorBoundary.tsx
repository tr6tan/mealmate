import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg px-6 z-[9999]">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold text-text1 mb-1">Erreur de rendu</p>
            <p className="text-xs font-mono text-red-500 bg-red-50 rounded-xl px-4 py-3 text-left break-all max-h-40 overflow-auto">
              {error.message}
            </p>
            <p className="text-xs text-muted mt-3 font-mono break-all max-h-40 overflow-auto">
              {error.stack?.split('\n').slice(0, 5).join('\n')}
            </p>
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="px-6 py-3 rounded-2xl text-white text-sm font-extrabold"
            style={{ background: '#D23D2D' }}
          >
            Recharger l'app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
