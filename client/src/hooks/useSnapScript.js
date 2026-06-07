import { useEffect } from "react";

// ✅ Shared hook — inject Snap.js script ke DOM
// Dipakai oleh Checkout.jsx dan OrderStatus.jsx
// Guard if (!script) memastikan script tidak double-inject
export default function useSnapScript() {
  useEffect(() => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const snapSrcUrl = "https://app.sandbox.midtrans.com/snap/snap.js";

    let script = document.querySelector(`script[src="${snapSrcUrl}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = snapSrcUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);
}
