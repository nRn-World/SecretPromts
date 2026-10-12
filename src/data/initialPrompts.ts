export interface PromptVariable {
  name: string;
  defaultValue: string;
  description: string;
}

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  promptText: string;
  negativePrompt?: string;
  model: string;
  category: string;
  tags: string[];
  imageUrl: string;
  images?: string[];
  aspectRatio: string;
  seed?: string;
  createdAt: string;
  isCustom?: boolean;
  isFavorite?: boolean;
  isLiked?: boolean;
  likesCount?: number;
  likedBy?: string[];
  viewCount?: number;
  copyCount?: number;
  favoritesCount?: number;
  variables?: PromptVariable[];
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
}

export const INITIAL_PROMPTS: PromptItem[] = [
  {
    id: 'prompt-1',
    title: 'Cinematisk Cyberpunk Porträtt',
    description: 'Ett hyperrealistiskt porträtt med dramatisk neonbelysning och intrikata futuristiska detaljer. Perfekt för karaktärsdesign och konceptkonst.',
    promptText: 'A hyper-realistic cinematic portrait of a [kön] in a neon-lit cyberpunk city, wearing [klädsel], intense rim lighting, reflections in eyes, 85mm lens, f/1.4, highly detailed skin texture, moody atmosphere, Volumetric fog, unreal engine 5 render --ar 4:5 --style raw --v 6.0',
    negativePrompt: 'cartoon, 3d, un realistic, bad eyes, blurry, low resolution, overexposed, bad anatomy',
    model: 'Midjourney',
    category: 'Porträtt',
    tags: ['Cyberpunk', 'Porträtt', 'Neon', 'Cinematisk', 'Hyperrealism'],
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '4:5',
    seed: '48291048',
    createdAt: '2026-02-10',
    variables: [
      { name: 'kön', defaultValue: 'mysterious hacker woman', description: 'Karaktärens typ eller kön' },
      { name: 'klädsel', defaultValue: 'an iridescent tech-jacket', description: 'Kläder och stil' }
    ],
    authorId: 'user-mock-1',
    authorName: 'Neon Creator',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-2',
    title: 'Minimalistisk Skandinavisk Villa',
    description: 'Arkitektonisk visualisering av ett modernt hem i naturen med naturligt ljus och rena linjer.',
    promptText: 'Architectural photography of a minimalist Scandinavian luxury villa nestled in a [omgivning], large glass facades, warm interior lighting, concrete and raw oak wood materials, golden hour sunlight filtering through trees, photorealistic, shot on Hasselblad, 24mm lens --ar 16:9 --v 6.0',
    negativePrompt: 'distorted lines, fake lighting, over-saturated, people, cars, modern clutter',
    model: 'Midjourney',
    category: 'Arkitektur',
    tags: ['Arkitektur', 'Skandinavisk', 'Minimalism', 'Lyx', 'Exteriör'],
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '16:9',
    seed: '91283012',
    createdAt: '2026-02-08',
    variables: [
      { name: 'omgivning', defaultValue: 'serene pine forest', description: 'Miljön runt huset' }
    ],
    authorId: 'user-mock-2',
    authorName: 'Architect AI',
    authorPhotoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-3',
    title: 'Magisk Glödande Fantasiskog',
    description: 'En fängslande och drömsk miljö fylld med bioluminescerande växter och mystiska ljussken.',
    promptText: 'An enchanting fantasy forest at night, filled with bioluminescent [växttyp] and glowing ethereal particles, a narrow winding cobblestone path, deep mystical atmosphere, vibrant colors of cyan and deep purple, fantasy concept art, octane render, 8k resolution',
    negativePrompt: 'dark, uninspired, low contrast, simple, flat lighting',
    model: 'DALL-E',
    category: 'Fantasy & Sci-Fi',
    tags: ['Fantasy', 'Natur', 'Magisk', 'Konceptkonst', 'Belysning'],
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '1:1',
    createdAt: '2026-02-05',
    variables: [
      { name: 'växttyp', defaultValue: 'giant crystal mushrooms', description: 'Typ av glödande växter' }
    ],
    authorId: 'user-mock-3',
    authorName: 'Pixel Master',
    authorPhotoURL: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-4',
    title: 'Sleek Vektor Tech Logotyp',
    description: 'Modern och ren logotypdesign för startups och teknikföretag. Skalbar och minimalistisk.',
    promptText: 'A sleek minimalist vector logo for an advanced AI tech company named "[företagsnamn]", featuring an abstract geometric [symbol], sharp clean lines, gradient [färger] colors, flat white background, modern corporate identity, professional vector art, no text, simple curves',
    negativePrompt: 'complex, 3d effects, drop shadows, low quality, text, letters, watermarks',
    model: 'Ideogram',
    category: 'Logotyper & Ikoner',
    tags: ['Logotyp', 'Vektor', 'Tech', 'Branding', 'Minimalism'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '1:1',
    createdAt: '2026-02-01',
    variables: [
      { name: 'företagsnamn', defaultValue: 'Nexus', description: 'Företagets namn' },
      { name: 'symbol', defaultValue: 'infinity loop combined with a data stream', description: 'Huvudsymbolen i logotypen' },
      { name: 'färger', defaultValue: 'electric blue and vibrant violet', description: 'Färgtema' }
    ],
    authorId: 'user-mock-1',
    authorName: 'Neon Creator',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-5',
    title: 'SaaS Dashboard UI & Webdesign',
    description: 'Professionell och ren gränssnittsdesign för webbapplikationer. Perfekt som inspiration för utvecklare.',
    promptText: 'A high-end UI/UX design of a modern SaaS analytics web dashboard, light mode with dark sidebar, stunning glassmorphism elements, clean sans-serif typography, elegant charts and data visualisations, accent colors of [accentfärg], hyper-detailed, Dribbble style, Behance winner --ar 16:9',
    negativePrompt: 'cluttered, confusing, outdated, windows 95, skeumorphism, blurry text',
    model: 'Leonardo AI',
    category: 'Webb & UI',
    tags: ['UI/UX', 'Webbdesign', 'Dashboard', 'SaaS', 'Figma'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '16:9',
    createdAt: '2026-01-28',
    variables: [
      { name: 'accentfärg', defaultValue: 'indigo and emerald green', description: 'Färg för knappar och grafer' }
    ],
    authorId: 'user-mock-2',
    authorName: 'Architect AI',
    authorPhotoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-6',
    title: 'Gullig 3D Pixar-stil Karaktär',
    description: 'En otroligt söt och uttrycksfull 3D-karaktär med mjuka texturer och fantastiskt ljus.',
    promptText: 'A ridiculously cute 3D animated character of a [djur] wearing a tiny [accessoar], big expressive glossy eyes, soft lighting, Pixar animation studio style, highly detailed fur texture, cozy simple studio background, 3d render, cinematic lighting --ar 1:1',
    negativePrompt: 'scary, realistic, deformed, multiple limbs, low poly, 2d',
    model: 'DALL-E',
    category: '3D & Anime',
    tags: ['Pixar', '3D', 'Karaktär', 'Gullig', 'Animation'],
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '1:1',
    createdAt: '2026-01-20',
    variables: [
      { name: 'djur', defaultValue: 'fluffy baby red panda', description: 'Vilket djur eller varelse' },
      { name: 'accessoar', defaultValue: 'yellow knitted beanie', description: 'Klädesplagg eller sak' }
    ],
    authorId: 'user-mock-3',
    authorName: 'Pixel Master',
    authorPhotoURL: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-7',
    title: 'Episkt Berglandskap vid Solnedgång',
    description: 'Hisnande naturvy med dramatiska moln och gyllene solstrålar som träffar bergstopparna.',
    promptText: 'A breathtaking wide-angle landscape photograph of majestic jagged mountain peaks at golden hour, a crystal clear mirror lake in the foreground reflecting the fiery sky, dramatic clouds, crisp sharp details, shot on Canon EOS R5, 16mm lens, award-winning nature photography --ar 16:9 --style raw',
    negativePrompt: 'blurry, over-edited, unnatural colors, artificial lights, text',
    model: 'Midjourney',
    category: 'Landskap & Natur',
    tags: ['Landskap', 'Natur', 'Berg', 'Solnedgång', 'Fotografi'],
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '16:9',
    seed: '10293847',
    createdAt: '2026-01-15',
    authorId: 'user-mock-1',
    authorName: 'Neon Creator',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-8',
    title: 'Abstrakt Flytande Guld & Svart',
    description: 'Exklusiv och sofistikerad abstrakt konst. Perfekt som bakgrund för lyxvarumärken och presentationer.',
    promptText: 'Abstract luxury wallpaper featuring swirling liquid black silk and molten gold metallic veins, rich deep textures, hyper-detailed dynamic fluid motion, elegant dynamic lighting, 8k resolution, sleek modern aesthetic --ar 16:9',
    negativePrompt: 'pixelated, rough, static, boring, matte, noisy',
    model: 'Stable Diffusion',
    category: 'Fantasy & Sci-Fi',
    tags: ['Abstrakt', 'Guld', 'Lyx', 'Bakgrund', 'Textur'],
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '16:9',
    createdAt: '2026-01-10',
    authorId: 'user-mock-3',
    authorName: 'Pixel Master',
    authorPhotoURL: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'prompt-9',
    title: 'Lyxig Interiör i Modern Våning',
    description: 'Inredningsdesign av ett elegant vardagsrum med exklusiva möbler och dämpad stämningsbelysning.',
    promptText: 'Interior design photography of an ultra-luxury modern living room, high ceilings, custom designer furniture, dark charcoal accent walls, ambient soft warm LED cove lighting, marble floors, panoramic window overlooking a city skyline at dusk, photorealistic --ar 16:9',
    negativePrompt: 'messy, cheap furniture, harsh lighting, daylight, small space',
    model: 'Midjourney',
    category: 'Arkitektur',
    tags: ['Inredning', 'Interiör', 'Lyx', 'Vardagsrum', 'Design'],
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
    aspectRatio: '16:9',
    createdAt: '2026-01-05',
    authorId: 'user-mock-2',
    authorName: 'Architect AI',
    authorPhotoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80'
  }
];

export const MODELS = [
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
  'Leonardo AI',
  'Ideogram',
  'Kling AI',
  'Gemini',
  'ChatGPT',
  'Qwen',
  'Nano Banana'
];

export const CATEGORIES = [
  'Alla',
  'Landskap & Natur',
  'Arkitektur',
  'Logotyper & Ikoner',
  'Fantasy & Sci-Fi',
  'Webb & UI',
  '3D & Anime',
  'Sport',
  'Digital Art',
  'Illustration',
  'Konceptkonst',
  'Mat & Dryck',
  'Mode & Kläder',
  'Produktdesign',
  'Abstrakt',
  'Cyberpunk',
  'Steampunk'
] as const;
