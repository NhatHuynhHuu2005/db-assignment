// FE/src/App.tsx
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes
} from 'react-router-dom';
import './styles/main.scss';
import { ProductList } from './components/products/ProductList';
import { CustomerOrdersReport } from './components/reports/CustomerOrdersReport';
import { StoreInventoryReport } from './components/reports/StoreInventoryReport';
import { fetchProducts, type Product } from './api/api';

const HomePage: React.FC = () => {
  const [featuredMen, setFeaturedMen] = useState<Product[]>([]);
  const [featuredWomen, setFeaturedWomen] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Lấy một ít sản phẩm bất kỳ để show hero sections
        const all = await fetchProducts();
        setFeaturedMen(all.slice(0, 4));
        setFeaturedWomen(all.slice(4, 8));
      } catch {
        // ignore demo
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <>
      <section className="hero-banner">
        <div>
          <h1 className="hero-banner__title">UNIQLO Mini</h1>
          <p className="hero-banner__subtitle">
            Hệ thống bán hàng thời trang tối giản, lấy cảm hứng từ
            UNIQLO – xây dựng bởi sinh viên, vận hành trên SQL Server.
          </p>
          <div className="hero-banner__cta-group">
            <NavLink to="/products" className="btn btn--primary">
              Quản lý sản phẩm
            </NavLink>
            <NavLink
              to="/reports/store-inventory"
              className="btn btn--outline"
            >
              Xem tồn kho
            </NavLink>
          </div>
        </div>
        <div>
          <div className="section-title">Khuyến mãi hôm nay</div>
          <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>
            Sử dụng dữ liệu Promotion / PromotionRule từ backend để
            demo báo cáo & logic khuyến mãi trong tương lai.
          </p>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>
            (Frontend hiện chỉ minh họa, backend đã có sẵn bảng và
            dữ liệu.)
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Nam</h2>
        {loading && <div>Đang tải sản phẩm...</div>}
        <div className="product-grid">
          {featuredMen.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-card__name">{p.name}</div>
              <div className="product-card__desc">
                {p.description || 'Sản phẩm UNIQLO Mini'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Nữ</h2>
        <div className="product-grid">
          {featuredWomen.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-card__name">{p.name}</div>
              <div className="product-card__desc">
                {p.description || 'Sản phẩm UNIQLO Mini'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

const AppShell: React.FC = () => {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header__logo">UNIQLO MINI</div>
        <nav className="app-header__nav">
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
          <NavLink to="/reports/customer-orders">
            Báo cáo đơn hàng
          </NavLink>
          <NavLink to="/reports/store-inventory">
            Báo cáo tồn kho
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route
            path="/reports/customer-orders"
            element={<CustomerOrdersReport />}
          />
          <Route
            path="/reports/store-inventory"
            element={<StoreInventoryReport />}
          />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
};

export default App;
