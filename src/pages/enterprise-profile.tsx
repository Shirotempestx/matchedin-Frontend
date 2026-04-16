import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useMemo, useState, useRef, type ReactNode } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  Mail01Icon,
  Globe02Icon,
  Search01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  AiMagicIcon,
  PencilEdit02Icon,
  Camera01Icon,
  Bookmark02Icon,
  UserMultiple02Icon,
  Briefcase02Icon,
} from "hugeicons-react"
import api from "@/lib/axios"
import { useAuth } from "@/lib/auth"
import { detectBadWordsInFields } from "@/lib/profanity"
import { normalizeLocale } from "@/i18n/config"
import { useQueryClient } from "@tanstack/react-query"

// ─── Constants ───────────────────────────────────────────────────────────────

const VILLES_MAROC = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir",
  "Meknès", "Oujda", "Salé", "Kénitra", "Tétouan", "Safi",
  "El Jadida", "Beni Mellal", "Nador", "Settat", "Khémisset",
  "Larache", "Khouribga", "Berrechid", "Mohammedia", "Ifrane",
]

const SECTEURS = [
  "Tech / IT", "Finance", "Santé", "Éducation", "E-commerce",
  "Immobilier", "Automobile", "Agroalimentaire", "Énergie",
  "Télécommunications", "Consulting", "Marketing / Publicité",
  "Logistique / Transport", "Industrie", "Tourisme", "Autre",
]
const SECTEURS_EN = [
  "Tech / IT", "Finance", "Health", "Education", "E-commerce",
  "Real estate", "Automotive", "Food industry", "Energy",
  "Telecommunications", "Consulting", "Marketing / Advertising",
  "Logistics / Transport", "Industry", "Tourism", "Other",
]

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
]

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileView = "owner" | "public"

type EnterpriseProfilePageProps = {
  view?: ProfileView
}

type EnterpriseProfile = {
  id?: string
  slug?: string
  name: string
  industry: string
  location: string
  email?: string
  description: string
  completion: number
  company_size: string
  website?: string
  logo_url?: string
  banner_url?: string
  contact_phone?: string
  followers_count: number
  preferred_language?: "fr" | "en"
  privateStats?: {
    activeOffres: number
    totalCandidates: number
  }
}

// ─── Normalize ───────────────────────────────────────────────────────────────

function normalizeProfile(raw: unknown): EnterpriseProfile {
  if (!raw || typeof raw !== "object") return EMPTY_PROFILE

  const p = raw as Partial<EnterpriseProfile>
  return {
    id: p.id,
    slug: p.slug,
    name: p.name ?? "",
    industry: p.industry ?? "",
    location: p.location ?? "",
    email: p.email,
    description: p.description ?? "",
    completion: typeof p.completion === "number" ? p.completion : 0,
    company_size: p.company_size ?? "",
    website: p.website,
    logo_url: p.logo_url,
    contact_phone: p.contact_phone,
    followers_count: p.followers_count ?? 0,
    preferred_language: p.preferred_language ?? "fr",
    privateStats: p.privateStats,
  }
}

