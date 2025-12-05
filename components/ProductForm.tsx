
import React, { useState, useEffect, useRef, memo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Product } from '../types';
import { compressImage } from '../utils/image';
import ProductImage from './ProductImage';
import { PlusIcon } from './Icons';
import Modal from './Modal';

interface ProductFormProps {
  product?: Partial<Product>;
  onDone: () => void;
}

// --- COMPOSANT EXTRAIT (Sorti du composant principal pour éviter les re-rendus destructeurs) ---
const CategoryCreationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}> = memo(({ isOpen, onClose, onCreate }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            setNewCategoryName(''); // Reset on open
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (newCategoryName.trim()) {
            onCreate(newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if inside a form
            handleSubmit();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Catégorie">
            <div className="space-y-4">
                <p className="text-slate-400 text-sm">Ajoutez une nouvelle catégorie pour classer vos produits.</p>
                <input 
                    ref={inputRef}
                    type="text" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: Bijoux, Soins..." 
                    className="mt-1 block w-full p-2 bg-[#1a1a1a] border border-white/20 text-white rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="px-4 py-2 text-slate-300 hover:bg-white/10 rounded-lg"
                    >
                        Annuler
                    </button>
                    <button 
                        type="button"
                        onClick={handleSubmit} 
                        disabled={!newCategoryName.trim()} 
                        className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50"
                    >
                        Créer
                    </button>
                </div>
            </div>
        </Modal>
    );
});


// --- COMPOSANT PRINCIPAL ---
const ProductForm: React.FC<ProductFormProps> = ({ product, onDone }) => {
  const { addProduct, updateProduct, settings, setSettings, showToast } = useBuvette();
  
  const getInitialFormData = () => ({
    name: '',
    price: 0,
    purchasePrice: 0,
    tokenPrice: 0,
    stock: 0,
    category: settings.categories[0] || 'Divers',
    image: '❓',
    packageUnit: '',
    servingsPerPackage: 0,
    laborTimeMinutes: 0,
    ...product,
  });
  
  const [formData, setFormData] = useState<Partial<Product>>(getInitialFormData());
  const [imagePreview, setImagePreview] = useState<Blob | string | null>(formData.image || null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialData = getInitialFormData();
    setFormData(initialData);
    setImagePreview(initialData.image || '❓');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty string for temporary input state, but treat as 0 on submission.
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedBlob = await compressImage(e.target.files[0]);
        setFormData(prev => ({ ...prev, image: compressedBlob }));
        setImagePreview(compressedBlob);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur lors du traitement de l\'image.', 'error');
      }
    }
  };

  const handleCreateCategory = (newCat: string) => {
      if (settings.categories.includes(newCat)) {
          showToast("Cette catégorie existe déjà.", "error");
          return;
      }

      // Update settings with new category
      setSettings(prev => ({
          ...prev,
          categories: [...prev.categories, newCat]
      }));

      // Select it immediately
      setFormData(prev => ({ ...prev, category: newCat }));
      setIsCategoryModalOpen(false);
      showToast(`Catégorie "${newCat}" ajoutée !`, "success");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || formData.price == null || formData.stock == null) {
      showToast('Les champs Nom, Prix de vente et Stock sont obligatoires.', 'error');
      return;
    }

    const finalData: Omit<Product, 'id'> = {
      name: formData.name,
      price: Number(formData.price || 0),
      purchasePrice: Number(formData.purchasePrice || 0),
      tokenPrice: Number(formData.tokenPrice || 0),
      stock: Number(formData.stock || 0),
      image: formData.image || '❓',
      category: formData.category || (settings.categories[0] || 'Divers'),
      packageUnit: formData.packageUnit,
      servingsPerPackage: Number(formData.servingsPerPackage || 0),
      laborTimeMinutes: Number(formData.laborTimeMinutes || 0),
    };

    if (product?.id) {
      updateProduct({ ...finalData, id: product.id });
    } else {
      addProduct(finalData);
    }
    onDone();
  };
  
  const inputStyles = "mt-1 block w-full p-2 bg-[#1a1a1a] border border-white/20 text-white rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500";
  
  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0 border border-white/10">
          {imagePreview && <ProductImage image={imagePreview} alt="Aperçu" className="w-full h-full object-contain text-4xl" />}
        </div>
        <div className="flex-grow space-y-2">
          <label className="block text-sm font-medium text-slate-300">Image ou Emoji</label>
          <input type="text" name="image" value={typeof formData.image === 'string' ? formData.image : ''} onChange={handleChange} placeholder="collez un emoji ici" className={inputStyles} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`${inputStyles} text-center cursor-pointer w-full`}>
            Charger une image
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300">Nom du produit</label>
        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputStyles} required />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300">Catégorie</label>
        <div className="flex gap-2">
            <select name="category" value={formData.category} onChange={handleChange} className={inputStyles}>
            {settings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button 
                type="button" 
                onClick={() => setIsCategoryModalOpen(true)}
                className="mt-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-md border border-white/20 text-white"
                title="Créer une catégorie"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Prix de Vente (€)</label>
          <input type="number" name="price" value={formData.price ?? ''} onChange={handleNumberChange} className={inputStyles} required step="0.01" min="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Prix d'Achat (€)</label>
          <input type="number" name="purchasePrice" value={formData.purchasePrice ?? ''} onChange={handleNumberChange} className={inputStyles} step="0.01" min="0" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300">Stock</label>
          <input type="number" name="stock" value={formData.stock ?? ''} onChange={handleNumberChange} className={inputStyles} required step="1" min="0" />
        </div>
        
        {settings.tokenMode && (
          <div>
            <label className="block text-sm font-medium text-slate-300">Prix en Jetons</label>
            <input type="number" name="tokenPrice" value={formData.tokenPrice ?? ''} onChange={handleNumberChange} className={inputStyles} step="1" min="0" />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-slate-300">Temps de travail estimé (minutes)</label>
            <input type="number" name="laborTimeMinutes" value={formData.laborTimeMinutes ?? ''} onChange={handleNumberChange} className={inputStyles} step="1" min="0" />
            <p className="text-xs text-slate-500 mt-1">Saisissez le temps moyen pour fabriquer/préparer une unité (ex: 30).</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-slate-300">Unité (ex: pack de 6)</label>
            <input type="text" name="packageUnit" value={formData.packageUnit || ''} onChange={handleChange} className={inputStyles} />
        </div>
        <div>
            <label className="block text-sm font-medium text-slate-300">Portions/paquet</label>
            <input type="number" name="servingsPerPackage" value={formData.servingsPerPackage ?? ''} onChange={handleNumberChange} className={inputStyles} step="1" min="0" />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-4">
        <button type="button" onClick={onDone} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-slate-700 transition">
          Annuler
        </button>
        <button type="submit" className="bg-amber-500 text-black font-bold py-2 px-4 rounded-full shadow-lg hover:bg-amber-600 transition">
          Enregistrer
        </button>
      </div>
    </form>

    <CategoryCreationModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        onCreate={handleCreateCategory}
    />
    </>
  );
};

export default memo(ProductForm);
