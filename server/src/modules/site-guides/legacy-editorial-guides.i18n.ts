import type { SiteLocale } from '../site/site.constants.js'
import type { ContentPageContent } from '../site/site.types.js'
import type { LegacyEditorialGuideSlug } from './legacy-editorial-guides.content.js'

type NonItLocale = Exclude<SiteLocale, 'IT'>

export const LEGACY_EDITORIAL_GUIDES_I18N: Record<
  NonItLocale,
  Record<LegacyEditorialGuideSlug, ContentPageContent>
> = {
  EN: {
    'luce-calda-o-fredda': {
      layout: 'article',
      eyebrow: 'DESIGN · SHOP THE LOOK · JUNE 2024',
      title: 'WARM or COOL light: the illuminating choice',
      subtitle: 'Playing with roles: how to choose warm vs cool light room by room.',
      intro:
        'Warm light (2400–2700K) feels cosy; cool light (4000–6500K) is brighter and better for visual tasks. Prefer warm in bedroom and living room; neutral/cool in office and kitchen.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Lighting plays a fundamental role in creating the perfect atmosphere in every room. How do you choose between warm and cool light? Colour temperature is measured in Kelvin (K): lower values give a soft, welcoming glow like candlelight; higher values recall crisp morning daylight.',
            'Warm light, between 2400K and 2700K, feels soft and inviting. Cool light, between 4000K and 6500K, is brighter — ideal where focus and visibility matter.',
          ],
        },
        {
          kind: 'bullets',
          title: 'Room by room',
          items: [
            'Bedroom: prefer warm light, especially bedside lamps, to support relaxation and sleep.',
            'Office: cool light improves concentration and productivity.',
            'Kitchen: many prefer cool or neutral light for a clean look and better visibility while cooking.',
            'Bathroom: mix both — cool for makeup and shaving, warm for a relaxing evening bath.',
            'Dining room: warm light creates a welcoming atmosphere at mealtimes.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspiration',
          subtitle: 'Design luminaires to complement your colour temperature choice.',
          items: [
            {
              title: 'Alphabet of light',
              description: 'Modular Artemide composition for dramatic living-room light.',
              href: '/catalogo?world=design&q=Alphabet+of+light',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/alpha.jpg',
            },
            {
              title: 'Captain Flint',
              description: 'Flos floor lamp with adjustable warm light for reading corners.',
              href: '/catalogo?world=design&q=Captain+Flint',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/capflin.jpg',
            },
            {
              title: 'Lampara',
              description: 'Pendant with warm character for dining or entryway.',
              href: '/catalogo?world=design&q=Lampara',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/lampara.jpg',
            },
            {
              title: 'Bolla',
              description: 'Blown glass and diffused light for soft atmospheres.',
              href: '/catalogo?world=design&q=Bolla',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/bolla1.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Looking for bulbs or fixtures by colour temperature?',
          primaryLabel: 'Explore design lighting →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'All design guides →', href: '/guide' },
    },
    'calipso-artemide-io-vengo-dalla-luna': {
      layout: 'article',
      eyebrow: 'DESIGN · DESIGN SPOTLIGHT · JUNE 2024',
      title: 'CALIPSO – Designed by Artemide',
      subtitle: 'I come from the moon: fractal geometry, visual comfort and emotional light.',
      intro:
        'Artemide Calipso is born from an algorithm: organic luminous circles that spread comfortable light and create a unique atmosphere for living rooms, hallways and social spaces.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'A luminous emotion takes shape with Artemide Calipso, a design artwork that captures lunar beauty. Born from an algorithm, its fractal geometry creates an organic ensemble of light circles, offering optimal visual comfort and a unique atmosphere.',
            'Perfect for any setting, Calipso blends high performance with distinctive expressiveness — a hallmark of Artemide design lighting. With Calipso, light becomes emotion: technology merges with art and the moon enters your home.',
            'Discover how technology and design fuse for an unforgettable lighting experience. Let Calipso inspire you and transform your spaces with its enveloping glow.',
          ],
        },
        {
          kind: 'features',
          title: 'Neil Poulton',
          items: [
            {
              title: 'Designer',
              description:
                'Award-winning Scottish designer Neil Poulton, based in Paris, is known for minimalist yet technologically advanced projects. He has long collaborated with Artemide and other leading brands.',
            },
            {
              title: 'Philosophy',
              description:
                'Essential forms, refined materials and luminous innovation: each product is made to fit everyday spaces without losing sculptural identity.',
            },
          ],
        },
        {
          kind: 'cards',
          title: 'Neil Poulton products',
          subtitle: 'Discover Calipso and other Artemide icons by the designer.',
          items: [
            {
              title: 'Calipso',
              description: 'Iconic pendant with fractal geometry and diffused light.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso.jpg',
            },
            {
              title: 'Microsurf',
              description: 'Compact table lamp with direct and reflected light.',
              href: '/catalogo?world=design&q=Microsurf',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/microsurf.jpg',
            },
            {
              title: 'Talo',
              description: 'Essential line for contemporary desks and nightstands.',
              href: '/catalogo?world=design&q=Talo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/talo.jpg',
            },
            {
              title: 'Rea',
              description: 'Slim-profile wall or sconce luminaire.',
              href: '/catalogo?world=design&q=Rea+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/rea.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Explore the full Artemide collection',
          primaryLabel: 'View Artemide brand →',
          primaryHref: '/brand/artemide',
          variant: 'accent',
        },
      ],
      cta: { label: 'More design inspiration →', href: '/categoria-prodotto/illuminazione-arredo' },
    },
    'la-natura-trend-2024': {
      layout: 'article',
      eyebrow: 'DESIGN · STYLE RADAR · JUNE 2024',
      title: 'Lighting trends 2024 – NATURE',
      subtitle: 'Nature comes home: organic shapes, natural materials and poetic light.',
      intro:
        '2024 design celebrates beehives, water flows and mountain silhouettes: organic lamps, Wabi-Sabi finishes and modular compositions bring a natural touch indoors.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Nature is the muse of 2024 design, and lighting is no exception. Inspired by beehives, flowing water or mountain shapes, this year\'s design lamps bring nature into domestic spaces. Forget rigid lines: 2024 celebrates organic forms and natural materials.',
            'Chlorophilia, by Ross Lovegrove, is a luminous sculpture that reinterprets Artemide expertise in an organic, fluid key. Its lightness shines when lit, with a striking play of shadows: the central body diffuses indirect light filtered through three transparent leaf-shaped elements.',
            'Wabi-Sabi aesthetics, celebrating imperfection and the beauty of ageing, is another strong trend: antiqued finishes, raw materials and imperfect shapes add character to interiors.',
            'Artemide Yanzi balances tradition and innovation: brushed brass branches support stylised swallows with white glass heads that hold the light. An open system for custom compositions and unique luminous landscapes.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspired by nature',
          subtitle: 'A selection of organic lamps and scenic compositions.',
          items: [
            {
              title: 'Chlorophilia',
              description: 'Ross Lovegrove luminous sculpture with glass leaves.',
              href: '/catalogo?world=design&q=Chlorophilia',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/chloro.jpg',
            },
            {
              title: 'Yanzi',
              description: 'Modular system with glass swallows and brushed brass.',
              href: '/catalogo?world=design&q=Yanzi',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/yanzi.jpg',
            },
            {
              title: 'Calipso',
              description: 'Fractal geometry inspired by the lunar surface.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso-up2.jpg',
            },
            {
              title: 'UOVO',
              description: 'Organic blown-glass form for soft light.',
              href: '/catalogo?world=design&q=Uovo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/uovo.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Discover design lighting',
          primaryLabel: 'Go to design category →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'All guides →', href: '/guide' },
    },
  },

  ES: {
    'luce-calda-o-fredda': {
      layout: 'article',
      eyebrow: 'DISEÑO · SHOP THE LOOK · JUNIO 2024',
      title: 'Luz CÁLIDA o FRÍA: la elección iluminante',
      subtitle: 'Juegos de roles: cómo elegir luz cálida o fría habitación por habitación.',
      intro:
        'La luz cálida (2400–2700K) crea ambiente acogedor; la fría (4000–6500K) es más brillante y adecuada para tareas visuales. En dormitorio y salón prioriza la cálida; en oficina y cocina la neutra/fría.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'La iluminación juega un papel fundamental en crear la atmósfera perfecta en cada estancia. ¿Cómo elegir entre luz cálida y fría? La temperatura de color se mide en Kelvin (K): valores bajos dan un brillo suave y acogedor; valores altos recuerdan la luz natural de la mañana.',
            'La luz cálida, entre 2400K y 2700K, emite un resplandor suave y acogedor. La luz fría, entre 4000K y 6500K, es más brillante e ideal donde se necesita concentración y visibilidad.',
          ],
        },
        {
          kind: 'bullets',
          title: 'Luz habitación por habitación',
          items: [
            'Dormitorio: privilegia la luz cálida, especialmente en las lámparas de mesita, para favorecer el relax y el sueño.',
            'Oficina: la luz fría mejora la concentración y la productividad.',
            'Cocina: muchos prefieren luz fría o neutra para un aspecto limpio y mejor visibilidad al cocinar.',
            'Baño: puedes combinar ambas — fría para maquillaje y afeitado, cálida para un baño relajante por la noche.',
            'Comedor: la luz cálida es perfecta para una atmósfera acogedora durante las comidas.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspiraciones',
          subtitle: 'Lámparas de diseño para valorizar tu elección de temperatura de color.',
          items: [
            {
              title: 'Alphabet of light',
              description: 'Composición modular Artemide para luz escenográfica en el salón.',
              href: '/catalogo?world=design&q=Alphabet+of+light',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/alpha.jpg',
            },
            {
              title: 'Captain Flint',
              description: 'Lámpara de pie Flos con luz cálida regulable para lectura.',
              href: '/catalogo?world=design&q=Captain+Flint',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/capflin.jpg',
            },
            {
              title: 'Lampara',
              description: 'Colgante de carácter cálido para comedor o entrada.',
              href: '/catalogo?world=design&q=Lampara',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/lampara.jpg',
            },
            {
              title: 'Bolla',
              description: 'Vidrio soplado y luz difusa para atmósferas suaves.',
              href: '/catalogo?world=design&q=Bolla',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/bolla1.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: '¿Buscas bombillas o lámparas por temperatura de color?',
          primaryLabel: 'Explora iluminación de diseño →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'Todas las guías de diseño →', href: '/guide' },
    },
    'calipso-artemide-io-vengo-dalla-luna': {
      layout: 'article',
      eyebrow: 'DISEÑO · DESIGN SPOTLIGHT · JUNIO 2024',
      title: 'CALIPSO – Diseñado por Artemide',
      subtitle: 'Vengo de la luna: geometría fractal, confort visual y luz emocional.',
      intro:
        'Calipso de Artemide nace de un algoritmo: círculos luminosos orgánicos que difunden luz confortable y crean una atmósfera única para salones, recibidores y zonas sociales.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Una emoción luminosa toma forma con Artemide Calipso, una obra de diseño que captura la belleza lunar. Nacida de un algoritmo, su geometría fractal crea un conjunto orgánico de círculos luminosos con confort visual óptimo.',
            'Perfecta para cualquier ambiente, Calipso fusiona alto rendimiento y expresividad única, sello distintivo de la iluminación de diseño Artemide. Con Calipso, la luz se convierte en emoción: la tecnología se funde con el arte.',
            'Descubre cómo tecnología y diseño se fusionan para una experiencia luminosa inolvidable. Déjate inspirar por la magia de Calipso y transforma tus espacios con su luz envolvente.',
          ],
        },
        {
          kind: 'features',
          title: 'Neil Poulton',
          items: [
            {
              title: 'Diseñador',
              description:
                'Neil Poulton, diseñador escocés premiado con base en París, es célebre por proyectos minimalistas pero tecnológicamente avanzados. Colabora desde hace años con Artemide y otras marcas líderes.',
            },
            {
              title: 'Filosofía',
              description:
                'Formas esenciales, materiales refinados e innovación luminosa: cada producto nace para integrarse en los espacios cotidianos sin renunciar a la identidad escultórica.',
            },
          ],
        },
        {
          kind: 'cards',
          title: 'Productos de Neil Poulton',
          subtitle: 'Descubre Calipso y otros iconos del diseñador para Artemide.',
          items: [
            {
              title: 'Calipso',
              description: 'Colgante icónico con geometría fractal y luz difusa.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso.jpg',
            },
            {
              title: 'Microsurf',
              description: 'Lámpara de mesa compacta con luz directa y reflejada.',
              href: '/catalogo?world=design&q=Microsurf',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/microsurf.jpg',
            },
            {
              title: 'Talo',
              description: 'Línea esencial para escritorios y mesitas contemporáneos.',
              href: '/catalogo?world=design&q=Talo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/talo.jpg',
            },
            {
              title: 'Rea',
              description: 'Aplique de perfil fino para pared.',
              href: '/catalogo?world=design&q=Rea+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/rea.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Explora toda la colección Artemide',
          primaryLabel: 'Ver marca Artemide →',
          primaryHref: '/brand/artemide',
          variant: 'accent',
        },
      ],
      cta: { label: 'Más inspiración de diseño →', href: '/categoria-prodotto/illuminazione-arredo' },
    },
    'la-natura-trend-2024': {
      layout: 'article',
      eyebrow: 'DISEÑO · STYLE RADAR · JUNIO 2024',
      title: 'Tendencias de iluminación 2024 – LA NATURALEZA',
      subtitle: 'La naturaleza entra en casa: formas orgánicas, materiales naturales y luz poética.',
      intro:
        'El diseño 2024 celebra colmenas, flujos de agua y siluetas montañosas: lámparas orgánicas, acabados Wabi-Sabi y composiciones modulares aportan un toque natural a los interiores.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'La naturaleza es la musa del diseño 2024, y la iluminación no es excepción. Inspiradas en colmenas, el flujo del agua o las formas de las montañas, las lámparas de diseño de este año traen naturaleza a los hogares. Olvida las líneas rígidas: 2024 celebra formas orgánicas y materiales naturales.',
            'Chlorophilia, firmada por Ross Lovegrove, es una escultura luminosa que reinterpreta el expertise Artemide en clave orgánica y fluida. Su ligereza se revela encendida, con un juego de sombras sugerente.',
            'La estética Wabi-Sabi, que celebra la imperfección y la belleza del envejecimiento, es otra tendencia fuerte: acabados envejecidos, materiales crudos y formas imperfectas añaden carácter.',
            'Yanzi de Artemide equilibra tradición e innovación: ramas de latón cepillado sostienen golondrinas estilizadas con cabezas de vidrio blanco que encierran la luz.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspirados por la naturaleza',
          subtitle: 'Selección de lámparas orgánicas y composiciones escenográficas.',
          items: [
            {
              title: 'Chlorophilia',
              description: 'Escultura luminosa de Ross Lovegrove con hojas de vidrio.',
              href: '/catalogo?world=design&q=Chlorophilia',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/chloro.jpg',
            },
            {
              title: 'Yanzi',
              description: 'Sistema modular con golondrinas de vidrio y latón cepillado.',
              href: '/catalogo?world=design&q=Yanzi',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/yanzi.jpg',
            },
            {
              title: 'Calipso',
              description: 'Geometría fractal inspirada en la superficie lunar.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso-up2.jpg',
            },
            {
              title: 'UOVO',
              description: 'Forma orgánica en vidrio soplado para luz suave.',
              href: '/catalogo?world=design&q=Uovo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/uovo.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Descubre la iluminación de diseño',
          primaryLabel: 'Ir a categoría diseño →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'Todas las guías →', href: '/guide' },
    },
  },

  FR: {
    'luce-calda-o-fredda': {
      layout: 'article',
      eyebrow: 'DÉCO · SHOP THE LOOK · JUIN 2024',
      title: 'Lumière CHAUDE ou FROIDE : le choix éclairant',
      subtitle: 'Jeux de rôles : comment choisir entre lumière chaude et froide pièce par pièce.',
      intro:
        'La lumière chaude (2400–2700K) crée une ambiance accueillante ; la froide (4000–6500K) est plus vive et adaptée aux tâches visuelles. Privilégiez le chaud en chambre et salon ; le neutre/froid au bureau et en cuisine.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'L\'éclairage joue un rôle fondamental dans l\'atmosphère de chaque pièce. Comment choisir entre lumière chaude et froide ? La température de couleur se mesure en Kelvin (K) : les valeurs basses donnent une lueur douce et chaleureuse ; les valeurs hautes rappellent la lumière du matin.',
            'La lumière chaude, entre 2400K et 2700K, émet une lueur douce et accueillante. La lumière froide, entre 4000K et 6500K, est plus brillante — idéale là où concentration et visibilité comptent.',
          ],
        },
        {
          kind: 'bullets',
          title: 'Pièce par pièce',
          items: [
            'Chambre : privilégiez la lumière chaude, surtout pour les lampes de chevet, pour favoriser détente et sommeil.',
            'Bureau : la lumière froide améliore concentration et productivité.',
            'Cuisine : beaucoup préfèrent une lumière froide ou neutre pour un aspect net et une meilleure visibilité.',
            'Salle de bain : combinez les deux — froide pour maquillage et rasage, chaude pour un bain relaxant le soir.',
            'Salle à manger : la lumière chaude crée une atmosphère conviviale aux repas.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspirations',
          subtitle: 'Luminaires design pour accompagner votre choix de température.',
          items: [
            {
              title: 'Alphabet of light',
              description: 'Composition modulaire Artemide pour une lumière scénographique au salon.',
              href: '/catalogo?world=design&q=Alphabet+of+light',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/alpha.jpg',
            },
            {
              title: 'Captain Flint',
              description: 'Lampadaire Flos à lumière chaude réglable pour coin lecture.',
              href: '/catalogo?world=design&q=Captain+Flint',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/capflin.jpg',
            },
            {
              title: 'Lampara',
              description: 'Suspension au caractère chaleureux pour salle à manger ou entrée.',
              href: '/catalogo?world=design&q=Lampara',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/lampara.jpg',
            },
            {
              title: 'Bolla',
              description: 'Verre soufflé et lumière diffuse pour atmosphères douces.',
              href: '/catalogo?world=design&q=Bolla',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/bolla1.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Vous cherchez ampoules ou luminaires par température ?',
          primaryLabel: 'Explorer l\'éclairage design →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'Toutes les guides design →', href: '/guide' },
    },
    'calipso-artemide-io-vengo-dalla-luna': {
      layout: 'article',
      eyebrow: 'DÉCO · DESIGN SPOTLIGHT · JUIN 2024',
      title: 'CALIPSO – Conçu par Artemide',
      subtitle: 'Je viens de la lune : géométrie fractale, confort visuel et lumière émotionnelle.',
      intro:
        'Calipso d\'Artemide naît d\'un algorithme : des cercles lumineux organiques qui diffusent une lumière confortable et créent une atmosphère unique pour salon, entrée et espaces conviviaux.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Une émotion lumineuse prend forme avec Artemide Calipso, une œuvre de design qui capture la beauté lunaire. Née d\'un algorithme, sa géométrie fractale crée un ensemble organique de cercles lumineux offrant un confort visuel optimal.',
            'Parfaite pour tout environnement, Calipso allie hautes performances et expressivité unique, trait distinctif de l\'éclairage design Artemide. Avec Calipso, la lumière devient émotion : la technologie fusionne avec l\'art.',
            'Découvrez comment technologie et design se fondent pour une expérience lumineuse inoubliable. Laissez-vous inspirer par la magie de Calipso et transformez vos espaces avec sa lumière enveloppante.',
          ],
        },
        {
          kind: 'features',
          title: 'Neil Poulton',
          items: [
            {
              title: 'Designer',
              description:
                'Neil Poulton, designer écossais primé basé à Paris, est célèbre pour des projets minimalistes mais technologiquement avancés. Il collabore depuis longtemps avec Artemide et d\'autres marques leaders.',
            },
            {
              title: 'Philosophie',
              description:
                'Formes essentielles, matériaux raffinés et innovation lumineuse : chaque produit s\'intègre au quotidien sans perdre son identité sculpturale.',
            },
          ],
        },
        {
          kind: 'cards',
          title: 'Produits de Neil Poulton',
          subtitle: 'Découvrez Calipso et d\'autres icônes du designer pour Artemide.',
          items: [
            {
              title: 'Calipso',
              description: 'Suspension iconique à géométrie fractale et lumière diffuse.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso.jpg',
            },
            {
              title: 'Microsurf',
              description: 'Lampe de table compacte à lumière directe et réfléchie.',
              href: '/catalogo?world=design&q=Microsurf',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/microsurf.jpg',
            },
            {
              title: 'Talo',
              description: 'Ligne essentielle pour bureaux et tables de nuit contemporains.',
              href: '/catalogo?world=design&q=Talo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/talo.jpg',
            },
            {
              title: 'Rea',
              description: 'Applique au profil fin pour mur.',
              href: '/catalogo?world=design&q=Rea+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/rea.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Explorez toute la collection Artemide',
          primaryLabel: 'Voir la marque Artemide →',
          primaryHref: '/brand/artemide',
          variant: 'accent',
        },
      ],
      cta: { label: 'Plus d\'inspiration design →', href: '/categoria-prodotto/illuminazione-arredo' },
    },
    'la-natura-trend-2024': {
      layout: 'article',
      eyebrow: 'DÉCO · STYLE RADAR · JUIN 2024',
      title: 'Tendances éclairage 2024 – LA NATURE',
      subtitle: 'La nature entre dans la maison : formes organiques, matériaux naturels et lumière poétique.',
      intro:
        'Le design 2024 célèbre ruches, flux d\'eau et silhouettes montagneuses : luminaires organiques, finitions Wabi-Sabi et compositions modulaires apportent une touche naturelle aux intérieurs.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'La nature est la muse du design 2024, et l\'éclairage ne fait pas exception. Inspirées des ruches, du flux de l\'eau ou des formes des montagnes, les lampes design de cette année apportent la nature dans les foyers. Oubliez les lignes rigides : 2024 célèbre formes organiques et matériaux naturels.',
            'Chlorophilia, signée Ross Lovegrove, est une sculpture lumineuse qui réinterprète l\'expertise Artemide en clé organique et fluide. Sa légèreté se révèle allumée, avec un jeu d\'ombres suggestif.',
            'L\'esthétique Wabi-Sabi, qui célèbre l\'imperfection et la beauté du vieillissement, est une autre tendance forte : finitions patinées, matériaux bruts et formes imparfaites ajoutent du caractère.',
            'Yanzi d\'Artemide équilibre tradition et innovation : des branches en laiton brossé soutiennent des hirondelles stylisées aux têtes en verre blanc qui renferment la lumière.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspirés par la nature',
          subtitle: 'Sélection de lampes organiques et compositions scénographiques.',
          items: [
            {
              title: 'Chlorophilia',
              description: 'Sculpture lumineuse de Ross Lovegrove avec feuilles en verre.',
              href: '/catalogo?world=design&q=Chlorophilia',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/chloro.jpg',
            },
            {
              title: 'Yanzi',
              description: 'Système modulaire avec hirondelles en verre et laiton brossé.',
              href: '/catalogo?world=design&q=Yanzi',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/yanzi.jpg',
            },
            {
              title: 'Calipso',
              description: 'Géométrie fractale inspirée de la surface lunaire.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso-up2.jpg',
            },
            {
              title: 'UOVO',
              description: 'Forme organique en verre soufflé pour une lumière douce.',
              href: '/catalogo?world=design&q=Uovo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/uovo.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Découvrez l\'éclairage design',
          primaryLabel: 'Aller à la catégorie design →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'Toutes les guides →', href: '/guide' },
    },
  },

  DE: {
    'luce-calda-o-fredda': {
      layout: 'article',
      eyebrow: 'DESIGN · SHOP THE LOOK · JUNI 2024',
      title: 'WARMES oder KALTES Licht: die erleuchtende Wahl',
      subtitle: 'Rollenspiel: warmes vs. kaltes Licht Raum für Raum wählen.',
      intro:
        'Warmes Licht (2400–2700K) wirkt gemütlich; kaltes Licht (4000–6500K) ist heller und besser für visuelle Aufgaben. Im Schlafzimmer und Wohnzimmer warm bevorzugen; im Büro und in der Küche neutral/kalt.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Beleuchtung spielt eine zentrale Rolle für die Atmosphäre in jedem Raum. Wie wählt man zwischen warmem und kaltem Licht? Die Farbtemperatur wird in Kelvin (K) gemessen: niedrige Werte geben ein weiches, einladendes Leuchten; hohe Werte erinnern an Morgenlicht.',
            'Warmes Licht zwischen 2400K und 2700K wirkt weich und einladend. Kaltes Licht zwischen 4000K und 6500K ist heller — ideal, wo Konzentration und Sichtbarkeit zählen.',
          ],
        },
        {
          kind: 'bullets',
          title: 'Raum für Raum',
          items: [
            'Schlafzimmer: warmes Licht bevorzugen, besonders bei Nachttischlampen, für Entspannung und Schlaf.',
            'Büro: kaltes Licht verbessert Konzentration und Produktivität.',
            'Küche: viele bevorzugen kaltes oder neutrales Licht für ein sauberes Erscheinungsbild und bessere Sicht beim Kochen.',
            'Bad: beides kombinieren — kalt für Make-up und Rasur, warm für ein entspannendes Abendbad.',
            'Esszimmer: warmes Licht schafft eine einladende Atmosphäre beim Essen.',
          ],
        },
        {
          kind: 'cards',
          title: 'Inspirationen',
          subtitle: 'Designleuchten für Ihre Farbtemperatur-Wahl.',
          items: [
            {
              title: 'Alphabet of light',
              description: 'Modulare Artemide-Komposition für stimmungsvolles Wohnzimmerlicht.',
              href: '/catalogo?world=design&q=Alphabet+of+light',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/alpha.jpg',
            },
            {
              title: 'Captain Flint',
              description: 'Flos-Stehleuchte mit einstellbarem warmem Licht für Lesecken.',
              href: '/catalogo?world=design&q=Captain+Flint',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/capflin.jpg',
            },
            {
              title: 'Lampara',
              description: 'Pendelleuchte mit warmem Charakter für Ess- oder Eingangsbereich.',
              href: '/catalogo?world=design&q=Lampara',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/lampara.jpg',
            },
            {
              title: 'Bolla',
              description: 'Blasglas und diffuses Licht für weiche Atmosphären.',
              href: '/catalogo?world=design&q=Bolla',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/bolla1.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Suchen Sie Leuchtmittel oder Lampen nach Farbtemperatur?',
          primaryLabel: 'Design-Beleuchtung entdecken →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'Alle Design-Guides →', href: '/guide' },
    },
    'calipso-artemide-io-vengo-dalla-luna': {
      layout: 'article',
      eyebrow: 'DESIGN · DESIGN SPOTLIGHT · JUNI 2024',
      title: 'CALIPSO – Designed by Artemide',
      subtitle: 'Ich komme vom Mond: fraktale Geometrie, Sehkomfort und emotionales Licht.',
      intro:
        'Artemide Calipso entsteht aus einem Algorithmus: organische Lichtkreise, die angenehmes Licht verteilen und eine einzigartige Atmosphäre für Wohnzimmer, Flure und gesellige Bereiche schaffen.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Eine leuchtende Emotion nimmt Gestalt an mit Artemide Calipso, einem Designkunstwerk, das die Schönheit des Mondes einfängt. Aus einem Algorithmus geboren, schafft seine fraktale Geometrie ein organisches Ensemble aus Lichtkreisen mit optimalem Sehkomfort.',
            'Perfekt für jede Umgebung vereint Calipso hohe Leistung mit unverwechselbarer Ausdruckskraft — ein Markenzeichen der Artemide-Designbeleuchtung. Mit Calipso wird Licht zur Emotion: Technologie verschmilzt mit Kunst.',
            'Entdecken Sie, wie Technologie und Design für ein unvergessliches Lichterlebnis verschmelzen. Lassen Sie sich von Calipso inspirieren und verwandeln Sie Ihre Räume mit seinem umhüllenden Licht.',
          ],
        },
        {
          kind: 'features',
          title: 'Neil Poulton',
          items: [
            {
              title: 'Designer',
              description:
                'Der preisgekrönte schottische Designer Neil Poulton, ansässig in Paris, ist bekannt für minimalistische, technologisch fortgeschrittene Projekte. Er arbeitet seit Jahren mit Artemide und anderen führenden Marken zusammen.',
            },
            {
              title: 'Philosophie',
              description:
                'Essenzielle Formen, edle Materialien und Lichtinnovation: jedes Produkt fügt sich in den Alltag ein, ohne seine skulpturale Identität zu verlieren.',
            },
          ],
        },
        {
          kind: 'cards',
          title: 'Neil Poulton Produkte',
          subtitle: 'Entdecken Sie Calipso und weitere Artemide-Ikonen des Designers.',
          items: [
            {
              title: 'Calipso',
              description: 'Ikoniche Pendelleuchte mit fraktaler Geometrie und diffusem Licht.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso.jpg',
            },
            {
              title: 'Microsurf',
              description: 'Kompakte Tischleuchte mit direktem und reflektiertem Licht.',
              href: '/catalogo?world=design&q=Microsurf',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/microsurf.jpg',
            },
            {
              title: 'Talo',
              description: 'Essenzielle Linie für zeitgenössische Schreib- und Nachttische.',
              href: '/catalogo?world=design&q=Talo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/talo.jpg',
            },
            {
              title: 'Rea',
              description: 'Wandleuchte mit schlankem Profil.',
              href: '/catalogo?world=design&q=Rea+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/rea.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Entdecken Sie die gesamte Artemide-Kollektion',
          primaryLabel: 'Marke Artemide ansehen →',
          primaryHref: '/brand/artemide',
          variant: 'accent',
        },
      ],
      cta: { label: 'Mehr Design-Inspiration →', href: '/categoria-prodotto/illuminazione-arredo' },
    },
    'la-natura-trend-2024': {
      layout: 'article',
      eyebrow: 'DESIGN · STYLE RADAR · JUNI 2024',
      title: 'Beleuchtungstrends 2024 – DIE NATUR',
      subtitle: 'Die Natur kommt nach Hause: organische Formen, natürliche Materialien und poetisches Licht.',
      intro:
        'Das Design 2024 feiert Bienenwaben, Wasserflüsse und Bergumrisse: organische Lampen, Wabi-Sabi-Oberflächen und modulare Kompositionen bringen Natur ins Interieur.',
      blocks: [
        {
          kind: 'prose',
          paragraphs: [
            'Die Natur ist die Muse des Designs 2024, und die Beleuchtung bildet keine Ausnahme. Inspiriert von Bienenwaben, fließendem Wasser oder Bergformen bringen die Designlampen dieses Jahres Natur in Wohnräume. Vergessen Sie starre Linien: 2024 feiert organische Formen und natürliche Materialien.',
            'Chlorophilia von Ross Lovegrove ist eine Lichtskulptur, die Artemides Expertise organisch und fließend neu interpretiert. Ihre Leichtigkeit offenbart sich eingeschaltet mit einem eindrucksvollen Schattenspiel.',
            'Die Wabi-Sabi-Ästhetik, die Unvollkommenheit und die Schönheit des Alterns feiert, ist ein weiterer starker Trend: gealterte Oberflächen, rohe Materialien und unperfekte Formen verleihen Charakter.',
            'Yanzi von Artemide balanciert Tradition und Innovation: Äste aus gebürstetem Messing tragen stilisierte Schwalben mit weißen Glasköpfen, die das Licht bergen.',
          ],
        },
        {
          kind: 'cards',
          title: 'Von der Natur inspiriert',
          subtitle: 'Auswahl organischer Lampen und stimmungsvoller Kompositionen.',
          items: [
            {
              title: 'Chlorophilia',
              description: 'Lichtskulptur von Ross Lovegrove mit Glasblättern.',
              href: '/catalogo?world=design&q=Chlorophilia',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/chloro.jpg',
            },
            {
              title: 'Yanzi',
              description: 'Modulares System mit Glasschwalben und gebürstetem Messing.',
              href: '/catalogo?world=design&q=Yanzi',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/yanzi.jpg',
            },
            {
              title: 'Calipso',
              description: 'Fraktale Geometrie inspiriert von der Mondoberfläche.',
              href: '/catalogo?world=design&q=Calipso',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso-up2.jpg',
            },
            {
              title: 'UOVO',
              description: 'Organische Form aus Blasglas für weiches Licht.',
              href: '/catalogo?world=design&q=Uovo+Artemide',
              imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/uovo.jpg',
            },
          ],
        },
        {
          kind: 'cta',
          title: 'Design-Beleuchtung entdecken',
          primaryLabel: 'Zur Design-Kategorie →',
          primaryHref: '/categoria-prodotto/illuminazione-arredo',
          variant: 'accent',
        },
      ],
      cta: { label: 'Alle Guides →', href: '/guide' },
    },
  },
}
