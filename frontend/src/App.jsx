import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar       from './components/layout/Navbar';
import MarketFooter from './components/layout/MarketFooter';
import AdminLayout  from './components/layout/AdminLayout';
import Home         from './pages/Home';
import Products     from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Profile      from './pages/Profile';
import Cart         from './pages/Cart';
import { Login, Register }        from './pages/Auth';
import { OrderList, OrderDetail } from './pages/Orders';
import AdminDashboard  from './pages/admin/Dashboard';
import AdminAccounts   from './pages/admin/Accounts';
import AdminCategories from './pages/admin/Categories';
import AdminProducts   from './pages/admin/Products';
import AdminBanners    from './pages/admin/Banners';
import AdminOrders     from './pages/admin/Orders';
import About           from './pages/About';

function Spin() { return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"/></div>; }

function Private({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Spin/>;
  if (!user) return <Navigate to="/login"/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/"/>;
  return children;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/"/> : children;
}

function PL({ children }) { return <><Navbar/><main>{children}</main><MarketFooter/></>; }

function AP({ children }) {
  return <Private roles={['admin']}><AdminLayout>{children}</AdminLayout></Private>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<PL><Home/></PL>}/>
      <Route path="/products" element={<PL><Products/></PL>}/>
      <Route path="/products/:id" element={<PL><ProductDetail/></PL>}/>
      <Route path="/about" element={<PL><About/></PL>}/>
      <Route path="/login"    element={<Guest><Login/></Guest>}/>
      <Route path="/register" element={<Guest><Register/></Guest>}/>
      <Route path="/profile" element={<Private><PL><Profile/></PL></Private>}/>
      <Route path="/cart"       element={<Private roles={['buyer']}><PL><Cart/></PL></Private>}/>
      <Route path="/orders"     element={<Private roles={['buyer']}><PL><OrderList/></PL></Private>}/>
      <Route path="/orders/:id" element={<Private roles={['buyer']}><PL><OrderDetail/></PL></Private>}/>
      <Route path="/admin"            element={<AP><AdminDashboard/></AP>}/>
      <Route path="/admin/accounts"   element={<AP><AdminAccounts/></AP>}/>
      <Route path="/admin/categories" element={<AP><AdminCategories/></AP>}/>
      <Route path="/admin/products"   element={<AP><AdminProducts/></AP>}/>
      <Route path="/admin/banners"    element={<AP><AdminBanners/></AP>}/>
      <Route path="/admin/orders"     element={<AP><AdminOrders/></AP>}/>
      <Route path="*" element={<Navigate to="/"/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes/>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
