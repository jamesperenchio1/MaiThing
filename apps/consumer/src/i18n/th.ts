export const th = {
  // ─── Common ──────────────────────────────────────────────────────────────
  common: {
    loading: 'กำลังโหลด...',
    error: 'เกิดข้อผิดพลาด',
    retry: 'ลองใหม่',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    close: 'ปิด',
    back: 'กลับ',
    next: 'ถัดไป',
    done: 'เสร็จสิ้น',
    search: 'ค้นหา',
    filter: 'กรอง',
    all: 'ทั้งหมด',
    free: 'ฟรี',
    saved: '{{percent}}%',
    distance: '{{dist}}',
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    signOut: 'ออกจากระบบ',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    continueWithGoogle: 'ดำเนินการต่อด้วย Google',
    continueWithLine: 'ดำเนินการต่อด้วย LINE',
    pdpaConsent: 'ฉันยินยอมให้ MaiThing เก็บและใช้ข้อมูลส่วนบุคคลตาม PDPA',
  },

  // ─── Discover / Home ──────────────────────────────────────────────────────
  discover: {
    title: 'อาหารใกล้ฉัน',
    mapView: 'แผนที่',
    listView: 'รายการ',
    noListings: 'ยังไม่มีอาหารในบริเวณนี้',
    notifyMe: 'แจ้งเตือนฉันเมื่อมีอาหารใหม่',
    searchPlaceholder: 'ค้นหาร้านอาหาร...',
    filters: {
      category: 'ประเภท',
      maxPrice: 'ราคาสูงสุด',
      availableNow: 'มีอยู่ตอนนี้',
      fulfillmentType: 'รูปแบบ',
    },
  },

  // ─── Listing ─────────────────────────────────────────────────────────────
  listing: {
    surpriseBag: 'กระเป๋าเซอร์ไพรส์',
    pickYourOwn: 'เลือกเองได้',
    remaining: 'เหลือ {{count}} ชิ้น',
    originalValue: 'มูลค่าปกติ ฿{{value}}',
    saved: 'ประหยัด {{percent}}%',
    allergens: 'สารก่อภูมิแพ้',
    bestBefore: 'ควรบริโภคก่อน',
    pickupWindow: 'เวลารับ',
    reserve: 'จอง',
    addToFavorites: 'เพิ่มในรายการโปรด',
    messageStore: 'ส่งข้อความหาร้าน',
    overallRating: 'คะแนนรวม',
    valueRating: 'คุ้มค่า',
  },

  // ─── Order / Checkout ─────────────────────────────────────────────────────
  order: {
    selectSlot: 'เลือกเวลารับ',
    pay: 'ชำระเงิน ฿{{amount}}',
    pickupCode: 'รหัสรับอาหาร',
    qrCode: 'QR Code',
    cancelPolicy: 'ยกเลิกได้ฟรีก่อน 2 ชั่วโมง',
    showToStaff: 'แสดงรหัสนี้ให้พนักงานเมื่อรับอาหาร',
    item: 'รายการ',
    location: 'ที่รับ',
    pickupWindow: 'เวลารับ',
    cancel: 'ยกเลิกคำสั่งซื้อ',
    cancelTitle: 'ยกเลิกคำสั่งซื้อ',
    cancelConfirm: 'คุณแน่ใจหรือไม่ที่จะยกเลิก? การกระทำนี้ไม่สามารถเลิกทำได้',
    cancelConfirmBtn: 'ใช่ ยกเลิก',
    cancelTooLate: 'หมดเวลายกเลิกแล้ว',
    status: {
      reserved: 'จองแล้ว',
      paid: 'ชำระแล้ว',
      collected: 'รับแล้ว',
      cancelled: 'ยกเลิกแล้ว',
      refunded: 'คืนเงินแล้ว',
      no_show: 'ไม่มาตามนัด',
    },
  },

  // ─── Review ──────────────────────────────────────────────────────────────
  review: {
    title: 'รีวิวการซื้อครั้งนี้',
    overallRating: 'คะแนนรวม',
    valueRating: 'ความคุ้มค่า',
    comment: 'ความคิดเห็น (ไม่บังคับ)',
    submit: 'ส่งรีวิว',
    reportProblem: 'รายงานปัญหา',
  },

  // ─── Profile ─────────────────────────────────────────────────────────────
  profile: {
    title: 'โปรไฟล์',
    orderHistory: 'ประวัติการสั่งซื้อ',
    foodHero: 'Food Hero',
    impact: {
      meals: '{{count}} มื้อที่ช่วยได้',
      co2: 'ลด CO₂ {{kg}} กก.',
      saved: 'ประหยัด ฿{{amount}}',
    },
    favorites: 'รายการโปรด',
    referrals: 'แนะนำเพื่อน',
    settings: 'ตั้งค่า',
  },

  // ─── Merchant ────────────────────────────────────────────────────────────
  merchant: {
    dashboard: 'แดชบอร์ด',
    todayOrders: 'คำสั่งซื้อวันนี้',
    publishListing: 'ลงประกาศ',
    confirmPickup: 'ยืนยันการรับ',
    soldOut: 'หมดแล้ว',
    adjustStock: 'ปรับสต็อก',
  },

  // ─── Categories ──────────────────────────────────────────────────────────
  categories: {
    bakery: 'เบเกอรี',
    cafe: 'คาเฟ่',
    restaurant: 'ร้านอาหาร',
    grocery: 'ร้านขายของชำ',
    supermarket: 'ซูเปอร์มาร์เก็ต',
    convenience: 'ร้านสะดวกซื้อ',
    hotel: 'โรงแรม',
    buffet: 'บุฟเฟต์',
    deli: 'เดลี่',
    juice_bar: 'ร้านน้ำผลไม้',
    other: 'อื่นๆ',
  },
};
