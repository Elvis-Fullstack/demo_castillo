import React, { useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// Etiqueta pequeña: 50 x 25 mm a 300 DPI (calidad de impresión)
const LABEL_MM = { w: 50, h: 25 };
const DPI = 300;
const W = Math.round((LABEL_MM.w / 25.4) * DPI); // 591 px
const H = Math.round((LABEL_MM.h / 25.4) * DPI); // 295 px
const PAD = 18;

const BRAND_RED = '#D32F2F';
const INK = '#1a1b22';
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

const formatPrice = (price) => {
  const n = Number(price);
  return price !== null && price !== '' && Number.isFinite(n) ? `$${n.toFixed(2)}` : '';
};

// Recorta un texto con "…" para que quepa en maxWidth
const fitText = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
};

// Divide un texto en varias líneas (máx. maxLines) dentro de maxWidth
const wrapText = (ctx, text, maxWidth, maxLines) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth);
    return kept;
  }
  return lines.map((l) => fitText(ctx, l, maxWidth));
};

const drawBarcodeLabel = (ctx, product) => {
  const sku = String(product.sku);
  const price = formatPrice(product.price);

  // Cabecera: marca + precio
  ctx.textBaseline = 'top';
  ctx.fillStyle = BRAND_RED;
  ctx.font = `800 24px ${FONT}`;
  ctx.fillText('EL CASTILLO', PAD, PAD);

  if (price) {
    ctx.fillStyle = INK;
    ctx.font = `800 30px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(price, W - PAD, PAD - 3);
    ctx.textAlign = 'left';
  }

  // Nombre del producto
  ctx.fillStyle = INK;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(fitText(ctx, product.name || '', W - PAD * 2), PAD, PAD + 34);

  // Código de barras Code128 con ancho de módulo entero (barras nítidas)
  const probe = document.createElement('canvas');
  JsBarcode(probe, sku, { format: 'CODE128', width: 1, height: 10, margin: 0, displayValue: false });
  const modules = probe.width;
  const module = Math.max(1, Math.floor((W - PAD * 2) / modules));

  const bc = document.createElement('canvas');
  JsBarcode(bc, sku, {
    format: 'CODE128',
    width: module,
    height: 128,
    margin: 0,
    displayValue: false,
    background: '#ffffff',
    lineColor: '#000000',
  });
  const bcX = Math.round((W - bc.width) / 2);
  const bcY = PAD + 70;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bc, bcX, bcY);

  // SKU legible debajo de las barras
  ctx.fillStyle = INK;
  ctx.font = `700 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(fitText(ctx, `SKU ${sku}`, W - PAD * 2), W / 2, bcY + 128 + 8);
  ctx.textAlign = 'left';
};

const drawQrLabel = async (ctx, product) => {
  const sku = String(product.sku);
  const price = formatPrice(product.price);
  const qrSize = H - PAD * 2;

  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, sku, { errorCorrectionLevel: 'M', margin: 0, width: qrSize, color: { dark: '#000000', light: '#ffffff' } });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, PAD, PAD, qrSize, qrSize);

  const x = PAD + qrSize + 20;
  const colW = W - x - PAD;

  ctx.textBaseline = 'top';
  ctx.fillStyle = BRAND_RED;
  ctx.font = `800 22px ${FONT}`;
  ctx.fillText('EL CASTILLO', x, PAD);

  ctx.fillStyle = INK;
  ctx.font = `700 25px ${FONT}`;
  const lines = wrapText(ctx, product.name || '', colW, 3);
  lines.forEach((line, i) => ctx.fillText(line, x, PAD + 32 + i * 30));

  ctx.font = `600 21px ${FONT}`;
  ctx.fillStyle = '#5b5e66';
  ctx.fillText(fitText(ctx, `SKU ${sku}`, colW), x, H - PAD - (price ? 72 : 24));

  if (price) {
    ctx.fillStyle = INK;
    ctx.font = `800 40px ${FONT}`;
    ctx.fillText(fitText(ctx, price, colW), x, H - PAD - 42);
  }
};

const renderLabel = async (canvas, product, format) => {
  if (document.fonts?.ready) await document.fonts.ready;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (format === 'qr') await drawQrLabel(ctx, product);
  else drawBarcodeLabel(ctx, product);
};

