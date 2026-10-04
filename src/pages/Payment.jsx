import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../context/CartContext';
import { getDeliveryMethods, createOrder } from '../services/orderService';
import { createOrUpdatePaymentIntent } from '../services/paymentService';
import { getErrorMessage } from '../services/api';
import config from '../config';
import { formatPrice } from '../utils/formatters';

const stripePromise = config.stripePublishableKey
  ? loadStripe(config.stripePublishableKey)
  : null;

const PaymentForm = ({
  deliveryMethods,
  deliveryMethodsError,
  deliveryMethodId,
  setDeliveryMethodId,
  deliveryCost,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const {
    cartItems,
    cartTotal,
    basketId,
    saveBasket,
    clearCart,
    syncBasketFromServer,
  } = useCart();
  const navigate = useNavigate();

  const [country, setCountry] = useState('Egypt');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const syncedMethodRef = useRef('');

  const syncWithServer = useCallback(async () => {
    if (!deliveryMethodId) return null;
    const savedBasket = await saveBasket({
      deliveryMethodId: Number(deliveryMethodId),
    });
    const currentBasketId = savedBasket?.id || basketId;
    const intentRes = await createOrUpdatePaymentIntent(currentBasketId);
    const data = intentRes.data;
    syncBasketFromServer(data);
    return data;
  }, [deliveryMethodId, basketId, saveBasket, syncBasketFromServer]);

  useEffect(() => {
    if (!deliveryMethodId || cartItems.length === 0) return;
    if (syncedMethodRef.current === deliveryMethodId) return;
    syncedMethodRef.current = deliveryMethodId;
    syncWithServer().catch(() => {});
  }, [deliveryMethodId, cartItems.length, syncWithServer]);

  const finalTotal = cartTotal + deliveryCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements) {
      setError('Stripe is not configured. Please add your Stripe publishable key.');
      return;
    }
    if (!deliveryMethodId) {
      setError('Please select a delivery method.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setIsProcessing(true);
    try {
      const basketData = await syncWithServer();
      const clientSecret = basketData?.clientSecret;
      if (!clientSecret) {
        throw new Error('No client secret returned from the server.');
      }

      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${firstName} ${lastName}`.trim(),
            email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.paymentIntent?.status !== 'succeeded') {
        setError('Payment was not successful. Please try again.');
        return;
      }

      await createOrder({
        basketId: basketData?.id || basketId,
        deliveryMethodId: Number(deliveryMethodId),
        shipToAddress: {
          firstName,
          lastName,
          city: address,
          street: address,
          country,
        },
      });

      await clearCart();
      setShowModal(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    navigate('/');
  };

  const inputClasses = "w-full bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-gray-400 font-medium text-sm tracking-wide shadow-sm";

  return (
    <>
      <section className="w-full lg:w-7/12 bg-gray-50 p-8 lg:p-16 xl:px-32 xl:py-20 relative">
        <h1 className="font-serif text-4xl mb-10 text-gray-900 font-bold tracking-wide">Payment</h1>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <h2 className="text-xl font-serif mb-4 text-gray-900 font-bold border-b border-gray-200 pb-2">Contact</h2>
            <input
              type="email"
              placeholder="Email or mobile phone number"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <h2 className="text-xl font-serif mb-4 text-gray-900 font-bold border-b border-gray-200 pb-2">Customer Information</h2>
            <div className="space-y-4">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`${inputClasses} cursor-pointer`}
              >
                <option>Egypt</option>
                <option>United States</option>
                <option>United Kingdom</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First name"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <input
                type="text"
                placeholder="Address"
                required
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-serif mb-4 text-gray-900 font-bold border-b border-gray-200 pb-2">Delivery Method</h2>
            {deliveryMethodsError ? (
              <p className="text-sm text-red-500">{deliveryMethodsError}</p>
            ) : deliveryMethods.length === 0 ? (
              <p className="text-sm text-gray-500">Loading delivery methods...</p>
            ) : (
              <div className="space-y-3">
                {deliveryMethods.map((dm) => (
                  <label key={dm.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 cursor-pointer transition-all hover:border-amber-300 has-[:checked]:border-amber-500 has-[:checked]:ring-1 has-[:checked]:ring-amber-500">
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={dm.id}
                        checked={deliveryMethodId === String(dm.id)}
                        onChange={(e) => setDeliveryMethodId(e.target.value)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className="font-bold text-gray-900 tracking-wide">{dm.shortName}</p>
                        <p className="text-xs text-gray-500 mt-1">{dm.description} · {dm.deliveryTime}</p>
                      </div>
                    </div>
                    <span className="text-amber-500 font-bold">{formatPrice(dm.cost)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-serif mb-4 text-gray-900 font-bold border-b border-gray-200 pb-2">Card Details</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#1f2937',
                      '::placeholder': { color: '#9ca3af' },
                    },
                    invalid: { color: '#ef4444' },
                  },
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">All transactions are secure and encrypted.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || cartItems.length === 0}
            className={`w-full py-4 rounded-sm font-serif font-bold text-lg tracking-widest shadow-md transform transition-all duration-300 flex items-center justify-center gap-2
              ${(isProcessing || cartItems.length === 0) ? 'bg-amber-600/70 text-white cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-0.5'}
            `}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PROCESSING SECURE PAYMENT...
              </>
            ) : (
              `PAY ${formatPrice(finalTotal)}`
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest">The Palate Collective Secure Checkout</p>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-full border-[3px] border-amber-500 flex items-center justify-center mb-6 shadow-sm bg-amber-50">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="font-serif text-3xl text-gray-900 font-bold mb-4 tracking-wide">Payment Successful!</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Thank you for your order. We&apos;ve sent your receipt and preparation details to your email.
            </p>
            <Link
              to="/"
              onClick={closeModal}
              className="block w-full bg-gray-900 hover:bg-amber-500 text-white font-bold tracking-widest py-3.5 rounded-sm shadow-md transition-colors duration-300"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

PaymentForm.propTypes = {
  deliveryMethods: PropTypes.array,
  deliveryMethodsError: PropTypes.string,
  deliveryMethodId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setDeliveryMethodId: PropTypes.func.isRequired,
  deliveryCost: PropTypes.number,
};

const Payment = () => {
  const {
    cartItems,
    cartTotal,
    deliveryMethodId: savedDeliveryMethodId,
    shippingPrice,
  } = useCart();
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [deliveryMethodsError, setDeliveryMethodsError] = useState('');
  const [deliveryMethodId, setDeliveryMethodId] = useState('');

  useEffect(() => {
    getDeliveryMethods()
      .then((res) => setDeliveryMethods(res.data || []))
      .catch((err) => setDeliveryMethodsError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (deliveryMethodId || deliveryMethods.length === 0) return;
    const saved = savedDeliveryMethodId
      ? String(savedDeliveryMethodId)
      : null;
    const initial =
      saved && deliveryMethods.some((dm) => dm.id === Number(saved))
        ? saved
        : String(deliveryMethods[0].id);
    setDeliveryMethodId(initial);
  }, [deliveryMethodId, deliveryMethods, savedDeliveryMethodId]);

  const selectedMethod = deliveryMethods.find(
    (dm) => dm.id === Number(deliveryMethodId),
  );
  const deliveryCost = selectedMethod?.cost ?? shippingPrice ?? 0;

  const stripeRender = stripePromise ? (
    <Elements stripe={stripePromise}>
      <PaymentForm
        deliveryMethods={deliveryMethods}
        deliveryMethodsError={deliveryMethodsError}
        deliveryMethodId={deliveryMethodId}
        setDeliveryMethodId={setDeliveryMethodId}
        deliveryCost={deliveryCost}
      />
    </Elements>
  ) : (
    <section className="w-full lg:w-7/12 bg-gray-50 p-8 lg:p-16 xl:px-32 xl:py-20 relative">
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm">
        Stripe is not configured. Add your Stripe publishable key to the .env file
        (VITE_STRIPE_PUBLISHABLE_KEY) and restart the dev server.
      </div>
    </section>
  );

  return (
    <div dir="ltr" className="w-full flex flex-col font-sans relative min-h-screen">

      <main className="flex flex-col-reverse lg:flex-row flex-grow">

        {/* Left Side: Order Summary (Static / Sticky While Right Side Scrolls) */}
        <section className="w-full lg:w-5/12 bg-gray-900 text-white p-8 lg:p-12 xl:p-16 border-t border-amber-500/20 lg:border-t-0 lg:border-r relative lg:h-screen lg:sticky lg:top-0 lg:self-start lg:overflow-y-auto">

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors text-sm font-medium tracking-widest group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            BACK TO MENU
          </Link>

          <h2 className="font-serif text-3xl mt-8 mb-10 tracking-wide">Order summary</h2>

          <div className="space-y-6 lg:max-h-[42vh] lg:overflow-y-auto lg:pr-2" style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto' }}>
            {cartItems.length === 0 ? (
              <p className="text-gray-400">Your order is empty. Please select items from the menu.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-sm object-cover border border-white/10 shadow-md" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-gray-100">{item.name}</h3>
                      <p className="text-sm text-gray-400">Qty {item.qty}</p>
                    </div>
                  </div>
                  <span className="font-medium tracking-wide text-amber-500">
                    {formatPrice((Number(item.price) || 0) * item.qty)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Delivery</span>
              <span>{formatPrice(deliveryCost)}</span>
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
              <span className="text-xl text-white">Total:</span>
              <span className="text-3xl font-bold text-amber-500">
                {formatPrice(cartTotal + deliveryCost)}
              </span>
            </div>
          </div>
        </section>

        {/* Right Side: Payment Form */}
        {stripeRender}
      </main>
    </div>
  );
};

export default Payment;
