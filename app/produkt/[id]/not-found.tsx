import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-semibold mb-4">Produkt nenalezen</h1>
        <p className="text-muted-foreground mb-8">
          Omlouváme se, ale hledaný produkt neexistuje nebo byl odstraněn.
        </p>
        <Link href="/kategorie/plavky">
          <Button>Prohlédnout plavky</Button>
        </Link>
      </div>
    </div>
  )
}
