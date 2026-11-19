import type { CalculationMethodId, CityLocation } from '../types/prayer';

interface CountrySeed {
  code: string;
  nameAr: string;
  nameEn: string;
  timeZone: string;
  defaultMethod: CalculationMethodId;
  cities: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    regionAr: string;
    regionEn: string;
    lat: number;
    lng: number;
    timeZone?: string;
  }>;
}

const COUNTRY_SEEDS: CountrySeed[] = [
  {
    code: 'SA',
    nameAr: 'المملكة العربية السعودية',
    nameEn: 'Saudi Arabia',
    timeZone: 'Asia/Riyadh',
    defaultMethod: 'umm_al_qura',
    cities: [
      { id: 'riyadh', nameAr: 'الرياض', nameEn: 'Riyadh', regionAr: 'منطقة الرياض', regionEn: 'Riyadh Region', lat: 24.7136, lng: 46.6753 },
      { id: 'alkharj', nameAr: 'الخرج', nameEn: 'Al-Kharj', regionAr: 'منطقة الرياض', regionEn: 'Riyadh Region', lat: 24.1556, lng: 47.312 },
      { id: 'dawadmi', nameAr: 'الدوادمي', nameEn: 'Al-Dawadmi', regionAr: 'منطقة الرياض', regionEn: 'Riyadh Region', lat: 24.5077, lng: 44.3924 },
      { id: 'makkah', nameAr: 'مكة المكرمة', nameEn: 'Makkah', regionAr: 'منطقة مكة المكرمة', regionEn: 'Makkah Region', lat: 21.4225, lng: 39.8262 },
      { id: 'jeddah', nameAr: 'جدة', nameEn: 'Jeddah', regionAr: 'منطقة مكة المكرمة', regionEn: 'Makkah Region', lat: 21.4858, lng: 39.1925 },
      { id: 'taif', nameAr: 'الطائف', nameEn: 'Taif', regionAr: 'منطقة مكة المكرمة', regionEn: 'Makkah Region', lat: 21.2703, lng: 40.4158 },
      { id: 'madinah', nameAr: 'المدينة المنورة', nameEn: 'Madinah', regionAr: 'منطقة المدينة المنورة', regionEn: 'Madinah Region', lat: 24.4672, lng: 39.6111 },
      { id: 'yanbu', nameAr: 'ينبع', nameEn: 'Yanbu', regionAr: 'منطقة المدينة المنورة', regionEn: 'Madinah Region', lat: 24.0895, lng: 38.0618 },
      { id: 'dammam', nameAr: 'الدمام', nameEn: 'Dammam', regionAr: 'المنطقة الشرقية', regionEn: 'Eastern Province', lat: 26.4207, lng: 50.0888 },
      { id: 'khobar', nameAr: 'الخبر', nameEn: 'Al-Khobar', regionAr: 'المنطقة الشرقية', regionEn: 'Eastern Province', lat: 26.2172, lng: 50.1971 },
      { id: 'ahsa', nameAr: 'الأحساء (الهفوف)', nameEn: 'Al-Ahsa (Hofuf)', regionAr: 'المنطقة الشرقية', regionEn: 'Eastern Province', lat: 25.38, lng: 49.5888 },
      { id: 'jubail', nameAr: 'الجبيل', nameEn: 'Jubail', regionAr: 'المنطقة الشرقية', regionEn: 'Eastern Province', lat: 27.0112, lng: 49.6583 },
      { id: 'abha', nameAr: 'أبها', nameEn: 'Abha', regionAr: 'منطقة عسير', regionEn: 'Asir Region', lat: 18.2164, lng: 42.5053 },
      { id: 'khamis', nameAr: 'خميس مشيط', nameEn: 'Khamis Mushait', regionAr: 'منطقة عسير', regionEn: 'Asir Region', lat: 18.3, lng: 42.7333 },
      { id: 'buraidah', nameAr: 'بريدة', nameEn: 'Buraidah', regionAr: 'منطقة القصيم', regionEn: 'Qassim Region', lat: 26.326, lng: 43.975 },
      { id: 'unaizah', nameAr: 'عنيزة', nameEn: 'Unaizah', regionAr: 'منطقة القصيم', regionEn: 'Qassim Region', lat: 26.084, lng: 43.9935 },
      { id: 'tabuk', nameAr: 'تبوك', nameEn: 'Tabuk', regionAr: 'منطقة تبوك', regionEn: 'Tabuk Region', lat: 28.3838, lng: 36.555 },
      { id: 'hail', nameAr: 'حائل', nameEn: 'Hail', regionAr: 'منطقة حائل', regionEn: 'Hail Region', lat: 27.5114, lng: 41.7208 },
      { id: 'jazan', nameAr: 'جازان', nameEn: 'Jazan', regionAr: 'منطقة جازان', regionEn: 'Jazan Region', lat: 16.8892, lng: 42.5511 },
      { id: 'najran', nameAr: 'نجران', nameEn: 'Najran', regionAr: 'منطقة نجران', regionEn: 'Najran Region', lat: 17.4924, lng: 44.1277 },
      { id: 'sakaka', nameAr: 'سكاكا', nameEn: 'Sakaka', regionAr: 'منطقة الجوف', regionEn: 'Al-Jouf Region', lat: 29.9697, lng: 40.2064 },
      { id: 'albaha', nameAr: 'الباحة', nameEn: 'Al-Baha', regionAr: 'منطقة الباحة', regionEn: 'Al-Baha Region', lat: 20.0129, lng: 41.4677 },
    ],
  },
  {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    timeZone: 'Africa/Cairo',
    defaultMethod: 'egyptian',
    cities: [
      { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', regionAr: 'القاهرة الكبرى', regionEn: 'Greater Cairo', lat: 30.0444, lng: 31.2357 },
      { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza', regionAr: 'القاهرة الكبرى', regionEn: 'Greater Cairo', lat: 30.0131, lng: 31.2089 },
      { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', regionAr: 'الإسكندرية والساحل', regionEn: 'Alexandria & Coast', lat: 31.2001, lng: 29.9187 },
      { id: 'matrouh', nameAr: 'مرسى مطروح', nameEn: 'Marsa Matrouh', regionAr: 'الإسكندرية والساحل', regionEn: 'Alexandria & Coast', lat: 31.3543, lng: 27.2373 },
      { id: 'mansoura', nameAr: 'المنصورة', nameEn: 'Mansoura', regionAr: 'الدلتا', regionEn: 'Nile Delta', lat: 31.0409, lng: 31.3785 },
      { id: 'tanta', nameAr: 'طنطا', nameEn: 'Tanta', regionAr: 'الدلتا', regionEn: 'Nile Delta', lat: 30.7865, lng: 31.0004 },
      { id: 'zagazig', nameAr: 'الزقازيق', nameEn: 'Zagazig', regionAr: 'الدلتا', regionEn: 'Nile Delta', lat: 30.5877, lng: 31.502 },
      { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', regionAr: 'القناة وسيناء', regionEn: 'Canal & Sinai', lat: 30.5965, lng: 32.2715 },
      { id: 'portsaid', nameAr: 'بورسعيد', nameEn: 'Port Said', regionAr: 'القناة وسيناء', regionEn: 'Canal & Sinai', lat: 31.2653, lng: 32.3019 },
      { id: 'suez', nameAr: 'السويس', nameEn: 'Suez', regionAr: 'القناة وسيناء', regionEn: 'Canal & Sinai', lat: 29.9668, lng: 32.5498 },
      { id: 'sharm', nameAr: 'شرم الشيخ', nameEn: 'Sharm El-Sheikh', regionAr: 'القناة وسيناء', regionEn: 'Canal & Sinai', lat: 27.9158, lng: 34.33 },
      { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut', regionAr: 'الصعيد', regionEn: 'Upper Egypt', lat: 27.1809, lng: 31.1837 },
      { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', regionAr: 'الصعيد', regionEn: 'Upper Egypt', lat: 25.6872, lng: 32.6396 },
      { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', regionAr: 'الصعيد', regionEn: 'Upper Egypt', lat: 24.0889, lng: 32.8998 },
    ],
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية المتحدة',
    nameEn: 'United Arab Emirates',
    timeZone: 'Asia/Dubai',
    defaultMethod: 'dubai',
    cities: [
      { id: 'dubai', nameAr: 'دبي', nameEn: 'Dubai', regionAr: 'إمارة دبي', regionEn: 'Dubai', lat: 25.2048, lng: 55.2708 },
      { id: 'abudhabi', nameAr: 'أبوظبي', nameEn: 'Abu Dhabi', regionAr: 'إمارة أبوظبي', regionEn: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
      { id: 'alain', nameAr: 'العين', nameEn: 'Al Ain', regionAr: 'إمارة أبوظبي', regionEn: 'Abu Dhabi', lat: 24.1302, lng: 55.8023 },
      { id: 'sharjah', nameAr: 'الشارقة', nameEn: 'Sharjah', regionAr: 'إمارة الشارقة', regionEn: 'Sharjah', lat: 25.3463, lng: 55.4209 },
      { id: 'ajman', nameAr: 'عجمان', nameEn: 'Ajman', regionAr: 'إمارة عجمان', regionEn: 'Ajman', lat: 25.4052, lng: 55.5136 },
      { id: 'rak', nameAr: 'رأس الخيمة', nameEn: 'Ras Al Khaimah', regionAr: 'رأس الخيمة', regionEn: 'Ras Al Khaimah', lat: 25.8007, lng: 55.9762 },
      { id: 'fujairah', nameAr: 'الفجيرة', nameEn: 'Fujairah', regionAr: 'إمارة الفجيرة', regionEn: 'Fujairah', lat: 25.1288, lng: 56.3265 },
    ],
  },
  {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    timeZone: 'Asia/Amman',
    defaultMethod: 'jordan',
    cities: [
      { id: 'amman', nameAr: 'عمّان', nameEn: 'Amman', regionAr: 'محافظات الوسط', regionEn: 'Central Jordan', lat: 31.9454, lng: 35.9284 },
      { id: 'zarqa', nameAr: 'الزرقاء', nameEn: 'Zarqa', regionAr: 'محافظات الوسط', regionEn: 'Central Jordan', lat: 32.0728, lng: 36.088 },
      { id: 'salt', nameAr: 'السلط', nameEn: 'Al-Salt', regionAr: 'محافظات الوسط', regionEn: 'Central Jordan', lat: 32.0392, lng: 35.7272 },
      { id: 'irbid', nameAr: 'إربد', nameEn: 'Irbid', regionAr: 'محافظات الشمال', regionEn: 'Northern Jordan', lat: 32.5568, lng: 35.8469 },
      { id: 'jerash', nameAr: 'جرش', nameEn: 'Jerash', regionAr: 'محافظات الشمال', regionEn: 'Northern Jordan', lat: 32.2747, lng: 35.8961 },
      { id: 'aqaba', nameAr: 'العقبة', nameEn: 'Aqaba', regionAr: 'محافظات الجنوب', regionEn: 'Southern Jordan', lat: 29.5321, lng: 35.0063 },
      { id: 'karak', nameAr: 'الكرك', nameEn: 'Al-Karak', regionAr: 'محافظات الجنوب', regionEn: 'Southern Jordan', lat: 31.1853, lng: 35.7048 },
    ],
  },
  {
    code: 'PS',
    nameAr: 'فلسطين',
    nameEn: 'Palestine',
    timeZone: 'Asia/Jerusalem',
    defaultMethod: 'mwl',
    cities: [
      { id: 'jerusalem', nameAr: 'القدس', nameEn: 'Jerusalem', regionAr: 'القدس', regionEn: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
      { id: 'ramallah', nameAr: 'رام الله', nameEn: 'Ramallah', regionAr: 'الضفة الغربية', regionEn: 'West Bank', lat: 31.9038, lng: 35.2034 },
      { id: 'nablus', nameAr: 'نابلس', nameEn: 'Nablus', regionAr: 'الضفة الغربية', regionEn: 'West Bank', lat: 32.2211, lng: 35.2544 },
      { id: 'hebron', nameAr: 'الخليل', nameEn: 'Hebron', regionAr: 'الضفة الغربية', regionEn: 'West Bank', lat: 31.5326, lng: 35.0998 },
      { id: 'gaza', nameAr: 'غزة', nameEn: 'Gaza', regionAr: 'قطاع غزة', regionEn: 'Gaza Strip', lat: 31.5017, lng: 34.4668 },
    ],
  },
  {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    timeZone: 'Asia/Kuwait',
    defaultMethod: 'kuwait',
    cities: [
      { id: 'kuwait', nameAr: 'مدينة الكويت', nameEn: 'Kuwait City', regionAr: 'محافظة العاصمة', regionEn: 'Capital Governorate', lat: 29.3759, lng: 47.9774 },
      { id: 'hawalli', nameAr: 'حولي', nameEn: 'Hawalli', regionAr: 'محافظة حولي', regionEn: 'Hawalli', lat: 29.3328, lng: 48.0286 },
      { id: 'ahmadi', nameAr: 'الأحمدي', nameEn: 'Al-Ahmadi', regionAr: 'محافظة الأحمدي', regionEn: 'Al-Ahmadi', lat: 29.0769, lng: 48.0838 },
      { id: 'jahra', nameAr: 'الجهراء', nameEn: 'Al-Jahra', regionAr: 'محافظة الجهراء', regionEn: 'Al-Jahra', lat: 29.3375, lng: 47.6581 },
    ],
  },
  {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    timeZone: 'Asia/Qatar',
    defaultMethod: 'qatar',
    cities: [
      { id: 'doha', nameAr: 'الدوحة', nameEn: 'Doha', regionAr: 'بلدية الدوحة', regionEn: 'Doha', lat: 25.2854, lng: 51.531 },
      { id: 'alrayyan', nameAr: 'الريان', nameEn: 'Al Rayyan', regionAr: 'بلدية الريان', regionEn: 'Al Rayyan', lat: 25.2919, lng: 51.4244 },
      { id: 'alwakrah', nameAr: 'الوكرة', nameEn: 'Al Wakrah', regionAr: 'بلدية الوكرة', regionEn: 'Al Wakrah', lat: 25.1715, lng: 51.6034 },
      { id: 'alkhor', nameAr: 'الخور', nameEn: 'Al Khor', regionAr: 'بلدية الخور', regionEn: 'Al Khor', lat: 25.6804, lng: 51.4969 },
    ],
  },
  {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    timeZone: 'Asia/Bahrain',
    defaultMethod: 'gulf',
    cities: [
      { id: 'manama', nameAr: 'المنامة', nameEn: 'Manama', regionAr: 'محافظة العاصمة', regionEn: 'Capital', lat: 26.2285, lng: 50.586 },
      { id: 'muharraq', nameAr: 'المحرق', nameEn: 'Muharraq', regionAr: 'محافظة المحرق', regionEn: 'Muharraq', lat: 26.2572, lng: 50.6119 },
      { id: 'riffa', nameAr: 'الرفاع', nameEn: 'Riffa', regionAr: 'المحافظة الجنوبية', regionEn: 'Southern', lat: 26.13, lng: 50.555 },
    ],
  },
  {
    code: 'OM',
    nameAr: 'عُمان',
    nameEn: 'Oman',
    timeZone: 'Asia/Muscat',
    defaultMethod: 'dubai',
    cities: [
      { id: 'muscat', nameAr: 'مسقط', nameEn: 'Muscat', regionAr: 'محافظة مسقط', regionEn: 'Muscat', lat: 23.588, lng: 58.3829 },
      { id: 'salalah', nameAr: 'صلالة', nameEn: 'Salalah', regionAr: 'محافظة ظفار', regionEn: 'Dhofar', lat: 17.0151, lng: 54.0924 },
      { id: 'sohar', nameAr: 'صحار', nameEn: 'Sohar', regionAr: 'شمال الباطنة', regionEn: 'Al Batinah North', lat: 24.3643, lng: 56.7468 },
      { id: 'nizwa', nameAr: 'نزوى', nameEn: 'Nizwa', regionAr: 'محافظة الداخلية', regionEn: 'Ad Dakhiliyah', lat: 22.9333, lng: 57.5333 },
    ],
  },
  {
    code: 'MA',
    nameAr: 'المغرب',
    nameEn: 'Morocco',
    timeZone: 'Africa/Casablanca',
    defaultMethod: 'mwl',
    cities: [
      { id: 'casablanca', nameAr: 'الدار البيضاء', nameEn: 'Casablanca', regionAr: 'الدار البيضاء - سطات', regionEn: 'Casablanca-Settat', lat: 33.5731, lng: -7.5898 },
      { id: 'rabat', nameAr: 'الرباط', nameEn: 'Rabat', regionAr: 'الرباط - سلا - القنيطرة', regionEn: 'Rabat-Salé-Kénitra', lat: 34.0209, lng: -6.8416 },
      { id: 'marrakech', nameAr: 'مراكش', nameEn: 'Marrakech', regionAr: 'مراكش - آسفي', regionEn: 'Marrakech-Safi', lat: 31.6295, lng: -7.9811 },
      { id: 'fez', nameAr: 'فاس', nameEn: 'Fez', regionAr: 'فاس - مكناس', regionEn: 'Fès-Meknès', lat: 34.0181, lng: -5.0078 },
      { id: 'tangier', nameAr: 'طنجة', nameEn: 'Tangier', regionAr: 'طنجة - تطوان', regionEn: 'Tanger-Tetouan', lat: 35.7595, lng: -5.834 },
    ],
  },
  {
    code: 'DZ',
    nameAr: 'الجزائر',
    nameEn: 'Algeria',
    timeZone: 'Africa/Algiers',
    defaultMethod: 'egyptian',
    cities: [
      { id: 'algiers', nameAr: 'الجزائر العاصمة', nameEn: 'Algiers', regionAr: 'الوسط', regionEn: 'Central', lat: 36.7538, lng: 3.0588 },
      { id: 'oran', nameAr: 'وهران', nameEn: 'Oran', regionAr: 'الغرب', regionEn: 'West', lat: 35.6969, lng: -0.6331 },
      { id: 'constantine', nameAr: 'قسنطينة', nameEn: 'Constantine', regionAr: 'الشرق', regionEn: 'East', lat: 36.365, lng: 6.6147 },
      { id: 'annaba', nameAr: 'عنابة', nameEn: 'Annaba', regionAr: 'الشرق', regionEn: 'East', lat: 36.9, lng: 7.7667 },
    ],
  },
  {
    code: 'TN',
    nameAr: 'تونس',
    nameEn: 'Tunisia',
    timeZone: 'Africa/Tunis',
    defaultMethod: 'mwl',
    cities: [
      { id: 'tunis', nameAr: 'تونس العاصمة', nameEn: 'Tunis', regionAr: 'الشمال', regionEn: 'North', lat: 36.8065, lng: 10.1815 },
      { id: 'sousse', nameAr: 'سوسة', nameEn: 'Sousse', regionAr: 'الوسط والساحل', regionEn: 'Sahel & Center', lat: 35.8256, lng: 10.6369 },
      { id: 'kairouan', nameAr: 'القيروان', nameEn: 'Kairouan', regionAr: 'الوسط والساحل', regionEn: 'Sahel & Center', lat: 35.6781, lng: 10.0963 },
      { id: 'sfax', nameAr: 'صفاقس', nameEn: 'Sfax', regionAr: 'الجنوب', regionEn: 'South', lat: 34.7406, lng: 10.7603 },
    ],
  },
  {
    code: 'IQ',
    nameAr: 'العراق',
    nameEn: 'Iraq',
    timeZone: 'Asia/Baghdad',
    defaultMethod: 'mwl',
    cities: [
      { id: 'baghdad', nameAr: 'بغداد', nameEn: 'Baghdad', regionAr: 'بغداد', regionEn: 'Baghdad', lat: 33.3152, lng: 44.3661 },
      { id: 'basra', nameAr: 'البصرة', nameEn: 'Basra', regionAr: 'الجنوب', regionEn: 'South Iraq', lat: 30.5085, lng: 47.7804 },
      { id: 'mosul', nameAr: 'الموصل', nameEn: 'Mosul', regionAr: 'نينوى والشمال', regionEn: 'Nineveh & North', lat: 36.3489, lng: 43.1577 },
      { id: 'erbil', nameAr: 'أربيل', nameEn: 'Erbil', regionAr: 'إقليم كردستان', regionEn: 'Kurdistan Region', lat: 36.1911, lng: 44.0092 },
      { id: 'najaf', nameAr: 'النجف', nameEn: 'Najaf', regionAr: 'الفرات الأوسط', regionEn: 'Middle Euphrates', lat: 31.9996, lng: 44.3267 },
    ],
  },
  {
    code: 'SY',
    nameAr: 'سوريا',
    nameEn: 'Syria',
    timeZone: 'Asia/Damascus',
    defaultMethod: 'mwl',
    cities: [
      { id: 'damascus', nameAr: 'دمشق', nameEn: 'Damascus', regionAr: 'دمشق والجنوب', regionEn: 'Damascus & South', lat: 33.5138, lng: 36.2765 },
      { id: 'aleppo', nameAr: 'حلب', nameEn: 'Aleppo', regionAr: 'الشمال', regionEn: 'North Syria', lat: 36.2021, lng: 37.1343 },
      { id: 'homs', nameAr: 'حمص', nameEn: 'Homs', regionAr: 'الوسط', regionEn: 'Central Syria', lat: 34.7324, lng: 36.7137 },
      { id: 'latakia', nameAr: 'اللاذقية', nameEn: 'Latakia', regionAr: 'الساحل', regionEn: 'Coastal Syria', lat: 35.5317, lng: 35.7901 },
    ],
  },
  {
    code: 'LB',
    nameAr: 'لبنان',
    nameEn: 'Lebanon',
    timeZone: 'Asia/Beirut',
    defaultMethod: 'mwl',
    cities: [
      { id: 'beirut', nameAr: 'بيروت', nameEn: 'Beirut', regionAr: 'بيروت وجبل لبنان', regionEn: 'Beirut & Mount Lebanon', lat: 33.8938, lng: 35.5018 },
      { id: 'tripoli_lb', nameAr: 'طرابلس', nameEn: 'Tripoli', regionAr: 'الشمال', regionEn: 'North Lebanon', lat: 34.4367, lng: 35.8497 },
      { id: 'sidon', nameAr: 'صيدا', nameEn: 'Sidon', regionAr: 'الجنوب', regionEn: 'South Lebanon', lat: 33.5571, lng: 35.3729 },
    ],
  },
  {
    code: 'YE',
    nameAr: 'اليمن',
    nameEn: 'Yemen',
    timeZone: 'Asia/Aden',
    defaultMethod: 'umm_al_qura',
    cities: [
      { id: 'sanaa', nameAr: 'صنعاء', nameEn: 'Sanaa', regionAr: 'صنعاء', regionEn: 'Sanaa', lat: 15.3694, lng: 44.191 },
      { id: 'aden', nameAr: 'عدن', nameEn: 'Aden', regionAr: 'عدن والجنوب', regionEn: 'Aden & South', lat: 12.7855, lng: 45.0187 },
      { id: 'taiz', nameAr: 'تعز', nameEn: 'Taiz', regionAr: 'تعز', regionEn: 'Taiz', lat: 13.5795, lng: 44.0209 },
      { id: 'mukalla', nameAr: 'المكلا', nameEn: 'Al Mukalla', regionAr: 'حضرموت', regionEn: 'Hadhramaut', lat: 14.5425, lng: 49.1242 },
    ],
  },
  {
    code: 'SD',
    nameAr: 'السودان',
    nameEn: 'Sudan',
    timeZone: 'Africa/Khartoum',
    defaultMethod: 'egyptian',
    cities: [
      { id: 'khartoum', nameAr: 'الخرطوم', nameEn: 'Khartoum', regionAr: 'ولاية الخرطوم', regionEn: 'Khartoum State', lat: 15.5007, lng: 32.5599 },
      { id: 'omdurman', nameAr: 'أم درمان', nameEn: 'Omdurman', regionAr: 'ولاية الخرطوم', regionEn: 'Khartoum State', lat: 15.6445, lng: 32.4777 },
      { id: 'portsudan', nameAr: 'بورتسودان', nameEn: 'Port Sudan', regionAr: 'ولاية البحر الأحمر', regionEn: 'Red Sea State', lat: 19.6158, lng: 37.2164 },
    ],
  },
  {
    code: 'LY',
    nameAr: 'ليبيا',
    nameEn: 'Libya',
    timeZone: 'Africa/Tripoli',
    defaultMethod: 'egyptian',
    cities: [
      { id: 'tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli', regionAr: 'إقليم طرابلس', regionEn: 'Tripolitania', lat: 32.8872, lng: 13.1913 },
      { id: 'misrata', nameAr: 'مصراتة', nameEn: 'Misrata', regionAr: 'إقليم طرابلس', regionEn: 'Tripolitania', lat: 32.3754, lng: 15.0925 },
      { id: 'benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi', regionAr: 'إقليم برقة', regionEn: 'Cyrenaica', lat: 32.1194, lng: 20.0868 },
    ],
  },
  {
    code: 'TR',
    nameAr: 'تركيا',
    nameEn: 'Turkey',
    timeZone: 'Europe/Istanbul',
    defaultMethod: 'turkey',
    cities: [
      { id: 'istanbul', nameAr: 'إسطنبول', nameEn: 'Istanbul', regionAr: 'منطقة مرمرة', regionEn: 'Marmara', lat: 41.0082, lng: 28.9784 },
      { id: 'bursa', nameAr: 'بورصة', nameEn: 'Bursa', regionAr: 'منطقة مرمرة', regionEn: 'Marmara', lat: 40.1885, lng: 29.061 },
      { id: 'ankara', nameAr: 'أنقرة', nameEn: 'Ankara', regionAr: 'وسط الأناضول', regionEn: 'Central Anatolia', lat: 39.9334, lng: 32.8597 },
      { id: 'konya', nameAr: 'قونية', nameEn: 'Konya', regionAr: 'وسط الأناضول', regionEn: 'Central Anatolia', lat: 37.8746, lng: 32.4932 },
      { id: 'izmir', nameAr: 'إزمير', nameEn: 'Izmir', regionAr: 'منطقة إيجة', regionEn: 'Aegean', lat: 38.4237, lng: 27.1428 },
    ],
  },
  {
    code: 'GB',
    nameAr: 'المملكة المتحدة',
    nameEn: 'United Kingdom',
    timeZone: 'Europe/London',
    defaultMethod: 'mwl',
    cities: [
      { id: 'london', nameAr: 'لندن', nameEn: 'London', regionAr: 'إنجلترا', regionEn: 'England', lat: 51.5072, lng: -0.1276 },
      { id: 'birmingham', nameAr: 'برمنغهام', nameEn: 'Birmingham', regionAr: 'إنجلترا', regionEn: 'England', lat: 52.4862, lng: -1.8904 },
      { id: 'manchester', nameAr: 'مانشستر', nameEn: 'Manchester', regionAr: 'إنجلترا', regionEn: 'England', lat: 53.4808, lng: -2.2426 },
      { id: 'edinburgh', nameAr: 'إدنبرة', nameEn: 'Edinburgh', regionAr: 'اسكتلندا', regionEn: 'Scotland', lat: 55.9533, lng: -3.1883 },
    ],
  },
  {
    code: 'FR',
    nameAr: 'فرنسا',
    nameEn: 'France',
    timeZone: 'Europe/Paris',
    defaultMethod: 'uoif',
    cities: [
      { id: 'paris', nameAr: 'باريس', nameEn: 'Paris', regionAr: 'إيل دو فرانس', regionEn: 'Île-de-France', lat: 48.8566, lng: 2.3522 },
      { id: 'lyon', nameAr: 'ليون', nameEn: 'Lyon', regionAr: 'أوفرن-رون ألب', regionEn: 'Auvergne-Rhône-Alpes', lat: 45.764, lng: 4.8357 },
      { id: 'marseille', nameAr: 'مارسيليا', nameEn: 'Marseille', regionAr: 'بروفانس', regionEn: 'Provence', lat: 43.2965, lng: 5.3698 },
    ],
  },
  {
    code: 'US',
    nameAr: 'الولايات المتحدة',
    nameEn: 'United States',
    timeZone: 'America/New_York',
    defaultMethod: 'isna',
    cities: [
      { id: 'newyork', nameAr: 'نيويورك', nameEn: 'New York', regionAr: 'الشمال الشرقي', regionEn: 'Northeast', lat: 40.7128, lng: -74.006, timeZone: 'America/New_York' },
      { id: 'washington', nameAr: 'واشنطن العاصمة', nameEn: 'Washington, D.C.', regionAr: 'الشمال الشرقي', regionEn: 'Northeast', lat: 38.9072, lng: -77.0369, timeZone: 'America/New_York' },
      { id: 'chicago', nameAr: 'شيكاغو', nameEn: 'Chicago', regionAr: 'الغرب الأوسط', regionEn: 'Midwest', lat: 41.8781, lng: -87.6298, timeZone: 'America/Chicago' },
      { id: 'detroit', nameAr: 'ديترويت', nameEn: 'Detroit', regionAr: 'الغرب الأوسط', regionEn: 'Midwest', lat: 42.3314, lng: -83.0458, timeZone: 'America/Detroit' },
      { id: 'houston', nameAr: 'هيوستن', nameEn: 'Houston', regionAr: 'الجنوب', regionEn: 'South', lat: 29.7604, lng: -95.3698, timeZone: 'America/Chicago' },
      { id: 'losangeles', nameAr: 'لوس أنجلوس', nameEn: 'Los Angeles', regionAr: 'الغرب', regionEn: 'West Coast', lat: 34.0522, lng: -118.2437, timeZone: 'America/Los_Angeles' },
    ],
  },
  {
    code: 'CA',
    nameAr: 'كندا',
    nameEn: 'Canada',
    timeZone: 'America/Toronto',
    defaultMethod: 'isna',
    cities: [
      { id: 'toronto', nameAr: 'تورونتو', nameEn: 'Toronto', regionAr: 'أونتاريو', regionEn: 'Ontario', lat: 43.6532, lng: -79.3832, timeZone: 'America/Toronto' },
      { id: 'ottawa', nameAr: 'أوتاوا', nameEn: 'Ottawa', regionAr: 'أونتاريو', regionEn: 'Ontario', lat: 45.4215, lng: -75.6972, timeZone: 'America/Toronto' },
      { id: 'montreal', nameAr: 'مونتريال', nameEn: 'Montreal', regionAr: 'كيبيك', regionEn: 'Quebec', lat: 45.5017, lng: -73.5673, timeZone: 'America/Toronto' },
      { id: 'vancouver', nameAr: 'فانكوفر', nameEn: 'Vancouver', regionAr: 'كولومبيا البريطانية', regionEn: 'British Columbia', lat: 49.2827, lng: -123.1207, timeZone: 'America/Vancouver' },
    ],
  },
  {
    code: 'MY',
    nameAr: 'ماليزيا',
    nameEn: 'Malaysia',
    timeZone: 'Asia/Kuala_Lumpur',
    defaultMethod: 'singapore',
    cities: [
      { id: 'kualalumpur', nameAr: 'كوالالمبور', nameEn: 'Kuala Lumpur', regionAr: 'كوالالمبور', regionEn: 'Kuala Lumpur', lat: 3.139, lng: 101.6869 },
      { id: 'penang', nameAr: 'جورج تاون (بينانغ)', nameEn: 'George Town (Penang)', regionAr: 'بينانغ', regionEn: 'Penang', lat: 5.4141, lng: 100.3288 },
      { id: 'johorbahru', nameAr: 'جوهر بهرو', nameEn: 'Johor Bahru', regionAr: 'جوهر', regionEn: 'Johor', lat: 1.4927, lng: 103.7414 },
    ],
  },
  {
    code: 'ID',
    nameAr: 'إندونيسيا',
    nameEn: 'Indonesia',
    timeZone: 'Asia/Jakarta',
    defaultMethod: 'singapore',
    cities: [
      { id: 'jakarta', nameAr: 'جاكرتا', nameEn: 'Jakarta', regionAr: 'جاوة', regionEn: 'Java', lat: -6.2088, lng: 106.8456 },
      { id: 'bandung', nameAr: 'باندونغ', nameEn: 'Bandung', regionAr: 'جاوة', regionEn: 'Java', lat: -6.9175, lng: 107.6191 },
      { id: 'surabaya', nameAr: 'سورابايا', nameEn: 'Surabaya', regionAr: 'جاوة', regionEn: 'Java', lat: -7.2575, lng: 112.7521 },
      { id: 'medan', nameAr: 'ميدان', nameEn: 'Medan', regionAr: 'سومطرة', regionEn: 'Sumatra', lat: 3.5952, lng: 98.6722 },
    ],
  },
];

export interface CountrySummary {
  code: string;
  nameAr: string;
  nameEn: string;
  cityCount: number;
  regionCount: number;
}

export interface RegionSummary {
  nameAr: string;
  nameEn: string;
  cityCount: number;
}

export const CITIES: CityLocation[] = COUNTRY_SEEDS.flatMap((country) =>
  country.cities.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    countryCode: country.code,
    countryAr: country.nameAr,
    countryEn: country.nameEn,
    regionAr: c.regionAr,
    regionEn: c.regionEn,
    latitude: c.lat,
    longitude: c.lng,
    timeZone: c.timeZone ?? country.timeZone,
    defaultMethod: country.defaultMethod,
  }))
);

export const DEFAULT_CITY: CityLocation = CITIES[0];

export function getCountries(): CountrySummary[] {
  return COUNTRY_SEEDS.map((country) => {
    const regions = new Set(country.cities.map((c) => c.regionEn));
    return {
      code: country.code,
      nameAr: country.nameAr,
      nameEn: country.nameEn,
      cityCount: country.cities.length,
      regionCount: regions.size,
    };
  });
}

export function getRegionsForCountry(countryCode: string): RegionSummary[] {
  const map = new Map<string, RegionSummary>();
  for (const city of CITIES) {
    if (city.countryCode !== countryCode) continue;
    const key = city.regionEn ?? city.regionAr ?? 'Other';
    const existing = map.get(key);
    if (existing) {
      existing.cityCount += 1;
    } else {
      map.set(key, {
        nameAr: city.regionAr ?? city.countryAr,
        nameEn: city.regionEn ?? city.countryEn ?? key,
        cityCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

export function filterCities(params: {
  query?: string;
  countryCode?: string | null;
  regionEn?: string | null;
}): CityLocation[] {
  const q = (params.query ?? '').trim().toLowerCase();
  return CITIES.filter((c) => {
    if (params.countryCode && c.countryCode !== params.countryCode) return false;
    if (params.regionEn && c.regionEn !== params.regionEn) return false;
    if (!q) return true;
    return (
      c.nameAr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.countryAr.toLowerCase().includes(q) ||
      (c.countryEn ?? '').toLowerCase().includes(q) ||
      (c.regionAr ?? '').toLowerCase().includes(q) ||
      (c.regionEn ?? '').toLowerCase().includes(q)
    );
  });
}

export function findNearestCity(lat: number, lng: number): CityLocation {
  let closest = CITIES[0];
  let bestDist = Infinity;
  for (const city of CITIES) {
    const dLat = city.latitude - lat;
    const dLng = city.longitude - lng;
    const sq = dLat * dLat + dLng * dLng;
    if (sq < bestDist) {
      bestDist = sq;
      closest = city;
    }
  }
  return closest;
}
