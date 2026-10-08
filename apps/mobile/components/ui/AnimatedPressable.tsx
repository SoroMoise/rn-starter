import { cssInterop } from 'nativewind'
import { Pressable } from 'react-native'
import Animated from 'react-native-reanimated'

// NativeWind only knows the components it registers: a wrapper made by createAnimatedComponent
// would take the className and draw nothing of it.
export const AnimatedPressable = cssInterop(Animated.createAnimatedComponent(Pressable), {
  className: 'style',
})
