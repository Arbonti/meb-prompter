/**
 * MEB Aydın — Sivil Savunma & Acil Durum Veri Modeli
 * AFAD, TÜRKIYE Sivil Savunma ve NATO Standartlarına göre modellenmiş
 * EĞİTİM AMAÇLI statik veridir.
 */

const EMERGENCY_DATA = {
  "EFELER": {
    shelter: {
      name: "Efeler Belediyesi Sivil Savunma Sığınağı",
      address: "Güzelhisar Cad. Belediye Hizmet Binası Bodrum Katı",
      lat: 37.85490, lng: 27.84470,
      distance_school: "~350m (Ortalama Okul Mesafesi)",
      capacity: 3500, type: "Betonarme Bodrum / Sığınak", depth_m: 5, air_filter: true, power_backup: true
    },
    assembly: {
      name: "Aydın Atatürk Stadyumu (Toplanma Alanı)",
      address: "İstiklal Mah. Stadyum Cad., Efeler/Aydın",
      lat: 37.84883, lng: 27.84274,
      distance_school: "~600m", capacity_persons: 12000,
      type: "Açık Alan — Birincil Toplanma Noktası"
    },
    emergency_center: {
      name: "Aydın Devlet Hastanesi",
      address: "Hasınefendi-Ramazan Paşa Mah. Kızılay Cad. No:1/1, Efeler/Aydın",
      lat: 37.84882, lng: 27.84352,
      distance_school: "~800m", phone: "0256 212 0555", afad_phone: "122", acil_phone: "112"
    },
    alert_system: {
      has_siren: true,
      type: "Elektronik Çok Tonlu Siren",
      siren_count: 14,
      radius_km: 3,
      test_schedule: "Her Ayın İlk Çarşamba Günü 11:00",
      afad_radio: "AFAD FM 89.8 MHz",
      local_radio: "Aydın FM 96.5 MHz",
      trt_radio: "TRT Radyo 1 — AM 567 kHz",
      note: "Efeler merkez olması nedeniyle siren ağı en yoğun ilçedir."
    },
    blackout: {
      protocol: "Aktif Prosedür Mevcut",
      curtain_type: "Koyu Renkli Stor/Karartma Perdesi",
      generator_hours: 8,
      emergency_lighting: "Kırmızı Filtreli LED Acil Aydınlatma",
      window_cover: "Alüminyum Folyo / Karartma Bezi",
      exterior_light_disable: true,
      note: "Tüm okullarda karartma tatbikatı yılda 2 kez yapılmalıdır."
    },
    protection: {
      score: 84,
      underground_shelter: "Mevcut (Belediye Binası)",
      visibility: "Orta (Şehir Merkezi)",
      concealment_level: "İyi",
      structural_class: "A — Güçlendirilmiş Betonarme",
      blast_resistance: "Orta Dayanımlı",
      note: "İl merkezi yüksek risk bölgesindedir; binaların bodrum katları sığınak protokolü taşımalıdır."
    },
    communication: {
      radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8",
      emergency_sms: "111 (AFAD Kriz SMS Hattı)",
      afad_app: "AFAD Mobil (iOS/Android)",
      local_fm: "Aydın FM 96.5 — Acil Yayın Kanalı",
      satellite_phone: "Valilikte Mevcut",
      shortwave: "15300 kHz — TRT Kısa Dalga",
      internet_backup: "Belediye Fiber + 4G Alternatif",
      note: "İnternet kesilmesi durumunda FM ve AM radyo birincil bilgi kaynağıdır."
    },
    readiness_score: 84,
    district_note: "İl merkezi sıfatıyla Aydın en kapsamlı sivil savunma altyapısına sahiptir. Konum itibarıyla 1. derece deprem ve olası kara/hava tehdit kuşağında değerlendirilir."
  },

  "NAZİLLİ": {
    shelter: {
      name: "Nazilli Belediyesi Alt Geçit Sığınağı",
      address: "Mithatpaşa Mah. Atatürk Bulvarı Altı",
      lat: 37.91350, lng: 28.31756,
      distance_school: "~400m", capacity: 2200, type: "Tünel Tipi Kentsel Sığınak", depth_m: 4, air_filter: true, power_backup: true
    },
    assembly: {
      name: "Nazilli Cumhuriyet Meydanı",
      address: "Atatürk Mah. Cumhuriyet Meydanı, Nazilli/Aydın",
      lat: 37.91372, lng: 28.31703,
      distance_school: "~300m", capacity_persons: 8000, type: "Açık Alan — Toplanma Noktası"
    },
    emergency_center: {
      name: "Nazilli Devlet Hastanesi",
      address: "Yeşil Mahalle 622. Sokak No:2, Nazilli/Aydın",
      lat: 37.91776, lng: 28.31839,
      distance_school: "~700m", phone: "0256 341 2121", afad_phone: "122", acil_phone: "112"
    },
    alert_system: {
      has_siren: true,
      type: "Elektronik Siren Sistemi",
      siren_count: 9,
      radius_km: 2.5,
      test_schedule: "Her Ayın İlk Çarşamba Günü 11:00",
      afad_radio: "AFAD FM 89.8 MHz",
      local_radio: "Nazilli FM 100.4 MHz",
      trt_radio: "TRT Radyo 1 — AM 567 kHz",
      note: "Nazilli fay hattına yakın konumuyla yüksek sismik risk taşır."
    },
    blackout: {
      protocol: "Aktif Prosedür Mevcut",
      curtain_type: "Koyu Renkli Karartma Perdesi",
      generator_hours: 6,
      emergency_lighting: "Kırmızı LED Acil Aydınlatma",
      window_cover: "Karartma Bezi",
      exterior_light_disable: true,
      note: "Fay hattına yakın bölge; bina güçlendirme önceliklidir."
    },
    protection: {
      score: 76,
      underground_shelter: "Kısmi (Belediye Altgeçidi)",
      visibility: "Orta",
      concealment_level: "Orta",
      structural_class: "B — Standart Betonarme",
      blast_resistance: "Orta Dayanımlı",
      note: "Doğu-batı ticaret güzergahında stratejik konumdadır."
    },
    communication: {
      radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8",
      emergency_sms: "111",
      afad_app: "AFAD Mobil",
      local_fm: "Nazilli FM 100.4 — Acil Yayın",
      satellite_phone: "Kaymakamlıkta Mevcut",
      shortwave: "15300 kHz — TRT Kısa Dalga",
      internet_backup: "4G + Fiber Alternatif",
      note: "Doğu Aydın'ın iletişim merkezi konumundadır."
    },
    readiness_score: 76,
    district_note: "Doğu Aydın'ın en büyük ticaret merkezidir. Fay hattı üzerindeki konumu nedeniyle sismik önlemler birincil önceliktir."
  },

  "SÖKE": {
    shelter: {
      name: "Söke Sivil Savunma Kapalı Garaj Sığınağı",
      address: "Yeni Mah. Kapalı Pazar Yanı, Söke/Aydın",
      lat: 37.75443, lng: 27.40906,
      distance_school: "~450m", capacity: 1800, type: "Yer Altı Park/Sığınak", depth_m: 3, air_filter: false, power_backup: true
    },
    assembly: {
      name: "Söke İlçe Stadyumu",
      address: "Cumhuriyet Mah. Söke/Aydın",
      lat: 37.75265, lng: 27.40559,
      distance_school: "~550m", capacity_persons: 5000, type: "Açık Alan — Toplanma Noktası"
    },
    emergency_center: {
      name: "Söke Fehime Faik Kocagöz Devlet Hastanesi",
      address: "Fevzipaşa Mah. Faik Kocagöz Cad. No:16, Söke/Aydın",
      lat: 37.76449, lng: 27.40303,
      distance_school: "~400m", phone: "0256 512 1181", afad_phone: "122", acil_phone: "112"
    },
    alert_system: {
      has_siren: true,
      type: "Elektromekanik Siren",
      siren_count: 7,
      radius_km: 2,
      test_schedule: "Her Ayın İlk Çarşamba 11:00",
      afad_radio: "AFAD FM 89.8 MHz",
      local_radio: "Söke FM 88.9 MHz",
      trt_radio: "TRT Radyo 1 — AM 567 kHz",
      note: "Ege kıyısına yakın konumu nedeniyle deniz kaynaklı tehditler de değerlendirilir."
    },
    blackout: {
      protocol: "Kısmen Aktif",
      curtain_type: "Koyu Renkli Beze Perde",
      generator_hours: 4,
      emergency_lighting: "Acil LED Aydınlatma",
      window_cover: "Karartma Bezi",
      exterior_light_disable: true,
      note: "Didim-Kuşadası güzergahında stratejik geçiş noktasıdır."
    },
    protection: {
      score: 70,
      underground_shelter: "Kısmi",
      visibility: "Düşük-Orta",
      concealment_level: "Orta",
      structural_class: "B",
      blast_resistance: "Orta",
      note: "Büyük Menderes ovasının alüvyon zemini sismik riski artırır."
    },
    communication: {
      radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8",
      emergency_sms: "111",
      afad_app: "AFAD Mobil",
      local_fm: "Söke FM 88.9",
      satellite_phone: "Kaymakamlıkta Mevcut",
      shortwave: "15300 kHz",
      internet_backup: "4G",
      note: "Didim ve Kuşadası'nın kara ulaşım merkezi konumundadır."
    },
    readiness_score: 70,
    district_note: "Ege kıyısına yakın stratejik konumu nedeniyle deniz ve kara kaynaklı tehditlere karşı hazırlık planlanmalıdır."
  },

  "KUŞADASI": {
    shelter: {
      name: "Kuşadası Kapalı Otopark Sığınağı (Liman Yanı)",
      address: "Atatürk Bulvarı Liman Bölgesi Kapalı Otopark, Kuşadası/Aydın",
      lat: 37.85818, lng: 27.25788,
      distance_school: "~500m", capacity: 1500, type: "Yer Altı Otopark / Sığınak", depth_m: 4, air_filter: false, power_backup: true
    },
    assembly: {
      name: "Kuşadası Atatürk Parkı Toplanma Alanı",
      address: "İnkılap Mah. Atatürk Bulvarı, Kuşadası/Aydın",
      lat: 37.85803, lng: 27.25956,
      distance_school: "~350m", capacity_persons: 6000, type: "Açık Alan — Toplanma Noktası"
    },
    emergency_center: {
      name: "Kuşadası Devlet Hastanesi",
      address: "Türkmen Mah. Hülya Koçyiğit Blv. No:11, Kuşadası/Aydın",
      lat: 37.87846, lng: 27.26774,
      distance_school: "~900m", phone: "0256 612 1020", afad_phone: "122", acil_phone: "112"
    },
    alert_system: {
      has_siren: true,
      type: "Elektronik Deniz Sahil Sireni",
      siren_count: 6,
      radius_km: 2,
      test_schedule: "Her Ayın İlk Çarşamba 11:00",
      afad_radio: "AFAD FM 89.8 MHz",
      local_radio: "Efes FM 92.0 MHz",
      trt_radio: "TRT Radyo 1 — AM 567 kHz",
      note: "Liman yakınlığı nedeniyle deniz kökenli tehditten ek koruma gerektirir."
    },
    blackout: {
      protocol: "Aktif (Liman Bölgesi Özel Prosedürü)",
      curtain_type: "Deniz Yönlü Özel Karartma Perdesi",
      generator_hours: 6,
      emergency_lighting: "Acil LED Kırmızı",
      window_cover: "Karartma Bezi",
      exterior_light_disable: true,
      note: "Sezonluk nüfus artışı nedeniyle yaz tatbikatlara dikkat edilmelidir."
    },
    protection: {
      score: 68,
      underground_shelter: "Mevcut (Liman Otopark)",
      visibility: "Yüksek (Kıyı Konumu)",
      concealment_level: "Düşük-Orta",
      structural_class: "B",
      blast_resistance: "Orta",
      note: "Yüksek turizm yoğunluğu ve liman varlığı kritik güvenlik faktörüdür."
    },
    communication: {
      radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8",
      emergency_sms: "111",
      afad_app: "AFAD Mobil",
      local_fm: "Efes FM 92.0",
      satellite_phone: "Liman İdaresinde Mevcut",
      shortwave: "15300 kHz",
      internet_backup: "Fiber + 4G/5G",
      note: "Liman telsiz sistemleri acil iletişimi desteklemektedir."
    },
    readiness_score: 68,
    district_note: "Liman kenti ve turistik yapısı nedeniyle sezonluk nüfus farklılıkları acil durum planlamasını zorlaştırmaktadır."
  },

  "DİDİM": {
    shelter: {
      name: "Didim Belediyesi Sivil Savunma Sığınağı",
      address: "Cumhuriyet Mah. Kapalı Spor Salonu Altı, Didim/Aydın",
      lat: 37.37215, lng: 27.27180,
      distance_school: "~600m", capacity: 1200, type: "Bodrum Kat Sığınağı", depth_m: 3, air_filter: false, power_backup: true
    },
    assembly: {
      name: "Didim Apollon Tapınak Meydanı (Toplanma)",
      address: "Yenikaya Mah. Didim/Aydın",
      lat: 37.38540, lng: 27.25424,
      distance_school: "~800m", capacity_persons: 5000, type: "Tarihi Açık Alan — Toplanma Noktası"
    },
    emergency_center: {
      name: "Didim İlçe Devlet Hastanesi",
      address: "Cumhuriyet Mah. İnönü Blv. No:130/A, Didim/Aydın",
      lat: 37.37203, lng: 27.27521,
      distance_school: "~500m", phone: "0256 811 2200", afad_phone: "122", acil_phone: "112"
    },
    alert_system: {
      has_siren: true,
      type: "Elektronik Siren (Kıyı Takviyeli)",
      siren_count: 5,
      radius_km: 2,
      test_schedule: "Her Ayın İlk Çarşamba 11:00",
      afad_radio: "AFAD FM 89.8 MHz",
      local_radio: "Didim FM 89.0 MHz",
      trt_radio: "TRT Radyo 1 — AM 567 kHz",
      note: "Kıyı bölgesi; tsunami uyarı sistemi aktif olarak izlenmektedir."
    },
    blackout: {
      protocol: "Kısmen Aktif",
      curtain_type: "Karartma Bezi",
      generator_hours: 4,
      emergency_lighting: "LED Acil",
      window_cover: "Alüminyum Folyo",
      exterior_light_disable: true,
      note: "Hızla büyüyen nüfus yeni okul ve sığınak ihtiyacını artırmaktadır."
    },
    protection: {
      score: 62,
      underground_shelter: "Sınırlı",
      visibility: "Yüksek (Kıyı)",
      concealment_level: "Düşük",
      structural_class: "C — Yeni Yapılar B+",
      blast_resistance: "Düşük-Orta",
      note: "Hızlı büyüme sürecindeki ilçede standart altyapı yetersiz kalabilir."
    },
    communication: {
      radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8",
      emergency_sms: "111",
      afad_app: "AFAD Mobil",
      local_fm: "Didim FM 89.0",
      satellite_phone: "Kaymakamlıkta Mevcut",
      shortwave: "15300 kHz",
      internet_backup: "4G",
      note: "Yazın yoğun turizm döneminde iletişim altyapısı ek yük altına girer."
    },
    readiness_score: 62,
    district_note: "Hızlı nüfus artışına karşın altyapı gelişimi geride kalmaktadır. Kıyı konumu tsunamı riskini öne çıkarmaktadır."
  },

  "GERMENCİK": {
    shelter: {
      name: "Germencik Belediye Hizmet Binası Bodrum Sığınağı",
      address: "Cumhuriyet Mah. Belediye Sarayı",
      lat: 37.867, lng: 27.609,
      distance_school: "~300m",
      capacity: 900,
      type: "Bodrum Kat Sığınağı",
      depth_m: 3,
      air_filter: false,
      power_backup: true
    },
    assembly: {
      name: "Germencik İlçe Stadyumu",
      address: "Yeni Mah.",
      lat: 37.862, lng: 27.610,
      distance_school: "~400m",
      capacity_persons: 3000,
      type: "Açık Alan — Toplanma Noktası"
    },
    emergency_center: {
      name: "Germencik İlçe Hastanesi",
      address: "Sağlık Mah.",
      lat: 37.865, lng: 27.603,
      distance_school: "~600m",
      phone: "0256 541 2020",
      afad_phone: "122",
      acil_phone: "112"
    },
    alert_system: {
      has_siren: true,
      type: "Elektromekanik Siren",
      siren_count: 4,
      radius_km: 1.8,
      test_schedule: "Her Ayın İlk Çarşamba 11:00",
      afad_radio: "AFAD FM 89.8 MHz",
      local_radio: "Aydın FM 96.5 MHz",
      trt_radio: "TRT Radyo 1 — AM 567 kHz",
      note: "Jeotermal sondaj alanları yakınındaki okullarda ek güvenlik gereklidir."
    },
    blackout: {
      protocol: "Temel Prosedür",
      curtain_type: "Koyu Renkli Stor",
      generator_hours: 4,
      emergency_lighting: "Acil LED",
      window_cover: "Karartma Bezi",
      exterior_light_disable: true,
      note: "Jeotermal tesislerin yakınlığı bölgeye özgü risk unsuru oluşturmaktadır."
    },
    protection: {
      score: 65,
      underground_shelter: "Kısmi",
      visibility: "Orta",
      concealment_level: "Orta",
      structural_class: "B",
      blast_resistance: "Orta",
      note: "Jeotermal sahalar zemin istikrarsızlığı yaratabilir."
    },
    communication: {
      radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8",
      emergency_sms: "111",
      afad_app: "AFAD Mobil",
      local_fm: "Aydın FM 96.5",
      satellite_phone: "Kaymakamlıkta Mevcut",
      shortwave: "15300 kHz",
      internet_backup: "4G",
      note: "İzmir-Aydın otoyoluna yakın konum erişimi kolaylaştırır."
    },
    readiness_score: 65,
    district_note: "Jeotermal aktivite bölgeye özgü risk unsuru oluşturmaktadır. Deprem ve jeotermal sarsıntı protokolleri birlikte değerlendirilmelidir."
  },

  "İNCİRLİOVA": {
    shelter: { name: "İncirliova Belediye Binası Sığınağı", address: "Cumhuriyet Mah. İncirliova/Aydın", lat: 37.84942, lng: 27.72236, distance_school: "~350m", capacity: 800, type: "Bodrum Kat Sığınağı", depth_m: 3, air_filter: false, power_backup: true },
    assembly: { name: "İncirliova Merkez Park", address: "Atatürk Mah. İncirliova/Aydın", lat: 37.84965, lng: 27.72019, distance_school: "~300m", capacity_persons: 3000, type: "Açık Alan" },
    emergency_center: { name: "İncirliova Sağlık Merkezi", address: "Cumhuriyet Mah. İncirliova/Aydın", lat: 37.85013, lng: 27.71838, distance_school: "~500m", phone: "0256 753 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektronik Siren", siren_count: 4, radius_km: 1.5, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Efeler ilçesine yakınlığı erken uyarı avantajı sağlar." },
    blackout: { protocol: "Temel Prosedür", curtain_type: "Stor Perde", generator_hours: 3, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 69, underground_shelter: "Kısmi", visibility: "Orta", concealment_level: "Orta", structural_class: "B", blast_resistance: "Orta", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "4G", note: "" },
    readiness_score: 69,
    district_note: "Efeler'e bitişik konumu ve İzmir yolu üzerindeki yeri acil ulaşımı kolaylaştırmaktadır."
  },

  "KOÇARLI": {
    shelter: { name: "Koçarlı Belediye Bodrum Sığınağı", address: "Merkez Mah. Koçarlı/Aydın", lat: 37.76180, lng: 27.69780, distance_school: "~400m", capacity: 600, type: "Bodrum Sığınağı", depth_m: 2.5, air_filter: false, power_backup: false },
    assembly: { name: "Koçarlı Merkez Meydanı", address: "Cumhuriyet Mah. Koçarlı/Aydın", lat: 37.76250, lng: 27.69717, distance_school: "~200m", capacity_persons: 2000, type: "Açık Alan" },
    emergency_center: { name: "Koçarlı Sağlık Merkezi", address: "Sağlık Cad. Koçarlı/Aydın", lat: 37.76013, lng: 27.69617, distance_school: "~350m", phone: "0256 724 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektromekanik Siren", siren_count: 3, radius_km: 1.5, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Dağlık arazi sirenlerin etki alanını daraltmaktadır." },
    blackout: { protocol: "Temel", curtain_type: "Stor Perde", generator_hours: 3, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 58, underground_shelter: "Yok", visibility: "Düşük (Dağlık)", concealment_level: "İyi (Coğrafi)", structural_class: "C", blast_resistance: "Düşük", note: "Dağlık arazi doğal gizlilik sağlamaktadır." },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "3G/4G Zayıf Sinyal", note: "Dağlık bölgede GSM kapsama alanı sınırlıdır." },
    readiness_score: 58,
    district_note: "Dağlık yapı doğal koruma sağlarken iletişim ve altyapı gelişimini kısıtlamaktadır."
  },

  "KÖŞK": {
    shelter: { name: "Köşk Belediye Bodrum Sığınağı", address: "Cumhuriyet Mah. Köşk/Aydın", lat: 37.85374, lng: 28.05102, distance_school: "~300m", capacity: 700, type: "Bodrum Sığınağı", depth_m: 3, air_filter: false, power_backup: true },
    assembly: { name: "Köşk Atatürk Alanı", address: "Atatürk Mah. Köşk/Aydın", lat: 37.85397, lng: 28.05016, distance_school: "~250m", capacity_persons: 2500, type: "Açık Alan" },
    emergency_center: { name: "Köşk Sağlık Merkezi", address: "Sağlık Mah. Köşk/Aydın", lat: 37.85502, lng: 28.05272, distance_school: "~400m", phone: "0256 761 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektronik Siren", siren_count: 4, radius_km: 1.8, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Denizli yolu üzerindeki konumu lojistik avantaj sağlar." },
    blackout: { protocol: "Temel Prosedür", curtain_type: "Stor Perde", generator_hours: 4, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 63, underground_shelter: "Kısmi", visibility: "Orta", concealment_level: "Orta", structural_class: "B", blast_resistance: "Orta", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "4G", note: "" },
    readiness_score: 63,
    district_note: "Denizli-Aydın aksında tarımsal sanayi bölgesidir. Tren bağlantısı acil tahliyeye katkı sağlar."
  },

  "SULTANHİSAR": {
    shelter: { name: "Sultanhisar Belediye Sığınağı", address: "Atatürk Mah. Sultanhisar/Aydın", lat: 37.88920, lng: 28.15192, distance_school: "~350m", capacity: 650, type: "Bodrum Sığınağı", depth_m: 2.5, air_filter: false, power_backup: false },
    assembly: { name: "Sultanhisar Nyssa Parkı", address: "Nyssa Mah. Sultanhisar/Aydın", lat: 37.89063, lng: 28.15241, distance_school: "~450m", capacity_persons: 2500, type: "Açık Alan" },
    emergency_center: { name: "Sultanhisar Sağlık Merkezi", address: "Cumhuriyet Mah. Sultanhisar/Aydın", lat: 37.88784, lng: 28.14820, distance_school: "~400m", phone: "0256 671 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektromekanik Siren", siren_count: 3, radius_km: 1.5, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "" },
    blackout: { protocol: "Temel", curtain_type: "Stor Perde", generator_hours: 3, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 60, underground_shelter: "Yok", visibility: "Düşük", concealment_level: "İyi", structural_class: "B-C", blast_resistance: "Düşük-Orta", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "4G", note: "" },
    readiness_score: 60,
    district_note: "Aydın'ın iç kesiminde sakin bir tarım ilçesidir. Nyssa antik kenti bölgeye tarihi önem katmaktadır."
  },

  "YENİPAZAR": {
    shelter: { name: "Yenipazar Belediye Sığınağı", address: "Merkez Mah. Yenipazar/Aydın", lat: 37.82960, lng: 28.17150, distance_school: "~300m", capacity: 500, type: "Bodrum Sığınağı", depth_m: 2, air_filter: false, power_backup: false },
    assembly: { name: "Yenipazar Merkez Meydan", address: "Atatürk Mah. Yenipazar/Aydın", lat: 37.83010, lng: 28.17250, distance_school: "~200m", capacity_persons: 2000, type: "Açık Alan" },
    emergency_center: { name: "Yenipazar Sağlık Merkezi", address: "Sağlık Mah. Yenipazar/Aydın", lat: 37.82920, lng: 28.17020, distance_school: "~350m", phone: "0256 621 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: false, type: "Yok (Trafik Hoparlör Sistemi ile İkame)", siren_count: 0, radius_km: 0.8, test_schedule: "Belirlenmemiş", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Cittaslow statüsündeki sakin şehirde siren sistemi kurulumu önerilir." },
    blackout: { protocol: "Mevcut Değil", curtain_type: "Standart Perde", generator_hours: 2, emergency_lighting: "Yok", window_cover: "Standart Perde", exterior_light_disable: false, note: "Karartma protokolü acilen geliştirilmelidir." },
    protection: { score: 45, underground_shelter: "Yok", visibility: "Düşük", concealment_level: "İyi (Doğal)", structural_class: "C", blast_resistance: "Düşük", note: "Cittaslow statüsü nedeniyle altyapı minimal tutulmuştur." },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "3G-4G", note: "" },
    readiness_score: 45,
    district_note: "Cittaslow (Sakin Şehir) statüsündeki Yenipazar, sivil savunma altyapısını en kısa sürede geliştirmelidir. Siren sistemi kurulumu öncelikli adımdır."
  },

  "KUYUCAK": {
    shelter: { name: "Kuyucak Belediye Bodrum Sığınağı", address: "Atatürk Mah. Kuyucak/Aydın", lat: 37.91387, lng: 28.45940, distance_school: "~400m", capacity: 600, type: "Bodrum Sığınağı", depth_m: 3, air_filter: false, power_backup: false },
    assembly: { name: "Kuyucak Merkez Meydanı", address: "Cumhuriyet Mah. Kuyucak/Aydın", lat: 37.91400, lng: 28.45860, distance_school: "~300m", capacity_persons: 2000, type: "Açık Alan" },
    emergency_center: { name: "Kuyucak Sağlık Merkezi", address: "Sağlık Mah. Kuyucak/Aydın", lat: 37.91510, lng: 28.46090, distance_school: "~450m", phone: "0256 481 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektromekanik Siren", siren_count: 3, radius_km: 1.5, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "" },
    blackout: { protocol: "Temel", curtain_type: "Stor Perde", generator_hours: 3, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 55, underground_shelter: "Kısmi", visibility: "Düşük", concealment_level: "İyi", structural_class: "B-C", blast_resistance: "Düşük-Orta", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "4G Zayıf", note: "" },
    readiness_score: 55,
    district_note: "Narenciye üretim merkezi. Denizli sınırına yakın konumuyla lojistik avantajı bulunmaktadır."
  },

  "BUHARKENT": {
    shelter: { name: "Buharkent Belediye Sığınağı", address: "Merkez Mah. Buharkent/Aydın", lat: 37.96120, lng: 28.74250, distance_school: "~350m", capacity: 500, type: "Bodrum Sığınağı", depth_m: 2.5, air_filter: false, power_backup: false },
    assembly: { name: "Buharkent Merkez Park", address: "Cumhuriyet Mah. Buharkent/Aydın", lat: 37.96150, lng: 28.74220, distance_school: "~250m", capacity_persons: 1500, type: "Açık Alan" },
    emergency_center: { name: "Buharkent Sağlık Ocağı", address: "Sağlık Mah. Buharkent/Aydın", lat: 37.96180, lng: 28.74310, distance_school: "~400m", phone: "0256 471 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektronik Siren", siren_count: 2, radius_km: 1.2, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Jeotermal enerji santralleri yakınında özel güvenlik protokolü gerektirir." },
    blackout: { protocol: "Temel", curtain_type: "Stor Perde", generator_hours: 2, emergency_lighting: "Yok", window_cover: "Standart Perde", exterior_light_disable: false, note: "" },
    protection: { score: 52, underground_shelter: "Yok", visibility: "Düşük", concealment_level: "İyi (Coğrafi)", structural_class: "C", blast_resistance: "Düşük", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "3G", note: "" },
    readiness_score: 52,
    district_note: "Jeotermal enerji potansiyeli yüksek, ancak sivil savunma altyapısı güçlendirilmeye ihtiyaç duymaktadır."
  },

  "KARACASU": {
    shelter: { name: "Karacasu Belediye Sığınağı", address: "Cumhuriyet Mah. Karacasu/Aydın", lat: 37.72890, lng: 28.60783, distance_school: "~400m", capacity: 600, type: "Bodrum Sığınağı", depth_m: 2.5, air_filter: false, power_backup: false },
    assembly: { name: "Karacasu Afrodisias Parkı", address: "Merkez Mah. Karacasu/Aydın", lat: 37.72810, lng: 28.60620, distance_school: "~300m", capacity_persons: 2000, type: "Açık Alan" },
    emergency_center: { name: "Karacasu İlçe Devlet Hastanesi", address: "Hastane Cad. Karacasu/Aydın", lat: 37.73002, lng: 28.61080, distance_school: "~500m", phone: "0256 552 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektromekanik Siren", siren_count: 3, radius_km: 1.5, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "" },
    blackout: { protocol: "Temel", curtain_type: "Stor Perde", generator_hours: 3, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 57, underground_shelter: "Kısmi", visibility: "Düşük", concealment_level: "İyi", structural_class: "B-C", blast_resistance: "Orta", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "4G Zayıf", note: "" },
    readiness_score: 57,
    district_note: "Afrodisias Antik Kenti'ne ev sahipliği yapan ilçe, turizm sezonunda ek nüfus taşımaktadır."
  },

  "BOZDOĞAN": {
    shelter: { name: "Bozdoğan Belediye Sığınağı", address: "Cumhuriyet Mah. Bozdoğan/Aydın", lat: 37.67120, lng: 28.31175, distance_school: "~500m", capacity: 500, type: "Bodrum Sığınağı", depth_m: 2, air_filter: false, power_backup: false },
    assembly: { name: "Bozdoğan Kemer Barajı Rekreasyon Alanı", address: "Baraj Mah. Bozdoğan/Aydın", lat: 37.67840, lng: 28.30430, distance_school: "~1200m", capacity_persons: 1500, type: "Açık Alan (Uzak)" },
    emergency_center: { name: "Bozdoğan Sağlık Merkezi", address: "Sağlık Cad. Bozdoğan/Aydın", lat: 37.67025, lng: 28.31010, distance_school: "~400m", phone: "0256 432 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektromekanik Siren", siren_count: 2, radius_km: 1.2, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Kemer Barajı yakınlığı su baskını riskini artırmaktadır." },
    blackout: { protocol: "Yok/Minimal", curtain_type: "Standart Perde", generator_hours: 2, emergency_lighting: "Yok", window_cover: "Yok", exterior_light_disable: false, note: "Karartma protokolü geliştirilmesi acil önerilir." },
    protection: { score: 48, underground_shelter: "Yok", visibility: "Düşük (Dağlık)", concealment_level: "Çok İyi (Coğrafi)", structural_class: "C", blast_resistance: "Düşük", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "3G Zayıf", note: "Dağlık arazi iletişimi güçleştirmektedir." },
    readiness_score: 48,
    district_note: "Kemer Barajı yakınlığı sel riski oluşturuyor. Dağlık yapı doğal gizlilik avantajı sağlıyor ancak iletişim ve altyapı yetersizdir."
  },

  "KARPUZLU": {
    shelter: { name: "Karpuzlu Belediye Binası Bodrum Sığınağı", address: "Merkez Mah. Karpuzlu/Aydın", lat: 37.54820, lng: 27.82820, distance_school: "~300m", capacity: 400, type: "Bodrum Sığınağı", depth_m: 2, air_filter: false, power_backup: false },
    assembly: { name: "Karpuzlu Merkez Meydanı", address: "Atatürk Mah. Karpuzlu/Aydın", lat: 37.54813, lng: 27.82754, distance_school: "~200m", capacity_persons: 1200, type: "Açık Alan" },
    emergency_center: { name: "Karpuzlu Sağlık Ocağı", address: "Sağlık Mah. Karpuzlu/Aydın", lat: 37.54850, lng: 27.82910, distance_school: "~350m", phone: "0256 421 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: false, type: "Yok", siren_count: 0, radius_km: 0, test_schedule: "Yok", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "Siren sistemi yoktur. Acil bildirim telefon zinciri ile yapılmaktadır." },
    blackout: { protocol: "Yok", curtain_type: "Standart Perde", generator_hours: 0, emergency_lighting: "Yok", window_cover: "Yok", exterior_light_disable: false, note: "Temel altyapı geliştirilmelidir." },
    protection: { score: 40, underground_shelter: "Yok", visibility: "Çok Düşük (Dağlık Uzak)", concealment_level: "Çok İyi (Coğrafi)", structural_class: "C", blast_resistance: "Çok Düşük", note: "" },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Zayıf Sinyal", satellite_phone: "Yok", shortwave: "15300 kHz", internet_backup: "3G—Bağlantı Kesilebilir", note: "Karpuzlu en zor iletişim koşullarına sahip ilçe konumundadır." },
    readiness_score: 40,
    district_note: "Alinda antik kentine ev sahipliği yapan Karpuzlu, sivil savunma altyapısı açısından en öncelikli gelişim gerektiren ilçedir."
  },

  "ÇİNE": {
    shelter: { name: "Çine Belediyesi Sivil Savunma Sığınağı", address: "Cumhuriyet Mah. Belediye Binası Yanı, Çine/Aydın", lat: 37.61783, lng: 28.06523, distance_school: "~400m", capacity: 900, type: "Betonarme Bodrum Sığınağı", depth_m: 3, air_filter: false, power_backup: true },
    assembly: { name: "Çine İlçe Stadyumu", address: "Spor Mah. Çine/Aydın", lat: 37.61448, lng: 28.06280, distance_school: "~500m", capacity_persons: 3000, type: "Açık Alan" },
    emergency_center: { name: "Çine Devlet Hastanesi", address: "Hastane Cad. Çine/Aydın", lat: 37.61520, lng: 28.06840, distance_school: "~450m", phone: "0256 714 2020", afad_phone: "122", acil_phone: "112" },
    alert_system: { has_siren: true, type: "Elektronik Siren", siren_count: 5, radius_km: 2, test_schedule: "Her Ayın İlk Çarşamba 11:00", afad_radio: "AFAD FM 89.8", local_radio: "Aydın FM 96.5", trt_radio: "TRT Radyo 1 AM 567", note: "2. derece deprem bölgesi; zemin yapısı diğer ilçelere göre daha serttir." },
    blackout: { protocol: "Aktif", curtain_type: "Koyu Stor Perde", generator_hours: 4, emergency_lighting: "Acil LED", window_cover: "Karartma Bezi", exterior_light_disable: true, note: "" },
    protection: { score: 67, underground_shelter: "Kısmi", visibility: "Düşük-Orta", concealment_level: "İyi", structural_class: "B", blast_resistance: "Orta-İyi", note: "Sert zemin yapısı bina dayanımını artırmaktadır." },
    communication: { radio: "TRT Radyo 1 AM 567 + AFAD FM 89.8", emergency_sms: "111", afad_app: "AFAD Mobil", local_fm: "Aydın FM 96.5", satellite_phone: "Kaymakamlıkta Mevcut", shortwave: "15300 kHz", internet_backup: "4G", note: "" },
    readiness_score: 67,
    district_note: "Aydın'ın en düşük sismik riskli ilçelerinden biridir. 2. derece deprem bölgesindeki sert zemin yapısı avantaj oluşturmaktadır."
  }
};

// ============== AFAD ACIL DURUM CANTASI İÇERİĞİ ==============
const EMERGENCY_BAG_CONTENTS = {
  zorunlu: [
    { icon: "💧", item: "Su (kişi başı min. 3 litre)", detail: "En az 72 saatlik su rezervi" },
    { icon: "🍱", item: "Hazır/Uzun Ömürlü Gıda", detail: "Enerji barları, kuru meyve, konserve" },
    { icon: "🩺", item: "İlk Yardım Kiti", detail: "Bandaj, antiseptik, ilaçlar, turnike" },
    { icon: "🔦", item: "El Feneri + Yedek Pil", detail: "Dinamo veya güneş enerjili tercih edilmeli" },
    { icon: "📻", item: "Bataryalı/Krank Radyo", detail: "AFAD FM ve TRT kanalları için şartsız" },
    { icon: "🪙", item: "Nakit Para", detail: "Küçük bozuk para dahil, banka sistemleri çalışmayabilir" },
    { icon: "📄", item: "Önemli Belgeler (Kopyalar)", detail: "Kimlik, pasaport, tapu, sigorta poliçesi" },
    { icon: "🔑", item: "Yedek Anahtar", detail: "Ev ve araç yedek anahtarı" },
    { icon: "👕", item: "Yedek Kıyafet", detail: "3 günlük mevsime uygun" },
    { icon: "🔋", item: "Taşınabilir Şarj Cihazı", detail: "Telefon için yüksek kapasiteli powerbank" }
  ],
  ek_onerilen: [
    { icon: "😷", item: "N95 Maske (10 adet)", detail: "Kimyasal/toz koruması için" },
    { icon: "🧤", item: "Eldiven", detail: "Çalışma eldiveni" },
    { icon: "🪖", item: "Koruyucu Kask/Baret", detail: "Enkaz altı için" },
    { icon: "🗺️", item: "Basılı Harita", detail: "GPS çalışmadığında şehir/bölge haritası" },
    { icon: "🕯️", item: "Mum ve Çakmak", detail: "Uzun yanma süreli" },
    { icon: "📋", item: "Acil İletişim Listesi", detail: "Aile, doktor, okul, komşu telefonları" }
  ]
};

// ============== İKAZ VE ALARM SİNYAL KODLARI ==============
const SIREN_CODES = {
  "Hava Tehlike": { sound: "Yükselen ton — 3 dakika sürekli", action: "Derhal sığınağa girin!" },
  "Hava Bitti": { sound: "Sabit uzun ton — 1 dakika", action: "Sığınaktan dikkatli çıkın" },
  "Kimyasal Tehlike": { sound: "Kısa-uzun-kısa dizi — 3 kez tekrar", action: "Binayı terketmeyin, pencereleri bantlayın" },
  "Nükleer Tehlike": { sound: "3 kısa + 1 uzun — 3 kez tekrar", action: "Kalın beton altında kalın, 14 gün içerde" },
  "Tahliye": { sound: "Sürekli kısa siren — 5 dakika", action: "Güzergahı takip edin" },
  "Test/Tatbikat": { sound: "Sabit ton — 30 saniye", action: "Test sinyali, işlem gerekmez" }
};
