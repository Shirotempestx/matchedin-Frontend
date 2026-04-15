import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useMemo, useState, useRef, type ReactNode } from "react"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import {
  Mail01Icon,
  Globe02Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  StarIcon,
  AiMagicIcon,
  CodeIcon,
  Search01Icon,
  Bookmark02Icon,
  PencilEdit02Icon,
  Camera01Icon,
  Briefcase02Icon,
  Download04Icon,
  FavouriteIcon,
  Building04Icon
} from "hugeicons-react"
import api from "@/lib/axios"
import { useAuth } from "@/lib/auth"
import CompetenceSelector, { type Skill } from "./auth/selectorRegister"
import { normalizeLocale } from "@/i18n/config"
import { isImportPipelineStudentProfileResponse, mapStudentProfileImportResponseToDraft, type GeneratedStudentProfileDraft } from "@/features/importPipeline/allocation"

// ─── Constants ───────────────────────────────────────────────────────────────

const VILLES_MAROC = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir",
  "Meknès", "Oujda", "Salé", "Kénitra", "Tétouan", "Safi",
  "El Jadida", "Beni Mellal", "Nador", "Settat", "Khémisset",
  "Larache", "Khouribga", "Berrechid", "Mohammedia", "Ifrane",
]

const WORK_MODES = ["Présentiel", "Remote", "Hybride", "Remote / Hybride"]
const WORK_MODE_LABELS_EN = ["On-site", "Remote", "Hybrid", "Remote / Hybrid"]

const AVAILABILITY_OPTIONS = [
  "Disponible immédiatement",
  "Disponible dans 1 mois",
  "Disponible dans 3 mois",
  "En poste — à l'écoute",
  "Non disponible",
]
const AVAILABILITY_LABELS_EN = [
  "Available immediately",
  "Available in 1 month",
  "Available in 3 months",
  "Currently employed - open to opportunities",
  "Not available",
]

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileView = "owner" | "public"

type StudentProfilePageProps = {
  view?: ProfileView
}

type StudentProfile = {
  id?: string
  slug?: string
  name: string
  headline: string
  city: string
  email?: string
  bio: string
  completion: number
  availability: string
  workMode: string
  links: string[]
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  cvUrl?: string
  avatarUrl?: string
  bannerUrl?: string
  profile_type?: "IT" | "NON_IT"
  education_level?: string
  preferred_language?: "fr" | "en"
  skills: Skill[]
  projects: Array<{ title: string; desc: string; stack: string }>
  privateStats?: {
    applications: number
    favorites: number
    strongMatches: number
  }
}

// ─── Normalize ───────────────────────────────────────────────────────────────

function normalizeProfile(raw: unknown): StudentProfile {
  if (!raw || typeof raw !== "object") return EMPTY_PROFILE

  const p = raw as Partial<StudentProfile>
  return {
    id: p.id,
    slug: p.slug,
    name: p.name ?? "",
    headline: p.headline ?? "",
    city: p.city ?? "",
    email: p.email,
    bio: p.bio ?? "",
    completion: typeof p.completion === "number" ? p.completion : 0,
    availability: p.availability ?? "",
    workMode: p.workMode ?? "",
    profile_type: p.profile_type ?? "IT",
    education_level: p.education_level ?? "",
    preferred_language: p.preferred_language ?? "fr",
    links: Array.isArray(p.links) ? p.links : [],
    githubUrl: p.githubUrl,
    linkedinUrl: p.linkedinUrl,
    portfolioUrl: p.portfolioUrl,
    cvUrl: p.cvUrl,
    avatarUrl: p.avatarUrl,
    bannerUrl: p.bannerUrl,
    skills: Array.isArray(p.skills) ? p.skills : [],
    projects: Array.isArray(p.projects) ? p.projects : [],
    privateStats: p.privateStats,
  }
}

