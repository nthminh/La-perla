
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
  navTeam: string;
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
  filterByDiscount: string;
  allDiscounts: string;
  noDiscount: string;
  withDiscount: string;
  kioskWelcome: string;
  kioskSubtitle: string;
  kioskNameLabel: string;
  kioskPhoneLabel: string;
  kioskReturnTimeLabel: string;
  kioskReturnTimePlaceholder: string;
  kioskJoinButton: string;
  kioskSuccessTitle: string;
  kioskSuccessMessage: string;
  smsTemplateReady: string;
  smsTemplateSoon: string;
  enterKioskMode: string;
  exitKioskMode: string;
  kioskMarqueeMessage: string;
  kioskPhoneError: string;
  kioskNameError: string;
  kioskServiceError: string;
  // Payroll Feature
  payrollTitle: string;
  payrollSubtitle: string;
  payrollSelectMonth: string;
  payrollRecalculate: string;
  payrollStaff: string;
  payrollDaysWorked: string;
  payrollRevenue: string;
  payrollBonus: string;
  payrollAdjustment: string;
  payrollTotal: string;
  payrollExportCSV: string;
  payrollPrintAll: string;
  payrollViewDetails: string;
  payrollDetailTitle: string;
  payrollBaseSalary: string;
  payrollDailyRate: string;
  payrollTarget: string;
  payrollAboveTarget: string;
  payrollBonusRate: string;
  payrollSubtotal: string;
  payrollAdjustmentNote: string;
  payrollAdjustmentPlaceholder: string;
  payrollFinalTotal: string;
  payrollPrintPayslip: string;
  payrollClose: string;
  payrollNoData: string;
  payrollTotalPayrollCost: string;
  payrollMonth: string;
  payrollYear: string;
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
  navTeam: "Our Team",
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
  promoOffer1Desc: "Buy more, get more! Perfect for gifts or treating yourself.",
  promoSpend: "Spend",
  promoReceive: "Receive",
  promoValue: "Value",
  promoGift: "Gift",
  promoActNow: "Act Now!",
  promoSaleDates: "Sale Dates:",
  promoSalePeriod: "15/12/2024 - 31/12/2024",
  promoPurchaseAt: "Purchase at:",
  promoPurchaseLocation: "In-store at La Perla Nails & Beauty",
  promoOffer2Title: "FREE UPGRADE",
  promoOffer2Desc: "Get a <b>Free Upgrade to Shellac</b> on Toes when you book a Pedicure + Manicure package!",
  promoUpgrade1: "Pedicure & Manicure (Regular Polish) - $55",
  promoUpgrade2: "Upgrade to Shellac on Toes (Normally +$15)",
  promoUpgrade3: "Total Value: $70",
  promoUpgrade4: "<b>You Pay: $55</b>",
  promoOffer2Closing: "Limited time offer. Book today!",
  promoContactTitle: "Visit Us",
  promoSalonName: "La Perla Nails & Beauty",
  promoAddressLabel: "Address:",
  promoAddressValue: "Shop 10/260 Jersey Rd, Plumpton NSW 2761",
  promoPhoneLabel: "Phone:",
  promoPhonePurpose: "(Bookings)",
  promoVoucherHotlineLabel: "Voucher Hotline:",
  promoVoucherHotlinePurpose: "(Order Vouchers)",
  promoEmailVoucherTitle: "Order Vouchers Online",
  promoEmailVoucherDesc: "Can't make it to the salon? Order your gift vouchers online and we'll email them to you!",
  promoEmailVoucherButton: "Order Vouchers",
  adminLogin: "Admin Login",
  enterPin: "Enter PIN",
  dashboard: "Dashboard",
  wrongPin: "Incorrect PIN",
  monthlyRevenue: "Monthly Revenue",
  dailyRevenue: "Daily Revenue",
  totalOrders: "Total Orders",
  topServices: "Top Services",
  recentTransactions: "Recent Transactions",
  revenueChartTitle: "Revenue Overview",
  noData: "No data available",
  logout: "Logout",
  cancelButton: "Cancel",
  transactionSaved: "Transaction saved!",
  emailSentSuccess: "Email sent successfully!",
  viewGoogleSheet: "View Google Sheet",
  refreshData: "Refresh Data",
  loadingData: "Loading...",
  sourceGoogleSheets: "Source: Google Sheets",
  filterDateRange: "Filter Date Range",
  startDate: "Start Date",
  endDate: "End Date",
  applyFilter: "Apply",
  vsPrevious: "vs previous period",
  revenue: "Revenue",
  orders: "Orders",
  filterByDiscount: "Filter by Discount",
  allDiscounts: "All Orders",
  noDiscount: "No Discount (0%)",
  withDiscount: "With Discount",
  kioskWelcome: "Welcome to La Perla",
  kioskSubtitle: "Please join our waitlist",
  kioskNameLabel: "Your Name",
  kioskPhoneLabel: "Phone Number",
  kioskReturnTimeLabel: "Estimated Return Time (Optional)",
  kioskReturnTimePlaceholder: "e.g. 10 mins, 2:30 PM",
  kioskJoinButton: "Join Waitlist",
  kioskSuccessTitle: "You're on the list!",
  kioskSuccessMessage: "Thanks {name}! We'll text you when we're ready.",
  smsTemplateReady: "Hi {name}, La Perla is ready for you! Please come back to the salon now. Thanks!",
  smsTemplateSoon: "Hi {name}, La Perla will be ready for you in about 5-10 mins. Please make your way back. Thanks!",
  enterKioskMode: "Enter Kiosk Mode",
  exitKioskMode: "Exit Kiosk",
  kioskMarqueeMessage: "💎 Join our 1-year Membership to choose ANY color you like without paying extra! 💎 Join our Yearly Membership to choose ANY color you like without extra cost! 💎",
  kioskPhoneError: "Please enter a valid phone number (8-15 digits)",
  kioskNameError: "Please enter a valid name (at least 2 characters)",
  kioskServiceError: "Please select at least one service",
  // Payroll Feature Translations (English primary, Vietnamese secondary)
  payrollTitle: "Employee Payroll",
  payrollSubtitle: "Calculate and manage staff salaries",
  payrollSelectMonth: "Select Month",
  payrollRecalculate: "Recalculate",
  payrollStaff: "Staff",
  payrollDaysWorked: "Days Worked",
  payrollRevenue: "Revenue",
  payrollBonus: "Bonus",
  payrollAdjustment: "Adjustment",
  payrollTotal: "Total",
  payrollExportCSV: "Export CSV",
  payrollPrintAll: "Print All Payslips",
  payrollViewDetails: "View Details",
  payrollDetailTitle: "Payroll Detail",
  payrollBaseSalary: "Base Salary",
  payrollDailyRate: "Daily Rate",
  payrollTarget: "Target",
  payrollAboveTarget: "Above Target",
  payrollBonusRate: "Bonus Rate",
  payrollSubtotal: "Subtotal",
  payrollAdjustmentNote: "Adjustment Note",
  payrollAdjustmentPlaceholder: "e.g., Performance bonus, deduction reason...",
  payrollFinalTotal: "Final Total",
  payrollPrintPayslip: "Print Payslip",
  payrollClose: "Close",
  payrollNoData: "No payroll data available for this month",
  payrollTotalPayrollCost: "Total Payroll Cost",
  payrollMonth: "Month",
  payrollYear: "Year",
  serviceCategories: {
    nails: "Nails",
    ladiesWaxing: "Ladies Waxing",
    mensWaxing: "Mens Waxing",
    tinting: "Tinting",
    eyelashExtension: "Eyelash Extension",
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
    goldPediShellac: "Gold Pedi + Shellac",
    platPediShellac: "Plat Pedi + Shellac",
    buffShapeNailsPolish: "Buff, Shape Nails & Polish",
    buffShapeToePolish: "Buff, Shape Toes & Polish",
    buffShapeNailsShellac: "Buff, Shape Nails & Shellac",
    buffShapeToesShellac: "Buff, Shape Toes & Shellac",
    infill: "Infill",
    acrylicFullset: "Acrylic Full Set",
    infillShellac: "Infill + Shellac",
    acrylicFullsetShellac: "Acrylic Full Set + Shellac",
    infillBuilderBiab: "Infill Builder/BIAB",
    fullsetBuilderBiab: "Full Set Builder/BIAB",
    infillOmbre: "Infill Ombre",
    fullsetOmbre: "Full Set Ombre",
    fullsetFrench: "Full Set French",
    overlay: "Overlay",
    acrylicToe: "Acrylic Toe",
    infillToe: "Infill Toe",
    acrylicFullsetTones: "Acrylic Full Set (2 Tones)",
    buffShapeSns: "Buff, Shape SNS",
    fullsetSns: "Full Set SNS",
    snsFrench: "SNS French",
    acrylicRemoval: "Acrylic Removal",
    repair: "Repair",
    extraLongNails: "Extra Long Nails",
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
    eyebrowsTint: "Eyebrows Tint",
    eyeLashTint: "Eyelash Tint",
    classicEyelash: "Classic Eyelash",
    infillClassic: "Infill Classic",
    volumeEyelash: "Volume Eyelash",
    infillVolume: "Infill Volume",
    eyelashPerming: "Eyelash Perming",
    eyebrowsLuminate: "Eyebrows Lamination",
    fullBodySprayTan: "Full Body Spray Tan",
    halfBodySprayTan: "Half Body Spray Tan",
    extraService1: "Extra Service ($1)",
    extraService2: "Extra Service ($2)",
    extraService5: "Extra Service ($5)",
    extraService10: "Extra Service ($10)",
    extraService20: "Extra Service ($20)",
    extraService30: "Extra Service ($30)",
    extraService40: "Extra Service ($40)",
    extraService50: "Extra Service ($50)",
  },
  galleryImageNames: {
    blushGoldLines: "Blush Gold Lines",
    roseMarble: "Rose Marble",
    charcoalGoldFlake: "Charcoal Gold Flake",
    pearlChrome: "Pearl Chrome",
    dustyRoseOmbre: "Dusty Rose Ombre",
    minimalistFrench: "Minimalist French",
    geometricGold: "Geometric Gold",
    tortoiseshell: "Tortoiseshell",
    floralNegativeSpace: "Floral Negative Space",
    roseVelvet: "Rose Velvet",
    waterDroplets: "Water Droplets",
    abstractGoldLeaf: "Abstract Gold Leaf",
    galaxyNails: "Galaxy Nails",
    holographicChrome: "Holographic Chrome",
    leopardPrint: "Leopard Print",
    cowPrint: "Cow Print",
    yinYang: "Yin Yang",
    matteGlossyTips: "Matte & Glossy Tips",
    pastelRainbow: "Pastel Rainbow",
    ginghamPattern: "Gingham Pattern",
    oceanWaves: "Ocean Waves",
    abstractFaces: "Abstract Faces",
    fairyDustGlitter: "Fairy Dust Glitter",
    stainedGlass: "Stained Glass",
    tieDye: "Tie Dye",
    emeraldGeo: "Emerald Geo",
    sapphireShimmer: "Sapphire Shimmer",
    rubyGlitter: "Ruby Glitter",
    amethystGeode: "Amethyst Geode",
    goldFoilAccent: "Gold Foil Accent",
    silverChromeDrips: "Silver Chrome Drips",
    neonSplatter: "Neon Splatter",
    checkerboard: "Checkerboard",
    autumnLeaves: "Autumn Leaves",
    winterSnowflake: "Winter Snowflake",
    cherryBlossoms: "Cherry Blossoms",
    sunflowerPop: "Sunflower Pop",
    crocSkinTexture: "Croc Skin Texture",
    cosmicNightSky: "Cosmic Night Sky",
    bubbleNails3d: "Bubble Nails (3D)",
    sageGreenMatte: "Sage Green Matte",
    terracottaArt: "Terracotta Art",
    periwinkleShimmer: "Periwinkle Shimmer",
    lavenderFields: "Lavender Fields",
    butterYellow: "Butter Yellow",
    tangerineDream: "Tangerine Dream",
    mossyGreen: "Mossy Green",
    chocolateSwirl: "Chocolate Swirl",
    greigeMinimalist: "Greige Minimalist",
    nudeWithGlitter: "Nude with Glitter",
    scarletRed: "Scarlet Red",
    denimBlue: "Denim Blue",
  }
};

