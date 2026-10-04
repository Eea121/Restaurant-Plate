import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  getMenuItems,
  getFoodCategories,
} from '../services/menuItemService';
import { getFeedBacks } from '../services/restaurantService';
import { getErrorMessage } from '../services/api';
import { formatPrice, getEffectivePrice, hasActiveOffer } from '../utils/formatters';

const toCartItem = (product) => ({
  id: product.id,
  name: product.name,
  image: product.pictureUrl,
  price: getEffectivePrice(product),
  description: product.description,
  type: product.foodCategory,
});

const Home = () => {
  const { addToCart } = useCart();
  const [specialOffers, setSpecialOffers] = useState([]);
  const [offersError, setOffersError] = useState('');
  const [offersLoading, setOffersLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    getMenuItems({ pageIndex: 1, pageSize: 4, specialOffers: true })
      .then((res) => setSpecialOffers(res.data?.data || []))
      .catch((err) => setOffersError(getErrorMessage(err)))
      .finally(() => setOffersLoading(false));
  }, []);

  useEffect(() => {
    getFoodCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => setCategoriesError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    getFeedBacks({ pageIndex: 1, pageSize: 2 })
      .then((res) => setFeedbacks(res.data?.data || []))
      .catch((err) => setFeedbackError(getErrorMessage(err)));
  }, []);

  const categoryImages = [
    'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=2069&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1974&auto=format&fit=crop',
  ];

  const avatarImages = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
  ];

  return (
    <div dir="ltr" className="w-full font-sans">
      
      {/* Hero Section */}
      <header 
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop')" 
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
          
          {/* Hero Text */}
          <div className="w-full md:w-1/2 z-10 text-white space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-wide drop-shadow-md">
              A Taste You’ll <br /> Always Remember
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-md leading-relaxed">
              Open your favorite style of making gourmet menu and well access your restaurant.
            </p>
            {/* تم إزالة زر الحجز من هنا بناءً على طلبك */}
          </div>

          {/* Hero Image (Plate) */}
          <div className="w-full md:w-1/2 relative z-10 flex justify-center">
            <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full w-72 h-72 md:w-96 md:h-96 mx-auto"></div>
            <img 
              src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2070&auto=format&fit=crop" 
              alt="Delicious Salmon" 
              className="relative w-72 md:w-96 rounded-full shadow-2xl border-4 border-white/10 object-cover aspect-square hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </header>

      {/* Special Offers Section */}
      <section id="menu" className="max-w-7xl mx-auto px-6 md:px-12 py-14 md:py-20">
        {/* Header with See All Button */}
        <div className="flex flex-wrap gap-4 justify-between items-end mb-8 md:mb-12 border-b border-gray-200 pb-4">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-gray-900 font-bold tracking-wide">Special Offers</h2>
          <Link to="/menu" className="text-amber-500 hover:text-amber-600 font-medium tracking-widest text-sm flex items-center gap-2 transition-colors">
            SEE ALL MENU
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {offersError ? (
            <div className="col-span-full text-center text-gray-500 text-sm py-10">
              Special offers are unavailable right now. Please check back later.
            </div>
          ) : offersLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" aria-hidden="true">
                <div className="skeleton h-48 rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-4 w-full" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="skeleton h-5 w-16" />
                    <div className="skeleton h-9 w-9 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : specialOffers.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 text-sm py-10">
              No special offers available right now. Check back soon!
            </div>
          ) : specialOffers.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="relative overflow-hidden h-48">
                <img src={item.pictureUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {hasActiveOffer(item) && (
                  <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full w-12 h-12 flex flex-col items-center justify-center leading-none shadow-md">
                    <span>{Number(item.discountPercentage)}%</span>
                    <span>off</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-gray-900 group-hover:text-amber-500 transition-colors">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-2 mb-4 line-clamp-2">{item.description}</p>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div>
                    {hasActiveOffer(item) ? (
                      <>
                        <span className="block text-gray-400 text-sm line-through">{formatPrice(item.price)}</span>
                        <span className="block text-amber-500 font-bold text-lg -mt-0.5">{formatPrice(getEffectivePrice(item))}</span>
                      </>
                    ) : (
                      <span className="text-amber-500 font-bold text-lg">{formatPrice(item.price)}</span>
                    )}
                    <div className="text-amber-400 text-xs font-medium flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      4.8+
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(toCartItem(item))}
                    className="text-gray-900 hover:text-amber-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 bg-gray-50 hover:bg-amber-50 active:bg-amber-100 p-2 rounded-full touch-manipulation"
                    aria-label="Add to cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white py-14 md:py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-gray-900 text-center font-bold mb-10 md:mb-16 tracking-wide">Categories</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {categoriesError ? (
              <div className="col-span-full text-center text-gray-500 text-sm py-10">
                Categories are unavailable right now. Please check back later.
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 text-sm py-10">
                Loading categories...
              </div>
            ) : (
              categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/menu?typeId=${category.id}`}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="overflow-hidden rounded-full shadow-md group-hover:shadow-2xl transition-all duration-300 w-32 h-32 md:w-48 md:h-48 border-4 border-transparent group-hover:border-amber-500/20">
                    <img
                      src={categoryImages[index % categoryImages.length]}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-gray-900 mt-6 group-hover:text-amber-500 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Customer Feedback Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-14 md:pb-20 pt-4">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-gray-900 text-center font-bold mb-8 md:mb-12 tracking-wide">Customer Feedback</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {feedbackError ? (
            <div className="col-span-full text-center text-gray-500 text-sm py-10">
              Customer feedback is unavailable right now. Please check back later.
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 text-sm py-10">
              No customer feedback yet. Be the first to share your experience!
            </div>
          ) : (
            feedbacks.map((feedback, index) => (
              <div key={feedback.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-start hover:shadow-lg transition-shadow duration-300">
                <img src={avatarImages[index % avatarImages.length]} alt={feedback.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-amber-100" />
                <div>
                  <h4 className="font-serif font-bold text-xl text-gray-900">{feedback.name}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                    <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {feedback.location}
                  </p>
                  <p className="text-sm text-gray-600 italic mb-4 leading-relaxed">
                    &ldquo;{feedback.msg}&rdquo;
                  </p>
                  <div className="text-amber-400 text-sm flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                       <svg key={star} className={`w-4 h-4 ${star <= (feedback.rate || 0) ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
};

export default Home;