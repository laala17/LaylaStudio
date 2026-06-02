import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">LayalaStudio</h3>
            <p className="text-sm text-muted-foreground">
              Prémiové plavky pro moderní ženy. Kvalita, styl a pohodlí v každém kousku.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Navigace</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Domů
                </Link>
              </li>
              <li>
                <Link href="/kategorie/plavky" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Plavky
                </Link>
              </li>
              <li>
                <Link href="/kosik" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Košík
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Informace</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">O nás</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Doprava a platba</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Reklamace</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Kontakt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>info@layalastudio.cz</li>
              <li>+420 123 456 789</li>
              <li>Praha, Česká republika</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} LayalaStudio. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  )
}
