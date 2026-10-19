"""
MUMS App – Ugentlig Live Tilbudshenter (Scraper)
Henter aktuelle tilbud direkte fra alle 6 danske supermarkeder:
- Netto
- Føtex
- Bilka
- REMA 1000
- Lidl
- 365discount

Genererer `live_offers.js` som indlæses direkte af MUMS-appen.
"""

import urllib.request
import json
import os
import re
from datetime import datetime

DEALERS = {
    'netto':   {'id': '9ba51',  'name': 'Netto Avis',        'logo': '🟡', 'flyerId': 'flyer-netto'},
    'foetex':  {'id': 'bdf5A',  'name': 'Føtex Avis',        'logo': '🟡', 'flyerId': 'flyer-foetex'},
    'bilka':   {'id': '93f13',  'name': 'Bilka Avis',        'logo': '🔵', 'flyerId': 'flyer-bilka'},
    'rema':    {'id': '11deC',  'name': 'REMA 1000 Avis',    'logo': '🔴', 'flyerId': 'flyer-rema'},
    'lidl':    {'id': '71c90',  'name': 'Lidl Avis',         'logo': '🔵', 'flyerId': 'flyer-lidl'},
    'coop365': {'id': 'DWZE1w', 'name': '365discount Avis',  'logo': '🟢', 'flyerId': 'flyer-coop365'},
}

CATEGORY_KEYWORDS = {
    # Drikke skal tjekkes FØR kod/mejeri for at undgå at f.eks. "Coca Cola" matches som kolonial/andet
    'drikke': ['sodavand', 'cola', 'pepsi', 'fanta', 'booster', 'monster', 'energidrik', 'juice', 'øl', 'vand', 'smoothie', 'vin', 'tuborg', 'carlsberg', 'spiritus', 'kildevand'],
    'mejeri': ['mælk', 'smør', 'ost', 'skyr', 'yoghurt', 'fløde', 'kærgården', 'lurpak', 'æg', 'ægg', 'cheasy', 'feta', 'mozzarella', 'hytteost', 'creme fraiche', 'parmesan'],
    'kod': ['kød', 'kylling', 'okse', 'gris', 'bacon', 'svin', 'pølse', 'pølser', 'hakket', 'filet', 'laks', 'fisk', 'torsk', 'rejer', 'and', 'schnitzel', 'mørbrad', 'stege', 'steg', 'ribbensteg', 'flæskesteg', 'leverpostej', 'skinke', 'medister'],
    'frugt': ['æble', 'æbler', 'banan', 'bananer', 'kartof', 'tomat', 'tomater', 'agurk', 'gulerod', 'gulerødder', 'salat', 'løg', 'avocado', 'bær', 'druer', 'pære', 'citron', 'appelsin', 'spinat', 'broccoli', 'champignon', 'svampe', 'hvidløg'],
    'slik': ['chokolade', 'chips', 'slik', 'kiks', 'marabou', 'haribo', 'kims', 'kage', 'snack', 'is', 'guf', 'lakrids'],
    'kolonial': ['brød', 'rugbrød', 'pasta', 'ris', 'mel', 'olie', 'kaffe', 'te', 'marmelade', 'konserves', 'tortilla', 'nudler', 'sauce', 'ketchup']
}

CATEGORY_EMOJIS = {
    'kod': '🥩',
    'mejeri': '🧀',
    'frugt': '🥦',
    'drikke': '🥤',
    'slik': '🍬',
    'kolonial': '🍞'
}

def detect_category(text):
    text_lower = text.lower()
    for cat in ['drikke', 'mejeri', 'kod', 'frugt', 'slik', 'kolonial']:
        kws = CATEGORY_KEYWORDS[cat]
        if any(kw in text_lower for kw in kws):
            return cat
    return 'kolonial'

