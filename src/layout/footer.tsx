
import { Linkedin01Icon,TwitterIcon,InstagramIcon } from "hugeicons-react";

export default function Footer() {
  const links = {
    "Produit": ["Fonctionnalités", "Comment ça marche", "Tarifs", "API & Intégrations"],
    "Entreprises": ["Publier une offre", "Rechercher des talents", "Tableaux de bord", "Témoignages"],
    "Étudiants": ["Créer un profil", "Explorer les offres", "Ressources carrière", "Blog"],
    "Compagnie": ["À propos", "Presse", "Politique de confidentialité", "Mentions légales"],
  }

  return (
    <footer className="app-panel border-t app-border">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <span className="text-white font-black text-sm italic">M</span>
              </div>
              <span className="font-black text-[17px] tracking-tight">MatchendIN</span>
            </div>
            <p className="app-muted text-[13px] font-medium leading-relaxed mb-6 max-w-[220px]">
              La plateforme de recrutement tech propulsée par l'IA, ancrée au Maroc.
            </p>
            <div className="flex gap-2">
              {[Linkedin01Icon, TwitterIcon, InstagramIcon].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl border app-border flex items-center justify-center app-muted hover:text-blue-500 hover:border-blue-400/40 app-soft transition-all duration-200">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] font-black uppercase tracking-widest mb-4">{group}</div>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-[13px] app-muted font-medium hover:text-blue-500 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t app-border">
          <p className="text-[12px] app-muted font-medium">© 2025 MatchendIN. Tous droits réservés.</p>
          <div className="flex items-center gap-2 px-4 py-2 app-soft rounded-xl border app-border">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black app-muted-strong uppercase tracking-tight">Tous les systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

