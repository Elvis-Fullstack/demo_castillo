import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const CameraScanner = ({ onScanSuccess }) => {
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // 'requesting', 'granted', 'denied'
  const [scannerInstance, setScannerInstance] = useState(null);

  const initCamera = () => {
    setPermissionStatus('requesting');
    const scanner = new Html5Qrcode("reader");
    setScannerInstance(scanner);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setPermissionStatus('granted');
          
          const startScanner = (cameraConfig) => {
            scanner.start(
              cameraConfig,
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                if (scanner.isScanning) {
                  scanner.stop().then(() => {
                    onScanSuccess(decodedText);
                  }).catch(() => {
                    onScanSuccess(decodedText);
                  });
                }
              },
              (errorMessage) => {}
            ).catch((err) => {
              // Si falla al intentar usar la cámara trasera, intentamos con la primera disponible
              if (cameraConfig.facingMode === "environment") {
                startScanner(devices[0].id);
              } else {
                setPermissionStatus('denied');
              }
            });
          };

          // Intentamos iniciar con la cámara trasera primero
          startScanner({ facingMode: "environment" });
        } else {
          setPermissionStatus('denied');
        }
      })
      .catch(() => {
        setPermissionStatus('denied');
      });
  };

  useEffect(() => {
    initCamera();

    return () => {
      if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().then(() => {
          scannerInstance.clear();
        }).catch(error => console.error("Fallo al detener la cámara.", error));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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

      <div id="reader" className={`w-full ${permissionStatus !== 'granted' ? 'hidden' : ''}`}></div>
    </div>
  );
};

export default CameraScanner;
