'use client';

import { useState, useMemo } from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type PaymentMethod = 'gpay' | 'phonepe' | 'paytm';

type Props = {
  amount: string;
  onPay: (method: PaymentMethod) => void;
  onClose: () => void;
};

const METHODS: { key: PaymentMethod; label: string; color: string; deepLink: string; storeUrl: string }[] = [
  {
    key: 'gpay',
    label: 'Google Pay',
    color: 'bg-white text-black',
    deepLink: 'tez://upi/',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
  },
  {
    key: 'phonepe',
    label: 'PhonePe',
    color: 'bg-purple-600 text-white',
    deepLink: 'phonepe://',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.phonepe.app',
  },
  {
    key: 'paytm',
    label: 'Paytm',
    color: 'bg-blue-500 text-white',
    deepLink: 'paytmmp://',
    storeUrl: 'https://play.google.com/store/apps/details?id=net.one97.paytm',
  },
];

function useIsMobile() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );
  }, []);
}

export function PaymentModal({ amount, onPay, onClose }: Props) {
  const isMobile = useIsMobile();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleMobilePay = (method: PaymentMethod) => {
    const m = METHODS.find((mm) => mm.key === method)!;
    // Open the UPI app via deep link
    const a = document.createElement('a');
    a.href = m.deepLink;
    a.click();
    onPay(method);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border shadow-xl">

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Pay{amount ? ` ₹${amount}` : ''}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {isMobile ? (
                <><Smartphone className="w-3 h-3" /> Opens UPI app on your phone</>
              ) : (
                <><Monitor className="w-3 h-3" /> Scan QR from your phone</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">

          {/* ===== MOBILE VIEW ===== */}
          {isMobile && (
            <div className="space-y-3">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => handleMobilePay(m.key)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-transform active:scale-[0.98] ${m.color}`}
                >
                  Pay via {m.label}
                </button>
              ))}
            </div>
          )}

          {/* ===== DESKTOP VIEW ===== */}
          {!isMobile && (
            <div className="space-y-4">
              {/* Method picker */}
              <div className="flex gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMethod(m.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      selectedMethod === m.key
                        ? `${m.color} border-transparent shadow`
                        : 'bg-secondary border-border text-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* QR Code */}
              {selectedMethod && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG
                      value={METHODS.find((m) => m.key === selectedMethod)!.deepLink}
                      size={180}
                      level="M"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan with your phone camera to open{' '}
                    <span className="font-semibold text-foreground">
                      {METHODS.find((m) => m.key === selectedMethod)!.label}
                    </span>
                  </p>
                  <button
                    onClick={() => onPay(selectedMethod)}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm mt-1"
                  >
                    I've completed the payment
                  </button>
                </div>
              )}

              {!selectedMethod && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Select a payment method to see the QR code
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cancel */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}