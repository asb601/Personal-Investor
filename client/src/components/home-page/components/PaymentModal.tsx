type Props = {
  onPay: (method: 'gpay' | 'phonepe' | 'paytm') => void;
  onClose: () => void;
};

export function PaymentModal({ onPay, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-xl w-full max-w-sm">

        <h2 className="text-lg font-bold mb-4">Choose Payment Method</h2>

        <div className="space-y-3">
          <button
            onClick={() => onPay('gpay')}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold"
          >
            Pay via GPay
          </button>

          <button
            onClick={() => onPay('phonepe')}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold"
          >
            Pay via PhonePe
          </button>

          <button
            onClick={() => onPay('paytm')}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
          >
            Pay via Paytm
          </button>
        </div>


      

        <button
          onClick={onClose}
          className="mt-2 w-full border py-2 rounded-lg"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}