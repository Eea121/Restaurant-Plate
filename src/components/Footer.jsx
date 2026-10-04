import { useState } from 'react';
import { Link } from 'react-router-dom'; // التعديل 1: استدعاء Link
import { addFeedback } from '../services/restaurantService';
import { getErrorMessage } from '../services/api';

const Footer = () => {
  const [formStatus, setFormStatus] = useState('idle');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [msg, setMsg] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const resetFeedbackForm = () => {
    setName('');
    setLocation('');
    setMsg('');
    setRating(5);
    setHoverRating(0);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setError('');

    try {
      await addFeedback({ name, location, msg, rate: rating });
      setFormStatus('success');
      resetFeedbackForm();

      setTimeout(() => {
        setFormStatus('idle');
      }, 3000);
    } catch (err) {
      setFormStatus('idle');
      setError(getErrorMessage(err));
    }
  };

  return (
    <footer dir="ltr" className="bg-gray-900 text-white pt-16 pb-8 border-t-[4px] border-amber-500 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

        {/* Restaurant Info */}
        <div className="lg:col-span-1">
          <div className="mb-6">
            <h3 className="font-serif text-2xl font-bold tracking-wider text-white">
              THE PALATE
            </h3>
            <p className="text-amber-500 text-xs tracking-[0.3em] mt-1">COLLECTIVE</p>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed pr-4">
            Our mission is to create professional, premium, and unforgettable dining experiences across our carefully curated locations.
          </p>
          
          {/* Social Icons */}
          <div className="flex gap-4 mt-6">
            <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>

        {/* Branches */}
        {/* التعديل 2: تحويل الروابط للـ Branches */}
        <div>
          <h4 className="font-serif text-lg font-bold mb-5 tracking-wide text-white">Branches</h4>
          <ul className="text-sm text-gray-400 space-y-3">
            <li><Link to="/branches" className="hover:text-amber-500 transition-colors">El Tahrir Restaurant</Link></li>
            <li><Link to="/branches" className="hover:text-amber-500 transition-colors">Heliopolis Restaurant</Link></li>
            <li><Link to="/branches" className="hover:text-amber-500 transition-colors">Maadi Restaurant</Link></li>
          </ul>
        </div>

        {/* Details */}
        {/* التعديل 3: تحويل روابط التفاصيل */}
        <div>
          <h4 className="font-serif text-lg font-bold mb-5 tracking-wide text-white">Details</h4>
          <ul className="text-sm text-gray-400 space-y-3">
            <li><Link to="/menu" className="hover:text-amber-500 transition-colors">Menu</Link></li>
            <li><Link to="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link></li>
            <li><Link to="/reservation" className="hover:text-amber-500 transition-colors">Reservations</Link></li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-serif text-lg font-bold mb-5 tracking-wide text-white">Contact Us</h4>
          <ul className="text-sm text-gray-400 space-y-4">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              {/* الروابط الخاصة بالاتصال المباشر (tel: و mailto:) بتفضل <a> زي ما هي */}
              <a href="tel:+2011387290" className="hover:text-white transition-colors">+20 113 87290</a>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <a href="mailto:restaurant@gmail.com" className="hover:text-white transition-colors">restaurant@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 border-t border-white/10 pt-12 mb-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-serif text-2xl md:text-3xl font-bold tracking-wide text-white">Share Your Experience</h3>
            <p className="text-amber-500 text-xs tracking-[0.3em] mt-2 uppercase">Leave a review</p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">

            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    >
                      <svg className={`w-7 h-7 transition-colors ${active ? 'text-amber-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-gray-400 tracking-widest uppercase">{rating} / 5</span>
            </div>

            {/* Name + Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="YOUR NAME"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-colors text-sm tracking-wide"
              />
              <input
                type="text"
                placeholder="YOUR LOCATION (OPTIONAL)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-colors text-sm tracking-wide"
              />
            </div>

            {/* Message */}
            <textarea
              rows="3"
              placeholder="TELL US ABOUT YOUR EXPERIENCE"
              required
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-colors text-sm tracking-wide resize-none"
            ></textarea>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-sm text-center">
                {error}
              </div>
            )}

            {formStatus === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-300 text-sm px-4 py-3 rounded-sm text-center">
                Thank you! Your review has been submitted for approval.
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={formStatus !== 'idle'}
                className={`px-10 py-3 rounded-sm font-serif font-bold text-sm tracking-widest uppercase shadow-md transform transition-all duration-300
                  ${formStatus === 'idle' ? 'bg-amber-500 hover:bg-amber-600 text-gray-900 hover:-translate-y-0.5' : ''}
                  ${formStatus === 'sending' ? 'bg-amber-600/50 text-gray-300 cursor-not-allowed' : ''}
                `}
              >
                {formStatus === 'sending' ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
        <p>Copyright © 2026 The Palate Collective. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0 font-medium tracking-wide">
          <Link to="/" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
          <Link to="/" className="hover:text-white transition-colors">TERMS OF USE</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
