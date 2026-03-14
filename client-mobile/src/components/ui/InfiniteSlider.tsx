import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Text, View } from 'react-native';

type Props = {
  items: string[];
  speed?: number;
};

export function InfiniteSlider({ items, speed = 60 }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (!contentWidth) return;

    translateX.setValue(0);
    const distance = contentWidth / 2;
    const duration = (distance / speed) * 1000;

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -distance,
        duration: duration || 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [contentWidth, speed, translateX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContentWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="overflow-hidden">
      <Animated.View
        className="flex-row"
        style={{ transform: [{ translateX }] }}
        onLayout={handleLayout}
      >
        {[...items, ...items].map((item, index) => (
          <View key={`${item}-${index}`} className="px-6">
            <Text className="text-base font-semibold text-foreground">{item}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
