'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '../ticket.module.css';

export default function TicketPrint({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [ticketRes, configRes] = await Promise.all([
        fetch(`/api/sales/${id}`),
        fetch('/api/config/ticket')
      ]);
      
      if (!ticketRes.ok) throw new Error('Venta no encontrada');
      
      const ticketData = await ticketRes.json();
      const configData = await configRes.json();
      
      setData(ticketData);
      setConfig(configData);

      // Auto-print
      setTimeout(() => {
        window.print();
        window.addEventListener('afterprint', () => {
          window.close();
        }, { once: true });
      }, 800);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setData({ error: true });
    }
  };

  if (!data || !config) return <div className={styles.ticket}>Cargando ticket...</div>;
  if (data.error || !data.venta) return <div className={styles.ticket}>Error: No se pudo cargar la venta</div>;

  const { venta, details } = data;

  return (
    <div className={styles.ticket}>
      <div className={styles.header}>
        {config.LogoPath ? (
            <img src={config.LogoPath} alt="Logo" style={{ width: '80px', marginBottom: '10px' }} />
        ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>✂️</div>
        )}
        {config.Header1 && <div className={styles.title}>{config.Header1}</div>}
        {config.Header2 && <div>{config.Header2}</div>}
        {config.Header3 && <div>{config.Header3}</div>}
        {config.Header4 && <div>{config.Header4}</div>}
        {config.Header5 && <div>{config.Header5}</div>}
        
        <div style={{ marginTop: '10px', fontSize: '10px' }}>
          <div className={styles.row}>
            <span>Folio: {venta.Folio}</span>
            <span>Fecha: {new Date(venta.FechaVenta).toLocaleDateString()} {new Date(venta.FechaVenta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {venta.Cliente && <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase' }}>CLIENTE: {venta.Cliente}</div>}
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.items}>
        <div className={styles.row} style={{ fontWeight: 'bold' }}>
          <span>CANT SERVICIO</span>
          <span>TOTAL</span>
        </div>
        <div className={styles.divider}></div>
        {details.filter((i: any) => !i.IdDetallePadre).map((item: any, idx: number) => {
          const itemExtras = details.filter((ex: any) => ex.IdDetallePadre === item.IdDetalleVenta);
          const itemTotal = (item.Cantidad * item.Precio) + itemExtras.reduce((acc: number, ex: any) => acc + (ex.Cantidad * ex.Precio), 0);
          
          return (
            <div key={idx} className={styles.item}>
              <div className={styles.row}>
                <span>{item.Cantidad} {item.Producto}</span>
                <span>${itemTotal.toFixed(2)}</span>
              </div>
              {itemExtras.map((extra: any, eIdx: number) => (
                <div key={eIdx} style={{ fontSize: '10px', marginLeft: '10px', fontStyle: 'italic' }}>
                  + {extra.Producto} (${(extra.Cantidad * extra.Precio).toFixed(2)})
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className={styles.divider}></div>

      <div className={styles.footer}>
        <div className={styles.row} style={{ fontSize: '14px', fontWeight: 'bold' }}>
          <span>TOTAL</span>
          <span>${venta.Total.toFixed(2)}</span>
        </div>
        <div className={styles.row} style={{ marginTop: '5px' }}>
          <span>PAGO: {venta.Efectivo > 0 ? 'EFECTIVO' : venta.Tarjeta > 0 ? 'TARJETA' : 'TRANSF.'}</span>
        </div>
        
        <div className={styles.divider} style={{ marginTop: '15px' }}></div>
        <div style={{ marginTop: '10px', fontSize: '11px' }}>
          {config.Footer1 && <div>{config.Footer1}</div>}
          {config.Footer2 && <div>{config.Footer2}</div>}
          {config.Footer3 && <div>{config.Footer3}</div>}
        </div>
      </div>
    </div>
  );
}
