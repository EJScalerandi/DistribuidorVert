import { useEffect, useState, Fragment } from 'react';

import { fetchPickings, setFinalCustomer } from './api/odoo';
import './App.css';

const emptyForm = {
  name: '',
  street: '',
  city: '',
  vat: '',
  phone: '',
  notes: '',
};

function App() {
  const [pickings, setPickings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // para ver detalle de productos

  const loadPickings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPickings();
      setPickings(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las entregas. Revisá la API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPickings();
  }, []);

  const openForm = (picking) => {
    setSelected(picking);
    setForm({
      ...emptyForm,
      // si querés, podés precargar algo acá
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;

    setSaving(true);
    setError('');
    try {
      await setFinalCustomer(selected.id, form);

      // Volvemos a cargar la lista para reflejar que está "Cargado"
      await loadPickings();

      setSelected(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el cliente final. Revisá la API.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelected(null);
    setForm(emptyForm);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="app-container">
      <h1>Entregas pendientes del distribuidor</h1>

      <div className="top-bar">
        <button onClick={loadPickings} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar lista'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!selected && (
        <>
          {loading && <p>Cargando entregas...</p>}

          {!loading && pickings.length === 0 && (
            <p>No hay entregas pendientes marcadas para distribuidor.</p>
          )}

          {!loading && pickings.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Remito</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha prevista</th>
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
                      <td>{p.origin}</td>
                      <td>{p.partner_name}</td>
                      <td>
                        {p.scheduled_date
                          ? new Date(p.scheduled_date).toLocaleString()
                          : '-'}
                      </td>
                      <td>{p.state}</td>
                      <td>
                        {p.final_customer_completed ? (
                          <span className="badge badge-ok">
                            Cargado
                            {p.final_customer_name
                              ? ` (${p.final_customer_name})`
                              : ''}
                          </span>
                        ) : (
                          <span className="badge badge-pending">Pendiente</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          onClick={() => toggleExpand(p.id)}
                        >
                          {expandedId === p.id ? 'Ocultar detalle' : 'Ver detalle'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openForm(p)}
                          style={{ marginLeft: '0.4rem' }}
                        >
                          {p.final_customer_completed
                            ? 'Editar cliente final'
                            : 'Completar cliente final'}
                        </button>
                      </td>
                    </tr>

                    {expandedId === p.id && (
                      <tr className="detail-row">
                        <td colSpan={7}>
                          {p.lines && p.lines.length > 0 ? (
                            <table className="inner-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '15%' }}>Cantidad</th>
                                  <th>Descripción</th>
                                  <th style={{ width: '15%' }}>U.M.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.lines.map((ln) => (
                                  <tr key={ln.id}>
                                    <td>{ln.quantity}</td>
                                    <td>{ln.product_name}</td>
                                    <td>{ln.uom}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>Este remito no tiene líneas para mostrar.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {selected && (
        <div className="form-container">
          <h2>
            Cliente final para remito {selected.name} ({selected.origin})
          </h2>
          {selected.final_customer_completed && (
            <p className="info-text">
              Este remito ya tiene cliente final cargado. Podés actualizar los
              datos si es necesario.
            </p>
          )}
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label>Nombre / Razón social</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label>Calle y número</label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label>Localidad / Ciudad</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label>CUIT / DNI</label>
              <input name="vat" value={form.vat} onChange={handleChange} />
            </div>

            <div className="form-row">
              <label>Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Aclaraciones</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