def extract_search_key(heading):
    h = heading.lower()
    # Kendte nøgleord for opskriftsmatching
    keywords = [
        'flæskesteg', 'ribbensteg', 'grisekam', 'svinekam', 'hakket kød', 'oksekød',
        'kylling', 'kyllingebryst', 'kyllingefilet', 'laks', 'torsk', 'fisk', 'bacon',
        'smør', 'kærgården', 'lurpak', 'mælk', 'fløde', 'ost', 'feta', 'mozzarella',
        'æg', 'pasta', 'spaghetti', 'ris', 'kartofler', 'kartoffel', 'tomat', 'tomater',
        'løg', 'hvidløg', 'gulerødder', 'gulerod', 'broccoli', 'spinat', 'agurk', 'salat',
        'citron', 'sodavand', 'cola', 'pepsi', 'juice', 'øl', 'chips', 'chokolade'
    ]
    for kw in keywords:
        if kw in h:
            return kw
    # Ellers tag første reelle ord
    words = re.findall(r'[a-zæøå0-9]+', h)
    return words[0] if words else 'vare'

def main():
    print("=" * 60)
    print(" MUMS App – Henter friske tilbud fra Danmarks 6 supermarkeder...")
    print("=" * 60)
    
    all_extracted_offers = []
    store_counts = {}

    for store_key, info in DEALERS.items():
        dealer_id = info['id']
        dealer_name = info['name']
        flyer_id = info['flyerId']
        
        url = f'https://squid-api.tjek.com/v2/offers?dealer_ids={dealer_id}&limit=50'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                store_offers = []
                for item in data:
                    heading = item.get('heading') or ''
                    desc = item.get('description') or ''
                    pricing = item.get('pricing') or {}
                    price = pricing.get('price')
                    pre_price = pricing.get('pre_price')
                    
                    if not heading or price is None:
                        continue
                    
                    cat = detect_category(heading + " " + desc)
                    emoji = CATEGORY_EMOJIS.get(cat, '🏷️')
                    
                    # Udtræk billede hvis tilgængeligt
                    images = item.get('images') or {}
                    img_url = images.get('view') or images.get('zoom') or images.get('thumb') or None
                    
                    run_from = item.get('run_from', '')[:10]
                    run_till = item.get('run_till', '')[:10]
                    
                    search_key = extract_search_key(heading + " " + desc)
                    
                    offer_obj = {
                        'flyerId': flyer_id,
                        'product': heading,
                        'supermarket': store_key,
                        'category': cat,
                        'offerPrice': float(price),
                        'normalPrice': float(pre_price) if pre_price else round(price * 1.3, 2),
                        'emoji': emoji,
                        'searchKey': search_key,
                        'source': dealer_name,
                        'startDate': run_from,
                        'endDate': run_till,
                        'image': img_url,
                        'active': True
                    }
                    store_offers.append(offer_obj)
                
                store_counts[store_key] = len(store_offers)
                all_extracted_offers.extend(store_offers)
                print(f"[OK] {dealer_name:20}: {len(store_offers)} tilbud hentet")
        except Exception as e:
            print(f"[FEJL] {dealer_name:20}: Fejl ({e})")

    print("\nTotal antal hentede tilbud:", len(all_extracted_offers))
    
    # Skriv filen live_offers.js
    timestamp = datetime.now().strftime("%d-%m-%Y kl. %H:%M")
    
    js_content = f"""// MUMS App – LIVE TILBUD FRA DANSKE SUPERMARKEDER
// Sidst opdateret: {timestamp}
// Hentet direkte via autoriserede forhandler-feeds (Netto, Føtex, Bilka, REMA 1000, Lidl, 365discount)

const LIVE_SCRAPED_OFFERS = {json.dumps(all_extracted_offers, ensure_ascii=False, indent=2)};

if (typeof window !== 'undefined') {{
  window.LIVE_SCRAPED_OFFERS = LIVE_SCRAPED_OFFERS;
  console.log('[MUMS Scraper] Indlæst {len(all_extracted_offers)} ægte tilbud fra supermarkederne ({timestamp})');
}}
"""
    
    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'live_offers.js')
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"\n[SUCCES] Genereret {out_file} med {len(all_extracted_offers)} aegte tilbud!")

if __name__ == '__main__':
    main()