const EMPTY_PROFILE: StudentProfile = {
  name: "", headline: "", city: "", bio: "",
  completion: 0, availability: "", workMode: "",
  links: [], skills: [], projects: [],
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentProfilePage({ view = "owner" }: StudentProfilePageProps) {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
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
  const [saveLoading, setSaveLoading] = useState(false)
  const [selectorKey, setSelectorKey] = useState(0)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMode, setImportMode] = useState<"document" | "website">("document")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importUrl, setImportUrl] = useState("")
  const [importLoading, setImportLoading] = useState(false)
  const [reviewData, setReviewData] = useState<GeneratedStudentProfileDraft | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const isOwner = view === "owner"
  const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || 'fr')
  const isFr = routeLocale === 'fr'

  const [editForm, setEditForm] = useState({
    name: "",
    headline: "",
    city: "",
    availability: "",
    workMode: "",
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    cvUrl: "",
    avatarUrl: "",
    bannerUrl: "",
    profile_type: "IT" as "IT" | "NON_IT",
    education_level: "",
    preferred_language: "fr" as "fr" | "en",
    skills: [] as Skill[],
  })

  const publicHandle = useMemo(() => {
    if (!params.slug) return ""
    return decodeURIComponent(params.slug)
  }, [params.slug])

  // Fetch profile - simple: /me for owner (uses Bearer token), /public/{slug} for public
  useEffect(() => {
    let cancelled = false
    async function fetchProfile() {
      setLoading(true)
      setError("")
      try {
        const endpoint = isOwner
          ? "/student-profiles/me"
          : `/student-profiles/public/${encodeURIComponent(publicHandle)}`
        const res = await api.get(endpoint)
        if (!cancelled) {
          const p = normalizeProfile(res.data?.data)
          setProfile(p)
          if (!isOwner && (user?.role === "enterprise" || user?.role === "Entreprise") && p.id) {
            api.get(`/students/${p.id}/is-saved`).then(r => setIsSaved(r.data.isSaved)).catch(() => {})
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
      name: profile.name,
      headline: profile.headline,
      city: profile.city,
      availability: profile.availability,
      workMode: profile.workMode,
      bio: profile.bio,
      githubUrl: profile.githubUrl ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      portfolioUrl: profile.portfolioUrl ?? "",
      cvUrl: profile.cvUrl ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      bannerUrl: profile.bannerUrl ?? "",
      profile_type: profile.profile_type ?? "IT",
      education_level: profile.education_level ?? "",
      preferred_language: profile.preferred_language ?? "fr",
      skills: profile.skills,
    })
  }, [profile])

  const activeProfile = profile ?? EMPTY_PROFILE
  const publicSlug = activeProfile.slug || publicHandle || "profile"
  const publicLink = `/${routeLocale}/students/${encodeURIComponent(publicSlug)}`
  const privateSpaceLink = (user?.role === "enterprise" || user?.role === "Entreprise")
    ? `/${routeLocale}/enterprise-profile`
    : `/${routeLocale}/profile`

  async function handleSaveProfile() {
    if (!isOwner) return
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const payload = {
        name: editForm.name,
        headline: editForm.headline,
        city: editForm.city,
        availability: editForm.availability,
        workMode: editForm.workMode,
        bio: editForm.bio,
        githubUrl: editForm.githubUrl,
        linkedinUrl: editForm.linkedinUrl,
        portfolioUrl: editForm.portfolioUrl,
        cvUrl: editForm.cvUrl,
        profile_type: editForm.profile_type,
        education_level: editForm.education_level,
        preferred_language: editForm.preferred_language,
        skills: editForm.skills.map(s => ({ id: s.id, level: s.level ?? 3 })),
      }
      const res = await api.put("/student-profiles/me", payload)
      setProfile(normalizeProfile(res.data?.data))
      localStorage.setItem('preferred_language', editForm.preferred_language)
      if (routeLocale !== editForm.preferred_language) {
        const suffix = location.pathname.split('/').filter(Boolean).slice(1).join('/')
        navigate(`/${editForm.preferred_language}/${suffix}`)
      }
      setEditMode(false)
      setNotice(routeLocale === 'fr' ? "Profil mis a jour avec succes ✓" : "Profile updated successfully ✓")
    } catch {
      setError(routeLocale === 'fr' ? "Echec de la mise a jour. Verifiez que tout est bien rempli." : "Update failed. Please verify required fields.")
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'avatar') setUploadingAvatar(true)
    else setUploadingBanner(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const payload: Record<string, unknown> = { ...editForm, skills: editForm.skills.map(s => s.id) }
      if (type === 'avatar') payload.avatar_url = data.url
      else payload.banner_url = data.url
      
      const res = await api.put("/student-profiles/me", payload)
      setProfile(normalizeProfile(res.data?.data))
      setEditForm(prev => ({ 
        ...prev, 
        avatarUrl: type === 'avatar' ? data.url : prev.avatarUrl,
        bannerUrl: type === 'banner' ? data.url : prev.bannerUrl
      }))
      setNotice(routeLocale === 'fr' ? `Image de ${type === 'avatar' ? 'profil' : 'banniere'} mise a jour ✓` : `${type === 'avatar' ? 'Profile' : 'Banner'} image updated ✓`)
    } catch {
      setError(routeLocale === 'fr' ? "Echec de l'upload. L'image est peut-etre trop lourde." : "Upload failed. The image may be too large.")
    } finally {
      if (type === 'avatar') setUploadingAvatar(false)
      else setUploadingBanner(false)
      if (e.target) e.target.value = ''
    }
  }

  function openEditMode() {
    setNotice("")
    setEditMode(true)
    setSelectorKey(k => k + 1)
  }

  function cancelEdit() {
    if (profile) {
      setEditForm({
        name: profile.name,
        headline: profile.headline,
        city: profile.city,
        availability: profile.availability,
        workMode: profile.workMode,
        bio: profile.bio,
        githubUrl: profile.githubUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        portfolioUrl: profile.portfolioUrl ?? "",
        cvUrl: profile.cvUrl ?? "",
        avatarUrl: profile.avatarUrl ?? "",
        bannerUrl: profile.bannerUrl ?? "",
        profile_type: profile.profile_type ?? "IT",
        education_level: profile.education_level ?? "",
        preferred_language: profile.preferred_language ?? "fr",
        skills: profile.skills,
      })
    }
    setEditMode(false)
    setNotice("")
  }

  async function mapSkillNamesToProfileSkills(skillNames: string[], profileType: "IT" | "NON_IT"): Promise<Skill[]> {
    const unique = Array.from(new Set(skillNames.map((skill) => skill.trim()).filter(Boolean))).slice(0, 12)
    if (unique.length === 0) return []

    const resolved = await Promise.all(unique.map(async (name) => {
      try {
        const res = await api.get('/skills/search', { params: { q: name, type: profileType } })
        const first = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null
        if (!first?.id) return null

        return {
          id: Number(first.id),
          name: String(first.name || name),
          category: String(first.category || profileType),
          level: 3,
        } as Skill
      } catch {
        return null
      }
    }))

    return resolved.filter((skill): skill is Skill => Boolean(skill))
  }

  async function applyImportedProfileDraft(draft: GeneratedStudentProfileDraft) {
    const targetProfileType = draft.profile_type ?? editForm.profile_type
    const mappedSkills = await mapSkillNamesToProfileSkills(draft.skills, targetProfileType)

    setEditForm(prev => ({
      ...prev,
      headline: draft.headline ?? prev.headline,
      city: draft.city ?? prev.city,
      availability: draft.availability ?? prev.availability,
      workMode: draft.workMode ?? prev.workMode,
      bio: draft.bio ?? prev.bio,
      githubUrl: draft.githubUrl ?? prev.githubUrl,
      linkedinUrl: draft.linkedinUrl ?? prev.linkedinUrl,
      portfolioUrl: draft.portfolioUrl ?? prev.portfolioUrl,
      cvUrl: draft.cvUrl ?? prev.cvUrl,
      profile_type: draft.profile_type ?? prev.profile_type,
      preferred_language: draft.preferred_language ?? prev.preferred_language,
      skills: mappedSkills.length > 0 ? mappedSkills : prev.skills,
    }))

    if (mappedSkills.length > 0) {
      setSelectorKey(k => k + 1)
    }
  }

  function openImportReview(payload: unknown) {
    if (!isImportPipelineStudentProfileResponse(payload)) {
      setError(isFr ? "Réponse d'import invalide." : "Invalid import response.")
      return
    }

    setReviewData(mapStudentProfileImportResponseToDraft(payload))
    setShowReviewModal(true)
  }

  async function handleImportFromDocument() {
    if (!importFile) {
      setError(isFr ? 'Ajoutez un document à importer.' : 'Please select a file to import.')
      return
    }

    setImportLoading(true)
    setError("")

    try {
      const payload = new FormData()
      payload.append('sourceType', 'file')
      payload.append('files', importFile)

      const res = await api.post('/premium/import/student-profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setShowImportModal(false)
      setImportFile(null)
      openImportReview(res.data)
    } catch (err: unknown) {
      const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const message = responseMessage || (isFr ? "Import impossible." : "Import failed.")
      setError(message)
    } finally {
      setImportLoading(false)
    }
  }

  async function handleImportFromWebsite() {
    const normalizedUrl = (() => {
      const raw = importUrl.trim()
      if (!raw) return ""
      if (/^https?:\/\//i.test(raw)) return raw
      return `https://${raw.replace(/^\/+/, "")}`
    })()

    if (!normalizedUrl) {
      setError(isFr ? 'Ajoutez une URL valide.' : 'Please provide a valid URL.')
      return
    }

    setImportLoading(true)
    setError("")

    try {
      const res = await api.post('/premium/import/student-profile', {
        sourceType: 'url',
        url: normalizedUrl,
      })

      setShowImportModal(false)
      setImportUrl("")
      openImportReview(res.data)
    } catch (err: unknown) {
      const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const message = responseMessage || (isFr ? "Extraction web impossible." : "Website extraction failed.")
      setError(message)
    } finally {
      setImportLoading(false)
    }
  }

  async function handleApplyReviewData() {
    if (!reviewData) return

    await applyImportedProfileDraft(reviewData)
    setShowReviewModal(false)
    setNotice(isFr ? "Données importées appliquées au formulaire." : "Imported data applied to the form.")
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const avatarInitials = activeProfile.name
    ? activeProfile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : (isOwner && user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?")

  const displayName = activeProfile.name
    || (isOwner ? user?.name : "")
    || (loading ? (isFr ? 'Chargement...' : 'Loading...') : (isFr ? 'Nom non renseigne' : 'Name not set'))

  return (
    <main className="app-page pt-[72px] pb-20">
      {/* ── Banner ─────────────────────────────────────────── */}
      <div className="relative h-52 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 overflow-hidden">
        {activeProfile.bannerUrl && (
          <img src={activeProfile.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
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
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-3xl border-4 border-[#09090b] bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-2xl overflow-hidden">
                {activeProfile.avatarUrl ? (
                  <img src={activeProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white tracking-tighter">{avatarInitials}</span>
                )}
              </div>
              {isOwner && (
                <>
                  <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => void handleImageUpload(e, 'avatar')} />
                  <button disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 border-2 border-[#09090b] flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-50">
                    <Camera01Icon size={12} className={`text-white ${uploadingAvatar ? "animate-pulse" : ""}`} />
                  </button>
                </>
              )}
            </div>

            {/* Name + headline */}
            <div className="pb-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                {displayName}
              </h1>
              <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                {activeProfile.headline || (isFr ? 'Etudiant MatchendIN' : 'MatchendIN student')}
              </p>
              {activeProfile.city && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Globe02Icon size={13} className="text-slate-500" />
                  <span className="text-[11px] text-slate-400">{activeProfile.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 pb-1">
            {isOwner && (
              <>
                <Link to={`/${routeLocale}/followed-enterprises`} className="h-10 px-4 rounded-xl border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-400 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
                  <Building04Icon size={14} className="mr-2" />
                  {isFr ? 'Mes Suivis' : 'Following'}
                </Link>
                <Link to={`/${routeLocale}/favorites`} className="h-10 px-4 rounded-xl border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
                  <FavouriteIcon size={14} className="mr-2" />
                  {isFr ? 'Mes Favoris' : 'My Favorites'}
                </Link>
              </>
            )}
            {isOwner ? (
              <>
                <Link to={`/${routeLocale}/profile`} className="h-10 px-4 rounded-xl border border-blue-600 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center">
                  {isFr ? 'Proprietaire' : 'Owner'}
                </Link>
                <Link to={publicLink} className="h-10 px-4 rounded-xl border border-white/10 bg-white/3 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
                  {isFr ? 'Vue externe' : 'External view'}
                </Link>
              </>
            ) : (
              <>
                <Link to={privateSpaceLink} className="h-10 px-4 rounded-xl border border-white/10 bg-white/3 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
                  {isFr ? 'Espace prive' : 'Private space'}
                </Link>
                <Link to={publicLink} className="h-10 px-4 rounded-xl border border-blue-600 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center">
                  {isFr ? 'Vue externe' : 'External view'}
                </Link>
              </>
            )}
          </div>
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
            {/* Completion */}
            <div className="app-card border app-border rounded-3xl p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">{isFr ? 'Completion du profil' : 'Profile completion'}</span>
                <span className="text-[13px] font-black text-blue-400">{activeProfile.completion}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeProfile.completion}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              {activeProfile.completion < 70 && (
                <p className="text-[10px] text-slate-500 mt-2">{isFr ? 'Completez votre profil pour augmenter votre visibilite' : 'Complete your profile to increase visibility'}</p>
              )}
            </div>

            {/* Contact info */}
            <div className="app-card border app-border rounded-3xl p-6 backdrop-blur-2xl space-y-3">
              {isOwner && activeProfile.email && (
                <InfoRow icon={<Mail01Icon size={15} />} value={activeProfile.email} />
              )}
              {activeProfile.profile_type && (
                <InfoRow
                  icon={<CodeIcon size={15} />}
                  value={activeProfile.profile_type === "IT" ? (isFr ? 'Profil IT' : 'IT profile') : (isFr ? 'Profil Non-IT' : 'Non-IT profile')}
                />
              )}
              {activeProfile.education_level && (
                <InfoRow icon={<Briefcase02Icon size={15} />} value={activeProfile.education_level} />
              )}
              {activeProfile.city && (
                <InfoRow icon={<Globe02Icon size={15} />} value={activeProfile.city} />
              )}
              {activeProfile.githubUrl && (
                <a href={activeProfile.githubUrl.startsWith("http") ? activeProfile.githubUrl : `https://${activeProfile.githubUrl}`}
                   target="_blank" rel="noreferrer"
                   className="flex items-center gap-3 text-[12px] text-blue-300 hover:text-blue-200 transition-colors">
                  <Globe02Icon size={15} className="text-slate-500 shrink-0" />
                  <span className="truncate">GitHub</span>
                </a>
              )}
              {activeProfile.linkedinUrl && (
                <a href={activeProfile.linkedinUrl.startsWith("http") ? activeProfile.linkedinUrl : `https://${activeProfile.linkedinUrl}`}
                   target="_blank" rel="noreferrer"
                   className="flex items-center gap-3 text-[12px] text-blue-300 hover:text-blue-200 transition-colors">
                  <Globe02Icon size={15} className="text-slate-500 shrink-0" />
                  <span className="truncate">LinkedIn</span>
                </a>
              )}
            </div>

            {/* Skills */}
            {activeProfile.skills.length > 0 && (
              <div className="app-card border app-border rounded-3xl p-6 backdrop-blur-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">{isFr ? 'Competences' : 'Skills'}</p>
                <div className="flex flex-wrap gap-2">
                  {activeProfile.skills.map(skill => (
                    <span
                      key={skill.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border app-border app-soft text-[10px] font-black uppercase tracking-wider text-slate-300"
                    >
                      {skill.name}
                      <span className="text-blue-400 opacity-70 tracking-[1px]">
                        {"●".repeat(skill.level ?? 3)}{"○".repeat(5 - (skill.level ?? 3))}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {isOwner ? (
              <div className={`grid gap-3 ${editMode ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {editMode ? (
                  <>
                    <button
                      onClick={() => void handleSaveProfile()}
                      disabled={saving}
                      className="h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (isFr ? 'Enregistrement...' : 'Saving...') : (isFr ? 'Enregistrer' : 'Save')}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                      {isFr ? 'Annuler' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Download04Icon size={14} />
                      {isFr ? 'Importer' : 'Import'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={openEditMode}
                      className="h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <PencilEdit02Icon size={14} />
                      {isFr ? 'Modifier' : 'Edit'}
                    </button>
                    <button
                      onClick={() => {
                        if (!editMode) openEditMode()
                        setShowImportModal(true)
                      }}
                      className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Download04Icon size={14} />
                      {isFr ? 'Importer profil' : 'Import profile'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleContact}
                  disabled={isActionLoading}
                  className="h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isFr ? 'Contacter' : 'Contact'}
                  <ArrowRight01Icon size={13} />
                </button>
                {(user?.role === "enterprise" || user?.role === "Entreprise") && (
                  <button
                    onClick={() => {
                      if (!profile?.id) return
                      setSaveLoading(true)
                      api.post(`/students/${profile.id}/save`)
                        .then(r => setIsSaved(r.data.isSaved))
                        .catch(() => {})
                        .finally(() => setSaveLoading(false))
                    }}
                    disabled={saveLoading}
                    className={`h-11 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      isSaved ? "app-soft border app-border text-white" : "border app-border app-card text-slate-300"
                    }`}
                  >
                    <Bookmark02Icon size={14} className={isSaved ? "text-blue-400 fill-blue-400" : ""} />
                    {isSaved ? (isFr ? 'Sauvegarde' : 'Saved') : (isFr ? 'Sauvegarder' : 'Save')}
                  </button>
                )}
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
            {/* Bio card */}
            <article className="app-card border app-border rounded-3xl p-7 backdrop-blur-2xl">
              <div className="flex items-center gap-2 mb-4">
                <AiMagicIcon size={17} className="text-blue-400" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isFr ? 'Resume' : 'Summary'}</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-[14px]">
                {activeProfile.bio || (isFr ? 'Aucune bio renseignee.' : 'No bio provided.')}
              </p>
              {(activeProfile.availability || activeProfile.workMode) && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {activeProfile.availability && (
                    <InfoPill label={isFr ? 'Disponibilite' : 'Availability'} value={activeProfile.availability} icon={<CheckmarkCircle01Icon size={15} />} />
                  )}
                  {activeProfile.workMode && (
                    <InfoPill label={isFr ? 'Mode de travail' : 'Work mode'} value={activeProfile.workMode} icon={<Search01Icon size={15} />} />
                  )}
                </div>
              )}
            </article>

            {/* Projects */}
            <article className="app-card border app-border rounded-3xl p-7 backdrop-blur-2xl">
              <div className="flex items-center gap-2 mb-5">
                <StarIcon size={17} className="text-blue-400" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isFr ? 'Projets cles' : 'Key projects'}</h3>
              </div>
              {activeProfile.projects.length === 0 ? (
                <p className="text-[12px] text-slate-500">{isFr ? 'Aucun projet renseigne pour le moment.' : 'No project added yet.'}</p>
              ) : (
                <div className="space-y-3">
                  {activeProfile.projects.map(project => (
                    <div key={project.title} className="rounded-2xl p-4 border app-border app-card">
                      <p className="text-[14px] font-black text-white">{project.title}</p>
                      <p className="text-[12px] text-slate-300 mt-1">{project.desc}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mt-3">{project.stack}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            {/* ── Edit Form ─── */}
            {isOwner && editMode && (
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="app-card border border-blue-500/30 rounded-3xl p-7 backdrop-blur-2xl"
              >
                <div className="flex items-center gap-2 mb-6">
                  <PencilEdit02Icon size={17} className="text-blue-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isFr ? 'Edition du profil' : 'Profile editing'}</h3>
                </div>

                <div className="space-y-6">
                  {/* Section: Informations de base */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{isFr ? 'Informations de base' : 'Basic information'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormInput
                        label={isFr ? 'Nom complet' : 'Full name'}
                        value={editForm.name}
                        onChange={v => setEditForm(p => ({ ...p, name: v }))}
                        placeholder={isFr ? 'Ex: Yassine Amrani' : 'e.g. Yassine Amrani'}
                      />
                      <FormInput
                        label={isFr ? 'Titre / headline' : 'Title / headline'}
                        value={editForm.headline}
                        onChange={v => setEditForm(p => ({ ...p, headline: v }))}
                        placeholder={isFr ? 'Ex: Fullstack Dev - Laravel / React' : 'e.g. Fullstack Dev - Laravel / React'}
                      />
                      <FormSelect
                        label={isFr ? 'Ville' : 'City'}
                        value={editForm.city}
                        onChange={v => setEditForm(p => ({ ...p, city: v }))}
                        options={VILLES_MAROC}
                        placeholder={isFr ? 'Selectionner une ville' : 'Select a city'}
                      />
                      {/* <FormSelect
                        label={isFr ? 'Type de profil' : 'Profile type'}
                        value={editForm.profile_type}
                        onChange={v => setEditForm(p => ({ ...p, profile_type: v as "IT" | "NON_IT" }))}
                        options={["IT", "NON_IT"]}
                        labels={isFr ? ["Profil IT", "Profil Non-IT"] : ["IT profile", "Non-IT profile"]}
                      /> */}
                      <FormSelect
                        label={isFr ? "Niveau d'étude" : 'Education Level'}
                        value={editForm.education_level}
                        onChange={v => setEditForm(p => ({ ...p, education_level: v }))}
                        options={["Bac+2", "Bac+3", "Bac+5", "Doctorat", "Bootcamp"]}
                        labels={isFr ? ["Bac+2", "Bac+3 / Licence", "Bac+5 / Master", "Doctorat", "Bootcamp / Certification"] : ["Associate", "Bachelor", "Master's", "Ph.D", "Bootcamp"]}
                        placeholder={isFr ? 'Selectionner' : 'Select'}
                      />
                      <FormSelect
                        label={isFr ? 'Disponibilite' : 'Availability'}
                        value={editForm.availability}
                        onChange={v => setEditForm(p => ({ ...p, availability: v }))}
                        options={AVAILABILITY_OPTIONS}
                        labels={isFr ? undefined : AVAILABILITY_LABELS_EN}
                        placeholder={isFr ? 'Selectionner' : 'Select'}
                      />
                      <FormSelect
                        label={isFr ? 'Mode de travail' : 'Work mode'}
                        value={editForm.workMode}
                        onChange={v => setEditForm(p => ({ ...p, workMode: v }))}
                        options={WORK_MODES}
                        labels={isFr ? undefined : WORK_MODE_LABELS_EN}
                        placeholder={isFr ? 'Selectionner' : 'Select'}
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

                  {/* Section: Bio */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{isFr ? 'Bio' : 'Bio'}</p>
                    <textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder={isFr ? 'Decrivez votre parcours, vos motivations...' : 'Describe your background and motivations...'}
                      rows={4}
                      className="w-full rounded-2xl border app-border app-input px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                    />
                  </div>

                  {/* Section: Compétences */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{isFr ? 'Competences' : 'Skills'}</p>
                    <CompetenceSelector
                      key={selectorKey}
                      profileType={editForm.profile_type}
                      initialSkills={editForm.skills}
                      onUpdate={updated => {
                        setEditForm(p => ({ ...p, skills: updated }))
                      }}
                    />
                  </div>

                  {/* Section: Liens */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{isFr ? 'Liens' : 'Links'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormInput
                        label="GitHub URL"
                        value={editForm.githubUrl}
                        onChange={v => setEditForm(p => ({ ...p, githubUrl: v }))}
                        placeholder="https://github.com/…"
                      />
                      <FormInput
                        label="LinkedIn URL"
                        value={editForm.linkedinUrl}
                        onChange={v => setEditForm(p => ({ ...p, linkedinUrl: v }))}
                        placeholder="https://linkedin.com/in/…"
                      />
                      <FormInput
                        label={isFr ? 'URL portfolio' : 'Portfolio URL'}
                        value={editForm.portfolioUrl}
                        onChange={v => setEditForm(p => ({ ...p, portfolioUrl: v }))}
                        placeholder="https://monportfolio.dev"
                      />
                      <FormInput
                        label="CV URL"
                        value={editForm.cvUrl}
                        onChange={v => setEditForm(p => ({ ...p, cvUrl: v }))}
                        placeholder={isFr ? 'Lien vers votre CV (Drive, etc.)' : 'Link to your CV (Drive, etc.)'}
                      />
                    </div>
                  </div>

                  {/* Bottom buttons */}
                  <div className="flex gap-3 pt-2 border-t border-white/10">
                    <button
                      onClick={() => void handleSaveProfile()}
                      disabled={saving}
                      className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
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

            {/* Private stats */}
            {isOwner && (
              <article className="app-card border app-border rounded-3xl p-7 backdrop-blur-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">{isFr ? 'Donnees privees' : 'Private data'}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label={isFr ? 'Candidatures' : 'Applications'} value={(activeProfile.privateStats?.applications ?? 0).toString()} />
                  <MetricCard label={isFr ? 'Favoris' : 'Favorites'} value={(activeProfile.privateStats?.favorites ?? 0).toString()} />
                  <MetricCard label={isFr ? 'Matchs forts' : 'Strong matches'} value={(activeProfile.privateStats?.strongMatches ?? 0).toString()} />
                </div>
              </article>
            )}
          </motion.section>
        </section>
      </div>

      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !importLoading && setShowImportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="app-panel border app-border rounded-[32px] p-8 md:p-10 max-w-xl w-full text-left"
            >
              <h2 className="text-2xl font-black uppercase tracking-widest mb-2">
                {isFr ? 'Importer un profil' : 'Import a profile'}
              </h2>
              <p className="text-slate-400 text-sm font-bold tracking-wide mb-6">
                {isFr ? 'Choisissez un document CV ou une URL (ex: LinkedIn) pour extraire et classer vos informations.' : 'Choose a CV document or a URL (e.g. LinkedIn) to extract and classify your information.'}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setImportMode('document')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${importMode === 'document' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {isFr ? 'Document' : 'Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('website')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${importMode === 'website' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {isFr ? 'URL' : 'URL'}
                </button>
              </div>

              {importMode === 'document' ? (
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.tiff,.gif,.bmp,.xls,.xlsx,.csv,.tsv,.ppt,.pptx,.html,.htm"
                  onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border app-border app-input px-4 py-3 text-[12px]"
                />
              ) : (
                <input
                  type="url"
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder={isFr ? 'https://linkedin.com/in/votre-profil' : 'https://linkedin.com/in/your-profile'}
                  className="w-full rounded-xl border app-border app-input px-4 py-3 text-[12px] placeholder:text-slate-600"
                />
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  disabled={importLoading}
                  className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {isFr ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => void (importMode === 'document' ? handleImportFromDocument() : handleImportFromWebsite())}
                  disabled={importLoading}
                  className="h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {importLoading ? (isFr ? 'Import...' : 'Importing...') : (isFr ? 'Analyser' : 'Analyze')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && reviewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="app-panel border app-border rounded-[32px] p-8 md:p-10 max-w-3xl w-full text-left max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-black uppercase tracking-widest mb-2">
                {isFr ? 'Vérifier les données importées' : 'Review imported data'}
              </h2>
              <p className="text-slate-400 text-sm font-bold tracking-wide mb-6">
                {isFr ? 'Modifiez les suggestions avant application au formulaire.' : 'Edit suggestions before applying to the form.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label={isFr ? 'Titre' : 'Headline'} value={reviewData.headline ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, headline: v || null }) : prev)} />
                <FormInput label={isFr ? 'Ville' : 'City'} value={reviewData.city ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, city: v || null }) : prev)} />
                <FormInput label={isFr ? 'Disponibilité' : 'Availability'} value={reviewData.availability ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, availability: v || null }) : prev)} />
                <FormInput label={isFr ? 'Mode de travail' : 'Work mode'} value={reviewData.workMode ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, workMode: v || null }) : prev)} />
                <FormSelect
                  label={isFr ? 'Type de profil' : 'Profile type'}
                  value={reviewData.profile_type ?? ''}
                  onChange={v => setReviewData(prev => prev ? ({ ...prev, profile_type: (v || null) as GeneratedStudentProfileDraft['profile_type'] }) : prev)}
                  options={['IT', 'NON_IT']}
                  labels={isFr ? ['Profil IT', 'Profil Non-IT'] : ['IT profile', 'Non-IT profile']}
                  placeholder={isFr ? 'Selectionner' : 'Select'}
                />
                <FormSelect
                  label={isFr ? 'Langue préférée' : 'Preferred language'}
                  value={reviewData.preferred_language ?? ''}
                  onChange={v => setReviewData(prev => prev ? ({ ...prev, preferred_language: (v || null) as GeneratedStudentProfileDraft['preferred_language'] }) : prev)}
                  options={['fr', 'en']}
                  labels={['Francais', 'English']}
                  placeholder={isFr ? 'Selectionner' : 'Select'}
                />
                <FormInput label='GitHub URL' value={reviewData.githubUrl ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, githubUrl: v || null }) : prev)} />
                <FormInput label='LinkedIn URL' value={reviewData.linkedinUrl ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, linkedinUrl: v || null }) : prev)} />
                <FormInput label={isFr ? 'Portfolio URL' : 'Portfolio URL'} value={reviewData.portfolioUrl ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, portfolioUrl: v || null }) : prev)} />
                <FormInput label='CV URL' value={reviewData.cvUrl ?? ''} onChange={v => setReviewData(prev => prev ? ({ ...prev, cvUrl: v || null }) : prev)} />
              </div>

              <textarea
                value={reviewData.bio ?? ''}
                onChange={e => setReviewData(prev => prev ? ({ ...prev, bio: e.target.value || null }) : prev)}
                placeholder={isFr ? 'Bio' : 'Bio'}
                rows={4}
                className="w-full mt-4 rounded-2xl border app-border app-input px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />

              <input
                type="text"
                value={reviewData.skills.join(', ')}
                onChange={e => setReviewData(prev => prev ? ({ ...prev, skills: e.target.value.split(',').map(item => item.trim()).filter(Boolean) }) : prev)}
                placeholder={isFr ? 'Compétences (séparées par virgules)' : 'Skills (comma separated)'}
                className="w-full mt-4 rounded-xl border app-border app-input px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="h-11 rounded-2xl border app-border app-card hover:bg-white/[0.06] text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  {isFr ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleApplyReviewData()}
                  className="h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  {isFr ? 'Appliquer au formulaire' : 'Apply to form'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
        className="w-full rounded-xl border app-border app-input px-4 py-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
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
        className="w-full rounded-xl border app-border app-input px-4 py-3 text-[13px] focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, i) => (
          <option key={opt} value={opt}>{labels ? labels[i] : opt}</option>
        ))}
      </select>
    </div>
  )
}




