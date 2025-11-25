
export interface Translation {
  name: string;
  flag: string;
  headerTitle: string;
  headerSubtitle: string;
  navAiStylist: string;
  navPriceList: string;
  navGallery: string;
  navPortfolio: string;
  navBooking: string;
  navPromotions: string;
  footerText: string;
  stylistTitle: string;
  stylistSubtitle: string;
  uploadPhotoButton: string;
  useCameraButton: string;
  creatingTitle: string;
  creatingSubtitle: string;
  yourPhotoTitle: string;
  aiSuggestionTitle: string;
  tryAnotherPhotoButton: string;
  downloadButton: string;
  errorTitle: string;
  tryAgainButton: string;
  pricingTitle: string;
  galleryTitle: string;
  gallerySubtitle: string;
  addToBill: string;
  viewBill: string;
  total: string;
  subtotal: string;
  discountLabel: string;
  billTitle: string;
  billDate: string;
  item: string;
  qty: string;
  price: string;
  downloadBill: string;
  completePayment: string;
  showToCashier: string;
  languageSelectTitle: string;
  serviceCategories: Record<string, string>;
  serviceNames: Record<string, string>;
  galleryImageNames: Record<string, string>;
  customPromptLabel: string;
  customPromptPlaceholder: string;
  dailyLimitReachedTitle: string;
  dailyLimitReachedSubtitle: string;
  generationsRemaining: string;
  portfolioTitle: string;
  portfolioSubtitle: string;
  portfolioButtonText: string;
  portfolioButtonTextGoogle: string;
  bookingTitle: string;
  bookingSubtitle: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  selectServices: string;
  selectDate: string;
  selectTime: string;
  yourName: string;
  yourPhone: string;
  specialRequests: string;
  specialRequestsPlaceholder: string;
  nextStepButton: string;
  prevStepButton: string;
  requestBookingButton: string;
  fieldRequired: string;
  timeMorning: string;
  timeAfternoon: string;
  timeEvening: string;
  bookingSuccessTitle: string;
  bookingSuccessMessage: string;
  bookAnother: string;
  aiAssist: string;
  aiAssistLoading: string;
  tryThisStyleButton: string;
  promoTitle: string;
  promoSubtitle: string;
  promoOffer1Title: string;
  promoOffer1Desc: string;
  promoSpend: string;
  promoReceive: string;
  promoValue: string;
  promoGift: string;
  promoActNow: string;
  promoSaleDates: string;
  promoSalePeriod: string;
  promoPurchaseAt: string;
  promoPurchaseLocation: string;
  promoOffer2Title: string;
  promoOffer2Desc: string;
  promoUpgrade1: string;
  promoUpgrade2: string;
  promoUpgrade3: string;
  promoUpgrade4: string;
  promoOffer2Closing: string;
  promoContactTitle: string;
  promoSalonName: string;
  promoAddressLabel: string;
  promoAddressValue: string;
  promoPhoneLabel: string;
  promoPhonePurpose: string;
  promoVoucherHotlineLabel: string;
  promoVoucherHotlinePurpose: string;
  promoEmailVoucherTitle: string;
  promoEmailVoucherDesc: string;
  promoEmailVoucherButton: string;
  adminLogin: string;
  enterPin: string;
  dashboard: string;
  wrongPin: string;
  monthlyRevenue: string;
  dailyRevenue: string;
  totalOrders: string;
  topServices: string;
  recentTransactions: string;
  revenueChartTitle: string;
  noData: string;
  logout: string;
  cancelButton: string;
  transactionSaved: string;
  emailSentSuccess: string;
  viewGoogleSheet: string;
  refreshData: string;
  loadingData: string;
  sourceGoogleSheets: string;
  filterDateRange: string;
  startDate: string;
  endDate: string;
  applyFilter: string;
  vsPrevious: string;
  revenue: string;
  orders: string;
}

