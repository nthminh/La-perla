
import { ServiceCategory, GalleryItem } from './types';
import { NailPolishIcon, WaxingIcon, EyelashIcon, SunIcon, SparklesIcon, LotusIcon, MustacheIcon, EyeDropperIcon } from './components/Icons';

// --- Configuration ---
export const SALON_EMAIL_ADDRESS = 'nthminh2804@gmail.com,vivian.dinh191@gmail.com,jd@doav.com.au';

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE AFTER DEPLOYMENT
// Example: 'https://script.google.com/macros/s/AKfycbx.../exec'
export const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbz4M4UYlgyt1_0UzJ18HMbXuldwsSsQXyVOVtBBVfRdBSMUZT7Mlpm3Jbr5CCEgxO1e6Q/exec'; 

// PASTE YOUR GOOGLE SHEET EDIT URL HERE
export const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BvTONsBqv7aJT0eOFD2umlxsfMAReX8Q3Gbzd9N_4M8/edit?usp=sharing';

export const STAFF_LIST = [
  "Amy",
  "Angela",
  "Chị Hạnh",
  "Chloe",
  "Ellie",
  "Fiona",
  "Hiền",
  "Ivy",
  "Kaylee",
  "Khuê",
  "Lê",
  "Linh",
  "Mỹ Anh",
  "Phượng",
  "Song",
  "Sue",
  "Tâm",
  "Thai",
  "Tina",
  "Trang",
  "Trang Bé",
  "Vivian",
  "Vy"
];

