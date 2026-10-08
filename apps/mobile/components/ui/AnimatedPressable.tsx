import { Pressable } from 'react-native'
import Animated from 'react-native-reanimated'

// Never wrap this in cssInterop: NativeWind would fold the className's styles and a
// useAnimatedStyle into one object, and Reanimated keeps only the animated values of an object
// carrying its marker, so flex, padding and colours vanish. Reanimated renders the Pressable
// NativeWind already registered, which reads the className itself.
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
