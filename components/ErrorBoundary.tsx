import React, { ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// FIX: Extend React.Component directly to ensure correct typing for props and state methods.
class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare state to satisfy strict TypeScript configurations
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Met à jour l'état pour que le prochain rendu affiche l'interface de secours.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logue l'erreur vers un service de rapport d'erreurs ou simplement la console.
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Affiche l'interface de secours personnalisée.
      return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-[#1a1a1a]">
          <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-red-500/50 max-w-lg w-full">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto" />
            <h1 className="text-3xl font-display text-red-300 mt-4">Oups ! Une erreur est survenue.</h1>
            <p className="text-slate-300 mt-4">
              Notre application a rencontré un problème inattendu. Ne vous inquiétez pas, vos données sont probablement en sécurité. Veuillez essayer de rafraîchir la page pour continuer.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-8 w-full max-w-sm bg-amber-500 text-black font-bold py-3 px-8 rounded-full shadow-lg text-lg font-display hover:bg-amber-600 transform hover:scale-105 transition-all duration-300"
            >
              Rafraîchir la page
            </button>
            <details className="mt-6 text-left text-xs text-slate-400 bg-black/30 p-3 rounded-lg">
              <summary className="cursor-pointer font-semibold hover:text-white">Détails techniques</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono">
                {this.state.error?.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
