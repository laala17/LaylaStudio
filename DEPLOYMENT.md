# LayalaStudio — Deployment Instrukce

## Build Status
✅ Projekt je připraven k nasazení  
✅ Build proběhl úspěšně bez chyb  
✅ Všechny stránky a funkcionalita jsou funkční  

## Možnosti Deployment

### 1. **Vercel (Doporučeno — Nejjednodušší)**
Vercel je nativně optimalizovaný pro Next.js.

**Kroky:**
1. Nahrajte projekt na GitHub
2. Přejděte na https://vercel.com a přihlaste se
3. Klikněte "New Project" a importujte repo z GitHubu
4. Vercel automaticky rozpozná Next.js a nastaví build
5. Klikněte "Deploy" — vše bude hotové za minutu

**Výhody:**
- Automatické deployment při každém push do main
- Bezplatný SSL certifikát
- Skvělá výkon optimalizace
- Analytics zabudovaný

### 2. **Netlify**
Alternativa k Vercelu.

**Kroky:**
1. Push na GitHub
2. Přejděte na https://netlify.com
3. "Add new site" → Connect to Git → vyberte repo
4. Nastavte Build command: `npm run build`
5. Publish directory: `.next`
6. Deploy

### 3. **Docker + Vlastní Server (VPS)**
Pro plnou kontrolu nad infrastrukturou.

**Dockerfile** (vlož do projektu):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Kroky:**
```bash
docker build -t layalastudio .
docker run -p 3000:80 layalastudio
```

### 4. **Environment Variables**
Pokud používáte Vercel/Netlify:
1. Jdete do nastavení projektu
2. Environment Variables
3. Přidejte tyto proměnné:
   - `NEXT_PUBLIC_APP_URL` (např. `https://vase-stranka.vercel.app`)
   - `RESEND_API_KEY`
4. `.env.example` je připraven pro kopírování

## Co je k nasazení potřeba

✅ **Node.js 18+** — Nutný pro npm  
✅ **Git repo** — Doporučeno pro CI/CD  
✅ **npm** — Pro instalaci dependencies  
✅ **Disk prostor** — ~500MB po build  

## Po Deploy — Ověřit Funkčnost

1. ✅ Domovská stránka se načítá
2. ✅ Kategorie plavek jsou viditelné
3. ✅ Editor se otevírá (personalizace)
4. ✅ Lze přidávat do košíku
5. ✅ Checkout funguje
6. ✅ Obrázky se načítají z `/public/images`

## Troubleshooting

**Problém:** Build selže  
**Řešení:** Zkontrolujte, že všechny files jsou commitnuty, zejména `/public/images`

**Problém:** Obrázky chybějí  
**Řešení:** Ujistěte se, že `/public` folder je součástí deployment

**Problém:** Slow performance  
**Řešení:** Obrázky optimalizujte nebo použijte CDN (Cloudinary, Imgix)

## Pro Rychlý Start s Vercelem

```bash
# 1. Inicializujte Git (pokud jste ještě neudělali)
git init
git add .
git commit -m "Initial commit"

# 2. Push na GitHub
# (Předpokládá, že máte GitHub repo)
git push origin main

# 3. Vercel automaticky nasadí při každém push!
```

---

**Podpora:** Kontaktujte info@layalastudio.cz