// --- Pricing Data ---
export const PRICING_DATA: ServiceCategory[] = [
  {
    categoryKey: 'nails',
    icon: NailPolishIcon,
    services: [
        { nameKey: 'manicure', price: '$28' },
        { nameKey: 'spaPedicure', price: '$38' },
        { nameKey: 'manicurePedicure', price: '$55' },
        { nameKey: 'shellacManicure', price: '$40' },
        { nameKey: 'shellacPedicure', price: '$50' },
        { nameKey: 'shellacManiPedi', price: '$85' },
        { nameKey: 'goldPediShellac', price: '$55' },
        { nameKey: 'platPediShellac', price: '$60' },
        { nameKey: 'buffShapeNailsPolish', price: '$25' },
        { nameKey: 'buffShapeToePolish', price: '$30' },
        { nameKey: 'buffShapeNailsShellac', price: '$30' },
        { nameKey: 'buffShapeToesShellac', price: '$35' },
        { nameKey: 'infill', price: 'from $45' },
        { nameKey: 'acrylicFullset', price: 'from $55' },
        { nameKey: 'infillShellac', price: 'from $55' },
        { nameKey: 'acrylicFullsetShellac', price: 'from $65' },
        { nameKey: 'infillBuilderBiab', price: 'from $65' },
        { nameKey: 'fullsetBuilderBiab', price: 'from $85' },
        { nameKey: 'infillOmbre', price: '$75' },
        { nameKey: 'fullsetOmbre', price: '$80' },
        { nameKey: 'fullsetFrench', price: 'from $55' },
        { nameKey: 'overlay', price: '$50' },
        { nameKey: 'acrylicToe', price: 'each $10' },
        { nameKey: 'infillToe', price: '$60' },
        { nameKey: 'acrylicFullsetTones', price: '$70' },
        { nameKey: 'buffShapeSns', price: '$50' },
        { nameKey: 'fullsetSns', price: '$60' },
        { nameKey: 'snsFrench', price: '$60' },
        { nameKey: 'acrylicRemoval', price: '$25' },
        { nameKey: 'repair', price: 'each $8' },
        { nameKey: 'extraLongNails', price: 'from $10' },
    ],
  },
  {
    categoryKey: 'ladiesWaxing',
    icon: LotusIcon,
    services: [
        { nameKey: 'eyebrowsLadies', price: '$17' },
        { nameKey: 'lip', price: '$10' },
        { nameKey: 'chin', price: '$10' },
        { nameKey: 'nose', price: '$10' },
        { nameKey: 'eyebrowsLipsChin', price: '$35' },
        { nameKey: 'faceSides', price: '$20' },
        { nameKey: 'fullFace', price: '$50' },
        { nameKey: 'underarms', price: 'from $20' },
        { nameKey: 'bikiniLine', price: 'from $30' },
        { nameKey: 'gString', price: 'from $35' },
        { nameKey: 'brazillian', price: 'from $55' },
        { nameKey: 'fullLegsLadies', price: 'from $55' },
        { nameKey: 'threeQuarterLegs', price: '$50' },
        { nameKey: 'halfLegsLadies', price: '$35' },
        { nameKey: 'thighs', price: '$35' },
        { nameKey: 'stomachLadies', price: '$25' },
        { nameKey: 'backLadies', price: '$50' },
        { nameKey: 'halfArmsLadies', price: '$28' },
        { nameKey: 'fullArmsLadies', price: 'from $40' },
        { nameKey: 'fullBodyLadies', price: 'Contact us' },
    ],
  },
    {
    categoryKey: 'mensWaxing',
    icon: MustacheIcon,
    services: [
        { nameKey: 'eyebrowsMens', price: '$20' },
        { nameKey: 'chestShoulder', price: 'from $60' },
        { nameKey: 'chestStomach', price: 'from $50' },
        { nameKey: 'menBack', price: 'from $55' },
        { nameKey: 'fullArmsMens', price: 'from $55' },
        { nameKey: 'halfArmsMens', price: '$35' },
        { nameKey: 'fullLegsMens', price: '$65' },
        { nameKey: 'halfLegMens', price: '$45' },
        { nameKey: 'stomachMens', price: '$40' },
        { nameKey: 'fullBodyMens', price: 'Contact us' },
    ],
  },
  {
    categoryKey: 'tinting',
    icon: EyeDropperIcon,
    services: [
        { nameKey: 'eyebrowsTint', price: '$17' },
        { nameKey: 'eyeLashTint', price: '$20' },
    ],
  },
  {
    categoryKey: 'eyelashExtension',
    icon: EyelashIcon,
    services: [
        { nameKey: 'classicEyelash', price: 'from $85' },
        { nameKey: 'infillClassic', price: 'from $70' },
        { nameKey: 'volumeEyelash', price: 'from $110' },
        { nameKey: 'infillVolume', price: 'from $90' },
        { nameKey: 'eyelashPerming', price: 'from $60' },
        { nameKey: 'eyebrowsLuminate', price: '$60' },
    ],
  },
  {
    categoryKey: 'sprayTan',
    icon: SunIcon,
    services: [
        { nameKey: 'fullBodySprayTan', price: '$55' },
        { nameKey: 'halfBodySprayTan', price: '$45' },
    ],
  },
  {
    categoryKey: 'extras',
    icon: SparklesIcon,
    services: [
        { nameKey: 'extraService1', price: '$1' },
        { nameKey: 'extraService2', price: '$2' },
        { nameKey: 'extraService5', price: '$5' },
        { nameKey: 'extraService10', price: '$10' },
    ],
  },
];

