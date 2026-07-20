# Brief Lottie — Transizione navigazione IdeaDiLuce

**Per:** motion designer / illustratore  
**Progetto:** PWA e-commerce IdeaDiLuce  
**Uso:** overlay animato sopra tendina nera a schermo intero durante il cambio pagina  
**Consegna:** file `.json` Lottie (Bodymovin / LottieFiles) + eventuale `.aep` / progetto sorgente

---

## 1. Contesto e obiettivo

Al click su un link interno:

1. Una **tendina nera** sale dal basso e copre tutto lo schermo (già gestita in codice).
2. **Sopra il nero** parte il tuo Lottie (questo brief).
3. Quando la pagina successiva è pronta, il nero esce verso l’alto e rivela il contenuto.
4. Il Lottie deve **mascherare la sensazione di attesa** e dare una transizione di *stile*, non un loader “tecnico” (niente spinner generici, niente progress bar).

Tone of voice: **luce, eleganza, design editoriale**. Premium, calmo, non giocoso / non tech-startup.

---

## 2. Composizione desiderata (multi-strato)

Progetta in **3–5 layer** indipendenti (nomi chiari nel progetto AE), così in futuro possiamo ritardare/sfasare i layer via codice se serve.

| Layer (suggerito) | Ruolo | Note |
|---|---|---|
| `L0_ambient` | Alone / bagliore soft | Molto soft, opacity bassa, full-bleed o ampio |
| `L1_motif` | Motivo principale (luce, alone, raggio, monogramma stilizzato) | Focus visivo al centro |
| `L2_detail` | Dettaglio fine (linee, polvere di luce, alone interno) | Micro-motion |
| `L3_wordmark` *(opzionale)* | Logo / wordmark IdeaDiLuce semplificato | Solo se fornito asset ufficiale; altrimenti omettere |
| `L4_exit_hint` *(opzionale)* | Accenno di “apertura” verso il reveal | Utile se l’animazione ha una coda di uscita |

**Importante:** il **nero di fondo non va disegnato nel Lottie**. Sfondo della composition = **trasparente**. Il sito fornisce già il nero a schermo intero.

---

## 3. Formato tecnico (obbligatorio)

