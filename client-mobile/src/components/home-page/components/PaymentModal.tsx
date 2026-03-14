import { type Dispatch, type SetStateAction, useMemo } from 'react';
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { X } from 'lucide-react-native';

type PaymentMethod = 'gpay' | 'phonepe' | 'paytm';

type Props = {
  visible: boolean;
  amount: string;
  onPay: (method: PaymentMethod) => void;
  onClose: () => void;
  selectedMethod: PaymentMethod | null;
  setSelectedMethod: Dispatch<SetStateAction<PaymentMethod | null>>;
};

const METHODS: { key: PaymentMethod; label: string; color: string; deepLink: string }[] = [
  {
    key: 'gpay',
    label: 'Google Pay',
    color: 'bg-white text-black',
    deepLink: 'tez://upi',
  },
  {
    key: 'phonepe',
    label: 'PhonePe',
    color: 'bg-purple-600 text-white',
    deepLink: 'phonepe://',
  },
  {
    key: 'paytm',
    label: 'Paytm',
    color: 'bg-blue-600 text-white',
    deepLink: 'paytmmp://',
  },
];

export function PaymentModal({
  visible,
  amount,
  onPay,
  onClose,
  selectedMethod,
  setSelectedMethod,
}: Props) {
  const isMobile = useMemo(() => Platform.OS !== 'web', []);

  const handleMobilePay = (method: PaymentMethod) => {
    const meta = METHODS.find(item => item.key === method);
    if (!meta) return;
    Linking.openURL(meta.deepLink).catch(() => null);
    onPay(method);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-card rounded-t-3xl border border-border px-4 pt-4 pb-6">
          <View className="flex-row items-center justify-between border-b border-border pb-4">
            <View>
              <Text className="text-base font-semibold text-foreground">
                Pay {amount ? `₹${amount}` : ''}
              </Text>
              <Text className="text-xs text-muted-foreground flex-row items-center gap-1">
                {isMobile ? 'Opens UPI app' : 'Scan QR from your phone'}
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-full bg-secondary/40">
              <X color="#f4f4f5" size={16} />
            </Pressable>
          </View>

          <View className="mt-4">
            {isMobile && (
              <View className="gap-3">
                {METHODS.map(method => (
                  <Pressable
                    key={method.key}
                    onPress={() => handleMobilePay(method.key)}
                    className={`w-full py-3 rounded-2xl items-center ${method.color}`}
                  >
                    <Text className="font-semibold">Pay via {method.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {!isMobile && (
              <View>
                <View className="flex-row gap-2 mb-4">
                  {METHODS.map(method => (
                    <Pressable
                      key={method.key}
                      onPress={() => setSelectedMethod(method.key)}
                      className={`flex-1 py-2 rounded-xl border ${
                        selectedMethod === method.key
                          ? `${method.color} border-transparent`
                          : 'bg-secondary border-border'
                      }`}
                    >
                      <Text
                        className={`text-center text-xs font-semibold ${
                          selectedMethod === method.key ? 'text-white' : 'text-secondary-foreground'
                        }`}
                      >
                        {method.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {selectedMethod ? (
                  <View className="items-center gap-3">
                    <View className="bg-white p-4 rounded-2xl">
                      <QRCode value={METHODS.find(item => item.key === selectedMethod)?.deepLink ?? ''} size={180} />
                    </View>
                    <Pressable
                      onPress={() => onPay(selectedMethod)}
                      className="w-full bg-primary rounded-2xl py-3"
                    >
                      <Text className="text-center font-semibold text-primary-foreground">
                        I've completed the payment
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text className="text-center text-muted-foreground py-6">
                    Select a payment method to view the QR code
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
