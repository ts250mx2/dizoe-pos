'use client';

import styles from './ProductCard.module.css';

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

interface Props {
  product: Product;
  onSelect: (p: Product) => void;
  disabled?: boolean;
}

export default function ProductCard({ product, onSelect, disabled }: Props) {
  const hasImage = !!product.ArchivoImagen;

  return (
    <button
      className={`${styles.card} ${disabled ? styles.disabled : ''}`}
      onClick={() => !disabled && onSelect(product)}
      disabled={disabled}
    >
      <div className={styles.imageWrap}>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.ArchivoImagen!} alt={product.Producto} className={styles.image} />
        ) : (
          <div className={styles.initial}>{product.Producto.charAt(0)}</div>
        )}
        {product.EsExtra === 1 && <span className={styles.extraBadge}>Extra</span>}
        {product.TipoCategoria === 'PRODUCTO' && (
          <span className={`${styles.stockBadge} ${Number(product.StockActual) <= 0 ? styles.outOfStock : ''}`}>
            {Number(product.StockActual) <= 0 ? 'Agotado' : `${Number(product.StockActual)} ${product.UnidadMedida || 'pieza'}`}
          </span>
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{product.Producto}</p>
        <p className={styles.price}>${Number(product.Precio1).toFixed(2)}</p>
      </div>
    </button>
  );
}
