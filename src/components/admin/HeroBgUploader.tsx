'use client'
import { useState, useEffect } from 'react'
import ProductShowcaseHeroEditor from '@/components/admin/ProductShowcaseHeroEditor'

type ShowcaseProduct = {
  image: string
  label: string
  slug: string
  color: string
  circleColor?: string
  glowEnabled?: boolean
  glowPulse?: boolean
}

type SettingItem = { key: string; value: string }
type GlowSettings = {
  glow_enabled: string
  glow_size: string
  glow_opacity: string
  glow_blur: string
  glow_pulse: string
  glow_color: string
}

const defaultGlowSettings: GlowSettings = {
  glow_enabled: 'true',
  glow_size: '520',
  glow_opacity: '0.65',
  glow_blur: '90',
  glow_pulse: 'false',
  glow_color: ''
}

export default function HeroBgUploader() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activating, setActivating] = useState(false)
  const [active, setActive] = useState(false)
  const [glow, setGlow] = useState<GlowSettings>(defaultGlowSettings)

  useEffect(() => {
    loadProducts()
    loadHeroMode()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/hero-products')
      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        setProducts(data.products)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Failed to load products:', err)
      setLoading(false)
    }
  }

  const loadHeroMode = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      const settings = data.settings
      const settingsMap: Record<string, string> = Array.isArray(settings)
        ? settings.reduce((map: Record<string, string>, setting: SettingItem) => {
            if (setting.key) map[setting.key] = setting.value
            return map
          }, {})
        : settings || {}
      const mode = Array.isArray(settings)
        ? settings.find((setting: { key: string; value: string }) => setting.key === 'hero_bg_type')?.value
        : settings?.hero_bg_type
      setActive(mode === 'showcase')
      setGlow({
        glow_enabled: settingsMap.glow_enabled || defaultGlowSettings.glow_enabled,
        glow_size: settingsMap.glow_size || defaultGlowSettings.glow_size,
        glow_opacity: settingsMap.glow_opacity || defaultGlowSettings.glow_opacity,
        glow_blur: settingsMap.glow_blur || defaultGlowSettings.glow_blur,
        glow_pulse: settingsMap.glow_pulse || defaultGlowSettings.glow_pulse,
        glow_color: settingsMap.glow_color || defaultGlowSettings.glow_color,
      })
    } catch (err) {
      console.error('Failed to load hero mode:', err)
    }
  }

  const saveGlowSetting = async (key: keyof GlowSettings, value: string) => {
    setGlow(prev => ({ ...prev, [key]: value }))
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (!response.ok) throw new Error('Failed to save glow setting')
      setError('')
    } catch (err) {
      console.error('Glow setting save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save glow setting')
    }
  }

  const activateShowcase = async () => {
    setActivating(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hero_bg_type', value: 'showcase' })
      })
      if (!response.ok) throw new Error('Failed to activate showcase')
      setActive(true)
      setError('')
    } catch (err) {
      console.error('Activation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to activate showcase')
    } finally {
      setActivating(false)
    }
  }

  const handleSave = async (updatedProducts: ShowcaseProduct[]) => {
    try {
      const response = await fetch('/api/hero-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSaved(true)
        setError('')
        setTimeout(() => setSaved(false), 3000)
        loadProducts()
      } else {
        setError(data.error || 'Failed to save products')
      }
    } catch (err) {
      console.error('Save failed:', err)
      setError('Network error - failed to save')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Hero Showcase Products
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          Configure the products displayed in the homepage hero section with custom colors and glows
        </p>
        <button
          onClick={activateShowcase}
          disabled={active || activating}
          style={{
            marginTop: '1rem',
            padding: '0.7rem 1rem',
            background: active ? '#16a34a' : '#111',
            color: '#fff',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            cursor: active || activating ? 'default' : 'pointer'
          }}
        >
          {active ? 'Showcase Active' : activating ? 'Activating...' : 'Use Showcase On Homepage'}
        </button>
      </div>

      {saved && (
        <div style={{ 
          background: '#10b981', 
          color: '#fff', 
          padding: '1rem 1.5rem', 
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <span style={{ fontWeight: '500' }}>Products saved successfully!</span>
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#ef4444', 
          color: '#fff', 
          padding: '1rem 1.5rem', 
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>❌</span>
          <span style={{ fontWeight: '500' }}>{error}</span>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Showcase Glow</h4>
            <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>Controls the premium glow behind the active hero product.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={glow.glow_enabled === 'true'}
              onChange={e => saveGlowSetting('glow_enabled', e.target.checked ? 'true' : 'false')}
              style={{ width: 18, height: 18 }}
            />
            Glow {glow.glow_enabled === 'true' ? 'ON' : 'OFF'}
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <GlowSlider label="Glow Size" value={glow.glow_size} min={200} max={800} step={10} suffix="px" onChange={value => saveGlowSetting('glow_size', value)} />
          <GlowSlider label="Glow Opacity" value={glow.glow_opacity} min={0} max={1} step={0.05} suffix="" onChange={value => saveGlowSetting('glow_opacity', value)} />
          <GlowSlider label="Glow Blur" value={glow.glow_blur} min={20} max={150} step={5} suffix="px" onChange={value => saveGlowSetting('glow_blur', value)} />
          <div style={{ padding: '0.85rem', background: '#f9fafb', border: '1px solid #eef0f3', borderRadius: '6px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.55rem' }}>
              <span>Glow Color</span>
              <span>{glow.glow_color || 'Product color'}</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={glow.glow_color || '#ffffff'}
                onChange={e => saveGlowSetting('glow_color', e.target.value)}
                style={{ width: 44, height: 34, border: '1px solid #d1d5db', padding: 0, cursor: 'pointer' }}
              />
              <button
                type="button"
                onClick={() => saveGlowSetting('glow_color', '')}
                style={{ padding: '0.45rem 0.7rem', border: '1px solid #d1d5db', background: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Use Product Color
              </button>
            </div>
          </div>
          <div style={{ padding: '0.85rem', background: '#f9fafb', border: '1px solid #eef0f3', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Glow Pulse</p>
              <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Subtle breathing intensity</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={glow.glow_pulse === 'true'}
                onChange={e => saveGlowSetting('glow_pulse', e.target.checked ? 'true' : 'false')}
                style={{ width: 18, height: 18 }}
              />
              {glow.glow_pulse === 'true' ? 'ON' : 'OFF'}
            </label>
          </div>
        </div>
      </div>

      <ProductShowcaseHeroEditor
        initialProducts={products}
        onSave={handleSave}
      />
    </div>
  )
}

function GlowSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: string
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ padding: '0.85rem', background: '#f9fafb', border: '1px solid #eef0f3', borderRadius: '6px' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.55rem' }}>
        <span>{label}</span>
        <span>{value}{suffix}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%' }}
      />
    </div>
  )
}
