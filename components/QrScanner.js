'use client';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

// Calls onDecoded(productId) the moment a valid "STOCK:PRODUCT:<id>" QR code is found.
export default function QrScanner({ onDecoded, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    let stream;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        video.play();
        requestAnimationFrame(tick);
      })
      .catch(() => {
        setError("Impossible d'accéder à la caméra. Utilisez la recherche manuelle du produit.");
      });

    function tick() {
      if (!activeRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data && code.data.indexOf('STOCK:PRODUCT:') === 0) {
            const productId = code.data.slice('STOCK:PRODUCT:'.length);
            activeRef.current = false;
            if (stream) stream.getTracks().forEach((t) => t.stop());
            onDecoded(productId);
            return;
          }
        } catch (e) { /* ignore decode errors, keep scanning */ }
      }
      requestAnimationFrame(tick);
    }

    return () => {
      activeRef.current = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div>
        <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>{error}</p>
        <button className="btn btn-outline btn-block" onClick={onCancel}>Fermer</button>
      </div>
    );
  }

  return (
    <div>
      <div className="scanner-wrap">
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="scanner-frame"></div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p className="muted" style={{ textAlign: 'center', marginTop: 12 }}>Visez le QR code du produit…</p>
      <button className="btn btn-outline btn-block" onClick={onCancel} style={{ marginTop: 10 }}>Annuler</button>
    </div>
  );
}
