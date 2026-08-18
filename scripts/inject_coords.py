import json
import re

with open('coords.json', 'r', encoding='utf-8') as f:
    coords = json.load(f)

with open('emergency_data.js', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_coords(match):
    district = match.group(1)
    type_ = match.group(2)
    key = f"{district}_{type_}"
    
    if key in coords and coords[key][0] is not None:
        lat = coords[key][0]
        lng = coords[key][1]
        
        # We need to return exactly the same indentation.
        # The match group 3 is the whitespace before lat:
        indent = match.group(3)
        return f'{district}": {{\n    {type_}: {{' + match.group(5) + f'lat: {lat}, lng: {lng},'
    return match.group(0)

for district in ["EFELER", "NAZİLLİ", "SÖKE", "KUŞADASI", "DİDİM", "GERMENCİK", "İNCİRLİOVA", "KOÇARLI", "KÖŞK", "SULTANHİSAR", "YENİPAZAR", "KUYUCAK", "BUHARKENT", "KARACASU", "BOZDOĞAN", "KARPUZLU", "ÇİNE"]:
    for type_ in ["shelter", "assembly", "emergency_center"]:
        key = f"{district}_{type_}"
        if key in coords and coords[key][0] is not None:
            lat = coords[key][0]
            lng = coords[key][1]
            
            # Regex to find:
            # "DISTRICT": { ... type: { ... lat: X, lng: Y,
            pattern = re.compile(rf'("{district}":\s*{{\s*(?:.*?\n)*?\s*{type_}:\s*{{.*?\n\s*)lat:\s*[\d\.]+,\s*lng:\s*[\d\.]+,', re.DOTALL)
            content = pattern.sub(rf'\g<1>lat: {lat}, lng: {lng},', content)

with open('emergency_data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated emergency_data.js with exact coordinates!")
