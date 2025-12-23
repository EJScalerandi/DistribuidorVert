// src/App.jsx
import { useEffect, useState, Fragment } from 'react';
import {
  fetchPickings,
  setFinalCustomer,
  fetchProducts,
  fetchDistributors,
  createQuotation,
} from './api/odoo';
import './App.css';

const APP_PASSWORD = import.meta.env.VITE_APP_LOGIN_PASSWORD;

// ===== Helpers comunes =====

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-AR');
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function App() {
  // 🔐 Login
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 📦 Entregas / pickings
  const [pickings, setPickings] = useState([]);
  const [loadingPickings, setLoadingPickings] = useState(false);
  const [pickingsError, setPickingsError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // 📝 Form de cliente final (entregas)
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    vat: '',
    phone: '',
    email: '',
    notes: '',
  });

  // 🧮 Presupuestador
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');

  const [distributors, setDistributors] = useState([]);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [distributorsError, setDistributorsError] = useState('');
  const [selectedDistributorId, setSelectedDistributorId] = useState('');

  const [quoteLines, setQuoteLines] = useState([]);
  const [quoteCustomer, setQuoteCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
  });
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState('');

  // ===== Utils internos =====

  const resetForm = () => {
    setFormData({
      name: '',
      street: '',
      city: '',
      vat: '',
      phone: '',
      email: '',
      notes: '',
    });
  };

  const resetQuoteForm = () => {
    setQuoteLines([]);
    setQuoteCustomer({
      name: '',
      phone: '',
      email: '',
      street: '',
      city: '',
    });
    setQuoteNotes('');
    // NO reseteamos el distribuidor elegido
  };

  // ===== Efectos =====

  useEffect(() => {
    const stored = localStorage.getItem('distributor_app_logged_in');
    if (stored === '1') {
      setLoggedIn(true);
    }
  }, []);

  const loadPickings = async () => {
    try {
      setLoadingPickings(true);
      setPickingsError('');
      const data = await fetchPickings();
      setPickings(data || []);
    } catch (err) {
      console.error(err);
      setPickingsError('Error al cargar las entregas desde Odoo.');
    } finally {
      setLoadingPickings(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError('');
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setProductsError('Error al cargar los productos desde Odoo.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadDistributors = async () => {
    try {
      setLoadingDistributors(true);
      setDistributorsError('');
      const data = await fetchDistributors();
      setDistributors(data || []);
      // Si hay uno solo, lo seleccionamos por defecto
      if (!selectedDistributorId && data.length === 1) {
        setSelectedDistributorId(String(data[0].id));
      }
    } catch (err) {
      console.error(err);
      setDistributorsError('Error al cargar los distribuidores desde Odoo.');
    } finally {
      setLoadingDistributors(false);
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadPickings();
    loadProducts();
    loadDistributors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // ===== Login =====

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!APP_PASSWORD) {
      setLoginError(
        'No hay contraseña configurada en el servidor (VITE_APP_LOGIN_PASSWORD).'
      );
      return;
    }
    if (loginPassword === APP_PASSWORD) {
      setLoggedIn(true);
      localStorage.setItem('distributor_app_logged_in', '1');
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem('distributor_app_logged_in');
    setPickings([]);
    setExpandedId(null);
    resetForm();
    resetQuoteForm();
  };

  // ===== Entregas: helpers =====

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    resetForm();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitFinalCustomer = async (pickingId, e) => {
    e.preventDefault();

    if (!formData.name || !formData.street) {
      setPickingsError('Nombre y dirección son obligatorios.');
      return;
    }

    try {
      setLoadingPickings(true);
      setPickingsError('');
      await setFinalCustomer(pickingId, formData);

      await loadPickings();

      alert('Datos del cliente final guardados correctamente.');
      setExpandedId(null);
      resetForm();
    } catch (err) {
      console.error(err);
      setPickingsError('Error al guardar los datos del cliente final.');
    } finally {
      setLoadingPickings(false);
    }
  };

  // ===== Presupuestador: helpers =====

  const handleAddProductLine = (product) => {
    setQuoteLines((prev) => {
      const existingIndex = prev.findIndex(
        (l) => l.product_id === product.id
      );
      if (existingIndex !== -1) {
        const clone = [...prev];
        const old = clone[existingIndex];
        clone[existingIndex] = {
          ...old,
          quantity: Number(old.quantity || 0) + 1,
        };
        return clone;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          uom: product.uom_name,
          price: product.list_price ?? 0,
          quantity: 1,
        },
      ];
    });
  };

  const handleQuoteLineChange = (index, field, value) => {
    setQuoteLines((prev) => {
      const clone = [...prev];
      if (!clone[index]) return prev;
      if (field === 'quantity') {
        clone[index] = { ...clone[index], quantity: Number(value) || 0 };
      } else if (field === 'price') {
        clone[index] = { ...clone[index], price: Number(value) || 0 };
      }
      return clone;
    });
  };

  const handleRemoveLine = (index) => {
    setQuoteLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuoteCustomerChange = (e) => {
    const { name, value } = e.target;
    setQuoteCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const quoteTotal = quoteLines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.price) || 0),
    0
  );

  const handleCreateQuote = async (e) => {
    e.preventDefault();

    if (!selectedDistributorId) {
      setQuoteError('Debe seleccionar un distribuidor.');
      return;
    }

    if (!quoteLines.length) {
      setQuoteError('Debe agregar al menos un producto al presupuesto.');
      return;
    }

    try {
      setQuoteLoading(true);
      setQuoteError('');
      setQuoteSuccess('');

      const payload = {
        distributor_id: Number(selectedDistributorId),
        customer: {
          name: quoteCustomer.name,
          phone: quoteCustomer.phone,
          email: quoteCustomer.email,
          street: quoteCustomer.street,
          city: quoteCustomer.city,
        },
        notes: quoteNotes,
        lines: quoteLines.map((l) => ({
          product_id: l.product_id,
          quantity: Number(l.quantity) || 0,
        })),
      };

      const res = await createQuotation(payload);

      setQuoteSuccess(
        `Cotización creada correctamente: ${
          res.name || ''
        } (ID ${res.order_id})`
      );
      resetQuoteForm();
    } catch (err) {
      console.error(err);
      setQuoteError('Error al crear la cotización en Odoo.');
    } finally {
      setQuoteLoading(false);
    }
  };

  // ===== Pantalla de login =====

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Ingreso distribuidor</h1>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            {loginError && <div className="error">{loginError}</div>}
            <button type="submit">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // ===== App principal =====

  return (
    <div className="app">
      <header className="app-header">
        <h1>Entregas vía distribuidor</h1>
        <div className="app-header-actions">
          <button
            type="button"
            onClick={loadPickings}
            disabled={loadingPickings}
          >
            {loadingPickings ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      {/* ---- BLOQUE ENTREGAS ---- */}
      <section style={{ marginBottom: '1.5rem' }}>
        {loadingPickings && <p>Cargando entregas...</p>}
        {pickingsError && <p className="error">{pickingsError}</p>}

        {pickings.length === 0 && !loadingPickings && (
          <p>No hay entregas pendientes para el distribuidor.</p>
        )}

        {pickings.length > 0 && (
          <table className="pickings-table">
            <thead>
              <tr>
                <th>Remito</th>
                <th>Pedido</th>
                <th>Cliente distribuidor</th>
                <th>Fecha programada</th>
                <th>Estado</th>
                <th>Cliente final</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pickings.map((p) => (
                <Fragment key={p.id}>
                  <tr>
                    <td>{p.name}</td>
                    <td>{p.origin || '-'}</td>
                    <td>{p.partner_name || '-'}</td>
                    <td>{formatDate(p.scheduled_date)}</td>
                    <td>{p.state}</td>
                    <td>
                      {p.final_customer_completed ? (
                        <>
                          Cargado
                          {p.final_customer_name && (
                            <>
                              : <strong>{p.final_customer_name}</strong>
                            </>
                          )}
                        </>
                      ) : (
                        'Pendiente'
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleExpand(p.id)}
                      >
                        {expandedId === p.id
                          ? 'Ocultar'
                          : 'Detalle / Cargar'}
                      </button>
                    </td>
                  </tr>

                  {expandedId === p.id && (
                    <tr className="detail-row">
                      <td colSpan={7}>
                        <div className="detail-container">
                          <div className="detail-left">
                            <h3>Detalle de productos</h3>
                            {(!p.lines || p.lines.length === 0) && (
                              <p>No hay líneas de producto.</p>
                            )}
                            {p.lines && p.lines.length > 0 && (
                              <table className="lines-table">
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>UdM</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.lines.map((line) => (
                                    <tr key={line.id}>
                                      <td>{line.product_name}</td>
                                      <td>{line.quantity}</td>
                                      <td>{line.uom}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div className="detail-right">
                            <h3>Datos del cliente final</h3>
                            <form
                              onSubmit={(e) =>
                                handleSubmitFinalCustomer(p.id, e)
                              }
                            >
                              <div className="form-group">
                                <label>Nombre / Razón social</label>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleFormChange}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Calle y número</label>
                                <input
                                  type="text"
                                  name="street"
                                  value={formData.street}
                                  onChange={handleFormChange}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Localidad</label>
                                <input
                                  type="text"
                                  name="city"
                                  value={formData.city}
                                  onChange={handleFormChange}
                                />
                              </div>
                              <div className="form-group">
                                <label>CUIT / DNI</label>
                                <input
                                  type="text"
                                  name="vat"
                                  value={formData.vat}
                                  onChange={handleFormChange}
                                />
                              </div>
                              <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                  type="text"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleFormChange}
                                />
                              </div>
                              <div className="form-group">
                                <label>Correo electrónico</label>
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleFormChange}
                                />
                              </div>
                              <div className="form-group">
                                <label>Notas</label>
                                <textarea
                                  name="notes"
                                  rows={3}
                                  value={formData.notes}
                                  onChange={handleFormChange}
                                />
                              </div>

                              <button type="submit">
                                Guardar datos del cliente final
                              </button>
                            </form>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ---- BLOQUE PRESUPUESTADOR ---- */}
      <section>
        <h2 style={{ marginBottom: '0.5rem', color: '#065f46' }}>
          Presupuesto rápido
        </h2>

        {/* Selector de distribuidor */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <div className="form-group" style={{ maxWidth: 260 }}>
            <label>Cliente / distribuidor</label>
            <select
              name="distributor"
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
            >
              <option value="">Seleccionar distribuidor...</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {loadingDistributors && <p>Cargando distribuidores...</p>}
          {distributorsError && <p className="error">{distributorsError}</p>}
        </div>

        {loadingProducts && <p>Cargando productos...</p>}
        {productsError && <p className="error">{productsError}</p>}

        {!loadingProducts &&
          !productsError &&
          products.length === 0 && (
            <p style={{ marginBottom: '0.75rem' }}>
              No hay productos disponibles en la lista VIP para este
              distribuidor.
            </p>
          )}

        {/* Lista de productos para agregar */}
        {products.length > 0 && (
          <div
            style={{
              marginBottom: '1rem',
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '0.5rem',
              background: '#f9fafb',
            }}
          >
            <table className="lines-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>UdM</th>
                  <th>Precio lista</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.default_code || '-'}</td>
                    <td>{p.uom_name || '-'}</td>
                    <td>{formatCurrency(p.list_price)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleAddProductLine(p)}
                      >
                        Agregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Carrito / líneas de la cotización */}
        <form onSubmit={handleCreateQuote}>
          {quoteLines.length === 0 && (
            <p style={{ marginBottom: '0.75rem' }}>
              Agregá productos desde la lista para armar el presupuesto.
            </p>
          )}

          {quoteLines.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <table className="lines-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>UdM</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {quoteLines.map((l, index) => {
                    const subtotal =
                      (Number(l.quantity) || 0) *
                      (Number(l.price) || 0);
                    return (
                      <tr key={l.product_id}>
                        <td>{l.name}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={l.quantity}
                            onChange={(e) =>
                              handleQuoteLineChange(
                                index,
                                'quantity',
                                e.target.value
                              )
                            }
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td>{l.uom || '-'}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.price}
                            onChange={(e) =>
                              handleQuoteLineChange(
                                index,
                                'price',
                                e.target.value
                              )
                            }
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>{formatCurrency(subtotal)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div
                style={{
                  textAlign: 'right',
                  marginTop: '0.5rem',
                  fontWeight: 600,
                }}
              >
                Total estimado: {formatCurrency(quoteTotal)}
              </div>
            </div>
          )}

          {/* Datos básicos del cliente de la cotización */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <div className="form-group">
              <label>Nombre / Razón social</label>
              <input
                type="text"
                name="name"
                value={quoteCustomer.name}
                onChange={handleQuoteCustomerChange}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="phone"
                value={quoteCustomer.phone}
                onChange={handleQuoteCustomerChange}
              />
            </div>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={quoteCustomer.email}
                onChange={handleQuoteCustomerChange}
              />
            </div>
            <div className="form-group">
              <label>Calle y número</label>
              <input
                type="text"
                name="street"
                value={quoteCustomer.street}
                onChange={handleQuoteCustomerChange}
              />
            </div>
            <div className="form-group">
              <label>Localidad</label>
              <input
                type="text"
                name="city"
                value={quoteCustomer.city}
                onChange={handleQuoteCustomerChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Notas internas / comentarios</label>
            <textarea
              rows={3}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
            />
          </div>

          {quoteError && <p className="error">{quoteError}</p>}
          {quoteSuccess && (
            <p style={{ color: '#065f46', marginTop: '0.25rem' }}>
              {quoteSuccess}
            </p>
          )}

          <button type="submit" disabled={quoteLoading}>
            {quoteLoading
              ? 'Enviando a Odoo...'
              : 'Crear cotización en Odoo'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default App;