| Spec | Valore |
|---|---|
| Formato | **Lottie JSON** (Bodymovin / LottieFiles). Non video, non GIF. |
| Player | `lottie-react` / Lottie Web (bodymovin) |
| Background | **Trasparente** |
| Dimensioni composition | **1080 × 1080 px** (quadrado, safe per centro) **oppure** **1920 × 1080** se full-bleed |
| Safe area centrale | Contenuto critico entro un cerchio/quadrato centrale ~**60%** della composition (mobile crop-friendly) |
| Framerate | **30 fps** (preferito) o 60 se leggero |
| Durata ciclo loop | **1.5 – 2.5 s** per loop continuo di “attesa” |
| Variante intro *(consigliata)* | Clip **0.4 – 0.8 s** di entrata (fade/scale-in motif) poi loop |
| Variante outro *(nice to have)* | Clip **0.3 – 0.6 s** di dissolvenza/contrazione per sincronizzare con la fine del nero |
| Peso file | Target **≤ 150 KB**, hard limit **300 KB** |
| Assets raster | **Evitare** PNG/JPG dentro il Lottie. Solo vettori / shape layers. |
| Font | Se usi testo: **outline/convert to shapes** (niente font esterni) |
| Espressioni AE | Evitare espressioni non supportate da Lottie; testare su [LottieFiles preview](https://lottiefiles.com/preview) / Bodymovin |
| Effetti da evitare | Gaussian blur pesanti, glow AE nativi non supportati, 3D layers, track matte complessi non esportabili |
| Naming file consegna | `nav-transition.json` (sostituirà `nav-loading.json`) |

### Responsive (desktop + mobile)

Il Lottie viene scalato in CSS mantenendo l’aspect ratio:

- **Mobile:** circa **112–128 px** di lato (mark centrale) **oppure** full-bleed se composition 9:16 / 16:9 con safe center.
- **Desktop:** circa **128–160 px** (mark) **oppure** full-bleed viewport.

Quindi:

1. Tutto ciò che deve restare leggibile va nel **centro safe**.
2. Layer ambient possono andare a bordo (si ritagliano / si riducono senza danno).
3. **Niente testo piccolo** ai margini.
4. Un solo file per entrambe le piattaforme (non due Lottie separati, salvo diversa richiesta).

Se preferisci un approccio **full-viewport** (più cinematografico):

- Composition **1080 × 1920** (mobile-first) o **1920 × 1080** (desktop-first).
- Motivo principale sempre nel safe center.
- Indica nel README di consegna: `mode: fullBleed` così adattiamo il wrapper CSS.

---

## 4. Direzione creativa

### Concetto
IdeaDiLuce = **la luce che prende forma**. La transizione è un “battito di luce” sul nero: non un loader, ma un **intermezzo di brand**.

### Palette (su nero puro `#000000`)

| Ruolo | Colore | Hex |
|---|---|---|
| Luce primaria | Bianco caldo soft | `#FFF8F0` / `#FFFFFF` |
| Accento caldo (discreto) | Champagne / oro molto soft | `#E8D5B5` o simile |
| Secondario | Grigio perla | `#C8C4BC` |
| Evitare | Viola, neon, ciano tech, rosso alert, gradienti rainbow |

### Motion
- Ease **smooth / ease-out** (niente bounce elastico da UI kit).
- Movimento **lento e continuo** in loop; micro-scale 95→105% o alone che respira.
- Opacità che pulsa con grazia; evitare strobo / flicker aggressivo.
- Se multi-strato: sfasare i layer di **4–12 frame** per profondità.

### Stile
- Editoriale, minimal, high-end lighting / interior design.
- OK: alone, raggio soft, monogramma astratto, “apertura di luce”.
- KO: spinner circolari generici, progress ring Material, icone carrello, emoji, illustrazioni complesse figurative.

---

## 5. Timing rispetto alla tendina (per sincronia)

Timeline tipica lato prodotto (indicativa):

```
0.00s  click
0.00–0.48s   nero sale dal basso (codice)
0.48s+       Lottie a regime (loop) finché la pagina è pronta
…            nero scende/esce verso l’alto (~0.52s)
```

**Consegna ideale (2 clip o 1 file con markers):**

1. **`intro`** (play once) → poi **`loop`**
2. Oppure un unico loop che parta già “bello” dal frame 0 (intro corta inclusa nei primi 15–20 frame)

Markers Lottie consigliati (se supportati nel tuo export):

- `intro_end`
- `loop_start` / `loop_end`
- `outro_start` *(opzionale)*

Se non usi markers: consegnami **due JSON** (`nav-transition-intro.json` + `nav-transition-loop.json`) oppure un solo loop autosufficiente.

---

## 6. Checklist di consegna

- [ ] `nav-transition.json` (sfondo trasparente, vettoriale)
- [ ] Preview MP4/WebM o GIF **solo per review** (non per produzione)
- [ ] Screenshot frame “hero” su fondo nero
- [ ] Nota: dimensioni composition, fps, durata loop, peso KB
- [ ] Elenco layer e cosa fa ciascuno
- [ ] Test su LottieFiles preview (iOS Safari + Chrome desktop)
- [ ] *(Opzionale)* progetto After Effects / Rive sorgente
- [ ] Conferma: nessun font esterno, nessun asset raster pesante

---

## 7. Dove finisce il file nel progetto

```
client/public/site/lottie/nav-transition.json
```

Il wrapper codice lo scala in modo responsive; se il Lottie è full-bleed, segnalarlo così adattiamo le classi da `size-28/32` a `w-full h-full`.

---

## 8. Riferimenti utili per te (designer)

- Export: plugin **Bodymovin** / **LottieFiles** per After Effects  
- Validazione: https://lottiefiles.com/preview  
- Feature support Lottie: evitare effetti non supportati (blur AE, some mattes, expressions avanzate)

---

## 9. Contatti / decisioni aperte (da chiarire con brand)

1. Usiamo **solo motif luce** o anche **wordmark** IdeaDiLuce?  
2. Preferenza **mark centrale** (più semplice, responsive) vs **full-bleed cinematografico**?  
3. Loop infinito durante l’attesa, oppure intro + hold statico soft?

**Raccomandazione prodotto:** mark centrale multi-layer + loop 2s, senza wordmark (più pulito e meno rischi legali/asset), full responsive out of the box.
