import React, { useState, memo, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useBuvette } from '../hooks/useBuvette';
import { SparklesIcon } from '../components/Icons';

// Initialize Gemini API client
const isApiAvailable = !!process.env.VITE_GEMINI_API_KEY;
const ai = isApiAvailable ? new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY }) : null;

interface Idea {
    name: string;
    description: string;
}

const IdeasPage: React.FC = () => {
    const { products, showToast } = useBuvette();
    const [theme, setTheme] = useState('');
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("L'IA réfléchit...");

    useEffect(() => {
        if (!isLoading) return;

        const messages = [
            "Recherche d'idées pétillantes...",
            "Mélange des saveurs créatives...",
            "Consultation des grimoires de recettes...",
            "Finalisation des suggestions...",
        ];
        let messageIndex = 0;
        
        setLoadingMessage("L'IA réfléchit...");

        const intervalId = setInterval(() => {
            setLoadingMessage(messages[messageIndex]);
            messageIndex = (messageIndex + 1) % messages.length;
        }, 2500);

        return () => clearInterval(intervalId);
    }, [isLoading]);


    const generateIdeas = useCallback(async () => {
        if (!theme) {
            showToast("Veuillez entrer un thème pour la recherche d'idées.", "error");
            return;
        }

        if (!ai) {
            const message = "La clé API pour le service IA n'est pas configurée. Impossible de générer des idées.";
            setNotification({ message, type: 'error' });
            showToast(message, "error");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setNotification(null);
        setIdeas([]);
        
        const existingProducts = products.map(p => p.name).join(', ');
        const prompt = `
            Je gère la buvette d'un événement sur le thème de "${theme}".
            J'ai déjà les produits suivants : ${existingProducts || "aucun produit pour l'instant"}.
            Suggère-moi 5 nouvelles idées de produits (boissons, snacks, confiseries) originales et adaptées à ce thème.
            Pour chaque idée, donne un nom accrocheur et une brève description.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { 
                                    type: Type.STRING,
                                    description: 'Le nom accrocheur de l\'idée de produit.'
                                },
                                description: { 
                                    type: Type.STRING,
                                    description: 'Une brève description attrayante du produit.'
                                }
                            },
                            required: ["name", "description"]
                        }
                    }
                }
            });
            
            const jsonText = response.text;
            if (!jsonText) {
                throw new Error("😅 L'IA a eu un petit hoquet ! Elle n'a pas réussi à générer les idées attendues. Un petit rafraîchissement pourrait régler le problème.");
            }

            const parsedIdeas = JSON.parse(jsonText);
            
            if (!Array.isArray(parsedIdeas)) {
                 throw new Error("🤖 L'IA est un peu confuse et a renvoyé une réponse dans un format étrange. Pouvez-vous réessayer ?");
            }

            if (parsedIdeas.length === 0) {
                 setNotification({ message: "🧐 L'IA a cherché partout, mais n'a trouvé aucune idée pour ce thème. Essayez d'être plus créatif ou un peu plus précis !", type: 'info' });
            }

            setIdeas(parsedIdeas);

        } catch (err) {
            console.error("Error generating ideas:", err);
            
            if (!navigator.onLine) {
                 setNotification({ message: "🤔 Oups, on dirait que votre connexion Internet a fait une pause. Vérifiez-la et réessayez !", type: 'error' });
            } else if (err instanceof Error && (err.message.includes("hoquet") || err.message.includes("confuse"))) {
                setNotification({ message: err.message, type: 'error' });
            } else {
                 setNotification({ message: "🛠️ Oups ! Le générateur d'idées rencontre un problème technique. Veuillez patienter quelques instants avant de réessayer.", type: 'error' });
            }
            showToast("Erreur lors de la génération d'idées.", "error");

        } finally {
            setIsLoading(false);
        }
    }, [theme, products, showToast]);

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
                <SparklesIcon className={`w-16 h-16 mx-auto ${isApiAvailable ? 'text-amber-400' : 'text-slate-600'}`} />
                <h1 className={`text-4xl font-display mt-2 ${isApiAvailable ? 'text-amber-400' : 'text-slate-500'}`}>Générateur d'Idées</h1>
                <p className={`mt-2 ${isApiAvailable ? 'text-slate-400' : 'text-slate-600'}`}>
                    En panne d'inspiration ? Laissez l'IA vous proposer de nouveaux produits !
                </p>
            </div>

            {isApiAvailable ? (
                <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border border-white/10 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Thème de l'événement</label>
                        <input
                            type="text"
                            value={theme}
                            onChange={e => setTheme(e.target.value)}
                            placeholder="ex: Médiéval, Années 80, Science-Fiction..."
                            className="mt-1 block w-full p-2 bg-[#1a1a1a] border-white/20 text-white rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                    </div>
                    <button
                        onClick={generateIdeas}
                        disabled={isLoading}
                        className="w-full bg-amber-500 text-black font-bold py-3 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoading ? 'Génération en cours...' : "Trouver des idées"}
                    </button>
                </div>
            ) : (
                <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border border-red-500/50 text-center">
                    <h2 className="text-xl font-display text-red-300">Fonctionnalité Indisponible</h2>
                    <p className="text-slate-300 mt-2">
                        Le service de génération d'idées par IA n'est pas configuré.
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        (Veuillez renseigner la variable VITE_GEMINI_API_KEY dans votre environnement).
                    </p>
                </div>
            )}

            {notification && (
                <div className={`text-sm p-3 rounded-lg text-center ${
                    notification.type === 'error'
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-sky-900/50 text-sky-300'
                }`}>
                    {notification.message}
                </div>
            )}

            {isLoading && (
                 <div className="text-center py-8">
                    <svg className="animate-spin h-10 w-10 text-amber-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-400 mt-2">{loadingMessage}</p>
                </div>
            )}

            {ideas.length > 0 && (
                <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
                    <h2 className="text-2xl font-display text-slate-200 text-center">Résultats pour "{theme}"</h2>
                    {ideas.map((idea, index) => (
                        <div key={index} className="bg-black/20 p-4 rounded-lg border-l-4 border-amber-500">
                            <h3 className="font-bold text-lg text-amber-300">{idea.name}</h3>
                            <p className="text-slate-300">{idea.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(IdeasPage);
