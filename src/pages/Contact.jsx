import { useState } from 'react';
import { createContactUs } from '../services/restaurantService';
import { getErrorMessage } from '../services/api';

const Contact = () => {
  const [formStatus, setFormStatus] = useState('idle');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setError('');

    const payload = {
      fullName,
      contactEmail: email,
      phoneNumber,
      message,
    };

    try {
      await createContactUs(payload);
      setFormStatus('success');
      resetForm();

      setTimeout(() => {
        setFormStatus('idle');
      }, 3000);
    } catch (err) {
      setFormStatus('idle');
      setError(getErrorMessage(err));
    }
  };

  return (
    <div dir="ltr" className="w-full bg-white flex flex-col font-sans">
      
      {/* Header Section */}
      <div 
        className="relative text-white py-20 text-center bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop')" 
        }}
      >
        <div className="relative z-10">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide drop-shadow-md">Get in Touch</h1>
          <p className="text-amber-500 text-xs tracking-[0.3em] mt-4 font-medium uppercase">We&apos;d love to hear from you</p>
        </div>
      </div>

      {/* Main Split Section - استخدمنا Grid لضمان التناسق التام */}
      <main className="w-full grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Information */}
        <section 
          className="relative flex items-center justify-center p-8 md:p-16 bg-cover bg-center"
          style={{ 
            backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')" 
          }}
        >
          {/* Glass Panel Light - نفس عرض الكارت اليمين بالظبط */}
          <div className="bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl p-8 md:p-12 w-full max-w-md text-center shadow-2xl transition-transform hover:-translate-y-1 duration-500">
            
            <div className="space-y-8">
              {/* Item: Phone */}
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-amber-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <h3 className="font-serif text-lg font-bold tracking-wider text-gray-900">CALL US</h3>
                <p className="text-sm text-gray-700 mt-1 font-medium">+20 113 87290</p>
                <p className="text-xs text-gray-500 mt-1">Mon-Sat 5PM-11PM</p>
              </div>

              {/* Item: Email */}
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-amber-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <h3 className="font-serif text-lg font-bold tracking-wider text-gray-900">EMAIL</h3>
                <p className="text-sm text-gray-700 mt-1 font-medium">restaurant@gmail.com</p>
              </div>

              {/* Item: Location */}
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-amber-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <h3 className="font-serif text-lg font-bold tracking-wider text-gray-900">VISIT US</h3>
                <p className="text-sm text-gray-700 mt-1 font-medium">El Tahrir Square,</p>
                <p className="text-sm text-gray-700 font-medium">Cairo, Egypt</p>
              </div>
            </div>

          </div>
        </section>

        {/* Right Side: Contact Form */}
        <section className="flex items-center justify-center p-8 md:p-16 bg-gray-50 border-l border-gray-100">
          
          <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-12 w-full max-w-md shadow-xl transition-transform hover:-translate-y-1 duration-500">
            <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-8 text-center font-bold tracking-wide">Send a Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <input 
                  type="text" 
                  placeholder="FULL NAME" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors placeholder-gray-400 font-medium text-sm tracking-wide"
                />
              </div>
              
              <div>
                <input 
                  type="email" 
                  placeholder="EMAIL ADDRESS" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors placeholder-gray-400 font-medium text-sm tracking-wide"
                />
              </div>

              <div>
                <input 
                  type="tel" 
                  placeholder="PHONE NUMBER"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors placeholder-gray-400 font-medium text-sm tracking-wide"
                />
              </div>

              <div>
                <textarea 
                  rows="4" 
                  placeholder="MESSAGE / SPECIAL REQUEST" 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors placeholder-gray-400 font-medium text-sm tracking-wide resize-none"
                ></textarea>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={formStatus !== 'idle'}
                className={`w-full py-4 rounded-sm font-serif font-bold text-lg tracking-widest shadow-md transform transition-all duration-300 flex items-center justify-center gap-2
                  ${formStatus === 'idle' ? 'bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-0.5' : ''}
                  ${formStatus === 'sending' ? 'bg-amber-600/70 text-white cursor-not-allowed' : ''}
                  ${formStatus === 'success' ? 'bg-green-600 text-white' : ''}
                `}
              >
                {formStatus === 'idle' && 'SUBMIT REQUEST'}
                
                {formStatus === 'sending' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SENDING...
                  </>
                )}
                
                {formStatus === 'success' && (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    REQUEST RECEIVED
                  </>
                )}
              </button>
            </form>

          </div>
        </section>

      </main>
    </div>
  );
};

export default Contact;