'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Trash2, Plus, Minus, X, CreditCard, Banknote, ArrowRightLeft, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';
import ProductCard from '@/components/POS/ProductCard';
import styles     from './pos.module.css';
import cartStyles from '@/components/POS/Cart.module.css';

interface Product {
  IdProducto: number;
  Producto: string;
  Precio1: number;
  Precio2: number;
  Precio3: number;
  Multiple: number;
  IdCategoria: number;
  Categoria?: string;
  EsExtra?: number;
  TipoCategoria?: string;
  StockActual?: number;
  UnidadMedida?: string;
  ArchivoImagen?: string | null;
}

interface Category {
  IdCategoria: number;
  Categoria: string;
  EsExtra: number;
}

interface Cliente {
  IdCliente: number;
  NombreCliente: string;
  Telefono?: string;
  CorreoElectronico?: string;
}

interface CartItem {
  cartId: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  typePrice: number;
  extras: Product[];
  image?: string | null;
  isExtra: number;
  sizeLabel?: string;
  tipoCategoria?: string;
  stockDisponible?: number;
}

interface PaymentState {
  efectivo: string;
  tarjeta: string;
  transferencia: string;
}

export default function POSPage() {
  const [products, setProducts]               = useState<Product[]>([]);
  const [allExtras, setAllExtras]             = useState<Product[]>([]);
  const [categories, setCategories]           = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [carts, setCarts]                     = useState<CartItem[][]>([[], [], []]);
  const [activeCartIdx, setActiveCartIdx]     = useState(0);
  const cart = carts[activeCartIdx];
  const [loading, setLoading]                 = useState(true);

  const [priceModal, setPriceModal]     = useState<{ product: Product } | null>(null);
  const [extrasModal, setExtrasModal]   = useState<{ item: CartItem } | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payment, setPayment]           = useState<PaymentState>({ efectivo: '', tarjeta: '', transferencia: '' });
  const [processing, setProcessing]     = useState(false);
  const [cashError, setCashError]       = useState('');
  const [openSession, setOpenSession]   = useState<{ IdApertura: number } | null>(null);
  const [ticketConfig, setTicketConfig] = useState<any>(null);

  // Client selection
  const [clientes, setClientes]             = useState<Cliente[]>([]);
  const [clienteSearch, setClienteSearch]   = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => { fetchData(); checkSession(); fetchClientes(); }, []);

  useEffect(() => {
    const onFocus = () => checkSession();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    let result = Array.isArray(products) ? products : [];
    if (selectedCategory) result = result.filter(p => p.IdCategoria === selectedCategory);
    if (searchTerm)       result = result.filter(p => p.Producto.toLowerCase().includes(searchTerm.toLowerCase()));
    result = [...result].sort((a, b) => (a.EsExtra ?? 0) - (b.EsExtra ?? 0));
    setFilteredProducts(result);
  }, [selectedCategory, searchTerm, products]);

  const fetchData = async () => {
    try {
      const [res, configRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/config/ticket')
      ]);
      
      let fetchedProducts: Product[] = [];
      let fetchedCategories: Category[] = [];
      let configData: any = null;

      if (res.ok) {
        const data = await res.json();
        fetchedProducts = Array.isArray(data.products) ? data.products : [];
        fetchedCategories = Array.isArray(data.categories) ? data.categories : [];
      } else {
        console.error('Failed to fetch products API status:', res.status);
      }

      if (configRes.ok) {
        configData = await configRes.json();
      } else {
        console.error('Failed to fetch ticket config API status:', configRes.status);
      }

      setProducts(fetchedProducts);
      setAllExtras(fetchedProducts.filter((p: Product) => p.EsExtra === 1));
      setCategories(fetchedCategories);
      setTicketConfig(configData);
      setLoading(false);
    } catch (err) { 
      console.error('POS fetchData error:', err); 
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const checkSession = async () => {
    try {
      const res  = await fetch('/api/cash/status');
      const data = await res.json();
      const session = data.isOpen ? data.session : null;
      setOpenSession(session);
      return session;
    } catch { return null; }
  };

  /* ── Payment math ── */
  const total      = cart.reduce((acc, item) => {
    const extrasTotal = item.extras.reduce((s, e) => s + (e.Precio1 || 0), 0);
    return acc + (item.price + extrasTotal) * item.quantity;
  }, 0);

  const pEfectivo      = parseFloat(payment.efectivo)      || 0;
  const pTarjeta       = parseFloat(payment.tarjeta)       || 0;
  const pTransferencia = parseFloat(payment.transferencia) || 0;
  const totalPagado    = pEfectivo + pTarjeta + pTransferencia;
  const cambio         = Math.max(0, pEfectivo - (total - pTarjeta - pTransferencia));
  const faltante       = Math.max(0, total - totalPagado);
  const canPay         = totalPagado >= total - 0.001 && cart.length > 0 && !!selectedCliente;

  const validatePayment = (field: keyof PaymentState, value: string) => {
    const num = parseFloat(value) || 0;
    if ((field === 'tarjeta' || field === 'transferencia')) {
      const other = field === 'tarjeta' ? pTransferencia : pTarjeta;
      if (num + other > total) return;
    }
    setPayment(prev => ({ ...prev, [field]: value }));
  };

  const openPaymentModal = async () => {
    const session = await checkSession();
    if (!session) { alert('No hay caja abierta. Ve a Caja y abre el turno primero.'); return; }
    setPayment({ efectivo: Number(total).toFixed(2), tarjeta: '', transferencia: '' });
    setSelectedCliente(null);
    setClienteSearch('');
    setCashError('');
    setPaymentModal(true);
  };

  /* ── Client search filter ── */
  const filteredClientes = clienteSearch.trim()
    ? clientes.filter(c =>
        c.NombreCliente.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        (c.Telefono || '').includes(clienteSearch)
      )
    : clientes.slice(0, 8);

  /* ── Cart helpers ── */
  const handleProductSelect = (product: Product) => {
    if (product.TipoCategoria === 'PRODUCTO' && Number(product.StockActual) <= 0) {
      alert(`${product.Producto} no tiene existencia disponible.`);
      return;
    }
    const hasMultiple = (product.Precio2 > 0) || (product.Precio3 > 0);
    if (hasMultiple) setPriceModal({ product });
    else             addToCart(product, product.Precio1, 1);
  };

  const addToCart = (product: Product, price: number, typePrice: number) => {
    const cartId   = `${product.IdProducto}-${typePrice}`;
    const existing = cart.find(i => i.cartId === cartId);
    if (existing) {
      updateQuantity(cartId, existing.quantity + 1);
    } else {
      const newItem: CartItem = {
        cartId, productId: product.IdProducto,
        name: product.Producto, price, quantity: 1,
        typePrice, extras: [], image: product.ArchivoImagen || null,
        isExtra: 0,
        sizeLabel: typePrice === 1 ? 'Chico' : (typePrice === 2 && product.Precio3 > 0) ? 'Mediano' : (typePrice > 1) ? 'Grande' : '',
        tipoCategoria: product.TipoCategoria,
        stockDisponible: Number(product.StockActual || 0),
      };
      setCarts(prev => {
        const next = [...prev];
        next[activeCartIdx] = [...next[activeCartIdx], newItem];
        return next;
      });
    }
    setPriceModal(null);
  };

  const updateQuantity = async (cartId: string, qty: number) => {
    const currentItem = cart.find((item) => item.cartId === cartId);
    if (currentItem?.tipoCategoria === 'PRODUCTO' && qty > Number(currentItem.stockDisponible)) {
      alert(`Solo hay ${currentItem.stockDisponible} unidades disponibles de ${currentItem.name}.`);
      return;
    }
    if (qty <= 0) {
      const item = cart.find(i => i.cartId === cartId);
      if (item) {
        fetch('/api/alerts/log', {
          method: 'POST',
          body: JSON.stringify({
            message: `SERVICIO ELIMINADO: ${item.name} del carrito`,
            idApertura: openSession?.IdApertura || 0,
            isRed: 1
          })
        });
      }
    }
    setCarts(prev => {
      const next = [...prev];
      const currentCart = next[activeCartIdx];
      if (qty <= 0) {
        next[activeCartIdx] = currentCart.filter(i => i.cartId !== cartId);
      } else {
        next[activeCartIdx] = currentCart.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i);
      }
      return next;
    });
  };

  const addExtra    = (item: CartItem, extra: Product) =>
    setCarts(prev => {
      const next = [...prev];
      next[activeCartIdx] = next[activeCartIdx].map(i =>
        i.cartId === item.cartId ? { ...i, extras: [...i.extras, extra] } : i
      );
      return next;
    });

  const removeExtra = (item: CartItem, idx: number) =>
    setCarts(prev => {
      const next = [...prev];
      next[activeCartIdx] = next[activeCartIdx].map(i => {
        if (i.cartId !== item.cartId) return i;
        const ex = [...i.extras]; ex.splice(idx, 1);
        return { ...i, extras: ex };
      });
      return next;
    });

  /* ── Process sale ── */
  const processSale = async () => {
    if (!openSession)   { alert('No hay caja abierta.'); return; }
    if (!canPay)        { setCashError('Selecciona un cliente y verifica el monto pagado.'); return; }
    if (!selectedCliente) { setCashError('Debes seleccionar un cliente.'); return; }
    if (pTarjeta > total)       { setCashError('Tarjeta no puede ser mayor al total.'); return; }
    if (pTransferencia > total) { setCashError('Transferencia no puede ser mayor al total.'); return; }
    if (pTarjeta + pTransferencia > total) { setCashError('Tarjeta + Transferencia no puede exceder el total.'); return; }

    setProcessing(true);
    setCashError('');

    const ticketWin = window.open('about:blank', 'TicketPrint', 'width=420,height=650');

    try {
      const res  = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart, total,
          idApertura: openSession.IdApertura,
          efectivo:      pEfectivo,
          tarjeta:       pTarjeta,
          transferencia: pTransferencia,
          idCliente: selectedCliente.IdCliente,
          cliente:   selectedCliente.NombreCliente,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentModal(false);
        setCarts(prev => {
          const next = [...prev];
          next[activeCartIdx] = [];
          return next;
        });
        if (ticketWin) ticketWin.location.href = `/print/ticket/${data.idVenta}`;
        await fetchData();
      } else {
        if (ticketWin) ticketWin.close();
        setCashError(data.message || 'Error al procesar la venta');
      }
    } catch {
      if (ticketWin) ticketWin.close();
      setCashError('Error de conexión');
    }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando...</div>;

  const ItemThumb = ({ item }: { item: CartItem }) =>
    item.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.image} alt={item.name} className={cartStyles.itemThumb} />
    ) : (
      <div className={cartStyles.itemThumbEmpty}>{item.name.charAt(0)}</div>
    );

  return (
    <div className={styles.posContainer}>
      {/* ── Products panel ── */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Buscar servicio..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className={styles.categories}>
            <button className={`${styles.catBtn} ${selectedCategory === null ? styles.activeCat : ''}`}
              onClick={() => setSelectedCategory(null)}>Todos</button>
            {categories.map(cat => (
              <button key={cat.IdCategoria}
                className={`${styles.catBtn} ${selectedCategory === cat.IdCategoria ? styles.activeCat : ''}`}
                onClick={() => setSelectedCategory(cat.IdCategoria)}>{cat.Categoria}</button>
            ))}
          </div>
        </header>

        {!openSession && (
          <div className={`${styles.sessionWarning} animate-fade`} onClick={() => router.push('/cash')}>
            <AlertTriangle size={20} />
            <div>
              <strong>No hay apertura de caja activa</strong>
              <p>Haz clic aquí para ir a Control de Caja e iniciar una nueva apertura.</p>
            </div>
          </div>
        )}

        <div className="grid-responsive" style={{ marginTop: '1.5rem', paddingBottom: '1rem' }}>
          {filteredProducts.map(p => (
            <ProductCard
              key={p.IdProducto}
              product={p}
              onSelect={handleProductSelect}
              disabled={!openSession || (p.TipoCategoria === 'PRODUCTO' && Number(p.StockActual) <= 0)}
            />
          ))}
        </div>
      </div>

      {/* ── Cart ── */}
      <div className={`${cartStyles.cart} glass`}>
        {/* Account Selector */}
        <div className={cartStyles.accountSelector}>
          {[0, 1, 2].map(idx => (
            <button
              key={idx}
              className={`${cartStyles.accountBtn} ${activeCartIdx === idx ? cartStyles.activeAccount : ''}`}
              onClick={() => setActiveCartIdx(idx)}
            >
              Turno {idx + 1}
              {carts[idx].length > 0 && <span className={cartStyles.badge}>{carts[idx].length}</span>}
            </button>
          ))}
        </div>

        <div className={cartStyles.header}>
          <div>
            <h2>Servicios</h2>
            {openSession && (
              <div className={styles.sessionMiniBadge}>
                <div className={styles.pulseDot}></div>
                <span>Apertura: {openSession.IdApertura}</span>
              </div>
            )}
          </div>
          <button onClick={() => setCarts(prev => {
            const next = [...prev];
            next[activeCartIdx] = [];
            return next;
          })}><Trash2 size={19} color="var(--text-muted)" /></button>
        </div>

        <div className={cartStyles.items}>
          {cart.length === 0 ? (
            <div className={cartStyles.empty}><p>Sin servicios</p></div>
          ) : cart.map(item => (
            <div key={item.cartId} className={cartStyles.item}>
              <ItemThumb item={item} />
              <div className={cartStyles.itemDetails}>
                <p className={cartStyles.itemName}>{item.name}</p>
                <p className={cartStyles.itemMeta}>
                  ${Number(item.price).toFixed(2)}{item.sizeLabel ? ` · ${item.sizeLabel}` : ''}
                </p>
                {item.extras.map((ex, idx) => (
                  <div key={idx} className={styles.extraTag}>
                    +{ex.Producto} (${Number(ex.Precio1).toFixed(2)})
                    <button onClick={() => removeExtra(item, idx)}><X size={11} /></button>
                  </div>
                ))}
                <button className={styles.addExtraBtn} onClick={() => setExtrasModal({ item })}>
                  + Agregar Extra
                </button>
              </div>
              <div className={cartStyles.itemControls}>
                <p className={cartStyles.itemPrice}>
                  ${Number((item.price + item.extras.reduce((s, e) => s + Number(e.Precio1), 0)) * item.quantity).toFixed(2)}
                </p>
                <div className={cartStyles.quantity}>
                  <button className={cartStyles.qtyBtn} onClick={() => updateQuantity(item.cartId, item.quantity - 1)}><Minus size={15} /></button>
                  <span>{item.quantity}</span>
                  <button className={cartStyles.qtyBtn} onClick={() => updateQuantity(item.cartId, item.quantity + 1)}><Plus size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={cartStyles.footer}>
          <div className={cartStyles.summaryRow}>
            <span>Subtotal</span><span>${Number(total).toFixed(2)}</span>
          </div>
          <div className={`${cartStyles.summaryRow} ${cartStyles.totalRow}`}>
            <span>Total</span><span>${Number(total).toFixed(2)}</span>
          </div>
          <button className={cartStyles.checkoutBtn} disabled={cart.length === 0} onClick={openPaymentModal}>
            Cobrar Ahora
          </button>
        </div>
      </div>

      {/* ── Price modal ── */}
      {priceModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-scale`}>
            {priceModal.product.ArchivoImagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={priceModal.product.ArchivoImagen} alt={priceModal.product.Producto} className={styles.modalProductImg} />
            )}
            <h3>Seleccionar Precio</h3>
            <p className={styles.modalSubtitle}>{priceModal.product.Producto}</p>
            <div className={styles.priceOptions}>
              <button onClick={() => addToCart(priceModal.product, priceModal.product.Precio1, 1)}>
                <span>Opción 1</span><strong>${Number(priceModal.product.Precio1).toFixed(2)}</strong>
              </button>
              {priceModal.product.Precio2 > 0 && (
                <button onClick={() => addToCart(priceModal.product, priceModal.product.Precio2, 2)}>
                  <span>{priceModal.product.Precio3 > 0 ? 'Opción 2' : 'Opción 2'}</span>
                  <strong>${Number(priceModal.product.Precio2).toFixed(2)}</strong>
                </button>
              )}
              {priceModal.product.Precio3 > 0 && (
                <button onClick={() => addToCart(priceModal.product, priceModal.product.Precio3, 3)}>
                  <span>Opción 3</span><strong>${Number(priceModal.product.Precio3).toFixed(2)}</strong>
                </button>
              )}
            </div>
            <button className={styles.closeBtn} onClick={() => setPriceModal(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Extras modal ── */}
      {extrasModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-scale`} style={{ maxWidth: '560px' }}>
            <h3>Agregar Extras</h3>
            <p className={styles.modalSubtitle}>Para: {extrasModal.item.name}</p>
            <div className={styles.extrasGrid}>
              {allExtras.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>
                  No hay extras disponibles
                </p>
              ) : allExtras.map(extra => (
                <button key={extra.IdProducto} className={styles.extraBtn}
                  onClick={() => addExtra(extrasModal.item, extra)}>
                  {extra.ArchivoImagen
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={extra.ArchivoImagen} alt={extra.Producto} className={styles.extraImg} />
                    : <div className={styles.extraInitial}>{extra.Producto.charAt(0)}</div>}
                  <span>{extra.Producto}</span>
                  <strong>+${Number(extra.Precio1).toFixed(2)}</strong>
                </button>
              ))}
            </div>
            <button className={styles.confirmBtn} onClick={() => setExtrasModal(null)}>Listo</button>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {paymentModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.payModal} glass animate-scale`}>
            <div className={styles.payModalHead}>
              <h3>Cobrar Servicio</h3>
              <button onClick={() => setPaymentModal(false)} disabled={processing}><X size={20} /></button>
            </div>

            <div className={styles.payTotal}>
              <span>Total a cobrar</span>
              <strong>${Number(total).toFixed(2)}</strong>
            </div>

            <div className={styles.payModalContent}>
              <div className={styles.payFields}>
                {/* Cash */}
                <div className={styles.payField}>
                  <label><Banknote size={16} /> Efectivo</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={payment.efectivo}
                    onChange={e => setPayment(p => ({ ...p, efectivo: e.target.value }))}
                  />
                  {pEfectivo > 0 && (
                    <span className={styles.cambio}>
                      Cambio: ${Number(Math.max(0, pEfectivo - Math.max(0, total - pTarjeta - pTransferencia))).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Card */}
                <div className={styles.payField}>
                  <label><CreditCard size={16} /> Tarjeta</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={payment.tarjeta}
                    onChange={e => validatePayment('tarjeta', e.target.value)}
                  />
                  <span className={styles.payHint}>Máx: ${Number(Math.max(0, total - pTransferencia)).toFixed(2)}</span>
                </div>

                {/* Transfer */}
                <div className={styles.payField}>
                  <label><ArrowRightLeft size={16} /> Transferencia</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={payment.transferencia}
                    onChange={e => validatePayment('transferencia', e.target.value)}
                  />
                  <span className={styles.payHint}>Máx: ${Number(Math.max(0, total - pTarjeta)).toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.payOptions}>
                {/* Client selector — REQUIRED */}
                <div className={styles.payField}>
                  <label><UserCheck size={16} /> Cliente <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span></label>

                  {selectedCliente ? (
                    <div className={styles.clientSelected}>
                      <span>{selectedCliente.NombreCliente}</span>
                      <button onClick={() => { setSelectedCliente(null); setClienteSearch(''); }}><X size={15} /></button>
                    </div>
                  ) : (
                    <div className={styles.clientSearchWrap}>
                      <input
                        ref={clienteInputRef}
                        type="text"
                        placeholder="Buscar cliente..."
                        value={clienteSearch}
                        onChange={e => { setClienteSearch(e.target.value); setShowClienteDropdown(true); }}
                        onFocus={() => setShowClienteDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClienteDropdown(false), 150)}
                        autoComplete="off"
                      />
                      {showClienteDropdown && filteredClientes.length > 0 && (
                        <div className={styles.clientDropdown}>
                          {filteredClientes.map(c => (
                            <div key={c.IdCliente} className={styles.clientOption}
                              onMouseDown={() => { setSelectedCliente(c); setClienteSearch(''); setShowClienteDropdown(false); }}>
                              <span className={styles.clientOptionName}>{c.NombreCliente}</span>
                              {c.Telefono && <span className={styles.clientOptionSub}>{c.Telefono}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className={styles.paySummary} style={{ marginTop: '0.5rem' }}>
                  <div className={styles.payRow}>
                    <span>Total pagado</span>
                    <span className={totalPagado >= total ? styles.payOk : styles.payShort}>
                      ${Number(totalPagado).toFixed(2)}
                    </span>
                  </div>
                  {faltante > 0.01 && (
                    <div className={`${styles.payRow} ${styles.payAlert}`}>
                      <span>Faltante</span>
                      <span>–${Number(faltante).toFixed(2)}</span>
                    </div>
                  )}
                  {cambio > 0.01 && (
                    <div className={`${styles.payRow} ${styles.payChange}`}>
                      <span>Cambio</span>
                      <span>${Number(cambio).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {cashError && (
              <div className={styles.payError}>
                <AlertCircle size={15} /> {cashError}
              </div>
            )}

            <button
              className={styles.payConfirmBtn}
              disabled={!canPay || processing}
              onClick={processSale}
            >
              {processing ? 'Procesando...' : `Confirmar Cobro — $${Number(total).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
