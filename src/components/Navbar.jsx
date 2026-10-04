import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatters';

/* ------------------------------ Icons ------------------------------ */
const Icon = ({ children, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {children}
  </svg>
);

const IconHamburger = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
const IconClose = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></Icon>
);
const IconCart = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></Icon>
);
const IconChevronDown = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></Icon>
);
const IconHome = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></Icon>
);
const IconMenu = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 2v8a2 2 0 004 0V2M9 10v12M17 2c1.5 1.6 2 3.1 2 5s-.5 3.4-2 5M17 12v10" /></Icon>
);
const IconBranches = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>
);
const IconReservation = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>
);
const IconOrders = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 2 2 2-2 3 2z" /></Icon>
);
const IconLogout = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Icon>
);
const IconShield = (p) => (
  <Icon {...p}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" /></Icon>
);

/* ------------------------------ Navbar ------------------------------ */
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, cartTotal } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const closeAccount = () => setIsAccountOpen(false);

  const isPathActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  /* Close dropdown/drawer on outside click & Escape; lock body scroll on drawer */
  useEffect(() => {
    const onPointerDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAccountOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const displayName = user?.displayName || user?.userName || user?.email || 'User';
  const displayInitial = (String(displayName).trim().charAt(0) || 'U').toUpperCase();

  const goToCheckout = () => {
    setIsCartOpen(false);
    navigate('/payment');
  };

  const primaryLinks = [
    { label: 'Home', to: '/', icon: <IconHome /> },
    { label: 'Menu', to: '/menu', icon: <IconMenu /> },
    { label: 'Branches', to: '/branches', icon: <IconBranches /> },
    { label: 'Reservation', to: '/reservation', icon: <IconReservation /> },
  ];

  const accountLinks = [
    { label: 'My Reservations', to: '/my-reservations', icon: <IconReservation /> },
    { label: 'My Orders', to: '/my-orders', icon: <IconOrders /> },
  ];

  const focusRing =
    'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-md';

  const DesktopNavLink = ({ to, children }) => {
    const active = isPathActive(to);
    return (
      <Link
        to={to}
        className={`relative inline-flex items-center text-[13px] font-bold tracking-[0.18em] transition-colors duration-200 ${active ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
      >
        {children}
        <span
          className={`absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-amber-400 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
        />
      </Link>
    );
  };

  const Logo = ({ className }) => (
    <Link to="/" onClick={closeMobileMenu} aria-label="The Palate Collective — home" className={`flex items-baseline gap-2 leading-none ${className || ''}`}>
      <span className="font-serif text-base md:text-xl font-bold tracking-wider text-amber-400 whitespace-nowrap">THE PALATE</span>
      <span className="text-amber-500 text-[10px] tracking-[0.3em]">COLLECTIVE</span>
    </Link>
  );

  return (
    <>
      <nav dir="ltr" className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 fixed top-0 inset-x-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 h-16 md:h-20">

            {/* LEFT — mobile hamburger / desktop logo */}
            <div className="flex items-center gap-3 lg:gap-4 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className={`lg:hidden text-gray-300 hover:text-amber-400 transition-colors p-2 ${focusRing}`}
                aria-label="Open navigation menu"
              >
                <IconHamburger className="w-6 h-6" />
              </button>
              <Logo className="hidden lg:flex" />
            </div>

            {/* CENTER — mobile logo / desktop primary navigation */}
            <div className="flex items-center justify-center min-w-0">
              <Logo className="lg:hidden" />
              <nav className="hidden lg:flex items-center gap-8 xl:gap-12" aria-label="Primary navigation">
                {primaryLinks.map((link) => (
                  <DesktopNavLink key={link.to} to={link.to}>
                    {link.label}
                  </DesktopNavLink>
                ))}
              </nav>
            </div>

            {/* RIGHT — cart, account, admin */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full text-gray-300 hover:text-amber-400 hover:bg-white/5 transition-colors ${focusRing}`}
                aria-label={`Open cart${totalItemsCount ? `, ${totalItemsCount} items` : ''}`}
              >
                <IconCart className="w-5 h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-amber-500 rounded-full">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              <span className="hidden lg:block h-6 w-px bg-white/10" aria-hidden="true" />

              {/* Account */}
              {isAuthenticated ? (
                <>
                  {/* Desktop dropdown */}
                  <div className="hidden lg:block relative" ref={accountRef}>
                    <button
                      onClick={() => setIsAccountOpen((v) => !v)}
                      className={`flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-white/5 transition-colors ${focusRing}`}
                      aria-haspopup="menu"
                      aria-expanded={isAccountOpen}
                      aria-label={`Account menu for ${displayName}`}
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold shrink-0">
                        {displayInitial}
                      </span>
                      <span className="hidden xl:inline text-sm font-medium text-gray-300 max-w-[110px] truncate">
                        {displayName}
                      </span>
                      <IconChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAccountOpen && (
                      <div
                        role="menu"
                        aria-label="My account"
                        className="absolute right-0 top-full mt-3 w-64 rounded-xl bg-gray-900 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50 origin-top-right animate-[nav-dropdown-in_0.18s_ease-out]"
                      >
                        <div className="px-5 py-3.5 border-b border-white/10">
                          <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-500">MY ACCOUNT</p>
                          <p className="text-sm text-white font-medium truncate mt-1">{displayName}</p>
                        </div>
                        <div className="py-1.5">
                          {accountLinks.map((link) => (
                            <Link
                              key={link.to}
                              to={link.to}
                              role="menuitem"
                              onClick={closeAccount}
                              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isPathActive(link.to) ? 'text-amber-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                            >
                              <span className="text-gray-500 shrink-0">{link.icon}</span>
                              {link.label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-white/10 py-1.5">
                          <button
                            role="menuitem"
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors ${focusRing}`}
                          >
                            <span className="shrink-0"><IconLogout className="w-5 h-5" /></span>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile account button — opens the drawer */}
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white text-sm font-bold hover:bg-amber-400 transition-colors ${focusRing}`}
                    aria-label={`Open account menu for ${displayName}`}
                  >
                    {displayInitial}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className={`inline-flex items-center rounded-full bg-amber-500 px-5 py-2 text-xs font-bold tracking-widest text-gray-900 hover:bg-amber-400 transition-colors ${focusRing}`}
                >
                  LOGIN
                </Link>
              )}

              <span className="hidden lg:block h-6 w-px bg-white/10" aria-hidden="true" />

              {/* Admin Dashboard — separated, admin only */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`hidden lg:inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest transition-colors ${isPathActive('/admin') ? 'bg-amber-400 border-amber-400 text-gray-900' : 'border-amber-400/50 text-amber-300 hover:bg-amber-400/10 hover:border-amber-300'}`}
                >
                  <IconShield className="w-4 h-4" />
                  ADMIN
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Mobile Drawer --- */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isMobileMenuOpen}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMobileMenu}
        />
        <aside
          role="dialog"
          aria-label="Mobile navigation menu"
          className={`absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-gray-900 border-r border-white/10 shadow-2xl shadow-black/50 flex flex-col transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <Logo />
            <button
              onClick={closeMobileMenu}
              className={`text-gray-300 hover:text-amber-400 transition-colors p-1.5 ${focusRing}`}
              aria-label="Close navigation menu"
            >
              <IconClose className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-8 safe-bottom">
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-2 pt-5">
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold shrink-0">
                  {displayInitial}
                </span>
                <span className="text-sm text-gray-200 font-medium truncate">{displayName}</span>
              </div>
            )}

            {/* Primary navigation */}
            <div className="pt-5">
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.25em] text-gray-500">PRIMARY NAVIGATION</p>
              <nav className="grid gap-0.5" aria-label="Mobile primary navigation">
                {primaryLinks.map((link) => {
                  const active = isPathActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${active ? 'bg-white/5 text-amber-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      <span className={`shrink-0 ${active ? 'text-amber-400' : 'text-gray-500'}`}>{link.icon}</span>
                      {link.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Account */}
            <div className="pt-6">
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.25em] text-gray-500">ACCOUNT</p>
              {isAuthenticated ? (
                <nav className="grid gap-0.5" aria-label="Mobile account navigation">
                  {accountLinks.map((link) => {
                    const active = isPathActive(link.to);
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${active ? 'bg-white/5 text-amber-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className={`shrink-0 ${active ? 'text-amber-400' : 'text-gray-500'}`}>{link.icon}</span>
                        {link.label}
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />}
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors text-left ${focusRing}`}
                  >
                    <span className="shrink-0 text-red-400/80"><IconLogout className="w-5 h-5" /></span>
                    Logout
                  </button>
                </nav>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-2 pt-1">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-sm font-bold tracking-wider transition-colors ${focusRing}`}
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-center rounded-md border border-gray-700 hover:border-amber-500 text-gray-300 hover:text-amber-400 py-2.5 text-sm font-bold tracking-wider transition-colors ${focusRing}`}
                  >
                    REGISTER
                  </Link>
                </div>
              )}
            </div>

            {/* Admin */}
            {isAdmin && (
              <div className="pt-6">
                <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.25em] text-gray-500">ADMIN</p>
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${isPathActive('/admin') ? 'bg-amber-400/10 text-amber-400 border border-amber-400/40' : 'text-amber-300 border border-amber-400/30 hover:bg-amber-400/10'}`}
                >
                  <IconShield className="w-5 h-5" />
                  Admin Dashboard
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* --- Cart Sidebar Overlay --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
      )}

      {/* --- Cart Sidebar Panel --- */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-serif text-xl font-bold text-gray-900">Your Order</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-900" aria-label="Close cart">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Sidebar Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover border border-gray-200" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                  <p className="text-amber-500 font-bold text-sm mt-1">{formatPrice(item.price)}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors" aria-label={`Remove ${item.name} from cart`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-900">Subtotal</span>
              <span className="font-bold text-amber-500 text-lg">{formatPrice(cartTotal)}</span>
            </div>
            <button onClick={goToCheckout} className="w-full bg-gray-900 hover:bg-amber-500 active:bg-amber-600 text-white font-bold py-4 sm:py-3 rounded-sm tracking-widest transition-colors touch-manipulation">
              CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
