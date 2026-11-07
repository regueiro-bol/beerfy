'use client'

import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import type { Venue } from '@/lib/types/database'
import { Loader2 } from 'lucide-react'

interface CityMapProps {
  venues: Venue[]
  center: { lat: number; lng: number }
  zoom?: number
  citySlug: string
}

const esc = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export default function CityMap({ venues, center, zoom = 13, citySlug }: CityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState('')

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey) return

    setOptions({
      key: apiKey,
      v: 'weekly',
    })

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ])
      .then(() => {
        if (!mapRef.current) return

        const google = window.google
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        const infoWindow = new google.maps.InfoWindow()
        const bounds = new google.maps.LatLngBounds()
        let placed = 0
        const icon: google.maps.Icon = {
          url: '/map/pin.svg',
          scaledSize: new google.maps.Size(40, 51),
          anchor: new google.maps.Point(20, 49),
        }

        venues.forEach((venue) => {
          if (venue.latitude === null || venue.longitude === null) return

          const position = { lat: Number(venue.latitude), lng: Number(venue.longitude) }

          const marker = new google.maps.Marker({
            position,
            map,
            title: venue.name,
            icon,
          })
          bounds.extend(position)
          placed++

          marker.addListener('click', () => {
            const contentString = `
              <div style="color: #000; padding: 4px; font-family: sans-serif; max-width: 220px;">
                <h3 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; line-height: 1.2;">${esc(venue.name)}</h3>
                <p style="font-size: 11px; margin: 0 0 8px 0; color: #555;">${esc(venue.address || '')}</p>
                <a href="/${citySlug}/${venue.slug}" style="font-size: 12px; font-weight: 600; color: #134236; text-decoration: underline;">
                  Ver ficha del bar
                </a>
              </div>
            `
            infoWindow.setContent(contentString)
            infoWindow.open(map, marker)
          })
        })

        // Encuadra los bares si hay varios, sin acercarse demasiado
        if (placed > 1) {
          map.fitBounds(bounds, 64)
          google.maps.event.addListenerOnce(map, 'idle', () => {
            if ((map.getZoom() ?? zoom) > 16) map.setZoom(16)
          })
        }

        setMapLoaded(true)
      })
      .catch((err) => {
        console.error('Google Maps loading error:', err)
        setError('Error al cargar Google Maps.')
      })
  }, [venues, center, zoom, citySlug, apiKey])

  if (!apiKey) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-muted flex items-center justify-center rounded-lg border">
        <p className="text-sm text-destructive font-medium">Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is not defined.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-muted flex items-center justify-center rounded-lg border">
        <p className="text-sm text-destructive font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden border">
      {!mapLoaded && (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center space-y-2 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Cargando mapa interactivo...</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[300px] md:h-[400px]" />
    </div>
  )
}
