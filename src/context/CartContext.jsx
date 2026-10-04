import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  getBasket,
  createOrUpdateBasket,
  deleteBasket,
} from '../services/basketService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const BASKET_KEY = 'basket_id';

const generateBasketId = () => {
  const id = crypto.randomUUID
    ? crypto.randomUUID()
    : `basket-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(BASKET_KEY, id);
  return id;
};

const toBasketItem = (item) => ({
  id: item.id,
  productName: item.name || item.productName || '',
  pictureUrl: item.image || item.pictureUrl || '',
  price: Number(item.price) || 0,
  quantity: item.qty || 1,
  type: item.type || item.productType || '',
});

const toCartItem = (basketItem) => ({
  id: basketItem.id,
  name: basketItem.productName,
  productName: basketItem.productName,
  image: basketItem.pictureUrl,
  pictureUrl: basketItem.pictureUrl,
  price: Number(basketItem.price) || 0,
  qty: basketItem.quantity,
  quantity: basketItem.quantity,
  type: basketItem.type,
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [basketId, setBasketId] = useState(
    () => localStorage.getItem(BASKET_KEY) || '',
  );
  const [deliveryMethodId, setDeliveryMethodId] = useState(null);
  const [shippingPrice, setShippingPrice] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loadingBasket, setLoadingBasket] = useState(false);
  const initializedRef = useRef(false);
  const basketIdRef = useRef(basketId);

  const getOrCreateBasketId = useCallback(() => {
    if (basketIdRef.current) return basketIdRef.current;
    const id = generateBasketId();
    basketIdRef.current = id;
    setBasketId(id);
    return id;
  }, []);

  const pushBasket = useCallback(
    async (items, id, overrides = {}) => {
      try {
        const payload = {
          id,
          items: items.map(toBasketItem),
          deliveryMethodId:
            overrides.deliveryMethodId !== undefined
              ? overrides.deliveryMethodId
              : deliveryMethodId,
          shippingPrice:
            overrides.shippingPrice !== undefined
              ? overrides.shippingPrice
              : shippingPrice,
          ...(overrides.paymentIntentId !== undefined
            ? { paymentIntentId: overrides.paymentIntentId }
            : paymentIntentId
              ? { paymentIntentId }
              : {}),
          ...(overrides.clientSecret !== undefined
            ? { clientSecret: overrides.clientSecret }
            : clientSecret
              ? { clientSecret }
              : {}),
        };
        const res = await createOrUpdateBasket(payload);
        const data = res.data;
        if (data && data.deliveryMethodId !== undefined) {
          setDeliveryMethodId(data.deliveryMethodId);
        }
        if (data && data.shippingPrice !== undefined) {
          setShippingPrice(data.shippingPrice);
        }
        return data;
      } catch {
        return null;
      }
    },
    [deliveryMethodId, shippingPrice, paymentIntentId, clientSecret],
  );

  useEffect(() => {
    if (!initializedRef.current) return;
    // After clearCart there is intentionally no basket id and no items.
    // Skip the sync so an empty basket is NOT auto-created on the server (L8).
    if (cartItems.length === 0 && !basketIdRef.current) return;
    const id = getOrCreateBasketId();
    pushBasket(cartItems, id);
  }, [cartItems, getOrCreateBasketId, pushBasket]);

  useEffect(() => {
    const loadBasket = async () => {
      if (!basketId) {
        initializedRef.current = true;
        setLoadingBasket(false);
        return;
      }
      setLoadingBasket(true);
      try {
        const res = await getBasket(basketId);
        const data = res.data;
        if (data && Array.isArray(data.items)) {
          setCartItems(data.items.map(toCartItem));
          setDeliveryMethodId(data.deliveryMethodId ?? null);
          setShippingPrice(data.shippingPrice ?? null);
          setPaymentIntentId(data.paymentIntentId ?? null);
          setClientSecret(data.clientSecret ?? null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          localStorage.removeItem(BASKET_KEY);
          basketIdRef.current = '';
          setBasketId('');
        }
      } finally {
        initializedRef.current = true;
        setLoadingBasket(false);
      }
    };
    loadBasket();
  }, [basketId]);

  const addToCart = (item) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1, quantity: i.qty + 1 } : i,
        );
      }
      return [{ ...item, qty: 1, quantity: 1 }, ...prevItems];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((i) =>
        i.id === id ? { ...i, qty, quantity: qty } : i,
      ),
    );
  };

  const clearCart = async () => {
    const currentId = basketIdRef.current;
    if (currentId) {
      try {
        await deleteBasket(currentId);
      } catch {
        // best-effort cleanup
      }
    }
    localStorage.removeItem(BASKET_KEY);
    basketIdRef.current = '';
    setBasketId('');
    setCartItems([]);
    setDeliveryMethodId(null);
    setShippingPrice(null);
    setPaymentIntentId(null);
    setClientSecret(null);
  };

  const syncBasketFromServer = useCallback((basketData) => {
    if (!basketData || !Array.isArray(basketData.items)) return null;
    if (basketData.deliveryMethodId !== undefined && basketData.deliveryMethodId !== null) {
      setDeliveryMethodId(basketData.deliveryMethodId);
    }
    if (basketData.shippingPrice !== undefined && basketData.shippingPrice !== null) {
      setShippingPrice(basketData.shippingPrice);
    }
    if (basketData.paymentIntentId !== undefined && basketData.paymentIntentId !== null) {
      setPaymentIntentId(basketData.paymentIntentId);
    }
    if (basketData.clientSecret !== undefined && basketData.clientSecret !== null) {
      setClientSecret(basketData.clientSecret);
    }
    if (basketData.id && basketData.id !== basketId) {
      setBasketId(basketData.id);
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const serverItem = basketData.items.find((i) => i.id === item.id);
        if (!serverItem) return item;
        return {
          ...item,
          price: Number(serverItem.price) || item.price,
          qty: Number(serverItem.quantity) || item.qty,
          quantity: Number(serverItem.quantity) || item.quantity,
        };
      }),
    );
    return basketData;
  }, [basketId]);

  const buildBasketPayload = useCallback(
    (overrides = {}) => ({
      id: getOrCreateBasketId(),
      items: cartItems.map(toBasketItem),
      deliveryMethodId:
        overrides.deliveryMethodId !== undefined
          ? overrides.deliveryMethodId
          : deliveryMethodId,
      shippingPrice:
        overrides.shippingPrice !== undefined
          ? overrides.shippingPrice
          : shippingPrice,
      ...(overrides.paymentIntentId !== undefined
        ? { paymentIntentId: overrides.paymentIntentId }
        : paymentIntentId
          ? { paymentIntentId }
          : {}),
      ...(overrides.clientSecret !== undefined
        ? { clientSecret: overrides.clientSecret }
        : clientSecret
          ? { clientSecret }
          : {}),
    }),
    [cartItems, deliveryMethodId, shippingPrice, getOrCreateBasketId, paymentIntentId, clientSecret],
  );

  const saveBasket = useCallback(
    async (overrides = {}) => {
      const payload = buildBasketPayload(overrides);
      const res = await createOrUpdateBasket(payload);
      const data = res.data;
      if (data && data.deliveryMethodId !== undefined) {
        setDeliveryMethodId(data.deliveryMethodId);
      }
      if (data && data.shippingPrice !== undefined) {
        setShippingPrice(data.shippingPrice);
      }
      return data;
    },
    [buildBasketPayload],
  );

  const cartTotal = cartItems.reduce(
    (total, item) => total + (Number(item.price) || 0) * item.qty,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        basketId,
        loadingBasket,
        deliveryMethodId,
        shippingPrice,
        paymentIntentId,
        clientSecret,
        saveBasket,
        syncBasketFromServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
