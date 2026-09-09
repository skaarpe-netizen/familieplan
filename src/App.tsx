import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, CloudSun, CookingPot, ExternalLink, LogOut, MessageCircle, Plus, RefreshCw, Settings2, Sun, ThermometerSun, Wind } from 'lucide-react'
import { formatDay } from './lib/date'
import { useCalendarData } from './hooks/useCalendarData'
import { supabase } from './lib/supabase'
import { createCalendar as createCalendarRecord, deleteCalendar as deleteCalendarRecord, updateCalendar as updateCalendarRecord } from './services/calendarService'
import { syncCalendars } from './services/syncService'
import { upsertUserProfile } from './services/profileService'
import { useFamilyStore } from './store/family'
import { useUiStore } from './store/ui'
import type { CalendarColor } from './types'

const colorClasses: Record<CalendarColor, string> = {
  lilac: 'calendar-lilac', blue: 'calendar-blue', pink: 'calendar-pink', green: 'calendar-green', orange: 'calendar-orange',
}

function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/dashboard" className="brand"><span className="brand-mark">F</span><span>Familieplanen</span></Link>
      <div className="topbar-meta"><span className="live-dot" /> Sidst synkroniseret for 2 min siden <Link to="/admin" className="icon-button" aria-label="Åbn administration"><Settings2 size={21} /></Link></div>
      {location.pathname === '/admin' && <Link to="/dashboard" className="back-link"><ChevronLeft size={18} /> Dashboard</Link>}
    </header>
    {children}
  </div>
}

function ProtectedLayout() {
  const [ready, setReady] = useState(!supabase)
  const [authenticated, setAuthenticated] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data }) => {
      setAuthenticated(Boolean(data.session))
      if (data.session?.user) await upsertUserProfile(data.session.user).catch(() => undefined)
      setReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session))
      setReady(true)
      if (session?.user) void upsertUserProfile(session.user).catch(() => undefined)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!ready) return <main className="loading-page">Indlæser Familieplanen...</main>
  return authenticated ? <AppShell><Outlet /></AppShell> : <Navigate to="/" replace />
}

function CalendarFilters({ calendars }: { calendars: ReturnType<typeof useFamilyStore.getState>['calendars'] }) {
  const { visibleCalendars, toggleCalendar } = useUiStore()
  return <div className="filter-row" aria-label="Kalenderfiltre">
    {calendars.map((calendar) => <button key={calendar.id} className={`filter-chip ${visibleCalendars.includes(calendar.id) ? 'selected' : ''} ${colorClasses[calendar.color]}`} onClick={() => toggleCalendar(calendar.id)}>
      <span className="chip-dot" />{calendar.name}
    </button>)}
  </div>
}

function CalendarPanel() {
  const { calendarMode, setCalendarMode, visibleCalendars } = useUiStore()
  const { calendars, events } = useCalendarData()
  const visibleEvents = useMemo(() => events.filter((event) => visibleCalendars.includes(event.calendarId)), [events, visibleCalendars])
  const getCalendar = (id: string) => calendars.find((calendar) => calendar.id === id)!
  return <section className="panel calendar-panel">
    <div className="panel-header calendar-header"><div><p className="eyebrow">Familien samlet</p><h2>Kalender</h2></div><div className="segmented"><button className={calendarMode === 'five-days' ? 'active' : ''} onClick={() => setCalendarMode('five-days')}>5 dage</button><button className={calendarMode === 'day' ? 'active' : ''} onClick={() => setCalendarMode('day')}>Dag</button></div></div>
    <CalendarFilters calendars={calendars} />
    {calendarMode === 'five-days' ? <div className="days-grid">{[0, 1, 2, 3, 4].map((offset) => <div className="day-column" key={offset}><div className={`day-heading ${offset === 0 ? 'today' : ''}`}><span>{formatDay(offset)}</span><strong>{offset === 0 ? 'I dag' : offset === 1 ? 'I morgen' : `+${offset} dage`}</strong></div><div className="events-stack">{visibleEvents.filter((event) => Number(event.date.slice(-2)) === 8 + offset).map((event) => { const calendar = getCalendar(event.calendarId); return <div className={`event-card ${colorClasses[calendar.color]}`} key={event.id}><div className="event-time">{event.time}</div><strong>{event.title}</strong><small>{calendar.name}{event.location ? ` · ${event.location}` : ''}</small></div> })}</div></div>)}</div> : <div className="day-view"><div className="day-view-title"><ChevronLeft size={20} /><strong>Tirsdag 8. september</strong><ChevronRight size={20} /></div>{visibleEvents.filter((event) => event.date === '2026-09-08').map((event) => { const calendar = getCalendar(event.calendarId); return <div className="day-event" key={event.id}><span className={`person-dot ${colorClasses[calendar.color]}`} /><span className="day-event-time">{event.time}</span><strong>{event.title}</strong><small>{calendar.name}</small></div> })}</div>}
  </section>
}

