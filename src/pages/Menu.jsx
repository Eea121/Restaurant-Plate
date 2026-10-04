import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getMenuItems, getFoodCategories } from '../services/menuItemService';
import { getErrorMessage } from '../services/api';
import { formatPrice, getEffectivePrice, hasActiveOffer } from '../utils/formatters';

const PAGE_SIZE = 8;

const toCartItem = (product) => ({
  id: product.id,
  name: product.name,
  image: product.pictureUrl,
  price: getEffectivePrice(product),
  description: product.description,
  type: product.foodCategory,
});

const Menu = () => {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getFoodCategories()
      .then((res) => {
        setCategories(res.data || []);
        const categoryParam = searchParams.get('typeId');
        if (
          categoryParam &&
          (res.data || []).some((category) => category.id === Number(categoryParam))
        ) {
          setActiveCategoryId(Number(categoryParam));
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      getMenuItems({
        typeId: activeCategoryId || undefined,
        search: search.trim() || undefined,
        sort: sort || undefined,
        pageIndex,
        pageSize: PAGE_SIZE,
      })
        .then((res) => {
          if (cancelled) return;
          setMenuItems(res.data.data);
          setTotalCount(res.data.count);
        })
        .catch((err) => {
          if (!cancelled) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategoryId, search, sort, pageIndex]);

  const handleCategoryChange = (categoryId) => {
    setActiveCategoryId(categoryId);
    setPageIndex(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div dir="ltr" className="w-full bg-gray-50 min-h-screen pb-20">

      <div
        className="relative text-white py-24 text-center bg-cover bg-center bg-no-repeat border-b border-amber-500/20"
        style={{
          backgroundImage: "linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')"
        }}
      >
        <div className="relative z-10">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide drop-shadow-md">Our Curated Menu</h1>
          <p className="text-amber-500 text-xs tracking-[0.3em] mt-4 font-medium">THE PALATE EXPERIENCE</p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 pt-10 md:pt-16 pb-6 md:pb-10">
        <div className="flex overflow-x-auto justify-start md:justify-center gap-6 md:gap-12 pb-4 -mx-6 px-6 border-b border-gray-200 scrollbar-hide snap-x">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`font-serif text-lg md:text-xl font-bold pb-2 transition-all duration-300 whitespace-nowrap border-b-2 snap-start ${
              activeCategoryId === null
                ? 'text-gray-950 border-amber-500'
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`font-serif text-lg md:text-xl font-bold pb-2 transition-all duration-300 whitespace-nowrap border-b-2 snap-start ${
                activeCategoryId === category.id
                  ? 'text-gray-950 border-amber-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-gray-400 font-medium text-sm tracking-wide shadow-sm"
            />
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPageIndex(1); }}
              className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-sm focus:outline-none focus:border-amber-500 font-medium text-sm tracking-wide shadow-sm cursor-pointer w-full sm:w-auto"
            >
              <option value="">Sort by</option>
              <option value="NameAsc">Name (A-Z)</option>
              <option value="NameDesc">Name (Z-A)</option>
              <option value="PriceAsc">Price (Low to High)</option>
              <option value="PriceDesc">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 min-h-[50vh]">
        {error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="skeleton h-56 rounded-none" />
                <div className="p-6 space-y-3">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="flex justify-between items-center pt-3">
                    <div className="skeleton h-6 w-20" />
                    <div className="skeleton h-9 w-9 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No dishes found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {menuItems.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-1"
              >
                <div className="overflow-hidden relative h-56">
                  <img
                    src={product.pictureUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500"></div>
                  {hasActiveOffer(product) && (
                    <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      {Number(product.discountPercentage)}% OFF
                    </div>
                  )}
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-gray-900 group-hover:text-amber-500 transition-colors duration-300 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="text-[11px] uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-3 py-1 font-medium">
                        {product.foodCategory}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-6">
                    {hasActiveOffer(product) ? (
                      <div>
                        <span className="block text-gray-400 text-sm line-through">{formatPrice(product.price)}</span>
                        <span className="block text-amber-500 font-bold text-xl -mt-0.5">{formatPrice(getEffectivePrice(product))}</span>
                      </div>
                    ) : (
                      <p className="text-amber-500 font-bold text-xl">{formatPrice(product.price)}</p>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(toCartItem(product));
                      }}
                      className="p-1.5 -m-1.5 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 lg:bg-transparent lg:text-gray-900 lg:p-0 lg:m-0 lg:hover:bg-transparent lg:hover:text-amber-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 touch-manipulation"
                      aria-label="Add to cart"
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !loading && menuItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {menuItems.length} of {totalCount} dishes
            </p>
            <div className="flex gap-3 w-full sm:w-auto justify-center">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex === 1}
                className="px-5 py-2.5 rounded-sm text-sm font-medium tracking-wider border border-gray-200 bg-white text-gray-700 hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                PREV
              </button>
              <span className="px-4 py-2.5 text-sm font-medium text-gray-700">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex === totalPages}
                className="px-5 py-2.5 rounded-sm text-sm font-medium tracking-wider border border-gray-200 bg-white text-gray-700 hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default Menu;
