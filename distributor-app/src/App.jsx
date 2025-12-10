// src/App.jsx
import { useEffect, useState } from 'react';
import { fetchPickings, setFinalCustomer } from './api/odoo';
import './App.css';

const APP_PASSWORD = import.meta.env.VITE_APP_LOGIN_PASSWORD;

function App() {
  // 🔐 Login
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 📦 Datos de Odoo
  const [pickings, setPickings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // 📝 Form de cliente final
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    vat: '',
    phone: '',
    email: '', // 👈 NUEVO
    notes: '',
  });

  // Helper para resetear el form
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

  // Al montar, ver si ya estaba logueado en esta máquina
  useEffect(() => {
    const stored = localStorage.getItem('distributor_app_logged_in');
    if (stored === '1') {
      setLoggedIn(true);
    }
  }, []);

  // Función reutilizable para cargar pickings
  const loadPickings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPickings();
      setPickings(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las entregas desde Odoo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar pickings cuando está logueado
  useEffect(() => {
    if (!loggedIn) return;
    loadPickings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // 🔐 Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!APP_PASSWORD) {
      setLoginError('No hay contraseña configurada en el servidor (VITE_APP_LOGIN_PASSWORD).');
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
  };

  // UI helpers
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
      setError('Nombre y dirección son obligatorios.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await setFinalCustomer(pickingId, formData);

      // Refrescar lista
      await loadPickings();

      alert('Datos del cliente final guardados correctamente.');
      setExpandedId(null);
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Error al guardar los datos del cliente final.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR');
  };

  // 🔐 Pantalla de login si no está logueado
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

  // ✅ App normal
  return (
    <div className="app">
      <header className="app-header">
        <h1>Entregas vía distribuidor</h1>
        <div className="app-header-actions">
          <button
            type="button"
            onClick={loadPickings}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      {pickings.length === 0 && !loading && (
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
              <>
                <tr key={p.id}>
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
                      {expandedId === p.id ? 'Ocultar' : 'Detalle / Cargar'}
                    </button>
                  </td>
                </tr>

                {expandedId === p.id && (
                  <tr className="detail-row" key={`${p.id}-detail`}>
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
                          <form onSubmit={(e) => handleSubmitFinalCustomer(p.id, e)}>
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
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
