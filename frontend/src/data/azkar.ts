// ─── Azkar Data ───────────────────────────────────────────────────────────────
// Bilingual (Arabic + English) authentic adhkar with sources and repetition counts.

export interface Zikr {
  ar: string;
  en: string;
  count: number;
  source?: string;
  sourceEn?: string;
  benefit?: string;
  benefitEn?: string;
}

export interface AzkarCategory {
  id: string;
  ar: string;
  en: string;
  icon: string;
  description: string;
  descriptionEn: string;
  items: Zikr[];
}

export const AZKAR: AzkarCategory[] = [
  // ── Morning ──
  {
    id: "morning",
    ar: "أذكار الصباح",
    en: "Morning Adhkar",
    icon: "🌅",
    description: "تُقرأ من بعد الفجر إلى الشروق",
    descriptionEn: "Recited from Fajr until sunrise",
    items: [
      {
        ar: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        en: "I seek refuge in Allah from the accursed Satan. Allah — there is no deity except Him, the Ever-Living, the Sustainer. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass nothing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
        count: 1,
        source: "البقرة ٢٥٥ (آية الكرسي)",
        sourceEn: "Quran 2:255 (Ayat al-Kursi)",
      },
      {
        ar: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        en: "In the name of Allah, the Most Gracious, the Most Merciful. Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.",
        count: 3,
        source: "سورة الإخلاص",
        sourceEn: "Surah Al-Ikhlas",
      },
      {
        ar: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِن شَرِّ مَا خَلَقَ ۞ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۞ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۞ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        en: "Say: I seek refuge in the Lord of daybreak — from the evil of that which He created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.",
        count: 3,
        source: "سورة الفلق",
        sourceEn: "Surah Al-Falaq",
      },
      {
        ar: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ ۞ إِلَهِ النَّاسِ ۞ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۞ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۞ مِنَ الْجِنَّةِ وَالنَّاسِ",
        en: "Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers in the breasts of mankind, from among the jinn and mankind.",
        count: 3,
        source: "سورة الناس",
        sourceEn: "Surah An-Nas",
      },
      {
        ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ",
        en: "We have entered the morning and the dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped except Allah alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it, and I seek refuge in You from the evil of this day and the evil of what follows it.",
        count: 1,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
        en: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.",
        count: 1,
        source: "الترمذي",
        sourceEn: "At-Tirmidhi",
      },
      {
        ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        en: "O Allah, You are my Lord. There is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me, and I acknowledge my sin, so forgive me — for none forgives sins but You.",
        count: 1,
        source: "البخاري — سيد الاستغفار",
        sourceEn: "Bukhari — Master of Seeking Forgiveness",
        benefit: "من قالها موقناً بها فمات من يومه قبل أن يمسي فهو من أهل الجنة",
        benefitEn: "Whoever says this with certainty and dies that day before evening will be of the people of Paradise.",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
        en: "O Allah, I have entered the morning calling You and all the bearers of Your throne, Your angels and all of Your creation to witness that You are Allah, there is none worthy of worship but You alone, You have no partners, and that Muhammad is Your servant and messenger.",
        count: 4,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
        en: "O Allah, whatever blessing has been received by me or any of Your creation this morning is from You alone — You have no partner. So for You is all praise, and to You is all thanks.",
        count: 1,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",
        en: "O Allah, grant my body health. O Allah, grant my hearing health. O Allah, grant my sight health. There is no god but You.",
        count: 3,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
        en: "O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. There is no god but You.",
        count: 3,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
        en: "Allah is sufficient for me. There is no god but Him. Upon Him I rely, and He is Lord of the magnificent Throne.",
        count: 7,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي",
        en: "O Allah, I ask You for pardon and well-being in this life and the next. O Allah, I ask You for pardon and well-being in my religious and worldly affairs, my family and my wealth.",
        count: 1,
        source: "أبو داود وابن ماجه",
        sourceEn: "Abu Dawud, Ibn Majah",
      },
      {
        ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        en: "In the name of Allah with whose name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.",
        count: 3,
        source: "أبو داود والترمذي",
        sourceEn: "Abu Dawud, At-Tirmidhi",
      },
      {
        ar: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        en: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.",
        count: 3,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        en: "O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs and do not entrust me to myself even for the blink of an eye.",
        count: 1,
        source: "النسائي",
        sourceEn: "An-Nasa'i",
      },
      {
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        en: "Glory is to Allah and praise is to Him.",
        count: 100,
        source: "مسلم",
        sourceEn: "Muslim",
        benefit: "حُطَّتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ",
        benefitEn: "His sins will be forgiven, even if they were like the foam of the sea.",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        en: "There is no god but Allah alone, without partner. To Him belongs the dominion and to Him belongs all praise, and He is over all things omnipotent.",
        count: 10,
        source: "النسائي",
        sourceEn: "An-Nasa'i",
      },
      {
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
        en: "Glory is to Allah and praise is to Him, by the number of His creation, by His pleasure, by the weight of His Throne, and by the ink of His words.",
        count: 3,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        en: "I seek the forgiveness of Allah and turn to Him in repentance.",
        count: 100,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
      {
        ar: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
        en: "O Allah, send prayers and peace upon our Prophet Muhammad.",
        count: 10,
        source: "الطبراني",
        sourceEn: "At-Tabarani",
      },
    ],
  },

  // ── Evening ──
  {
    id: "evening",
    ar: "أذكار المساء",
    en: "Evening Adhkar",
    icon: "🌇",
    description: "تُقرأ من بعد العصر إلى المغرب",
    descriptionEn: "Recited from Asr until Maghrib",
    items: [
      {
        ar: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ...",
        en: "I seek refuge in Allah from Satan. Allah — there is no deity except Him, the Ever-Living, the Sustainer... (Ayat al-Kursi)",
        count: 1,
        source: "البقرة ٢٥٥",
        sourceEn: "Quran 2:255 (Ayat al-Kursi)",
      },
      {
        ar: "قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        en: "Say: He is Allah, the One...",
        count: 3,
        source: "سورة الإخلاص",
        sourceEn: "Surah Al-Ikhlas",
      },
      {
        ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِن شَرِّ مَا خَلَقَ...",
        en: "Say: I seek refuge in the Lord of daybreak...",
        count: 3,
        source: "سورة الفلق",
        sourceEn: "Surah Al-Falaq",
      },
      {
        ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ...",
        en: "Say: I seek refuge in the Lord of mankind...",
        count: 3,
        source: "سورة الناس",
        sourceEn: "Surah An-Nas",
      },
      {
        ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا",
        en: "We have entered the evening and the dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped but Allah alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it, and I seek refuge in You from the evil of this night and the evil of what follows it.",
        count: 1,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
        en: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.",
        count: 1,
        source: "الترمذي",
        sourceEn: "At-Tirmidhi",
      },
      {
        ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ... (سيد الاستغفار)",
        en: "O Allah, You are my Lord. There is no god but You... (Master of Seeking Forgiveness)",
        count: 1,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        en: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        count: 3,
        source: "مسلم",
        sourceEn: "Muslim",
        benefit: "من قالها لم يضره شيء في تلك الليلة",
        benefitEn: "Whoever says this will not be harmed that night.",
      },
      {
        ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        en: "In the name of Allah with whose name nothing can harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.",
        count: 3,
        source: "أبو داود والترمذي",
        sourceEn: "Abu Dawud, At-Tirmidhi",
      },
      {
        ar: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        en: "I am pleased with Allah as my Lord, Islam as my religion, and Muhammad (peace be upon him) as my Prophet.",
        count: 3,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        en: "O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs and do not leave me to myself for the blink of an eye.",
        count: 1,
        source: "النسائي",
        sourceEn: "An-Nasa'i",
      },
      {
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        en: "Glory is to Allah and praise is to Him.",
        count: 100,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        en: "I seek forgiveness from Allah and repent to Him.",
        count: 100,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
        en: "O Allah, send prayers and peace upon our Prophet Muhammad.",
        count: 10,
        source: "الطبراني",
        sourceEn: "At-Tabarani",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
        en: "O Allah, I have entered the evening calling You and all the bearers of Your throne, Your angels and all of Your creation to witness that You are Allah, there is none worthy of worship but You, alone, without partner; and that Muhammad is Your servant and messenger.",
        count: 4,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
    ],
  },

  // ── After Prayer ──
  {
    id: "after_prayer",
    ar: "أذكار بعد الصلاة",
    en: "After Prayer Adhkar",
    icon: "🕌",
    description: "تُقرأ بعد كل صلاة مفروضة",
    descriptionEn: "Recited after every obligatory prayer",
    items: [
      {
        ar: "أَسْتَغْفِرُ اللَّهَ",
        en: "I seek the forgiveness of Allah.",
        count: 3,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
        en: "O Allah, You are Peace and from You comes Peace. Blessed are You, O Possessor of Majesty and Honor.",
        count: 1,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
        en: "There is no god but Allah alone, without partner. To Him belongs all dominion and praise, and He is over all things omnipotent. O Allah, none can withhold what You give and none can give what You withhold; and no wealth or fortune avails its possessor against You.",
        count: 1,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
      {
        ar: "سُبْحَانَ اللَّهِ",
        en: "Glory is to Allah.",
        count: 33,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "الْحَمْدُ لِلَّهِ",
        en: "All praise is for Allah.",
        count: 33,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "اللَّهُ أَكْبَرُ",
        en: "Allah is the Greatest.",
        count: 33,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        en: "There is no god but Allah alone, without partner. To Him belongs the dominion and praise, and He is over all things omnipotent.",
        count: 1,
        source: "مسلم — يُتمّ به المئة",
        sourceEn: "Muslim — completes the 100",
        benefit: "غُفِرَت خطاياه وإن كانت مثل زبد البحر",
        benefitEn: "His sins are forgiven, even if they were like the foam of the sea.",
      },
      {
        ar: "قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ...",
        en: "Surah Al-Ikhlas",
        count: 1,
        source: "أبو داود — بعد كل صلاة",
        sourceEn: "Abu Dawud — after every prayer",
      },
      {
        ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...",
        en: "Surah Al-Falaq",
        count: 1,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ...",
        en: "Surah An-Nas",
        count: 1,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... (آية الكرسي)",
        en: "Ayat al-Kursi (Quran 2:255)",
        count: 1,
        source: "النسائي — من قرأها دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت",
        sourceEn: "An-Nasa'i — nothing prevents Paradise except death",
      },
      {
        ar: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ",
        en: "O Allah, help me to remember You, to thank You, and to worship You in the best manner.",
        count: 1,
        source: "أبو داود والنسائي",
        sourceEn: "Abu Dawud, An-Nasa'i",
      },
    ],
  },

  // ── Sleep ──
  {
    id: "sleep",
    ar: "أذكار النوم",
    en: "Sleep Adhkar",
    icon: "🌙",
    description: "تُقرأ قبل النوم",
    descriptionEn: "Recited before going to sleep",
    items: [
      {
        ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... (آية الكرسي)",
        en: "Ayat al-Kursi (Quran 2:255)",
        count: 1,
        source: "البخاري — لم يزل عليك من الله حافظ ولا يقربك شيطان حتى تصبح",
        sourceEn: "Bukhari — A guardian from Allah will protect you and no devil will come near you until morning.",
      },
      {
        ar: "قُلْ هُوَ اللَّهُ أَحَدٌ، قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، قُلْ أَعُوذُ بِرَبِّ النَّاسِ — يجمع كفّيه وينفث فيهما ويقرؤها ثلاثاً ثم يمسح بهما ما استطاع من جسده",
        en: "Recite Al-Ikhlas, Al-Falaq and An-Nas — Cup your hands together, blow into them, recite these surahs three times, then wipe over your body.",
        count: 3,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ",
        en: "In Your name, my Lord, I lay down my side, and in Your name I raise it. If You should take my soul, then have mercy upon it, and if You should return it, then protect it as You protect Your righteous servants.",
        count: 1,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
      {
        ar: "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا",
        en: "O Allah, in Your name I die and live.",
        count: 1,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "سُبْحَانَ اللَّهِ",
        en: "Glory is to Allah.",
        count: 33,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
      {
        ar: "الْحَمْدُ لِلَّهِ",
        en: "All praise is for Allah.",
        count: 33,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
      {
        ar: "اللَّهُ أَكْبَرُ",
        en: "Allah is the Greatest.",
        count: 34,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
      {
        ar: "اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَرَبَّ الْعَرْشِ الْعَظِيمِ، رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ، فَالِقَ الْحَبِّ وَالنَّوَى، وَمُنْزِلَ التَّوْرَاةِ وَالْإِنْجِيلِ وَالْفُرْقَانِ، أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ، اللَّهُمَّ أَنْتَ الْأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ، وَأَنْتَ الْآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ، وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ، وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ، اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ",
        en: "O Allah, Lord of the seven heavens and Lord of the magnificent Throne, our Lord and Lord of everything, Splitter of the grain and the date stone, Revealer of the Torah, the Gospel and the Criterion. I seek refuge in You from the evil of everything in Your grasp. O Allah, You are the First, so there is nothing before You; You are the Last, so there is nothing after You; You are the Manifest, so there is nothing above You; You are the Hidden, so there is nothing below You. Settle our debt for us and free us from poverty.",
        count: 1,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ... (آخر آيتين من البقرة)",
        en: "The last two verses of Surah Al-Baqarah (2:285–286)",
        count: 1,
        source: "البخاري ومسلم — كفتاه",
        sourceEn: "Bukhari & Muslim — They will suffice him.",
      },
      {
        ar: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ",
        en: "O Allah, I have submitted myself to You, entrusted my affairs to You, turned my face to You, and committed my back to You — out of desire and fear of You. There is no refuge nor escape from You except to You. I believe in Your Book which You revealed and the Prophet whom You sent.",
        count: 1,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
    ],
  },

  // ── Waking up ──
  {
    id: "waking",
    ar: "أذكار الاستيقاظ",
    en: "Waking-Up Adhkar",
    icon: "☀️",
    description: "تُقرأ عند الاستيقاظ من النوم",
    descriptionEn: "Recited upon waking up",
    items: [
      {
        ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        en: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.",
        count: 1,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ، رَبِّ اغْفِرْ لِي",
        en: "There is no god but Allah alone, without partner. To Him belongs the dominion and praise, and He is over all things omnipotent. Glory is to Allah, and praise is to Him, and there is no god but Allah, and Allah is the Greatest, and there is no power and no might except in Allah, the Most High, the Most Great. My Lord, forgive me.",
        count: 1,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ",
        en: "All praise is for Allah who restored to me my health and returned my soul to me, and has permitted me to remember Him.",
        count: 1,
        source: "الترمذي",
        sourceEn: "At-Tirmidhi",
      },
    ],
  },

  // ── Duha ──
  {
    id: "duha",
    ar: "أذكار الضحى",
    en: "Duha Adhkar",
    icon: "🌤️",
    description: "تُقرأ بعد طلوع الشمس وارتفاعها",
    descriptionEn: "Recited after sunrise (forenoon)",
    items: [
      {
        ar: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
        en: "O Allah, send prayers and peace upon our Prophet Muhammad.",
        count: 10,
        source: "الطبراني",
        sourceEn: "At-Tabarani",
      },
      {
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        en: "Glory is to Allah and praise is to Him.",
        count: 100,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ",
        en: "I seek forgiveness from Allah the Magnificent, and I repent to Him.",
        count: 100,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        en: "There is no god but Allah alone, without partner. To Him belongs the dominion and praise, and He is over all things omnipotent.",
        count: 10,
        source: "أحمد",
        sourceEn: "Ahmad",
      },
    ],
  },

  // ── Travel ──
  {
    id: "travel",
    ar: "أذكار السفر",
    en: "Travel Adhkar",
    icon: "✈️",
    description: "تُقرأ عند السفر والركوب",
    descriptionEn: "Recited when traveling or mounting a vehicle",
    items: [
      {
        ar: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ، اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا، وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ",
        en: "Allah is the Greatest, Allah is the Greatest, Allah is the Greatest. Glory is to the One who has subjugated this to us, for we were never capable, and indeed to our Lord we will return. O Allah, we ask You on this journey of ours for righteousness, piety and deeds that are pleasing to You. O Allah, ease our journey and shorten its distance for us. O Allah, You are our Companion on the journey and the Successor over our family. O Allah, I seek refuge in You from the difficulties of travel, from sorrowful sights, and from finding our family and property in misfortune upon our return.",
        count: 1,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا إِنَّ رَبِّي لَغَفُورٌ رَحِيمٌ",
        en: "In the name of Allah is its course and its anchorage. Indeed, my Lord is Forgiving and Merciful.",
        count: 1,
        source: "هود ٤١",
        sourceEn: "Quran 11:41",
      },
    ],
  },

  // ── Food ──
  {
    id: "food",
    ar: "أذكار الطعام",
    en: "Eating Adhkar",
    icon: "🍽️",
    description: "تُقرأ قبل وبعد الطعام",
    descriptionEn: "Recited before and after eating",
    items: [
      {
        ar: "بِسْمِ اللَّهِ",
        en: "In the name of Allah. (Said before eating)",
        count: 1,
        source: "أبو داود",
        sourceEn: "Abu Dawud",
      },
      {
        ar: "بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ",
        en: "In the name of Allah, at its beginning and at its end. (If forgotten and remembered during the meal)",
        count: 1,
        source: "أبو داود والترمذي",
        sourceEn: "Abu Dawud, At-Tirmidhi",
      },
      {
        ar: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
        en: "All praise is for Allah who fed me this and provided it for me, without any might or power from myself.",
        count: 1,
        source: "أبو داود والترمذي",
        sourceEn: "Abu Dawud, At-Tirmidhi",
        benefit: "غُفر له ما تقدّم من ذنبه",
        benefitEn: "His previous sins will be forgiven.",
      },
      {
        ar: "اللَّهُمَّ بَارِكْ لَنَا فِيهِ، وَأَطْعِمْنَا خَيْرًا مِنْهُ",
        en: "O Allah, bless it for us and feed us with better than it. (When drinking milk)",
        count: 1,
        source: "أبو داود والترمذي",
        sourceEn: "Abu Dawud, At-Tirmidhi",
      },
    ],
  },

  // ── General ──
  {
    id: "general",
    ar: "أدعية مختارة",
    en: "Selected Supplications",
    icon: "📿",
    description: "أدعية متنوعة للاستعمال اليومي",
    descriptionEn: "Various supplications for daily use",
    items: [
      {
        ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        count: 1,
        source: "البقرة ٢٠١",
        sourceEn: "Quran 2:201",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
        en: "O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.",
        count: 1,
        source: "مسلم",
        sourceEn: "Muslim",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
        en: "O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and oppression by men.",
        count: 1,
        source: "البخاري",
        sourceEn: "Bukhari",
      },
      {
        ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        en: "Allah is sufficient for us, and He is the best Disposer of affairs.",
        count: 1,
        source: "آل عمران ١٧٣",
        sourceEn: "Quran 3:173",
      },
      {
        ar: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
        en: "There is no god but You, glory is to You. Indeed I was among the wrongdoers. (Dua of Yunus AS)",
        count: 1,
        source: "الأنبياء ٨٧",
        sourceEn: "Quran 21:87",
      },
      {
        ar: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
        en: "O Allah, send prayers upon Muhammad and the family of Muhammad as You sent prayers upon Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy and Glorious. O Allah, bless Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy and Glorious. (Ibrahimi Salah)",
        count: 1,
        source: "البخاري ومسلم",
        sourceEn: "Bukhari & Muslim",
      },
    ],
  },
];

// Helper to look up category by id
export const azkarById = (id: string) => AZKAR.find(c => c.id === id);
