const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://therestaurant.runasp.net/api',
  stripePublishableKey:
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
};

export default config;