const baseTranslations: Omit<Translation, 'name' | 'flag'> = {
  headerTitle: "La Perla Nail AI Stylist",
  headerSubtitle: "Visualise your perfect nail art before you book.",
  navAiStylist: "AI Stylist",
  navPriceList: "Price List",
  navGallery: "Gallery",
  navPortfolio: "Portfolio",
  navBooking: "Booking",
  navPromotions: "Promotions",
  footerText: "© {year} La Perla Nails & Beauty. Powered by AI.",
  stylistTitle: "Design Your Dream Nails",
  stylistSubtitle: "Upload a photo of your hand, and our AI will create a stunning, personalized nail art design just for you. Or use your camera to take a photo now.",
  uploadPhotoButton: "Upload Photo",
  useCameraButton: "Take Photo",
  creatingTitle: "Creating Magic...",
  creatingSubtitle: "Please wait while our AI paints your nails. This might take a few seconds.",
  yourPhotoTitle: "Your Hand",
  aiSuggestionTitle: "La Perla Style",
  tryAnotherPhotoButton: "Try Another Photo",
  downloadButton: "Download Image",
  errorTitle: "Oops!",
  tryAgainButton: "Try Again",
  pricingTitle: "Our Services & Pricing",
  galleryTitle: "Inspiration Gallery",
  gallerySubtitle: "Browse our curated collection of styles. Click on any image to try it on your own hand using our AI Stylist!",
  addToBill: "Add",
  viewBill: "View Bill",
  total: "Total",
  subtotal: "Subtotal",
  discountLabel: "Discount",
  billTitle: "Your Bill",
  billDate: "Date",
  item: "Item",
  qty: "Qty",
  price: "Price",
  downloadBill: "Download Receipt",
  completePayment: "Complete Payment",
  showToCashier: "Please show this screen to the cashier.",
  languageSelectTitle: "Select Language",
  customPromptLabel: "Have a specific idea? (Optional)",
  customPromptPlaceholder: "e.g., red and gold christmas theme...",
  dailyLimitReachedTitle: "Daily Limit Reached",
  dailyLimitReachedSubtitle: "You have used all your free designs for today. Please come back tomorrow!",
  generationsRemaining: "You have {count} free designs remaining today.",
  portfolioTitle: "Real Work, Real Beauty",
  portfolioSubtitle: "Explore our latest masterpieces created by our talented technicians on Facebook and Google Photos.",
  portfolioButtonText: "View Portfolio on Facebook",
  portfolioButtonTextGoogle: "View Google Photos Album",
  bookingTitle: "Book Your Appointment",
  bookingSubtitle: "Ready to shine? Select your services and preferred time.",
  step1Title: "1. Select Services",
  step2Title: "2. Date & Time",
  step3Title: "3. Your Details",
  selectServices: "Please select at least one service.",
  selectDate: "Please select a date.",
  selectTime: "Please select a time slot.",
  yourName: "Your Name",
  yourPhone: "Phone Number",
  specialRequests: "Special Requests / Notes",
  specialRequestsPlaceholder: "Any specific designs or allergies...",
  nextStepButton: "Next Step",
  prevStepButton: "Back",
  requestBookingButton: "Send Booking Request",
  fieldRequired: "This field is required.",
  timeMorning: "Morning (9am - 12pm)",
  timeAfternoon: "Afternoon (12pm - 4pm)",
  timeEvening: "Evening (4pm - 7pm)",
  bookingSuccessTitle: "Request Sent!",
  bookingSuccessMessage: "We have received your booking request. We will contact you at {phone} shortly to confirm.",
  bookAnother: "Book Another",
  aiAssist: "Write with AI",
  aiAssistLoading: "Writing...",
  tryThisStyleButton: "Try this style",
  promoTitle: "Current Promotions",
  promoSubtitle: "Exclusive Offers for You",
  promoOffer1Title: "GIFT VOUCHERS SALE",
  promoOffer1Desc: "Get more value for your money with our special gift voucher sale! <br/> Perfect for gifts or treating yourself.",
  promoSpend: "Spend",
  promoReceive: "Receive",
  promoValue: "Value",
  promoGift: "Includes a free gift!",
  promoActNow: "Act Now!",
  promoSaleDates: "Sale ends:",
  promoSalePeriod: "25th December 2025",
  promoPurchaseAt: "Purchase at:",
  promoPurchaseLocation: "In-store or call",
  promoOffer2Title: "FREE SERVICE UPGRADE",
  promoOffer2Desc: "For the price of a regular <strong>Shellac Pedicure</strong> & get the following for <strong>FREE</strong>:",
  promoUpgrade1: "Nourishing foot mask",
  promoUpgrade2: "Deep exfoliation scrub",
  promoUpgrade3: "Extended massage",
  promoUpgrade4: "Muscle Relaxation with Himalayan Salt",
  promoOffer2Closing: "Treat your feet to the luxury they deserve!",
  promoContactTitle: "Visit Us",
  promoSalonName: "La Perla Nails and Beauty",
  promoAddressLabel: "<strong>Address:</strong>",
  promoAddressValue: "Shop 10/260 Jersey Rd, Plumpton NSW 2761 <br/> (HomeCo. Plumpton Marketplace)",
  promoPhoneLabel: "<strong>Phone:</strong>",
  promoPhonePurpose: "(Bookings)",
  promoVoucherHotlineLabel: "<strong>Voucher Hotline:</strong>",
  promoVoucherHotlinePurpose: "",
  promoEmailVoucherTitle: "Get Your Voucher Online",
  promoEmailVoucherDesc: "Prefer to buy online? Fill out our simple form and we'll email your voucher directly to you.",
  promoEmailVoucherButton: "Order Voucher Online",
  adminLogin: "Admin Access",
  enterPin: "Enter PIN",
  dashboard: "Dashboard",
  wrongPin: "Incorrect PIN",
  monthlyRevenue: "Monthly Revenue",
  dailyRevenue: "Today's Revenue",
  totalOrders: "Total Orders",
  topServices: "Top Services",
  recentTransactions: "Recent Transactions",
  revenueChartTitle: "Revenue Over Time",
  noData: "No data available yet.",
  logout: "Exit Admin",
  cancelButton: "Cancel",
  transactionSaved: "Order saved to system successfully!",
  emailSentSuccess: "Email sent successfully!",
  viewGoogleSheet: "View Google Sheet",
  refreshData: "Refresh Data",
  loadingData: "Loading data from Google Sheets...",
  sourceGoogleSheets: "Live Data: Google Sheets",
  filterDateRange: "Date Range",
  startDate: "Start Date",
  endDate: "End Date",
  applyFilter: "Apply Filter",
  vsPrevious: "vs previous period",
  revenue: "Revenue",
  orders: "Orders",
  serviceCategories: {
    nails: "Nails",
    ladiesWaxing: "Ladies Waxing",
    mensWaxing: "Men's Waxing",
    tinting: "Tinting",
    eyelashExtension: "Eyelash Extensions",
    sprayTan: "Spray Tan",
    extras: "Extras"
  },
  serviceNames: {
    manicure: "Manicure",
    spaPedicure: "Spa Pedicure",
    manicurePedicure: "Manicure & Pedicure",
    shellacManicure: "Shellac Manicure",
    shellacPedicure: "Shellac Pedicure",
    shellacManiPedi: "Shellac Mani & Pedi",
    goldPediShellac: "Gold Spa Pedicure + Shellac",
    platPediShellac: "Platinum Spa Pedicure + Shellac",
    buffShapeNailsPolish: "Buff, Shape & Polish (Nails)",
    buffShapeToePolish: "Buff, Shape & Polish (Toes)",
    buffShapeNailsShellac: "Buff, Shape & Shellac (Nails)",
    buffShapeToesShellac: "Buff, Shape & Shellac (Toes)",
    infill: "Infill",
    acrylicFullset: "Acrylic Fullset",
    infillShellac: "Infill + Shellac",
    acrylicFullsetShellac: "Acrylic Fullset + Shellac",
    infillBuilderBiab: "Infill Builder Gel/BIAB",
    fullsetBuilderBiab: "Fullset Builder Gel/BIAB",
    infillOmbre: "Infill Ombre",
    fullsetOmbre: "Fullset Ombre",
    fullsetFrench: "Fullset French Tip",
    overlay: "Overlay",
    acrylicToe: "Acrylic Toe Correction",
    infillToe: "Infill (Toes)",
    acrylicFullsetTones: "Acrylic Fullset (Tones)",
    buffShapeSns: "Buff, Shape & SNS",
    fullsetSns: "Fullset SNS",
    snsFrench: "SNS French",
    acrylicRemoval: "Acrylic Removal",
    repair: "Nail Repair",
    extraLongNails: "Extra Long Nails Add-on",
    eyebrowsLadies: "Eyebrows",
    lip: "Lip",
    chin: "Chin",
    nose: "Nose",
    eyebrowsLipsChin: "Eyebrows, Lips & Chin",
    faceSides: "Sides of Face",
    fullFace: "Full Face",
    underarms: "Underarms",
    bikiniLine: "Bikini Line",
    gString: "G-String",
    brazillian: "Brazilian",
    fullLegsLadies: "Full Legs",
    threeQuarterLegs: "3/4 Legs",
    halfLegsLadies: "Half Legs",
    thighs: "Thighs",
    stomachLadies: "Stomach",
    backLadies: "Back",
    halfArmsLadies: "Half Arms",
    fullArmsLadies: "Full Arms",
    fullBodyLadies: "Full Body",
    eyebrowsMens: "Eyebrows",
    chestShoulder: "Chest & Shoulder",
    chestStomach: "Chest & Stomach",
    menBack: "Back",
    fullArmsMens: "Full Arms",
    halfArmsMens: "Half Arms",
    fullLegsMens: "Full Legs",
    halfLegMens: "Half Legs",
    stomachMens: "Stomach",
    fullBodyMens: "Full Body",
    eyebrowsTint: "Eyebrow Tint",
    eyeLashTint: "Eyelash Tint",
    classicEyelash: "Classic Set",
    infillClassic: "Infill Classic",
    volumeEyelash: "Volume Set",
    infillVolume: "Infill Volume",
    eyelashPerming: "Eyelash Lift/Perming",
    eyebrowsLuminate: "Eyebrow Lamination",
    fullBodySprayTan: "Full Body Spray Tan",
    halfBodySprayTan: "Half Body Spray Tan",
    extraService1: "Add-on $1",
    extraService2: "Add-on $2",
    extraService5: "Add-on $5",
    extraService10: "Add-on $10"
  },
  galleryImageNames: {
    blushGoldLines: "Blush & Gold Lines",
    roseMarble: "Rose Quartz Marble",
    charcoalGoldFlake: "Charcoal & Gold Flake",
    pearlChrome: "Pearl Chrome",
    dustyRoseOmbre: "Dusty Rose Ombre",
    minimalistFrench: "Minimalist French",
    geometricGold: "Geometric Gold",
    tortoiseshell: "Tortoiseshell",
    floralNegativeSpace: "Floral Negative Space",
    roseVelvet: "Rose Velvet Cat Eye",
    waterDroplets: "Water Droplets",
    abstractGoldLeaf: "Abstract Gold Leaf",
    galaxyNails: "Galaxy Night",
    holographicChrome: "Holographic Chrome",
    leopardPrint: "Leopard Print",
    cowPrint: "Cow Print",
    yinYang: "Yin Yang",
    matteGlossyTips: "Matte Black & Glossy Tips",
    pastelRainbow: "Pastel Rainbow",
    ginghamPattern: "Pink Gingham",
    oceanWaves: "Ocean Waves",
    abstractFaces: "Abstract Faces",
    fairyDustGlitter: "Fairy Dust Glitter",
    stainedGlass: "Stained Glass",
    tieDye: "Tie Dye Swirl",
    emeraldGeo: "Emerald Geometric",
    sapphireShimmer: "Sapphire Shimmer",
    rubyGlitter: "Ruby Slippers",
    amethystGeode: "Amethyst Geode",
    goldFoilAccent: "Gold Foil Accent",
    silverChromeDrips: "Silver Chrome Drips",
    neonSplatter: "Neon Splatter 90s",
    checkerboard: "Checkerboard",
    autumnLeaves: "Autumn Leaves",
    winterSnowflake: "Winter Snowflake",
    cherryBlossoms: "Cherry Blossoms",
    sunflowerPop: "Sunflower Pop",
    crocSkinTexture: "Croc Skin Texture",
    cosmicNightSky: "Cosmic Night Sky",
    bubbleNails3d: "3D Bubble Nails",
    sageGreenMatte: "Sage Green Matte",
    terracottaArt: "Terracotta Art",
    periwinkleShimmer: "Periwinkle Shimmer",
    lavenderFields: "Lavender Fields",
    butterYellow: "Butter Yellow",
    tangerineDream: "Tangerine Dream",
    mossyGreen: "Mossy Green",
    chocolateSwirl: "Chocolate Swirl",
    greigeMinimalist: "Greige Minimalist",
    nudeWithGlitter: "Nude with Glitter Fade",
    scarletRed: "Scarlet Red",
    denimBlue: "Denim Blue"
  }
};

export const TRANSLATIONS: Record<string, Translation> = {
  en: { ...baseTranslations, name: 'English', flag: '🇬🇧' },
};