const safeName = (sku) => String(sku).replace(/[^a-z0-9_-]+/gi, '_');

const ProductLabelModal = ({ products, initialProduct = null, onClose }) => {
  const [product, setProduct] = useState(initialProduct);
  const [format, setFormat] = useState('barcode');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !q || (p.name || '').toLowerCase().includes(q) || String(p.sku || '').toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, search]);

  useEffect(() => {
    if (!product || !canvasRef.current) return;
    setError('');
    renderLabel(canvasRef.current, product, format).catch((e) => {
      console.error(e);
      setError('No se pudo generar la etiqueta para este SKU.');
    });
  }, [product, format]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta-${safeName(product.sku)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  const downloadPdf = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [LABEL_MM.w, LABEL_MM.h] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, LABEL_MM.w, LABEL_MM.h);
    pdf.save(`etiqueta-${safeName(product.sku)}.pdf`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-charcoal/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-2xl border border-neutral-border max-h-[92vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="label-modal-title"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-red-subtle text-brand-red flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">sell</span>
            </div>
            <h2 id="label-modal-title" className="text-headline-md text-on-surface">Etiqueta de producto</h2>
          </div>
          <button id="label-modal-close" className="text-on-surface-variant hover:text-on-surface p-1" onClick={onClose} aria-label="Cerrar">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {!product ? (
          /* Paso 1: elegir producto */
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                id="label-product-search"
                autoFocus
                className="w-full bg-surface-container-low text-on-surface text-body-md rounded-lg pl-10 pr-4 py-2 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Buscar producto por nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ul className="flex flex-col divide-y divide-neutral-border border border-neutral-border rounded-lg overflow-hidden max-h-[55vh] overflow-y-auto">
              {results.length === 0 && (
                <li className="p-4 text-body-sm text-on-surface-variant text-center">No hay productos que coincidan.</li>
              )}
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    id={`label-pick-${p.id}`}
                    onClick={() => setProduct(p)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-container-low transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-body-md font-bold text-on-surface truncate">{p.name}</p>
                      <p className="text-body-sm text-on-surface-variant truncate">SKU: {p.sku}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Paso 2: vista previa y descarga */
          <div className="flex flex-col gap-4">
            {!initialProduct && (
              <button
                id="label-change-product"
                onClick={() => setProduct(null)}
                className="self-start text-label-md text-primary flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Cambiar producto
              </button>
            )}

            {/* Selector de formato */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-low rounded-lg border border-neutral-border">
              {[
                { id: 'barcode', label: 'Código de barras', icon: 'barcode' },
                { id: 'qr', label: 'Código QR', icon: 'qr_code_2' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  id={`label-format-${opt.id}`}
                  onClick={() => setFormat(opt.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-label-md transition-all ${
                    format === opt.id ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Vista previa */}
            <div className="bg-[repeating-conic-gradient(#f1f1f4_0%_25%,#fafafa_0%_50%)] [background-size:16px_16px] rounded-xl p-5 flex flex-col items-center gap-2 border border-neutral-border">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[300px] h-auto rounded-md shadow-md ring-1 ring-black/10 bg-white"
                style={{ aspectRatio: `${LABEL_MM.w} / ${LABEL_MM.h}` }}
              />
              <span className="text-label-sm text-on-surface-variant">
                Tamaño real: {LABEL_MM.w} × {LABEL_MM.h} mm · {DPI} ppp
              </span>
            </div>

            {error && <p className="text-body-sm text-error text-center">{error}</p>}

            {/* Descargas */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="label-download-png"
                onClick={downloadPng}
                disabled={!!error}
                className="bg-primary text-on-primary hover:bg-brand-red-hover py-2.5 rounded-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">download</span> Imagen PNG
              </button>
              <button
                id="label-download-pdf"
                onClick={downloadPdf}
                disabled={!!error}
                className="bg-surface-container-high text-on-surface hover:bg-neutral-border py-2.5 rounded-lg text-label-lg flex items-center justify-center gap-2 border border-neutral-border shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant text-center -mt-1">
              El PDF se imprime al tamaño exacto de la etiqueta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductLabelModal;
