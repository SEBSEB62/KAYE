
import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Product } from '../types';
import { SearchIcon, TagIcon } from '../components/Icons';
import Modal from '../components/Modal';
import NumericKeypad from '../components/NumericKeypad';
import ProductImage from '../components/ProductImage';
import { formatCurrency } from '../utils/formatting';
import { useDebounce } from '../hooks/useDebounce';

const MAX_CAROUSEL_ITEMS = 30;
const GRID_PAGE_SIZE = 30;

const MiscSaleModal: React.FC<{ isOpen: boolean; onClose: () => void }> = memo(({ isOpen, onClose }) => {
    const { addMiscSaleToCart, showToast } = useBuvette();
    const [price, setPrice] = useState('');
    const [name, setName] = useState('');

    // Clear state on close
    useEffect(() => {
        if (!isOpen) {
            setPrice('');
            setName('');
        }
    }, [isOpen]);
    
    const handleConfirm = () => {
        const saleAmount = parseFloat(price);
        if (isNaN(saleAmount) || saleAmount <= 0) {
            showToast('Veuillez entrer un montant valide supérieur à zéro.', 'error');
            return;
        }
        if (name.length > 50) {
            showToast('La description ne peut pas dépasser 50 caractères.', 'error');
            return;
        }
        addMiscSaleToCart(saleAmount, name || 'Vente Diverse');
        onClose();
    };
    
     const handleKeypadInput = (key: string) => {
        setPrice(prev => {
            if (key === '.') {
                if (prev.includes('.')) return prev;
                if (prev === '') return '0.';
                return prev + '.';
            }
            if (prev.includes('.')) {
                const decimalPart = prev.split('.')[1];
                if (decimalPart.length >= 2) return prev;
            }
            if (prev === '0' && key !== '.') return key;
            return prev + key;
        });
    };

    const handleKeypadDelete = () => {
        setPrice(prev => prev.slice(0, -1));
    };
    
    // Calculate estimated net
    const currentAmount = parseFloat(price) || 0;
    const sumUpNet = currentAmount - (currentAmount * 0.0175);
    const paypalNet = currentAmount > 0 ? currentAmount - ((currentAmount * 0.029) + 0.35) : 0;


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une Vente Diverse">
            <div className="space-y-4">
                <p className="text-center text-slate-500 dark:text-slate-400">Pour un article non listé (ex: table, emplacement...).</p>
                <div>
                    <label htmlFor="misc-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (optionnel)</label>
                    <input 
                        type="text"
                        id="misc-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: Emplacement B12"
                        className="block w-full p-2 border-white/20 rounded-md shadow-sm bg-white/20 dark:bg-black/40 text-slate-900 dark:text-white"
                        autoFocus
                        maxLength={50}
                    />
                     {name.length > 0 && (
                        <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">{name.length} / 50</p>
                    )}
                </div>
                 <div>
                    <label htmlFor="misc-price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prix (€)</label>
                    <input 
                        type="text" 
                        id="misc-price"
                        readOnly
                        value={price}
                        placeholder="0.00"
                        className="block w-full text-center text-3xl p-2 border-white/20 rounded-md shadow-sm bg-white/20 dark:bg-black/40 text-slate-900 dark:text-white font-sans"
                    />
                     {currentAmount > 0 && (
                        <div className="mt-2 text-xs space-y-1 text-center text-slate-500 dark:text-slate-400 bg-black/10 dark:bg-black/30 p-2 rounded-lg">
                            <p>Net (SumUp): <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(sumUpNet)}</span></p>
                            <p>Net (PayPal): <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Math.max(0, paypalNet))}</span></p>
                        </div>
                    )}
                </div>
                <NumericKeypad
                    onKeyPress={handleKeypadInput}
                    onDelete={handleKeypadDelete}
                    onDone={handleConfirm}
                />
            </div>
        </Modal>
    );
});