function WeatherPanel() {
  const weather = useFamilyStore((state) => state.weather)
  const [current, setCurrent] = useState({ temperature: 18, wind: 12, rain: 20, label: 'Delvist skyet' })
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weather.latitude}&longitude=${weather.longitude}&current=temperature_2m,wind_speed_10m,precipitation&hourly=precipitation_probability&forecast_days=1`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setCurrent({ temperature: Math.round(data.current.temperature_2m), wind: Math.round(data.current.wind_speed_10m), rain: Math.round(data.hourly?.precipitation_probability?.[0] ?? 20), label: data.current.weather_code < 3 ? 'Delvist skyet' : 'Regn eller skyer' }))
      .catch(() => undefined)
  }, [weather.latitude, weather.longitude])
  const clothing = current.temperature < 8 ? 'Vinterjakke' : current.temperature < 16 ? 'Tynd jakke' : 'T-shirt og let trøje'
  return <section className="panel weather-panel"><div className="panel-header"><div><p className="eyebrow">Hjemme hos os</p><h2>Vejret</h2></div><CloudSun size={34} className="weather-icon" /></div><div className="weather-main"><div><span className="temperature">{current.temperature}°</span><span className="condition">{current.label}</span></div><div className="weather-place">{weather.city}<br /><small>Opdateret fra Open-Meteo</small></div></div><div className="weather-stats"><span><Wind size={17} /> {current.wind} km/t</span><span><ThermometerSun size={17} /> Føles som {current.temperature - 1}°</span><span><CloudSun size={17} /> {current.rain}% regn</span></div><div className="clothing"><span className="clothing-icon">◒</span><div><strong>{clothing}</strong><small>{current.temperature < 16 ? 'Det bliver køligt i aften' : 'En lun dag forude'}</small></div></div></section>
}

function MealPanel() { return <section className="panel meal-panel"><div className="panel-header"><div><p className="eyebrow">Tirsdag</p><h2>Madplan</h2></div><CookingPot size={30} className="meal-icon" /></div><div className="meal-content"><div className="meal-image">🍝</div><div><span className="meal-label">Aftensmad</span><h3>Lasagne</h3><p>Med grøn salat og hjemmebagt brød</p></div></div><button className="text-action">Se hele madplanen <ExternalLink size={15} /></button></section> }

function MessagesPanel() {
  const messages = useFamilyStore((state) => state.messages)
  const addMessage = useFamilyStore((state) => state.addMessage)
  const writeMessage = () => { const text = window.prompt('Skriv en besked til familien'); if (text?.trim()) addMessage(text.trim()) }
  return <section className="panel messages-panel"><div className="panel-header"><div><p className="eyebrow">Fra familien</p><h2>Beskeder</h2></div><MessageCircle size={29} className="message-icon" /></div><div className="message-list">{messages.slice(0, 2).map((message) => <div className="message-item" key={message.id}><span className="avatar">{message.author[0]}</span><div><strong>{message.text}</strong><small>{message.author} · {message.createdAt}</small></div></div>)}</div><button className="text-action" onClick={writeMessage}>Skriv en besked <Plus size={16} /></button></section>
}

function Ticker() { const messages = useFamilyStore((state) => state.messages); return <div className="ticker"><span className="ticker-label"><MessageCircle size={16} /> FAMILIENYT</span>{messages.slice(0, 3).map((message, index) => <span key={message.id}>{index > 0 && <span className="ticker-separator"> • </span>}{message.text}</span>)}</div> }

function Dashboard() { return <main className="dashboard"><div className="dashboard-grid"><CalendarPanel /><div className="side-stack"><WeatherPanel /><MealPanel /><MessagesPanel /></div></div><Ticker /></main> }

function Admin() {
  const [tab, setTab] = useState<'calendars' | 'meals' | 'weather' | 'messages'>('calendars')
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const queryClient = useQueryClient()
  const calendars = useFamilyStore((state) => state.calendars)
  const messages = useFamilyStore((state) => state.messages)
  const weather = useFamilyStore((state) => state.weather)
  const mealUrl = useFamilyStore((state) => state.mealUrl)
  const addCalendar = useFamilyStore((state) => state.addCalendar)
  const updateCalendar = useFamilyStore((state) => state.updateCalendar)
  const removeCalendar = useFamilyStore((state) => state.removeCalendar)
  const addMessage = useFamilyStore((state) => state.addMessage)
  const removeMessage = useFamilyStore((state) => state.removeMessage)
  const setWeather = useFamilyStore((state) => state.setWeather)
  const setMealUrl = useFamilyStore((state) => state.setMealUrl)
  const createCalendar = async () => { const name = window.prompt('Kalendernavn'); if (!name?.trim()) return; const calendar = { name: name.trim(), owner: name.trim(), color: 'orange' as const, active: true, source: 'ICS' }; try { const saved = await createCalendarRecord(calendar); if (saved) addCalendar(saved); await queryClient.invalidateQueries({ queryKey: ['calendar-data'] }); } catch (error) { window.alert(error instanceof Error ? error.message : 'Kalenderen kunne ikke gemmes') } }
  const editCalendar = async (calendar: typeof calendars[number]) => { const nextName = window.prompt('Kalendernavn', calendar.name); if (!nextName?.trim()) return; const nextUrl = window.prompt('ICS kalenderlink', calendar.icsUrl ?? ''); if (!nextUrl?.trim() || !nextUrl.startsWith('http')) { window.alert('Indtast et gyldigt ICS-link'); return } try { await updateCalendarRecord(calendar.id, { name: nextName.trim(), icsUrl: nextUrl.trim() }); updateCalendar(calendar.id, { name: nextName.trim(), icsUrl: nextUrl.trim() }); await queryClient.invalidateQueries({ queryKey: ['calendar-data'] }); } catch { window.alert('Kalenderen kunne ikke opdateres') } }
  const toggleCalendar = async (id: string, active: boolean) => { try { await updateCalendarRecord(id, { active: !active }); updateCalendar(id, { active: !active }); await queryClient.invalidateQueries({ queryKey: ['calendar-data'] }); } catch { window.alert('Kalenderens status kunne ikke gemmes') } }
  const deleteCalendar = async (id: string) => { try { await deleteCalendarRecord(id); removeCalendar(id); await queryClient.invalidateQueries({ queryKey: ['calendar-data'] }); } catch { window.alert('Kalenderen kunne ikke slettes') } }
  const runCalendarSync = async () => {
    setSyncing(true)
    setSyncStatus('Synkroniserer...')
    try {
      const result = await syncCalendars()
      await queryClient.invalidateQueries({ queryKey: ['calendar-data'] })
      setSyncStatus(`${result.synced ?? 0} events synkroniseret`)
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Synkronisering fejlede')
    } finally {
      setSyncing(false)
    }
  }
  const createMessage = () => { const text = window.prompt('Ny familiebesked'); if (text?.trim()) addMessage(text.trim()) }
  const saveWeather = () => { const city = window.prompt('By', weather.city); const latitude = Number(window.prompt('Latitude', String(weather.latitude))); const longitude = Number(window.prompt('Longitude', String(weather.longitude))); if (city?.trim() && Number.isFinite(latitude) && Number.isFinite(longitude)) setWeather({ city: city.trim(), latitude, longitude }) }
  return <main className="admin-page"><div className="admin-heading"><div><p className="eyebrow">Familieplanen</p><h1>Administration</h1><p>Hold familiens data opdateret ét sted.</p></div>{tab === 'calendars' && <div className="admin-actions"><button className="secondary-button" onClick={runCalendarSync} disabled={syncing}><RefreshCw size={17} className={syncing ? 'spin' : ''} /> {syncing ? 'Synkroniserer' : 'Synkroniser Aula'}</button><button className="primary-button" onClick={createCalendar}><Plus size={18} /> Tilføj kalender</button></div>}</div><div className="admin-tabs"><button className={tab === 'calendars' ? 'active' : ''} onClick={() => setTab('calendars')}><CalendarDays size={17} /> Kalendere</button><button className={tab === 'meals' ? 'active' : ''} onClick={() => setTab('meals')}><CookingPot size={17} /> Madplan</button><button className={tab === 'weather' ? 'active' : ''} onClick={() => setTab('weather')}><CloudSun size={17} /> Vejr</button><button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}><MessageCircle size={17} /> Beskeder</button></div>{tab === 'calendars' && <section className="admin-section"><div className="section-title"><div><h2>Kalendere</h2><p>ICS-kilder synkroniseres automatisk hver time.</p>{syncStatus && <p className="sync-status">{syncStatus}</p>}</div><span className="status-pill">{calendars.filter((calendar) => calendar.active).length} aktive</span></div><div className="calendar-table"><div className="table-row table-head"><span>Navn</span><span>Kilde</span><span>ICS URL</span><span>Status</span><span /></div>{calendars.map((calendar) => <div className="table-row" key={calendar.id}><span className="table-name"><span className={`chip-dot ${colorClasses[calendar.color]}`} />{calendar.name}</span><span>{calendar.source}</span><span className="url">{calendar.icsUrl ?? 'Ikke angivet'}</span><span><button className={`status-toggle ${calendar.active ? 'on' : ''}`} aria-label={`Skift ${calendar.name}`} onClick={() => toggleCalendar(calendar.id, calendar.active)} /></span><span><button className="row-action" onClick={() => editCalendar(calendar)}>Rediger</button><button className="row-action danger" onClick={() => deleteCalendar(calendar.id)}>Slet</button></span></div>)}</div></section>}{tab === 'meals' && <section className="admin-section form-section"><h2>Madplan</h2><p>Opsæt den separate ICS-kilde til familiens aftensmad.</p><label>ICS URL<input value={mealUrl} onChange={(event) => setMealUrl(event.target.value)} placeholder="https://..." /></label><button className="primary-button" onClick={() => window.alert('Madplan-URL gemt lokalt')}>Gem madplan</button></section>}{tab === 'weather' && <section className="admin-section form-section"><h2>Vejr</h2><p>Open-Meteo bruger koordinaterne til præcise prognoser.</p><label>By<input value={weather.city} onChange={(event) => setWeather({ ...weather, city: event.target.value })} /></label><div className="form-grid"><label>Latitude<input type="number" value={weather.latitude} onChange={(event) => setWeather({ ...weather, latitude: Number(event.target.value) })} /></label><label>Longitude<input type="number" value={weather.longitude} onChange={(event) => setWeather({ ...weather, longitude: Number(event.target.value) })} /></label></div><button className="primary-button" onClick={() => window.alert('Vejrindstillinger gemt lokalt')}>Gem vejr</button><button className="secondary-button" onClick={saveWeather}>Rediger via dialog</button></section>}{tab === 'messages' && <section className="admin-section"><div className="section-title"><div><h2>Beskeder</h2><p>Beskederne vises på dashboardet og i ticker-båndet.</p></div><button className="primary-button" onClick={createMessage}><Plus size={18} /> Ny besked</button></div><div className="admin-message-list">{messages.map((message) => <div className="admin-message" key={message.id}><div><strong>{message.text}</strong><small>{message.author} · {message.createdAt}</small></div><button className="row-action danger" onClick={() => removeMessage(message.id)}>Slet</button></div>)}</div></section>}</main>
}

function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const signIn = async () => {
    if (!email.trim()) { setStatus('Skriv din emailadresse først.'); return }
    if (!supabase) { window.location.assign('/dashboard'); return }
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin + '/dashboard' } })
    setStatus(error ? error.message : 'Tjek din indbakke for login-linket.')
  }

  return <main className="login-page"><div className="login-card"><span className="brand-mark large">F</span><p className="eyebrow">Familiens fælles overblik</p><h1>Velkommen til<br /><em>Familieplanen</em></h1><p>Alt det, I skal vide om dagen, samlet på ét sted.</p><label className="login-label">Emailadresse<input className="login-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="familie@example.com" /></label><button className="google-button" onClick={signIn}><span>→</span> Send login-link</button><small>{status || (supabase ? 'Du modtager et sikkert login-link på email.' : 'Demo-tilstand er aktiv.')}</small></div></main>
}

export function App() { return <Routes><Route path="/" element={<Login />} /><Route element={<ProtectedLayout />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/admin" element={<Admin />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes> }
