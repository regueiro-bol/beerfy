import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AgeGate } from '@/components/age-gate'
import { StoreProvider, useStore } from '@/lib/store'
import { C } from '@/lib/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

function Root() {
  const { ageOk, confirmAge } = useStore()
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })
  const ready = fontsLoaded && ageOk !== null

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  if (!ready) return null
  if (!ageOk) return <AgeGate onYes={confirmAge} />

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bar/[id]" />
      <Stack.Screen name="ciudad/[slug]" />
      <Stack.Screen name="puntuar/[id]" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: C.ink } }} />
      <Stack.Screen name="avisos" options={{ presentation: 'modal' }} />
    </Stack>
  )
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  )
}