export const TRANSLATIONS: Record<string, Translation> = {
  en: {
    name: "English",
    flag: "🇬🇧",
    ...baseTranslations,
  },
  vi: {
    name: "Tiếng Việt",
    flag: "🇻🇳",
    ...baseTranslations,
    // Override with Vietnamese translations
    headerTitle: "Trợ lý AI Làm Móng La Perla",
    headerSubtitle: "Hình dung nghệ thuật móng hoàn hảo trước khi đặt hẹn.",
    navAiStylist: "Trợ lý AI",
    navPriceList: "Bảng Giá",
    navGallery: "Thư Viện",
    navPortfolio: "Portfolio",
    navBooking: "Đặt Hẹn",
    navPromotions: "Khuyến Mãi",
    navTeam: "Đội Ngũ",
    // Payroll Vietnamese translations (secondary language)
    payrollTitle: "Bảng Lương Nhân Viên",
    payrollSubtitle: "Tính toán và quản lý lương nhân viên",
    payrollSelectMonth: "Chọn Tháng",
    payrollRecalculate: "Tính Lại",
    payrollStaff: "Nhân Viên",
    payrollDaysWorked: "Số Ngày Làm",
    payrollRevenue: "Doanh Thu",
    payrollBonus: "Thưởng",
    payrollAdjustment: "Điều Chỉnh",
    payrollTotal: "Tổng",
    payrollExportCSV: "Xuất CSV",
    payrollPrintAll: "In Tất Cả",
    payrollViewDetails: "Xem Chi Tiết",
    payrollDetailTitle: "Chi Tiết Lương",
    payrollBaseSalary: "Lương Cơ Bản",
    payrollDailyRate: "Lương Ngày",
    payrollTarget: "Mục Tiêu",
    payrollAboveTarget: "Vượt Mục Tiêu",
    payrollBonusRate: "Tỷ Lệ Thưởng",
    payrollSubtotal: "Tổng Phụ",
    payrollAdjustmentNote: "Ghi Chú Điều Chỉnh",
    payrollAdjustmentPlaceholder: "VD: Thưởng hiệu suất, lý do trừ lương...",
    payrollFinalTotal: "Tổng Cuối",
    payrollPrintPayslip: "In Phiếu Lương",
    payrollClose: "Đóng",
    payrollNoData: "Không có dữ liệu lương cho tháng này",
    payrollTotalPayrollCost: "Tổng Chi Phí Lương",
    payrollMonth: "Tháng",
    payrollYear: "Năm",
    revenue: "Doanh Thu",
    orders: "Đơn Hàng",
    filterByDiscount: "Lọc Theo Giảm Giá",
    allDiscounts: "Tất Cả Đơn",
    noDiscount: "Không Giảm Giá (0%)",
    withDiscount: "Có Giảm Giá",
    discountLabel: "Giảm Giá",
  },
};
