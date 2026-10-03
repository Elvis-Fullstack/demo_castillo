import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const READER_ID = 'reader';

// Formatos habituales en etiquetas de mercería / retail + QR
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

// Recuadro rectangular: sirve tanto para códigos de barras (anchos) como para QR
const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
  const width = Math.floor(Math.min(viewfinderWidth * 0.9, 340));
  const height = Math.floor(Math.min(viewfinderHeight * 0.7, width * 0.65));
  return { width: Math.max(width, 150), height: Math.max(height, 100) };
};

const CameraScanner = ({ onScanSuccess }) => {
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // 'requesting', 'granted', 'denied', 'unavailable'
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch (error) {
      console.error('Fallo al detener la cámara.', error);
    }
  };

  const deliverResult = async (text) => {
    if (handledRef.current) return; // Evita lecturas duplicadas
    handledRef.current = true;
    await stopScanner();
    onScanSuccessRef.current?.(text);
  };

  const initCamera = async () => {
    setPermissionStatus('requesting');
    handledRef.current = false;
    await stopScanner();

    const scanner = new Html5Qrcode(READER_ID, {
      formatsToSupport: SUPPORTED_FORMATS,
      useBarCodeDetectorIfSupported: true,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });
    scannerRef.current = scanner;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');

      await scanner.start(
        // Siempre la cámara trasera, nunca la frontal
        { facingMode: { exact: 'environment' } },
        {
          fps: 15,
          qrbox: qrboxFunction,
          disableFlip: true,
        },
        (decodedText) => deliverResult(decodedText),
        () => {} // Errores de "no se encontró código en este frame": se ignoran
      );
    } catch (err) {
      console.error('Error al iniciar la cámara:', err);
      const errText = `${err?.name || ''} ${err?.message || err || ''}`;
      // Sin permiso -> instrucciones del candado. Otro fallo -> no hay cámara trasera o está en uso.
      setPermissionStatus(/NotAllowed|Permission|denied/i.test(errText) ? 'denied' : 'unavailable');
    }
  };

  useEffect(() => {
    initCamera();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    deliverResult(code);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="w-full bg-surface-container-low rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
        {permissionStatus === 'requesting' && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-brand-red animate-pulse">photo_camera</span>
            <p className="text-body-lg font-bold text-on-surface">Activando cámara...</p>
            <p className="text-body-sm text-on-surface-variant">Por favor, otorga los permisos cuando el navegador te lo solicite.</p>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-error">no_photography</span>
            <div>
              <p className="text-body-lg font-bold text-error">Acceso Bloqueado</p>
              <p className="text-body-sm text-on-surface-variant mt-2">
                El navegador ha bloqueado el acceso a la cámara de forma permanente por seguridad.
              </p>
              <p className="text-body-sm text-on-surface-variant font-bold mt-2">
                Para solucionarlo: Toca el ícono del candado (🔒) en la barra de direcciones de tu navegador y cambia "Cámara" a "Permitir".
              </p>
            </div>
            <button
              onClick={initCamera}
              className="px-4 py-2 bg-brand-red text-on-primary rounded-lg text-label-md font-bold hover:bg-brand-red-hover transition-colors"
            >
              Ya le di permiso, reintentar
            </button>
          </div>
        )}

        {permissionStatus === 'unavailable' && (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">videocam_off</span>
            <div>
              <p className="text-body-lg font-bold text-on-surface">Cámara trasera no disponible</p>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Este dispositivo no tiene cámara trasera o la está usando otra aplicación. Ciérrala y reintenta, o escribe el SKU abajo.
              </p>
            </div>
            <button
              onClick={initCamera}
              className="px-4 py-2 bg-brand-red text-on-primary rounded-lg text-label-md font-bold hover:bg-brand-red-hover transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        <div id={READER_ID} className={`w-full ${permissionStatus !== 'granted' ? 'hidden' : ''}`}></div>
      </div>

      {permissionStatus === 'granted' && (
        <p className="text-body-sm text-on-surface-variant text-center">
          Apunta a las <span className="font-bold">barras o al QR</span> (no al texto) y mantén el móvil a unos 10–15 cm.
        </p>
      )}

      {/* Plan B: entrada manual si la etiqueta está dañada o no tiene código */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          id="manual-sku-input"
          type="text"
          inputMode="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="¿No lee? Escribe el SKU"
          className="flex-1 min-w-0 border border-neutral-border rounded-lg px-3 py-2 bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
        <button
          id="manual-sku-submit"
          type="submit"
          className="px-4 py-2 bg-brand-red text-on-primary rounded-lg text-label-md font-bold hover:bg-brand-red-hover transition-colors"
        >
          Añadir
        </button>
      </form>
    </div>
  );
};

export default CameraScanner;
