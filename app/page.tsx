import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-muted">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/77.png"
          alt="Hero background"
          fill
          className="object-cover opacity-20"
          priority
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-balance mb-6">
          Elegance pro<br />letní dny
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          Objevte naši kolekci prémiových plavek. Kvalita, styl a pohodlí v každém kousku.
        </p>
        <Link href="/kategorie/plavky">
          <Button size="lg" className="gap-2">
            Prohlédnout kolekci
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
