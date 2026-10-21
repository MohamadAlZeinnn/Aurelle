import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout.jsx';
import HomePage from '../pages/store/HomePage.jsx';
import { RequireAuth, RequireAdmin, GuestOnly } from './guards.jsx';
import { RouteError } from '../pages/store/NotFoundPage.jsx';

// Route-level code splitting: storefront home is eager, everything else loads on demand.
const ShopPage = lazy(() => import('../pages/store/ShopPage.jsx'));
const ProductPage = lazy(() => import('../pages/store/ProductPage.jsx'));
const CartPage = lazy(() => import('../pages/store/CartPage.jsx'));
const CheckoutPage = lazy(() => import('../pages/store/CheckoutPage.jsx'));
const OrderConfirmationPage = lazy(() => import('../pages/store/OrderConfirmationPage.jsx'));
const TrackOrderPage = lazy(() => import('../pages/store/TrackOrderPage.jsx'));
const WishlistPage = lazy(() => import('../pages/store/WishlistPage.jsx'));
const InfoPage = lazy(() => import('../pages/store/InfoPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/store/NotFoundPage.jsx'));

const LoginPage = lazy(() => import('../pages/account/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/account/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/account/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/account/ResetPasswordPage.jsx'));
const AccountLayout = lazy(() => import('../layouts/AccountLayout.jsx'));
const AccountOverview = lazy(() => import('../pages/account/AccountOverview.jsx'));
const ProfilePage = lazy(() => import('../pages/account/ProfilePage.jsx'));
const AddressesPage = lazy(() => import('../pages/account/AddressesPage.jsx'));
const OrdersPage = lazy(() => import('../pages/account/OrdersPage.jsx'));
const OrderDetailPage = lazy(() => import('../pages/account/OrderDetailPage.jsx'));
const PasswordPage = lazy(() => import('../pages/account/PasswordPage.jsx'));

const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('../pages/admin/DashboardPage.jsx'));
const AdminProducts = lazy(() => import('../pages/admin/ProductsPage.jsx'));
const AdminProductEdit = lazy(() => import('../pages/admin/ProductEditPage.jsx'));
const AdminInventory = lazy(() => import('../pages/admin/InventoryPage.jsx'));
const AdminOrders = lazy(() => import('../pages/admin/OrdersPage.jsx'));
const AdminOrderDetail = lazy(() => import('../pages/admin/OrderDetailPage.jsx'));
const AdminPackingSlip = lazy(() => import('../pages/admin/PackingSlipPage.jsx'));
const AdminCategories = lazy(() => import('../pages/admin/CategoriesPage.jsx'));
const AdminCoupons = lazy(() => import('../pages/admin/CouponsPage.jsx'));
const AdminCustomers = lazy(() => import('../pages/admin/CustomersPage.jsx'));
const AdminCustomerDetail = lazy(() => import('../pages/admin/CustomerDetailPage.jsx'));
const AdminContent = lazy(() => import('../pages/admin/ContentPage.jsx'));
const AdminRestock = lazy(() => import('../pages/admin/RestockPage.jsx'));
const AdminReviews = lazy(() => import('../pages/admin/ReviewsPage.jsx'));
const AdminShipping = lazy(() => import('../pages/admin/ShippingPage.jsx'));
const AdminSettings = lazy(() => import('../pages/admin/SettingsPage.jsx'));

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <StoreLayout />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'shop', element: <ShopPage /> },
        { path: 'shop/:categorySlug', element: <ShopPage /> },
        { path: 'product/:slug', element: <ProductPage /> },
        { path: 'cart', element: <CartPage /> },
        { path: 'checkout', element: <CheckoutPage /> },
        { path: 'order/confirmation/:reference', element: <OrderConfirmationPage /> },
        { path: 'track-order', element: <TrackOrderPage /> },
        { path: 'wishlist', element: <WishlistPage /> },
        { path: 'pages/:slug', element: <InfoPage /> },
        { path: 'login', element: <GuestOnly><LoginPage /></GuestOnly> },
        { path: 'register', element: <GuestOnly><RegisterPage /></GuestOnly> },
        { path: 'forgot-password', element: <ForgotPasswordPage /> },
        { path: 'reset-password', element: <ResetPasswordPage /> },
        {
          path: 'account',
          element: (
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          ),
          children: [
            { index: true, element: <AccountOverview /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'addresses', element: <AddressesPage /> },
            { path: 'orders', element: <OrdersPage /> },
            { path: 'orders/:reference', element: <OrderDetailPage /> },
            { path: 'password', element: <PasswordPage /> },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    {
      path: '/admin',
      errorElement: <RouteError />,
      element: (
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      ),
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: 'products', element: <AdminProducts /> },
        { path: 'products/new', element: <AdminProductEdit /> },
        { path: 'products/:id', element: <AdminProductEdit /> },
        { path: 'inventory', element: <AdminInventory /> },
        { path: 'orders', element: <AdminOrders /> },
        { path: 'orders/:id', element: <AdminOrderDetail /> },
        { path: 'categories', element: <AdminCategories /> },
        { path: 'coupons', element: <AdminCoupons /> },
        { path: 'customers', element: <AdminCustomers /> },
        { path: 'customers/:key', element: <AdminCustomerDetail /> },
        { path: 'content', element: <AdminContent /> },
        { path: 'restock', element: <AdminRestock /> },
        { path: 'reviews', element: <AdminReviews /> },
        { path: 'shipping', element: <AdminShipping /> },
        { path: 'settings', element: <AdminSettings /> },
      ],
    },
    {
      path: '/admin/orders/:id/packing-slip',
      element: (
        <RequireAdmin>
          <AdminPackingSlip />
        </RequireAdmin>
      ),
    },
  ],
  { future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true } }
);