const ProductCard: React.FC<{
  product: Product;
  style?: React.CSSProperties;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}> = memo(({ product, style, onClick, className = '' }) => {
  const { settings } = useBuvette();
  const hasStock = product.stock > 0;

    const priceDisplay = settings.tokenMode 
    ? `${product.tokenPrice || 0} Jeton${(product.tokenPrice || 0) > 1 ? 's' : ''}`
    : `${formatCurrency(product.price)}`;

  return (
    <button
      type="button"
      className={`absolute w-40 h-52 flex flex-col overflow-hidden rounded-2xl glass-panel shadow-xl shadow-amber-500/10 transition-all duration-300 text-left 
      ${hasStock ? 'border-white/30 dark:border-white/10' : 'border-red-500/50 opacity-80'} ${className}`}
      style={style}
      aria-label={product.name}
      onDragStart={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={!hasStock}
    >
      <div className={`w-full h-24 flex items-center justify-center overflow-hidden bg-white/40 dark:bg-black/40`}>
        <ProductImage 
            image={product.image}
            alt={product.name}
            className="w-full h-full object-contain pointer-events-none text-4xl"
        />
      </div>

      <div className="flex flex-col p-3 flex-grow bg-white/10 dark:bg-transparent">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</h3>
        <p className="mt-0.5 font-display text-lg text-amber-600 dark:text-amber-400 font-bold">{priceDisplay}</p>
        
        <div className="mt-auto flex-grow flex items-end justify-between">
          <p className={`text-xs font-semibold ${hasStock ? 'text-slate-500 dark:text-slate-400' : 'text-red-500 dark:text-red-300'}`}>
            {hasStock ? `Stock: ${product.stock}` : 'Rupture'}
          </p>
          <div 
            className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm transition-all duration-200 border
            ${ hasStock 
                ? 'border-amber-500 text-amber-600 dark:text-amber-500' 
                : 'border-slate-400 text-slate-500'
            }`}
          >
            Ajouter
          </div>
        </div>
      </div>

      {!hasStock && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] pointer-events-none" aria-hidden="true" />
      )}
    </button>
  );
});


const ProductGridItem: React.FC<{ product: Product }> = memo(({ product }) => {
    const { addToCart, settings } = useBuvette();
    const hasStock = product.stock > 0;

    const handleAddToCart = () => {
        if (hasStock) {
            addToCart(product);
        }
    };

    const priceDisplay = settings.tokenMode
        ? `${product.tokenPrice || 0} Jeton${(product.tokenPrice || 0) > 1 ? 's' : ''}`
        : `${formatCurrency(product.price)}`;

    return (
        <button
            onClick={handleAddToCart}
            disabled={!hasStock}
            className={`glass-panel w-full flex flex-col items-center p-3 rounded-2xl shadow-xl shadow-amber-500/10 transition-all duration-300
            ${hasStock ? 'hover:scale-105' : 'border-red-500/50 opacity-60'}
            focus:outline-none focus:ring-2 focus:ring-amber-500`}
            aria-label={hasStock ? `Ajouter ${product.name} au panier` : `${product.name} en rupture de stock`}
        >
            <div className="w-24 h-24 rounded-lg flex items-center justify-center overflow-hidden bg-white/40 dark:bg-black/40 mb-2">
                <ProductImage
                    image={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain text-4xl"
                />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center truncate w-full">{product.name}</h3>
            <p className="font-display text-lg text-amber-600 dark:text-amber-400 font-bold">{priceDisplay}</p>
            <p className={`text-xs font-semibold ${hasStock ? 'text-slate-500 dark:text-slate-400' : 'text-red-500 dark:text-red-300'}`}>
                {hasStock ? `Stock: ${product.stock}` : 'Rupture'}
            </p>
        </button>
    );
});


const CarouselView: React.FC<{ products: Product[] }> = ({ products }) => {
    const { addToCart } = useBuvette();
    const carouselRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef(0);
    const isDraggingRef = useRef(false);
    const wasDraggedRef = useRef(false);
    const startXRef = useRef(0);
    const startRotationRef = useRef(0);

    const productsToDisplay = products.length > MAX_CAROUSEL_ITEMS 
        ? products.slice(0, MAX_CAROUSEL_ITEMS) 
        : products;

    useEffect(() => {
        if (carouselRef.current) {
            carouselRef.current.style.transition = 'transform 0.5s ease-out';
            carouselRef.current.style.transform = 'rotateY(0deg)';
            rotationRef.current = 0;
        }
    }, [products]);

    const handleInteractionStart = useCallback((clientX: number) => {
        isDraggingRef.current = true;
        wasDraggedRef.current = false;
        startXRef.current = clientX;
        startRotationRef.current = rotationRef.current;
        if (carouselRef.current) {
            carouselRef.current.style.transition = 'none';
        }
    }, []);

    const handleInteractionMove = useCallback((clientX: number) => {
        if (!isDraggingRef.current) return;
        const sensitivity = 0.4;
        const dx = clientX - startXRef.current;
        if (Math.abs(dx) > 5) wasDraggedRef.current = true;
        const newRotation = startRotationRef.current + dx * sensitivity;
        requestAnimationFrame((_timestamp) => {
            if (carouselRef.current) {
                carouselRef.current.style.transform = `rotateY(${newRotation}deg)`;
            }
        });
    }, []);

    const handleInteractionEnd = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        if (carouselRef.current) {
            const currentTransform = carouselRef.current.style.transform;
            const matches = /rotateY\(([^d]+)deg\)/.exec(currentTransform);
            if (matches && matches[1]) {
                rotationRef.current = parseFloat(matches[1]);
            }
            carouselRef.current.style.transition = 'transform 0.5s ease-out';
        }
        setTimeout(() => { wasDraggedRef.current = false; }, 0);
    }, []);

    const onMouseDown = (e: React.MouseEvent) => handleInteractionStart(e.clientX);
    const onMouseMove = (e: React.MouseEvent) => handleInteractionMove(e.clientX);
    const onMouseUp = () => handleInteractionEnd();
    const onMouseLeave = () => { if (isDraggingRef.current) handleInteractionEnd(); };
    const onTouchStart = (e: React.TouchEvent) => handleInteractionStart(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => handleInteractionMove(e.touches[0].clientX);
    const onTouchEnd = () => handleInteractionEnd();

    const radius = 250;
    const angleStep = productsToDisplay.length > 0 ? 360 / productsToDisplay.length : 0;

    const handleCardClick = useCallback((product: Product) => (e: React.MouseEvent) => {
        if (wasDraggedRef.current) {
            e.stopPropagation();
            return;
        }
        if (product.stock > 0) {
            addToCart(product);
        }
    }, [addToCart]);

    return (
        <div 
            className="flex-grow flex items-center justify-center cursor-grab active:cursor-grabbing relative"
            style={{ perspective: '1000px' }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            role="region" aria-roledescription="carousel" aria-label="Carousel de produits"
        >
            <div 
                id="product-carousel"
                ref={carouselRef}
                className="relative w-40 h-52"
                style={{ transformStyle: 'preserve-3d', transform: 'rotateY(0deg)', transition: 'transform 0.5s ease-out' }}
            >
                {productsToDisplay.map((product, index) => {
                    const cardAngle = angleStep * index;
                    const style = {
                        transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
                    };
                    return <ProductCard key={product.id} product={product} style={style} onClick={handleCardClick(product)} />;
                })}
            </div>
            {products.length > MAX_CAROUSEL_ITEMS && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-black/50 px-3 py-1 rounded-full pointer-events-none">
                    {MAX_CAROUSEL_ITEMS} premiers produits affichés.
                </div>
            )}
        </div>
    );
};

const GridView: React.FC<{ products: Product[] }> = ({ products }) => {
    const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);
    const observer = useRef<IntersectionObserver | null>(null);

    const loadMoreRef = useCallback((node: HTMLDivElement) => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + GRID_PAGE_SIZE, products.length));
            }
        });
        if (node) observer.current.observe(node);
    }, [products.length]);

    useEffect(() => {
        setVisibleCount(GRID_PAGE_SIZE);
    }, [products]);

    const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

    return (
        <div className="flex-grow overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {visibleProducts.map(product => (
                    <ProductGridItem key={product.id} product={product} />
                ))}
            </div>
            {visibleCount < products.length && (
                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </div>
    );
};

const SalePage: React.FC = () => {
  const { products, settings } = useBuvette();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMiscSaleModalOpen, setMiscSaleModalOpen] = useState(false);
  
  const categories: string[] = ['all', ...settings.categories];
  
  const filteredProducts = useMemo(() => products.filter(product => {
      const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
      const searchMatch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return categoryMatch && searchMatch;
  }), [products, selectedCategory, debouncedSearchTerm]);

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-4xl font-display text-center flex-shrink-0 text-amber-500 dark:text-amber-400 mb-4 drop-shadow-sm">Faire une Vente</h1>
      
      {/* Sticky controls */}
      <div className="sticky top-0 z-10 py-2 space-y-4 mb-4 backdrop-blur-md bg-white/10 dark:bg-black/20 rounded-xl px-2">
        <div className="relative flex-shrink-0">
          <label htmlFor="search-product" className="sr-only">Rechercher un produit</label>
          <input
              id="search-product"
              type="search"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white border-2 border-white/20 focus:border-amber-500 rounded-xl shadow-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-slate-500 dark:placeholder-slate-400"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" aria-hidden="true">
              <SearchIcon className="w-6 h-6" />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-full transition-colors"
              aria-label="Effacer la recherche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-shrink-0">
          <div className="flex space-x-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
              {categories.map(category => (
                  <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap shadow-md border-2
                          ${selectedCategory === category
                              ? 'bg-amber-500 text-black border-amber-500 scale-105'
                              : 'bg-white/40 dark:bg-[#2a2a2a] text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-[#3a3a3a] border-slate-300 dark:border-slate-700'
                          }`
                      }
                  >
                      {category === 'all' ? 'Tous' : category}
                  </button>
              ))}
          </div>
        </div>
      
        <div className="flex-shrink-0">
          <button
              onClick={() => setMiscSaleModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white/20 dark:bg-transparent text-amber-600 dark:text-amber-400 border-2 border-amber-500/50 dark:border-amber-400 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-500/20 transition-all transform hover:scale-105 font-display text-lg"
          >
              <TagIcon className="w-6 h-6" />
              + Vente Diverse
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow flex flex-col min-h-0">
        {filteredProducts.length > 0 ? (
            settings.uiMode === 'grid' 
            ? <GridView products={filteredProducts} />
            : <CarouselView products={filteredProducts} />
          ) : (
              <div className="flex-grow flex items-center justify-center text-center py-10 px-4 text-slate-500 dark:text-slate-400 glass-panel rounded-xl">
                  <div>
                      <p className="text-4xl">😥</p>
                      <p className="text-2xl font-display text-slate-700 dark:text-slate-300 mt-2">Oups !</p>
                      <p className="mt-2">Aucun produit ne correspond à votre recherche.</p>
                  </div>
              </div>
          )}
      </div>
        
      <MiscSaleModal isOpen={isMiscSaleModalOpen} onClose={() => setMiscSaleModalOpen(false)} />
    </div>
  );
};

export default React.memo(SalePage);
