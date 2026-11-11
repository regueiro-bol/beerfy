import { Tabs } from 'expo-router/js-tabs'
import { TabBar } from '@/components/tab-bar'
import { C } from '@/lib/theme'

export default function TabLayout() {
  return (
    <Tabs
       
      tabBar={(props) => <TabBar {...(props as any)} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.paper } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="ciudades" options={{ title: 'Ciudades' }} />
      <Tabs.Screen name="cerca" options={{ title: 'Cerca de mí' }} />
      <Tabs.Screen name="bodega" options={{ title: 'La Bodega' }} />
      <Tabs.Screen name="sugerir" options={{ title: 'Sugerir' }} />
    </Tabs>
  )
}