// --- Gallery Images ---
// Using embedded SVG placeholders to guarantee they always load.
const createSvgUrl = (svgContent: string) => `data:image/svg+xml;base64,${btoa(svgContent)}`;

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: '1', nameKey: 'blushGoldLines', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F5E0E5"/>
      <line x1="20" y1="0" x2="20" y2="200" stroke="#D4AF37" stroke-width="2"/>
      <line x1="100" y1="0" x2="100" y2="200" stroke="#D4AF37" stroke-width="1.5"/>
      <line x1="180" y1="0" x2="180" y2="200" stroke="#D4AF37" stroke-width="2"/>
      <line x1="0" y1="50" x2="200" y2="50" stroke="#D4AF37" stroke-width="1"/>
      <line x1="0" y1="150" x2="200" y2="150" stroke="#D4AF37" stroke-width="1"/>
    </svg>`)
  },
  {
    id: '2', nameKey: 'roseMarble', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="marble">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
        </filter>
      </defs>
      <rect width="200" height="200" fill="#D8B6C1"/>
      <rect width="200" height="200" fill="#F8F6F2" opacity="0.7" filter="url(#marble)"/>
    </svg>`)
  },
  {
    id: '3', nameKey: 'charcoalGoldFlake', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#333333"/>
      <path d="M50 50 L55 45 L60 55 L52 58 Z" fill="#D4AF37" opacity="0.8"/>
      <path d="M150 140 L153 138 L158 145 L151 149 Z" fill="#D4AF37" opacity="0.9"/>
      <path d="M90 110 L95 112 L92 118 L88 115 Z" fill="#D4AF37" opacity="0.7"/>
      <path d="M120 30 L122 35 L118 33 L117 29 Z" fill="#D4AF37" opacity="0.8"/>
    </svg>`)
  },
  {
    id: '4', nameKey: 'pearlChrome', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pearl" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
          <stop offset="60%" stop-color="#F8F6F2" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#D8B6C1" stop-opacity="0.6"/>
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="#F5E0E5"/>
      <rect width="200" height="200" fill="url(#pearl)"/>
    </svg>`)
  },
  {
    id: '5', nameKey: 'dustyRoseOmbre', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ombre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="20%" stop-color="#D8B6C1"/>
          <stop offset="80%" stop-color="#F5E0E5"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#ombre)"/>
    </svg>`)
  },
  {
    id: '6', nameKey: 'minimalistFrench', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F5E0E5"/>
      <path d="M0 20 C 80 40, 120 40, 200 20 L 200 0 L 0 0 Z" fill="#F8F6F2"/>
      <circle cx="100" cy="80" r="4" fill="#D4AF37"/>
    </svg>`)
  },
  {
    id: '7', nameKey: 'geometricGold', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <path d="M0 0 L 100 200 L 200 0 Z" stroke="#D4AF37" stroke-width="2" fill="none"/>
      <line x1="100" y1="0" x2="100" y2="200" stroke="#D4AF37" stroke-width="1.5"/>
      <line x1="0" y1="100" x2="200" y2="100" stroke="#D4AF37" stroke-width="1"/>
    </svg>`)
  },
  {
    id: '8', nameKey: 'tortoiseshell', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#D4AF37"/>
      <circle cx="50" cy="50" r="40" fill="#333333" opacity="0.5"/>
      <rect x="90" y="100" width="80" height="60" fill="#333333" opacity="0.4" rx="20"/>
      <circle cx="150" cy="70" r="30" fill="#333333" opacity="0.6"/>
      <circle cx="80" cy="150" r="35" fill="#333333" opacity="0.5"/>
    </svg>`)
  },
  {
    id: '9', nameKey: 'floralNegativeSpace', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#D8B6C1"/>
      <circle cx="100" cy="100" r="30" stroke="#F8F6F2" stroke-width="4" fill="none"/>
      <path d="M100 70 A 20 20 0 0 1 120 50" stroke="#F8F6F2" stroke-width="4" fill="none"/>
      <path d="M100 70 A 20 20 0 0 0 80 50" stroke="#F8F6F2" stroke-width="4" fill="none"/>
      <path d="M100 130 A 20 20 0 0 0 120 150" stroke="#F8F6F2" stroke-width="4" fill="none"/>
      <path d="M100 130 A 20 20 0 0 1 80 150" stroke="#F8F6F2" stroke-width="4" fill="none"/>
    </svg>`)
  },
  {
    id: '10', nameKey: 'roseVelvet', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="velvet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#D8B6C1"/>
          <stop offset="50%" stop-color="#F5E0E5" />
          <stop offset="100%" stop-color="#D8B6C1"/>
        </linearGradient>
        <filter id="noiseVelvet">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
        </filter>
      </defs>
      <rect width="200" height="200" fill="url(#velvet)"/>
      <rect width="200" height="200" filter="url(#noiseVelvet)" opacity="0.05"/>
    </svg>`)
  },
  {
    id: '11', nameKey: 'waterDroplets', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="droplet" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="#F5E0E5"/>
      <circle cx="70" cy="80" r="25" fill="url(#droplet)"/>
      <circle cx="140" cy="130" r="20" fill="url(#droplet)"/>
      <ellipse cx="120" cy="50" rx="15" ry="22" fill="url(#droplet)"/>
    </svg>`)
  },
  {
    id: '12', nameKey: 'abstractGoldLeaf', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <path d="M 20,50 Q 50,20 80,60 T 120,50 Q 150,30 180,70 L 170,100 Q 140,120 110,90 T 70,110 Q 40,130 10,90 Z" fill="#D4AF37" opacity="0.9"/>
    </svg>`)
  },
  {
    id: '13', nameKey: 'galaxyNails', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="galaxy" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000033"/>
          <stop offset="70%" stop-color="#330066"/>
          <stop offset="100%" stop-color="#663399"/>
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#galaxy)"/>
      <circle cx="50" cy="50" r="1.5" fill="white"/>
      <circle cx="150" cy="150" r="1" fill="white"/>
      <circle cx="100" cy="80" r="2" fill="white" opacity="0.8"/>
    </svg>`)
  },
  {
    id: '14', nameKey: 'holographicChrome', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff00ff"/>
          <stop offset="25%" stop-color="#00ffff"/>
          <stop offset="50%" stop-color="#ffff00"/>
          <stop offset="75%" stop-color="#ff00ff"/>
          <stop offset="100%" stop-color="#00ffff"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#holo)" opacity="0.7"/>
    </svg>`)
  },
  {
    id: '15', nameKey: 'leopardPrint', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#E6A876"/>
      <circle cx="40" cy="50" r="10" stroke="#333333" stroke-width="4" fill="none"/>
      <path d="M70 80 C 60 90, 80 100, 75 90" stroke="#333333" stroke-width="4" fill="none"/>
      <path d="M120 40 C 130 30, 140 50, 130 50" stroke="#333333" stroke-width="4" fill="none"/>
    </svg>`)
  },
  {
    id: '16', nameKey: 'cowPrint', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <path d="M 30 40 C 10 60, 50 80, 60 50 Z" fill="#333333"/>
      <path d="M 100 120 C 80 150, 140 160, 130 130 Z" fill="#333333"/>
      <ellipse cx="160" cy="70" rx="20" ry="30" fill="#333333"/>
    </svg>`)
  },
  {
    id: '17', nameKey: 'yinYang', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <path d="M100,20 A80,80 0 0,1 100,180 Z" fill="#333333"/>
      <path d="M100,20 A80,80 0 0,0 100,180" fill="none"/>
      <path d="M100,20 A40,40 0 0,1 100,100" fill="#333333"/>
      <path d="M100,100 A40,40 0 0,0 100,180" fill="#F8F6F2"/>
      <circle cx="100" cy="60" r="10" fill="#F8F6F2"/>
      <circle cx="100" cy="140" r="10" fill="#333333"/>
    </svg>`)
  },
  {
    id: '18', nameKey: 'matteGlossyTips', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#333333" />
      <path d="M0 20 C 80 40, 120 40, 200 20 L 200 0 L 0 0 Z" fill="#333333" opacity="0.8"/>
      <path d="M0 15 C 80 35, 120 35, 200 15 L 200 0 L 0 0 Z" fill="white" opacity="0.1"/>
    </svg>`)
  },
  {
    id: '19', nameKey: 'pastelRainbow', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
       <defs>
        <linearGradient id="pastel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffb3ba"/>
          <stop offset="20%" stop-color="#ffdfba"/>
          <stop offset="40%" stop-color="#ffffba"/>
          <stop offset="60%" stop-color="#baffc9"/>
          <stop offset="80%" stop-color="#bae1ff"/>
          <stop offset="100%" stop-color="#f5e0e5"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#pastel)"/>
    </svg>`)
  },
  {
    id: '20', nameKey: 'ginghamPattern', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <rect width="200" height="200" fill="url(#gingham)" />
      <defs>
        <pattern id="gingham" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="20" height="40" fill="#D8B6C1" />
          <rect x="20" width="20" height="40" fill="#F5E0E5" />
          <rect width="40" height="20" fill="#D8B6C1" opacity="0.5"/>
        </pattern>
      </defs>
    </svg>`)
  },
  {
    id: '21', nameKey: 'oceanWaves', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#6699CC"/>
      <path d="M -20 100 Q 30 50, 80 100 T 180 100 T 280 100" stroke="#F8F6F2" stroke-width="5" fill="none"/>
      <path d="M -20 120 Q 30 70, 80 120 T 180 120 T 280 120" stroke="#F8F6F2" stroke-width="3" fill="none" opacity="0.7"/>
    </svg>`)
  },
  {
    id: '22', nameKey: 'abstractFaces', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F5E0E5"/>
      <path d="M 50 150 C 70 50, 130 50, 150 150" stroke="#333333" stroke-width="3" fill="none"/>
      <circle cx="80" cy="90" r="5" fill="#333333"/>
      <path d="M 110 120 Q 120 130, 130 120" stroke="#333333" stroke-width="3" fill="none"/>
    </svg>`)
  },
  {
    id: '23', nameKey: 'fairyDustGlitter', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#D8B6C1"/>
      <circle cx="30" cy="40" r="3" fill="#D4AF37" opacity="0.9"/>
      <circle cx="170" cy="160" r="2" fill="#F8F6F2" opacity="0.8"/>
      <path d="M100 100 l2 2 l-2 2 l-2-2 z" fill="#FFFFFF"/>
    </svg>`)
  },
  {
    id: '24', nameKey: 'stainedGlass', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="none"/>
      <path d="M0 0 L 80 120 L 0 200 Z" fill="#F5E0E5"/>
      <path d="M0 0 L 200 0 L 80 120 Z" fill="#D8B6C1"/>
      <path d="M200 0 L 200 200 L 80 120 Z" fill="#D4AF37" opacity="0.6"/>
      <path d="M0 200 L 200 200 L 80 120 Z" fill="#6699CC" opacity="0.7"/>
      <path d="M0 0 L 80 120 L 200 0 M 80 120 L 200 200 M 80 120 L 0 200" stroke="#333333" stroke-width="2"/>
    </svg>`)
  },
  {
    id: '25', nameKey: 'tieDye', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="tieDyeFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" />
        </filter>
        <radialGradient id="tieDyeGrad">
          <stop offset="0%" stop-color="red" />
          <stop offset="20%" stop-color="yellow" />
          <stop offset="40%" stop-color="lime" />
          <stop offset="60%" stop-color="cyan" />
          <stop offset="80%" stop-color="blue" />
          <stop offset="100%" stop-color="magenta" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#tieDyeGrad)" filter="url(#tieDyeFilter)" />
    </svg>`)
  },
  {
    id: '26', nameKey: 'emeraldGeo', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#006A4E"/>
      <path d="M0 50 L 200 150 L 200 200 L 0 200 Z" fill="#D4AF37" stroke-width="2" />
      <line x1="100" y1="0" x2="100" y2="200" stroke="#F8F6F2" stroke-width="1" />
    </svg>`)
  },
  {
    id: '27', nameKey: 'sapphireShimmer', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sapphire" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0F52BA"/>
          <stop offset="100%" stop-color="#002366"/>
        </linearGradient>
        <filter id="shimmer">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
        </filter>
      </defs>
      <rect width="200" height="200" fill="url(#sapphire)"/>
      <rect width="200" height="200" filter="url(#shimmer)" opacity="0.1" fill="white"/>
    </svg>`)
  },
  {
    id: '28', nameKey: 'rubyGlitter', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#9B111E"/>
      <circle cx="50" cy="50" r="1.5" fill="red"/>
      <circle cx="150" cy="150" r="1" fill="#FFC0CB"/>
      <circle cx="100" cy="80" r="2" fill="white" opacity="0.8"/>
    </svg>`)
  },
  {
    id: '29', nameKey: 'amethystGeode', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#9966CC"/>
      <path d="M 50 50 C 60 20, 140 20, 150 50 L 170 150 C 160 180, 40 180, 30 150 Z" stroke="#D4AF37" stroke-width="3" fill="none"/>
      <path d="M 60 60 C 70 40, 130 40, 140 60 L 155 140 C 150 160, 50 160, 45 140 Z" stroke="white" stroke-width="2" fill="#6A0DAD" opacity="0.5"/>
    </svg>`)
  },
  {
    id: '30', nameKey: 'goldFoilAccent', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <path d="M 150,20 C 100,50 180,150 130,180" fill="#D4AF37" />
    </svg>`)
  },
  {
    id: '31', nameKey: 'silverChromeDrips', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#333333"/>
      <path d="M0,0 H200 V30 C 180,50 160,20 140,40 C 120,60 100,30 80,50 C 60,70 40,40 20,60 C 0,80 0,30 0,30 Z" fill="silver"/>
    </svg>`)
  },
  {
    id: '32', nameKey: 'neonSplatter', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#111111"/>
      <circle cx="50" cy="60" r="15" fill="#39FF14"/>
      <circle cx="140" cy="130" r="20" fill="#FF00FF"/>
      <ellipse cx="100" cy="100" rx="25" ry="10" fill="#00FFFF"/>
    </svg>`)
  },
  {
    id: '33', nameKey: 'checkerboard', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
       <defs>
        <pattern id="checker" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="25" height="25" fill="#333333" />
          <rect x="25" width="25" height="25" fill="#F8F6F2" />
          <rect y="25" width="25" height="25" fill="#F8F6F2" />
          <rect x="25" y="25" width="25" height="25" fill="#333333" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#checker)"/>
    </svg>`)
  },
  {
    id: '34', nameKey: 'autumnLeaves', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F5E0E5"/>
      <path d="M 50 50 L 70 30 L 90 50 L 70 70 Z" fill="#E77D22"/>
      <path d="M 120 100 L 140 80 L 160 100 L 140 120 Z" fill="#D4AF37"/>
      <path d="M 80 150 L 100 130 L 120 150 L 100 170 Z" fill="#9B111E"/>
    </svg>`)
  },
  {
    id: '35', nameKey: 'winterSnowflake', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#6699CC"/>
      <path d="M100 50 V 150 M 50 100 H 150 M 65 65 L 135 135 M 65 135 L 135 65" stroke="white" stroke-width="4"/>
      <circle cx="100" cy="100" r="10" fill="#6699CC" stroke="white" stroke-width="2"/>
    </svg>`)
  },
  {
    id: '36', nameKey: 'cherryBlossoms', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#F8F6F2"/>
      <path d="M 50 80 C 20 150, 150 150, 120 80" stroke="#8B4513" stroke-width="3" fill="none"/>
      <circle cx="120" cy="80" r="10" fill="#FFB7C5"/>
      <circle cx="130" cy="70" r="10" fill="#FFB7C5"/>
      <circle cx="110" cy="70" r="10" fill="#FFB7C5"/>
    </svg>`)
  },
  {
    id: '37', nameKey: 'sunflowerPop', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#6699CC"/>
      <circle cx="100" cy="100" r="50" fill="#FFD700"/>
      <circle cx="100" cy="100" r="20" fill="#8B4513"/>
    </svg>`)
  },
  {
    id: '38', nameKey: 'crocSkinTexture', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#006A4E"/>
      <path d="M0 50 H200 M0 100 H200 M0 150 H200 M50 0 V200 M100 0 V200 M150 0 V200" stroke="black" stroke-width="1" opacity="0.3"/>
    </svg>`)
  },
  {
    id: '39', nameKey: 'cosmicNightSky', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#000033"/>
      <circle cx="30" cy="40" r="2" fill="white"/>
      <circle cx="170" cy="160" r="1.5" fill="white"/>
      <path d="M100 80 l5 10 l-10 -4 h10 l-10 4 z" fill="yellow"/>
    </svg>`)
  },
  {
    id: '40', nameKey: 'bubbleNails3d', src: createSvgUrl(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
       <defs>
        <radialGradient id="bubble" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="white" stop-opacity="0.1"/>
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="#F5E0E5"/>
      <circle cx="100" cy="100" r="50" fill="url(#bubble)"/>
    </svg>`)
  },
  {
    id: '41', nameKey: 'sageGreenMatte', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#8A9A5B"/></svg>`)
  },
  {
    id: '42', nameKey: 'terracottaArt', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#E2725B"/><path d="M 50 150 Q 100 50 150 150" stroke="white" stroke-width="4" fill="none"/></svg>`)
  },
  {
    id: '43', nameKey: 'periwinkleShimmer', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="periwinkle" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#CCCCFF"/><stop offset="100%" stop-color="#9370DB"/></linearGradient><filter id="shimmer2"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" stitchTiles="stitch"/></filter></defs><rect width="200" height="200" fill="url(#periwinkle)"/><rect width="200" height="200" filter="url(#shimmer2)" opacity="0.2" fill="white"/></svg>`)
  },
  {
    id: '44', nameKey: 'lavenderFields', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#E6E6FA"/><circle cx="50" cy="50" r="3" fill="#967BB6"/><circle cx="60" cy="55" r="2" fill="#967BB6"/><circle cx="150" cy="150" r="3" fill="#967BB6"/><circle cx="140" cy="145" r="2" fill="#967BB6"/></svg>`)
  },
  {
    id: '45', nameKey: 'butterYellow', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FDFFD5"/><path d="M20 20 H 180 V 180 H 20 Z" stroke="#333" stroke-width="2" fill="none" stroke-dasharray="10"/></svg>`)
  },
  {
    id: '46', nameKey: 'tangerineDream', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="tangerine" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F9A602"/><stop offset="100%" stop-color="#F28500"/></radialGradient></defs><rect width="200" height="200" fill="url(#tangerine)"/></svg>`)
  },
  {
    id: '47', nameKey: 'mossyGreen', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#8A9A5B"/><rect width="200" height="200" fill="black" opacity="0.1"/></svg>`)
  },
  {
    id: '48', nameKey: 'chocolateSwirl', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><filter id="swirl"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="25" /></filter></defs><rect width="200" height="200" fill="#D2691E"/><rect width="200" height="200" fill="#7B3F00" opacity="0.6" filter="url(#swirl)"/></svg>`)
  },
  {
    id: '49', nameKey: 'greigeMinimalist', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#B2A99D"/><line x1="100" y1="20" x2="100" y2="180" stroke="white" stroke-width="2"/></svg>`)
  },
  {
    id: '50', nameKey: 'nudeWithGlitter', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F5E0E5"/><defs><linearGradient id="glitterGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#D4AF37" stop-opacity="0.8"/><stop offset="40%" stop-color="transparent"/></linearGradient><filter id="glitterNoise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter></defs><rect width="200" height="200" fill="url(#glitterGrad)"/><rect width="200" height="80" y="120" filter="url(#glitterNoise)" opacity="0.2" fill="#D4AF37"/></svg>`)
  },
  {
    id: '51', nameKey: 'scarletRed', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FF2400"/><circle cx="160" cy="40" r="30" fill="white" opacity="0.2"/></svg>`)
  },
  {
    id: '52', nameKey: 'denimBlue', src: createSvgUrl(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#1560BD"/><line x1="0" y1="0" x2="200" y2="200" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="4" opacity="0.5"/><line x1="200" y1="0" x2="0" y2="200" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="4" opacity="0.5"/></svg>`)
  }
];
