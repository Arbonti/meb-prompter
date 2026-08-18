import urllib.request, urllib.parse, json, time

queries = [
  ('EFELER', 'shelter', 'Efeler Belediyesi, Aydın'),
  ('EFELER', 'assembly', 'Atatürk Stadyumu, Efeler, Aydın'),
  ('EFELER', 'emergency_center', 'Aydın Devlet Hastanesi, Aydın'),

  ('NAZİLLİ', 'shelter', 'Nazilli Belediyesi, Aydın'),
  ('NAZİLLİ', 'assembly', 'Nazilli Cumhuriyet Meydanı, Aydın'),
  ('NAZİLLİ', 'emergency_center', 'Nazilli Devlet Hastanesi, Aydın'),

  ('SÖKE', 'shelter', 'Söke Belediyesi, Aydın'),
  ('SÖKE', 'assembly', 'Söke İlçe Stadyumu, Aydın'),
  ('SÖKE', 'emergency_center', 'Söke Fehime Faik Kocagöz, Aydın'),

  ('KUŞADASI', 'shelter', 'Kuşadası Belediyesi, Aydın'),
  ('KUŞADASI', 'assembly', 'Kuşadası El Heykeli, Aydın'),
  ('KUŞADASI', 'emergency_center', 'Kuşadası Devlet Hastanesi, Aydın'),

  ('DİDİM', 'shelter', 'Didim Belediyesi, Aydın'),
  ('DİDİM', 'assembly', 'Didim Apollon Tapınağı, Aydın'),
  ('DİDİM', 'emergency_center', 'Didim Devlet Hastanesi, Aydın'),

  ('GERMENCİK', 'shelter', 'Germencik Belediyesi, Aydın'),
  ('GERMENCİK', 'assembly', 'Germencik Cumhuriyet Meydanı, Aydın'),
  ('GERMENCİK', 'emergency_center', 'Germencik Devlet Hastanesi, Aydın'),

  ('İNCİRLİOVA', 'shelter', 'İncirliova Belediyesi, Aydın'),
  ('İNCİRLİOVA', 'assembly', 'İncirliova Cumhuriyet Meydanı, Aydın'),
  ('İNCİRLİOVA', 'emergency_center', 'İncirliova Sağlık, Aydın'),

  ('KOÇARLI', 'shelter', 'Koçarlı Belediyesi, Aydın'),
  ('KOÇARLI', 'assembly', 'Koçarlı Cumhuriyet Meydanı, Aydın'),
  ('KOÇARLI', 'emergency_center', 'Koçarlı Devlet Hastanesi, Aydın'),

  ('KÖŞK', 'shelter', 'Köşk Belediyesi, Aydın'),
  ('KÖŞK', 'assembly', 'Köşk Cumhuriyet Meydanı, Aydın'),
  ('KÖŞK', 'emergency_center', 'Köşk Devlet Hastanesi, Aydın'),

  ('SULTANHİSAR', 'shelter', 'Sultanhisar Belediyesi, Aydın'),
  ('SULTANHİSAR', 'assembly', 'Sultanhisar Nysa Antik Kenti, Aydın'),
  ('SULTANHİSAR', 'emergency_center', 'Sultanhisar Devlet Hastanesi, Aydın'),

  ('YENİPAZAR', 'shelter', 'Yenipazar Belediyesi, Aydın'),
  ('YENİPAZAR', 'assembly', 'Yenipazar Cumhuriyet Meydanı, Aydın'),
  ('YENİPAZAR', 'emergency_center', 'Yenipazar Devlet Hastanesi, Aydın'),

  ('KUYUCAK', 'shelter', 'Kuyucak Belediyesi, Aydın'),
  ('KUYUCAK', 'assembly', 'Kuyucak Cumhuriyet Meydanı, Aydın'),
  ('KUYUCAK', 'emergency_center', 'Kuyucak Devlet Hastanesi, Aydın'),

  ('BUHARKENT', 'shelter', 'Buharkent Belediyesi, Aydın'),
  ('BUHARKENT', 'assembly', 'Buharkent Cumhuriyet Meydanı, Aydın'),
  ('BUHARKENT', 'emergency_center', 'Buharkent Devlet Hastanesi, Aydın'),

  ('KARACASU', 'shelter', 'Karacasu Belediyesi, Aydın'),
  ('KARACASU', 'assembly', 'Karacasu Cumhuriyet Meydanı, Aydın'),
  ('KARACASU', 'emergency_center', 'Karacasu Devlet Hastanesi, Aydın'),

  ('BOZDOĞAN', 'shelter', 'Bozdoğan Belediyesi, Aydın'),
  ('BOZDOĞAN', 'assembly', 'Bozdoğan Cumhuriyet Meydanı, Aydın'),
  ('BOZDOĞAN', 'emergency_center', 'Bozdoğan Devlet Hastanesi, Aydın'),

  ('KARPUZLU', 'shelter', 'Karpuzlu Belediyesi, Aydın'),
  ('KARPUZLU', 'assembly', 'Karpuzlu Cumhuriyet Meydanı, Aydın'),
  ('KARPUZLU', 'emergency_center', 'Karpuzlu Devlet Hastanesi, Aydın'),

  ('ÇİNE', 'shelter', 'Çine Belediyesi, Aydın'),
  ('ÇİNE', 'assembly', 'Çine Yüksel Yalova Stadyumu, Aydın'),
  ('ÇİNE', 'emergency_center', 'Çine Devlet Hastanesi, Aydın'),
]

import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def geocode(q):
    url = f'https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(q)}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0)'})
        res = urllib.request.urlopen(req, timeout=5, context=ctx)
        data = json.loads(res.read().decode())
        if data:
            return round(float(data[0]['lat']), 5), round(float(data[0]['lon']), 5)
    except Exception as e:
        pass
    
    district = q.split(',')[0].split(' ')[0]
    if district == 'Aydın': district = 'Efeler'
    fallback_q = f'{district}, Aydın, Turkey'
    url = f'https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(fallback_q)}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0)'})
        res = urllib.request.urlopen(req, timeout=5, context=ctx)
        data = json.loads(res.read().decode())
        if data:
            return round(float(data[0]['lat']), 5), round(float(data[0]['lon']), 5)
    except:
        pass
    return None, None

results = []
for ilce, type_, q in queries:
    lat, lon = geocode(q)
    print(f"Got: {ilce} {type_} -> {lat}, {lon}")
    results.append(f'"{ilce}_{type_}": [{lat}, {lon}]')
    time.sleep(1.2)

with open('coords.json', 'w', encoding='utf-8') as f:
    f.write('{\n' + ',\n'.join(results) + '\n}')
print('Done!')