const EMPTY_PROFILE: EnterpriseProfile = {
  name: "", industry: "", location: "", description: "",
  completion: 0, company_size: "", followers_count: 0,
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EnterpriseProfilePage({ view = "owner" }: EnterpriseProfilePageProps) {
  const queryClient = useQueryClient();
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [profile, setProfile] = useState<EnterpriseProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const handleContact = async () => {
    if (!profile?.id) return
    setIsActionLoading(true)
    try {
      const res = await api.post("/conversations", { target_user_id: profile.id })
      navigate(`/${routeLocale}/messages/${res.data.conversation.id}`)
    } catch (e) {
      console.error("Failed to start conversation", e)
    } finally {
      setIsActionLoading(false)
    }
  }

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const isOwner = view === "owner"
  const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || 'fr')
  const isFr = routeLocale === 'fr'

  const [editForm, setEditForm] = useState({
    company_name: "",
    industry: "",
    country: "",
    description: "",
    company_size: "",
    website: "",
    logo_url: "",
    banner_url: "",
    contact_phone: "",
    preferred_language: "fr" as "fr" | "en",
  })

  const publicHandle = useMemo(() => {
    if (!params.slug) return ""
    return decodeURIComponent(params.slug)
  }, [params.slug])

  // Fetch profile
  useEffect(() => {
    let cancelled = false
    async function fetchProfile() {
      setLoading(true)
      setError("")
      try {
        const endpoint = isOwner
          ? "/enterprise-profiles/me"
          : `/enterprise-profiles/public/${encodeURIComponent(publicHandle)}`
        const res = await api.get(endpoint)
        if (!cancelled) {
          const p = normalizeProfile(res.data?.data)
          setProfile(p)
          if (!isOwner && user?.role === "student" && p.id) {
            api.get(`/enterprises/${p.id}/is-following`).then(r => setIsFollowing(r.data.isFollowing)).catch(() => {})
          }
        }
      } catch {
        if (!cancelled) {
          setError(routeLocale === 'fr' ? "Impossible de charger le profil." : "Unable to load profile.")
          setProfile(EMPTY_PROFILE)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchProfile()
    return () => { cancelled = true }
  }, [isOwner, publicHandle, routeLocale, user?.role])

  // Sync editForm when profile loads
  useEffect(() => {
    if (!profile) return
    setEditForm({
      company_name: profile.name,
      industry: profile.industry,
      country: profile.location,
      description: profile.description,
      company_size: profile.company_size,
      website: profile.website ?? "",
      logo_url: profile.logo_url ?? "",
      banner_url: profile.banner_url ?? "",
      contact_phone: profile.contact_phone ?? "",
      preferred_language: profile.preferred_language ?? "fr",
    })
  }, [profile])

  const activeProfile = profile ?? EMPTY_PROFILE
  const publicSlug = activeProfile.slug || publicHandle || "entreprise"
  const publicLink = `/${routeLocale}/enterprises/${encodeURIComponent(publicSlug)}`

  async function handleSaveProfile() {
    if (!isOwner) return

    const profanityResult = detectBadWordsInFields(editForm as unknown as Record<string, unknown>, ["company_name", "industry", "country", "description"])
    if (profanityResult.hasBadWord) {
      setError(isFr ? "Veuillez retirer les mots injurieux de votre texte." : "Please remove offensive words from your text.")
      return
    }

    setSaving(true)
    setError("")
    setNotice("")
    try {
      const res = await api.put("/enterprise-profiles/me", editForm)
      setProfile(normalizeProfile(res.data?.data))
      localStorage.setItem('preferred_language', editForm.preferred_language)
      if (routeLocale !== editForm.preferred_language) {
        const suffix = location.pathname.split('/').filter(Boolean).slice(1).join('/')
        navigate(`/${editForm.preferred_language}/${suffix}`)
      }
      setEditMode(false)
      setNotice(routeLocale === 'fr' ? "Profil entreprise mis a jour avec succes ✓" : "Company profile updated successfully ✓")
    } catch {
      setError(routeLocale === 'fr' ? "Echec de la mise a jour." : "Update failed.")
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'logo') setUploadingLogo(true)
    else setUploadingBanner(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const payload: Record<string, unknown> = { ...editForm }
      if (type === 'logo') payload.logo_url = data.url
      else payload.banner_url = data.url
      
      const res = await api.put("/enterprise-profiles/me", payload)
      setProfile(normalizeProfile(res.data?.data))
      setEditForm(prev => ({ 
        ...prev, 
        logo_url: type === 'logo' ? data.url : prev.logo_url,
        banner_url: type === 'banner' ? data.url : prev.banner_url
      }))
      setNotice(routeLocale === 'fr' ? `Image de ${type === 'logo' ? 'logo' : 'banniere'} mise a jour ✓` : `${type === 'logo' ? 'Logo' : 'Banner'} image updated ✓`)
    } catch {
      setError(routeLocale === 'fr' ? "Echec de l'upload. L'image est peut-etre trop lourde." : "Upload failed. The image may be too large.")
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingBanner(false)
      if (e.target) e.target.value = ''
    }
  }

  function openEditMode() {
    setNotice("")
    setEditMode(true)
  }

  function cancelEdit() {
    if (profile) {
      setEditForm({
        company_name: profile.name,
        industry: profile.industry,
        country: profile.location,
        description: profile.description,
        company_size: profile.company_size,
        website: profile.website ?? "",
        logo_url: profile.logo_url ?? "",
        banner_url: profile.banner_url ?? "",
        contact_phone: profile.contact_phone ?? "",
        preferred_language: profile.preferred_language ?? "fr",
      })
    }
    setEditMode(false)
    setNotice("")
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const logoInitials = activeProfile.name
    ? activeProfile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : (isOwner && user?.company_name ? user.company_name[0].toUpperCase() : "E")

  const displayName = activeProfile.name
    || (isOwner ? user?.company_name : "")
    || (loading ? (isFr ? 'Chargement...' : 'Loading...') : (isFr ? 'Nom non renseigne' : 'Name not set'))

  return (
    <main className="app-page pt-[72px] pb-20">
      {/* ── Banner ─────────────────────────────────────────── */}
      <div className="relative h-52 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-950 overflow-hidden">
        {activeProfile.banner_url && (
          <img src={activeProfile.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />
        {isOwner && (
          <>
            <input type="file" accept="image/*" ref={bannerInputRef} className="hidden" onChange={(e) => void handleImageUpload(e, 'banner')} />
            <button disabled={uploadingBanner} onClick={() => bannerInputRef.current?.click()} className="absolute top-4 right-4 h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-all disabled:opacity-50">
              <Camera01Icon size={14} className={uploadingBanner ? "animate-pulse" : ""} />
              {uploadingBanner ? (isFr ? 'Upload...' : 'Uploading...') : (isFr ? 'Changer banniere' : 'Change banner')}
            </button>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        {/* ── Header Row ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="flex items-end gap-5">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-3xl border-4 border-[#09090b] bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-2xl overflow-hidden">
                {activeProfile.logo_url ? (
                  <img src={activeProfile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white tracking-tighter">{logoInitials}</span>
                )}
              </div>
              {isOwner && (
                <>
                  <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={(e) => void handleImageUpload(e, 'logo')} />
                  <button disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-600 border-2 border-[#09090b] flex items-center justify-center hover:bg-emerald-500 transition-all disabled:opacity-50">
                    <Camera01Icon size={12} className={`text-white ${uploadingLogo ? "animate-pulse" : ""}`} />
                  </button>
                </>
              )}
            </div>

            {/* Name + industry */}
            <div className="pb-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                {displayName}
              </h1>
              <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {activeProfile.industry || (isFr ? 'Secteur non renseigne' : 'Sector not specified')}
              </p>
              {activeProfile.location && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Globe02Icon size={13} className="text-slate-500" />
                  <span className="text-[11px] text-slate-400">{activeProfile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* View toggle - only for owner */}
          {isOwner && (
            <div className="flex items-center gap-2 pb-1">
              <Link to={`/${routeLocale}/enterprise-profile`} className="h-10 px-4 rounded-xl border border-emerald-600 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center">
                {isFr ? 'Proprietaire' : 'Owner'}
              </Link>
              <Link to={publicLink} className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
                {isFr ? 'Vue externe' : 'External view'}
              </Link>
            </div>
          )}
        </div>

        {/* ── Status messages ────────────────────────────────── */}
        <AnimatePresence>
          {(error || notice) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 px-5 py-3 rounded-2xl border text-[12px] font-bold ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}
            >
              {error || notice}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="mb-6 px-5 py-3 rounded-2xl border app-border app-soft text-[12px] app-muted">
            {isFr ? 'Chargement du profil...' : 'Loading profile...'}
          </div>
        )}

        {/* ── Grid ───────────────────────────────────────────── */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ── Left sidebar ─── */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="xl:col-span-4 space-y-4"
          >
            {/* Completion - only show to owner */}
            {isOwner && (
              <div className="app-card border app-border rounded-3xl p-6 backdrop-blur-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{isFr ? 'Completion du profil' : 'Profile completion'}</span>
                  <span className="text-[13px] font-black text-emerald-400">{activeProfile.completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeProfile.completion}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                {activeProfile.completion < 70 && (
                  <p className="text-[10px] text-slate-500 mt-2">{isFr ? 'Completez votre profil pour attirer plus de candidats' : 'Complete your profile to attract more candidates'}</p>
                )}
              </div>
            )}

            {/* Info card */}
            <div className="app-card border app-border rounded-3xl p-6 backdrop-blur-2xl space-y-3">
              {isOwner && activeProfile.email && (
                <InfoRow icon={<Mail01Icon size={15} />} value={activeProfile.email} />
              )}
              {activeProfile.company_size && (
                <InfoRow icon={<UserMultiple02Icon size={15} />} value={`${activeProfile.company_size} ${isFr ? 'employes' : 'employees'}`} />
              )}
              {activeProfile.location && (
                <InfoRow icon={<Globe02Icon size={15} />} value={activeProfile.location} />
              )}
              {activeProfile.industry && (
                <InfoRow icon={<Briefcase02Icon size={15} />} value={activeProfile.industry} />
              )}
              {activeProfile.website && (
                <a href={activeProfile.website.startsWith("http") ? activeProfile.website : `https://${activeProfile.website}`}
                   target="_blank" rel="noreferrer"
                   className="flex items-center gap-3 text-[12px] text-emerald-300 hover:text-emerald-200 transition-colors">
                  <Globe02Icon size={15} className="text-slate-500 shrink-0" />
                  <span className="truncate">{activeProfile.website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
              {!isOwner && (
                <div className="pt-2 border-t border-white/[0.08]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {activeProfile.followers_count} {isFr ? 'abonnes' : 'followers'}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="grid grid-cols-2 gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={() => void handleSaveProfile()}
                      disabled={saving}
                      className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (isFr ? 'Enregistrement...' : 'Saving...') : (isFr ? 'Enregistrer' : 'Save')}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                      {isFr ? 'Annuler' : 'Cancel'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={openEditMode}
                      className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <PencilEdit02Icon size={14} />
                      {isFr ? 'Modifier' : 'Edit'}
                    </button>
                    {/* <Link
                      to={publicLink}
                      className="h-11 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center"
                    >
                      {isFr ? 'Vue publique' : 'Public view'}
                    </Link> */}
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {user?.role === "student" ? (
                  <button
                    onClick={() => {
                      if (!profile?.id) return
                      setFollowLoading(true)
                      api.post(`/enterprises/${profile.id}/follow`)
                        .then(r => {
                          setIsFollowing(r.data.isFollowing)
                          setProfile(prev => prev ? {
                            ...prev,
                            followers_count: r.data.isFollowing ? prev.followers_count + 1 : prev.followers_count - 1
                          } : prev)
                          queryClient.invalidateQueries({ queryKey: ['followedEnterprises'] })
                        })
                        .catch(() => {})
                        .finally(() => setFollowLoading(false))
                    }}
                    disabled={followLoading}
                    className={`h-11 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      isFollowing ? "app-soft border app-border text-white" : "bg-emerald-600 hover:bg-emerald-500"
                    }`}
                  >
                    <Bookmark02Icon size={14} className={isFollowing ? "text-emerald-400" : ""} />
                    {isFollowing ? (isFr ? 'Abonne' : 'Following') : (isFr ? 'Suivre' : 'Follow')}
                  </button>
                ) : (
                  <button 
                    onClick={handleContact}
                    disabled={isActionLoading}
                    className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isFr ? 'Contacter' : 'Contact'}
                    <ArrowRight01Icon size={13} />
                  </button>
                )}
                <Link
                  to={`/${routeLocale}/offres?company=${encodeURIComponent(activeProfile.name)}`}
                  className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center"
                >
                  {isFr ? 'Voir offres' : 'See offers'}
                </Link>
              </div>
            )}
          </motion.aside>

          {/* ── Main content ─── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="xl:col-span-8 space-y-5"
          >
            {/* About card */}
            <article className="app-card border app-border rounded-3xl p-7 backdrop-blur-2xl">
              <div className="flex items-center gap-2 mb-4">
                <AiMagicIcon size={17} className="text-emerald-400" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isFr ? 'A propos' : 'About'}</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-[14px] whitespace-pre-line">
                {activeProfile.description || (isFr ? 'Aucune description renseignee.' : 'No description provided.')}
              </p>
              {(activeProfile.company_size || activeProfile.industry) && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {activeProfile.company_size && (
                    <InfoPill label={isFr ? 'Taille' : 'Size'} value={`${activeProfile.company_size} ${isFr ? 'employes' : 'employees'}`} icon={<CheckmarkCircle01Icon size={15} />} />
                  )}
                  {activeProfile.industry && (
                    <InfoPill label={isFr ? 'Secteur' : 'Sector'} value={activeProfile.industry} icon={<Search01Icon size={15} />} />
                  )}
                </div>
              )}
            </article>

            {/* ── Edit Form ─── */}
            {isOwner && editMode && (
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="app-card border border-emerald-500/30 rounded-3xl p-7 backdrop-blur-2xl"
              >
                <div className="flex items-center gap-2 mb-6">
                  <PencilEdit02Icon size={17} className="text-emerald-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isFr ? 'Edition du profil' : 'Profile editing'}</h3>
                </div>

                <div className="space-y-6">
                  {/* Section: Informations */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{isFr ? "Informations de l'entreprise" : 'Company information'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormInput
                        label={isFr ? "Nom de l'entreprise" : 'Company name'}
                        value={editForm.company_name}
                        onChange={v => setEditForm(p => ({ ...p, company_name: v }))}
                        placeholder={isFr ? 'Ex: OpenTech Maroc' : 'e.g. OpenTech Morocco'}
                      />
                      <FormSelect
                        label={isFr ? "Secteur d'activite" : 'Industry sector'}
                        value={editForm.industry}
                        onChange={v => setEditForm(p => ({ ...p, industry: v }))}
                        options={SECTEURS}
                        labels={isFr ? undefined : SECTEURS_EN}
                        placeholder={isFr ? 'Selectionner un secteur' : 'Select a sector'}
                      />
                      <FormSelect
                        label={isFr ? 'Ville' : 'City'}
                        value={editForm.country}
                        onChange={v => setEditForm(p => ({ ...p, country: v }))}
                        options={VILLES_MAROC}
                        placeholder={isFr ? 'Selectionner une ville' : 'Select a city'}
                      />
                      <FormSelect
                        label={isFr ? "Taille de l'entreprise" : 'Company size'}
                        value={editForm.company_size}
                        onChange={v => setEditForm(p => ({ ...p, company_size: v }))}
                        options={COMPANY_SIZES}
                        placeholder={isFr ? 'Selectionner' : 'Select'}
                      />
                      <FormInput
                        label={isFr ? 'Site web' : 'Website'}
                        value={editForm.website}
                        onChange={v => setEditForm(p => ({ ...p, website: v }))}
                        placeholder="https://exemple.ma"
                      />
                      <FormInput
                        label={isFr ? 'Telephone de contact' : 'Contact phone'}
                        value={editForm.contact_phone}
                        onChange={v => setEditForm(p => ({ ...p, contact_phone: v }))}
                        placeholder="+212 6XX XXX XXX"
                      />
                      <FormInput
                        label="URL du logo"
                        value={editForm.logo_url}
                        onChange={v => setEditForm(p => ({ ...p, logo_url: v }))}
                        placeholder="https://…/logo.png"
                      />
                      <FormSelect
                        label={isFr ? 'Langue' : 'Language'}
                        value={editForm.preferred_language}
                        onChange={v => setEditForm(p => ({ ...p, preferred_language: (v as "fr" | "en") }))}
                        options={["fr", "en"]}
                        labels={["Francais", "English"]}
                        placeholder={isFr ? 'Selectionner' : 'Select'}
                      />
                    </div>
                  </div>

                  {/* Section: Description */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{isFr ? 'Description' : 'Description'}</p>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                      placeholder={isFr ? 'Decrivez votre entreprise, votre mission, votre culture...' : 'Describe your company, mission, and culture...'}
                      rows={5}
                      className="w-full rounded-2xl border app-border app-input px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                    />
                  </div>

                  {/* Bottom buttons */}
                  <div className="flex gap-3 pt-2 border-t border-white/10">
                    <button
                      onClick={() => void handleSaveProfile()}
                      disabled={saving}
                      className="h-11 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (isFr ? 'Enregistrement...' : 'Saving...') : (isFr ? 'Enregistrer les modifications' : 'Save changes')}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="h-11 px-6 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                      {isFr ? 'Annuler' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </motion.article>
            )}

            {/* Stats */}
            {isOwner && (
              <article className="app-card border app-border rounded-3xl p-7 backdrop-blur-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">{isFr ? 'Statistiques' : 'Statistics'}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label={isFr ? 'Abonnes' : 'Followers'} value={(activeProfile.followers_count ?? 0).toString()} />
                  <MetricCard label={isFr ? 'Offres actives' : 'Active offers'} value={(activeProfile.privateStats?.activeOffres ?? 0).toString()} />
                  <MetricCard label={isFr ? 'Candidats' : 'Candidates'} value={(activeProfile.privateStats?.totalCandidates ?? 0).toString()} />
                </div>
              </article>
            )}
          </motion.section>
        </section>
      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-slate-300">
      <span className="text-slate-500 shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function InfoPill({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border app-border app-card">
      <span className="text-slate-500">{icon}</span>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
        <p className="text-[11px] font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border app-border app-card px-4 py-4 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-2xl font-black tracking-tight mt-2">{value}</p>
    </div>
  )
}

function FormInput({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border app-border app-input px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  )
}

function FormSelect({
  label, value, onChange, options, labels, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  labels?: string[]
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border app-border app-input px-4 py-3 text-[13px] focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, i) => (
          <option key={opt} value={opt}>{labels ? labels[i] : opt}</option>
        ))}
      </select>
    </div>
  )
}
