import json

PID = "92-2026-M"

paper = {
    "id": PID,
    "paperCode": "92/2026 M",
    "post": "Village Field Assistant - Direct Recruitment",
    "dept": "Revenue",
    "date": "17-Oct-2026",
    "medium": "M",
    "year": "2026",
    "categoryCode": "571/2025",
    "answerKeyStatus": ""
}

def q(n, topic, text, a, b, c, d, ans, correct, rule, wrong, tip):
    return {
        "id": f"{PID}-Q{n}", "paperId": PID, "questionNumber": n, "topic": topic,
        "questionText": text, "optionA": a, "optionB": b, "optionC": c, "optionD": d,
        "correctAnswer": ans,
        "explanation": {"correct": correct, "rule": rule, "wrong": wrong, "tip": tip},
    }

questions = [

q(81, "Conditionals",
"If I were you, I ________ smoking.",
"would quit", "will have quit", "may quit", "will quit", "A",
"""✅ ശരിയുത്തരം: (A) would quit
• 'If I were you' എന്നത് ഉപദേശം നൽകാനുള്ള ഏറ്റവും പ്രശസ്തമായ Second Conditional രൂപമാണ് — "ഞാൻ നിന്റെ സ്ഥാനത്തായിരുന്നെങ്കിൽ" എന്നർഥം.
• ഞാൻ ഒരിക്കലും 'നീ' ആകാൻ പോകുന്നില്ല — അതായത് ഇതൊരു സാങ്കൽപ്പിക (imaginary) സാഹചര്യമാണ്. അതുകൊണ്ട് main clause-ൽ would + V1 തന്നെ വേണം.
• "ഞാൻ നിന്റെ സ്ഥാനത്തായിരുന്നെങ്കിൽ, പുകവലി നിർത്തുമായിരുന്നു" — കൂട്ടുകാരന് സ്നേഹത്തോടെ കൊടുക്കുന്ന ഉപദേശം!""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: If + Past (were) → would + V1 (Second Conditional)
• Second Conditional-ൽ 'be' verb എല്ലാ subject-നും 'were' ആണ് — If I were, If he were, If she were. 'If I was' എന്നത് PSC-യിൽ ശരിയായി എടുക്കില്ല.
• Conditional family: First → If + V1/V-s, will + V1 | Second → If + V2/were, would + V1 | Third → If + had + V3, would have + V3.
• ⭐ PSC ആവർത്തനം: 'If I were you, I would…' — ഈ pattern PSC പലതവണ ചോദിച്ചിട്ടുണ്ട്; കണ്ണടച്ച് മാർക്ക് വാങ്ങാവുന്ന ചോദ്യം!
• ഉദാഹരണ sentences:
1. If I were you, I would apologise to her.
   → ഞാൻ നിന്റെ സ്ഥാനത്തായിരുന്നെങ്കിൽ അവളോട് ക്ഷമ ചോദിക്കുമായിരുന്നു.
2. If she were rich, she would help the poor.
   → അവൾ പണക്കാരിയായിരുന്നെങ്കിൽ പാവങ്ങളെ സഹായിക്കുമായിരുന്നു.
3. If I were a bird, I would fly over the sea.
   → ഞാനൊരു പക്ഷിയായിരുന്നെങ്കിൽ കടലിനു മുകളിലൂടെ പറക്കുമായിരുന്നു.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (B) will have quit — Future Perfect ആണിത്; ഭാവിയിൽ ഒരു സമയത്തിനകം പൂർത്തിയാകുന്ന കാര്യത്തിനാണ് ഉപയോഗിക്കുന്നത്.
• 'If I were' എന്ന സാങ്കൽപ്പിക clause-നോട് 'will' ചേരില്ല.
• 🪤 PSC Trap: 'have quit' കണ്ട് Third Conditional ആണെന്ന് തെറ്റിദ്ധരിപ്പിക്കാനുള്ള ഓപ്ഷൻ.

• (C) may quit — 'ഒരുപക്ഷേ നിർത്തിയേക്കാം' എന്ന സാധ്യതയാണ് ഇത് കാണിക്കുന്നത്.
• ഉപദേശം നൽകുന്ന 'If I were you' pattern-ൽ would ആണ് ഉറപ്പായും വേണ്ടത്.
• 🪤 PSC Trap: Modal verb ആയതുകൊണ്ട് ശരിയാണെന്ന് തോന്നാം.

• (D) will quit — First Conditional-ന്റെ main clause ആണിത് (If + V1 → will).
• If clause-ൽ 'were' (past) ഉള്ളപ്പോൾ 'will' ഇടുന്നത് tense mismatch ആണ്.
• 🪤 PSC Trap: ഏറ്റവും സാധാരണ തെറ്റ് — First, Second conditional കൂട്ടിക്കലർത്തൽ.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "WERE കണ്ടാൽ WOULD വിളിക്കൂ!" — W-W ജോടി: Were ↔ Would. രണ്ടും W-യിൽ തുടങ്ങുന്ന ഇരട്ടക്കുട്ടികൾ!
• ഒരുമിച്ച് പഠിക്കേണ്ടത്: If I were you (ഉപദേശം), I wish I were (ആഗ്രഹം), as if he were (സാങ്കൽപ്പികം) — മൂന്നിലും 'were' തന്നെ.
• PSC strategy: If clause-ലെ verb നോക്കുക — V1 ആണെങ്കിൽ will, V2/were ആണെങ്കിൽ would, had + V3 ആണെങ്കിൽ would have + V3. ഒരിക്കലും miss ആകില്ല!"""),

q(82, "Spelling",
"\"Do not ________ me in front of my friends\".",
"embbaras", "embarrase", "embarrass", "embarass", "C",
"""✅ ശരിയുത്തരം: (C) embarrass
• 'Embarrass' എന്നാൽ "നാണംകെടുത്തുക / ലജ്ജിപ്പിക്കുക" എന്നർഥം — "എന്റെ കൂട്ടുകാരുടെ മുന്നിൽ വെച്ച് എന്നെ നാണംകെടുത്തരുത്".
• ശരിയായ spelling-ൽ R രണ്ടെണ്ണം, S രണ്ടെണ്ണം: em-ba-RR-a-SS.
• B ഒന്നു മാത്രം; അത് ഇരട്ടിക്കില്ല — 'embb' എന്ന് ഒരിക്കലും എഴുതരുത്.
• Etymology hint: French 'embarrasser' (തടസ്സപ്പെടുത്തുക) എന്നതിൽ നിന്നാണ് വാക്ക് വന്നത് — അതിലും rr, ss ഇരട്ടിക്കുന്നുണ്ട്.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: embarrass = em + ba + RR + a + SS (Double R + Double S)
• Word family: embarrass (verb), embarrassed (adj), embarrassing (adj), embarrassment (noun) — എല്ലാത്തിലും rr, ss നിലനിൽക്കും.
• സമാനമായി ഇരട്ടിക്കുന്ന കുഴപ്പക്കാരായ വാക്കുകൾ: accommodate (cc, mm), committee (mm, tt, ee), possess (ss, ss), harass (ഒരു r, ss മാത്രം!).
• ⭐ PSC ആവർത്തനം: embarrass, accommodate, harass, occurrence — PSC spelling ചോദ്യങ്ങളിലെ സ്ഥിരം അതിഥികൾ!
• ഉദാഹരണ sentences:
1. His rude behaviour embarrassed his parents.
   → അവന്റെ മോശം പെരുമാറ്റം മാതാപിതാക്കളെ നാണംകെടുത്തി.
2. It was an embarrassing moment for me.
   → അതെനിക്ക് ലജ്ജാകരമായ ഒരു നിമിഷമായിരുന്നു.
3. She could not hide her embarrassment.
   → അവൾക്ക് തന്റെ ജാള്യത മറച്ചുവെക്കാനായില്ല.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) embbaras — B ഇരട്ടിച്ചു, R ഒന്നായി, S ഒന്നായി — മൂന്നും തെറ്റ്!
• ശരിയായ രൂപത്തിന്റെ നേർവിപരീതമാണ് ഇതിലെ ഇരട്ടിപ്പ്.
• 🪤 PSC Trap: ഇരട്ടിക്കേണ്ടത് ഏതെന്ന് സംശയമുള്ളവരെ കുഴക്കാൻ തെറ്റായ അക്ഷരം ഇരട്ടിപ്പിച്ചു.

• (B) embarrase — rr ശരി, പക്ഷേ S ഒന്നു മാത്രം; അവസാനം അനാവശ്യമായി 'e' ചേർത്തിരിക്കുന്നു.
• 'Embarrase' എന്നൊരു വാക്ക് ഇംഗ്ലീഷിൽ ഇല്ല.
• 🪤 PSC Trap: 'increase, release' പോലെ -ase ending ഉണ്ടെന്ന് തോന്നിപ്പിക്കുന്നു.

• (D) embarass — S ഇരട്ടിച്ചു, പക്ഷേ R ഒന്നു മാത്രം.
• ഏറ്റവും കൂടുതൽ ആളുകൾ വരുത്തുന്ന spelling തെറ്റാണിത്.
• 🪤 PSC Trap: 'harass' (ഒരു r) എന്ന വാക്കുമായി കൂട്ടിക്കലർത്താൻ വെച്ച കെണി!""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "നാണം വന്നാൽ മുഖം Really Red ആകും, പിന്നെ Shy Smile!" — RR + SS = embaRRaSS. ചുവന്ന മുഖം രണ്ടു തവണ, ചിരി രണ്ടു തവണ!
• ജോടിയായി പഠിക്കുക: embarrass (2 r, 2 s) ↔ harass (1 r, 2 s) — ഈ രണ്ടെണ്ണം തമ്മിലാണ് ഏറ്റവും കൂടുതൽ ആശയക്കുഴപ്പം.
• PSC strategy: Spelling ചോദ്യത്തിൽ ആദ്യം ഇരട്ടിക്കുന്ന അക്ഷരങ്ങൾ എണ്ണുക — rr ഉം ss ഉം ഒരുമിച്ചുള്ള ഓപ്ഷൻ മാത്രം തിരഞ്ഞെടുക്കുക. Guaranteed mark!"""),

q(83, "Antonyms",
"His spontaneous trip required a ________ budget.",
"deliberate", "plain", "rehearsed", "calculated", "D",
"""✅ ശരിയുത്തരം: (D) calculated
• 'Spontaneous' എന്നാൽ "മുൻകൂട്ടി തീരുമാനിക്കാതെ, പെട്ടെന്ന് തോന്നിയ" എന്നർഥം. 'Calculated' എന്നാൽ "കൃത്യമായി കണക്കുകൂട്ടി തയ്യാറാക്കിയ" എന്നർഥം.
• യാത്ര പെട്ടെന്ന് തീരുമാനിച്ചതാണെങ്കിലും ബജറ്റ് കൃത്യമായി കണക്കുകൂട്ടേണ്ടി വന്നു — ഈ വൈരുദ്ധ്യമാണ് (contrast) വാക്യം കാണിക്കുന്നത്.
• 'Budget' എന്ന വാക്കിനോട് ഏറ്റവും സ്വാഭാവികമായി ചേരുന്നത് 'calculated' ആണ് — പണം കണക്കുകൂട്ടിയാണല്ലോ ബജറ്റ് ഉണ്ടാക്കുന്നത്!

⚠️ ശ്രദ്ധിക്കുക — 2 ഉത്തരങ്ങൾക്ക് സാധ്യത:
• (A) deliberate എന്നതിനും "ആലോചിച്ച് മനഃപൂർവം ചെയ്ത" എന്നർഥമുണ്ട്; അതും spontaneous-ന്റെ antonym ആണ്.
• പക്ഷേ 'a deliberate budget' എന്നത് ഇംഗ്ലീഷിൽ അത്ര സ്വാഭാവികമായ പ്രയോഗമല്ല — 'calculated budget' ആണ് natural collocation. അതുകൊണ്ട് (D) ആണ് ഏറ്റവും അനുയോജ്യം.
• Provisional key വരുമ്പോൾ PSC (A) കൂടി പരിഗണിക്കാൻ സാധ്യതയുണ്ട് — key പുറത്തുവന്നശേഷം ഉറപ്പാക്കുക.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: Spontaneous (പെട്ടെന്നുള്ള) ✕ Calculated / Planned / Deliberate (ആലോചിച്ചുള്ള)
• Contrast വാക്യങ്ങളിൽ blank-ലേക്ക് വരുന്നത് പലപ്പോഴും വാക്യത്തിലെ പ്രധാന വാക്കിന്റെ വിപരീതമാണ്.
• Spontaneous-ന്റെ synonyms: impulsive, unplanned, impromptu, offhand | Antonyms: planned, calculated, deliberate, premeditated.
• ⭐ PSC ആവർത്തനം: spontaneous, impromptu, deliberate — Synonym/Antonym ചോദ്യങ്ങളിൽ സ്ഥിരമായി വരുന്ന കൂട്ടം!
• Etymology hint: Latin 'sponte' = സ്വമേധയാ (സ്വന്തം ഇഷ്ടത്തിന്) → spontaneous. 'Calculus' = കണക്കുകൂട്ടാനുപയോഗിച്ചിരുന്ന ചെറിയ കല്ല് → calculated.
• ഉദാഹരണ sentences:
1. The audience gave a spontaneous applause.
   → സദസ്സ് സ്വയമേവ കൈയടിച്ചു.
2. It was a calculated risk.
   → അതൊരു കണക്കുകൂട്ടിയെടുത്ത റിസ്ക് ആയിരുന്നു.
3. He made a deliberate attempt to insult me.
   → എന്നെ അപമാനിക്കാൻ അവൻ മനഃപൂർവം ശ്രമിച്ചു.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) deliberate — "മനഃപൂർവമുള്ള, ആലോചിച്ചുള്ള" എന്നർഥം.
• അർഥം കൊണ്ട് spontaneous-ന്റെ വിപരീതമാണെങ്കിലും 'budget'-നോട് ചേരുന്ന സ്വാഭാവിക പ്രയോഗമല്ല (മുകളിലെ note കാണുക).
• 🪤 PSC Trap: ഏറ്റവും ശക്തമായ distractor — antonym മാത്രം നോക്കുന്നവർ ഇതിൽ വീഴാം.

• (B) plain — "ലളിതമായ, സാധാരണ" എന്നർഥം.
• Spontaneous എന്നതുമായി ഒരു contrast-ഉം ഇത് ഉണ്ടാക്കുന്നില്ല.
• 🪤 PSC Trap: 'plain budget' എന്ന് കേൾക്കാൻ കുഴപ്പമില്ലെന്ന് തോന്നിപ്പിക്കുന്നു.

• (C) rehearsed — "മുൻകൂട്ടി പരിശീലിച്ച" എന്നർഥം — പ്രസംഗം, നാടകം, പാട്ട് എന്നിവയ്ക്കാണ് ഉപയോഗിക്കുന്നത്.
• ബജറ്റ് ആരും rehearse ചെയ്യാറില്ലല്ലോ!
• 🪤 PSC Trap: Spontaneous speech ✕ rehearsed speech എന്ന ജോടി ഓർമ്മയുള്ളവരെ കുഴക്കാൻ.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "SPONTANEOUS = SPOT-il തീരുമാനം!" — spot-ൽ വെച്ച് പെട്ടെന്ന് എടുത്ത തീരുമാനം. അതിന്റെ എതിര് CALCULATOR എടുത്ത് കണക്കുകൂട്ടിയ തീരുമാനം = calculated!
• Collocation family: calculated risk, calculated budget, calculated move | deliberate attempt, deliberate lie | rehearsed speech.
• PSC strategy: രണ്ട് ഓപ്ഷനുകൾക്കും ഒരേ അർഥം തോന്നിയാൽ, blank-ന് ശേഷമുള്ള noun-നോട് ഏതാണ് സ്വാഭാവികമായി ചേരുന്നതെന്ന് നോക്കുക — collocation ആണ് വിധി നിർണ്ണയിക്കുന്നത്!"""),

q(84, "One Word Substitutes",
"A person who writes with bad handwriting or incorrect spelling is a ________.",
"Calligraphist", "Cacographist", "Cartographist", "Cryptographist", "B",
"""✅ ശരിയുത്തരം: (B) Cacographist
• മോശം കൈയക്ഷരത്തിൽ എഴുതുന്ന, അല്ലെങ്കിൽ തെറ്റായ spelling-ൽ എഴുതുന്ന ആളിനെയാണ് Cacographist (cacographer) എന്ന് വിളിക്കുന്നത്.
• Greek 'kakos' = മോശം + 'graphein' = എഴുതുക → "മോശമായി എഴുതുന്നവൻ".
• 'Caco-' എന്ന prefix എപ്പോഴും 'മോശം' എന്ന അർഥമാണ് നൽകുന്നത് — cacophony (കർണ്ണകഠോരമായ ശബ്ദം) പോലെ.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: CACO = മോശം | CALLI = മനോഹരം | CARTO = ഭൂപടം | CRYPTO = രഹസ്യം — എല്ലാത്തിനും + GRAPH (എഴുത്ത്/വര)
• Calligraphy (മനോഹരമായ കൈയെഴുത്ത്) ✕ Cacography (മോശം കൈയെഴുത്ത്) — ഇവ പരസ്പരം വിപരീതങ്ങളാണ്.
• -graphy family: biography (ജീവചരിത്രം), autobiography (ആത്മകഥ), geography, photography, orthography (ശരിയായ spelling).
• ⭐ PSC ആവർത്തനം: calligraphy, cartographer, cacophony, cryptography — '-graph' One Word Substitute കൂട്ടം PSC ഇഷ്ടപ്പെടുന്നു!
• Etymology hint: Greek kakos (bad), kallos (beauty), khartēs (map/paper), kryptos (hidden).
• ഉദാഹരണ sentences:
1. The doctor was a cacographist; nobody could read his prescription.
   → ഡോക്ടറുടെ കൈയക്ഷരം വളരെ മോശമായിരുന്നു; കുറിപ്പടി ആർക്കും വായിക്കാനായില്ല.
2. The calligraphist wrote the invitation beautifully.
   → കാലിഗ്രാഫർ ക്ഷണക്കത്ത് മനോഹരമായി എഴുതി.
3. A cartographer prepared the map of Kerala.
   → ഒരു ഭൂപടനിർമ്മാതാവ് കേരളത്തിന്റെ ഭൂപടം തയ്യാറാക്കി.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) Calligraphist — മനോഹരമായ കൈയക്ഷരത്തിൽ എഴുതുന്ന കലാകാരൻ.
• ചോദ്യം ചോദിക്കുന്നതിന്റെ നേർവിപരീതമാണിത്.
• 🪤 PSC Trap: Antonym-നെ തന്നെ ഓപ്ഷനായി വെച്ചു — 'C-a-' കൊണ്ട് തുടങ്ങുന്നതുകൊണ്ട് ധൃതിയിൽ വായിക്കുന്നവർ വീഴും!

• (C) Cartographist — ഭൂപടങ്ങൾ (maps) തയ്യാറാക്കുന്ന ആൾ (cartographer).
• കൈയക്ഷരവുമായി ഇതിന് യാതൊരു ബന്ധവുമില്ല.
• 🪤 PSC Trap: '-graphist' ending ഒരുപോലെയായതിനാൽ ആശയക്കുഴപ്പം.

• (D) Cryptographist — രഹസ്യ കോഡുകൾ (codes/ciphers) എഴുതുകയും വായിക്കുകയും ചെയ്യുന്ന വിദഗ്ധൻ.
• മോശം എഴുത്തുമായി ഇതിന് ബന്ധമില്ല.
• 🪤 PSC Trap: 'വായിക്കാൻ പറ്റാത്ത എഴുത്ത്' എന്നതിനെ 'രഹസ്യ എഴുത്ത്' ആയി തെറ്റിദ്ധരിപ്പിക്കാൻ.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "CACO = KAKKA!" — കാക്ക കാലുകൊണ്ട് വരച്ചതുപോലുള്ള എഴുത്ത് = Cacography! (മലയാളത്തിലെ 'കാക്കക്കാലിട്ടതുപോലെ' എന്ന ചൊല്ല് ഓർക്കൂ.)
• Prefix family ഒരുമിച്ച്: caco- (cacography, cacophony) | calli- (calligraphy, callisthenics) | carto- (cartography) | crypto- (cryptography, cryptocurrency).
• PSC strategy: '-graph' ചോദ്യങ്ങളിൽ prefix-ന്റെ അർഥം മാത്രം നോക്കിയാൽ മതി — prefix അറിഞ്ഞാൽ ഉത്തരം ഉറപ്പ്!"""),

q(85, "Prepositions",
"She was sitting ________ the pool and reading a book.",
"on", "in", "into", "beside", "D",
"""✅ ശരിയുത്തരം: (D) beside
• 'Beside' എന്നാൽ "അരികിൽ, തൊട്ടടുത്ത്" എന്നർഥം — "അവൾ പൂളിന്റെ അരികിൽ ഇരുന്ന് പുസ്തകം വായിക്കുകയായിരുന്നു".
• പുസ്തകം വായിക്കുന്നതുകൊണ്ട് അവൾ വെള്ളത്തിനുള്ളിലല്ല, പൂളിന്റെ സമീപത്താണ് ഇരിക്കുന്നത് എന്ന് വ്യക്തം.
• Context clue: 'reading a book' — വെള്ളത്തിൽ മുങ്ങിയിരുന്ന് ആരും പുസ്തകം വായിക്കില്ലല്ലോ!""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: BESIDE = അരികിൽ (next to) | BESIDES = കൂടാതെ (in addition to)
• Place prepositions: in (ഉള്ളിൽ), on (മുകളിൽ — ഉപരിതലത്തിൽ തൊട്ട്), into (പുറത്തുനിന്ന് ഉള്ളിലേക്കുള്ള ചലനം), beside/by/near (അടുത്ത്).
• 'Into' ചലനത്തെ (movement) കാണിക്കുന്നു; 'sitting' പോലെ നിശ്ചലമായ അവസ്ഥയ്ക്ക് into ചേരില്ല.
• ⭐ PSC ആവർത്തനം: beside ✕ besides — PSC-യുടെ ഏറ്റവും പ്രിയപ്പെട്ട preposition ജോടികളിൽ ഒന്ന്!
• ഉദാഹരണ sentences:
1. He sat beside his mother.
   → അവൻ അമ്മയുടെ അരികിൽ ഇരുന്നു.
2. Besides English, she knows Hindi.
   → ഇംഗ്ലീഷിനു പുറമെ അവൾക്ക് ഹിന്ദിയും അറിയാം.
3. The boy jumped into the pool.
   → കുട്ടി പൂളിലേക്ക് ചാടി.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) on — ഒരു വസ്തുവിന്റെ ഉപരിതലത്തിൽ തൊട്ടിരിക്കുന്നതിനെ കാണിക്കുന്നു (on the chair, on the table).
• വെള്ളത്തിന്റെ മുകളിൽ ആരും ഇരിക്കില്ല!
• 🪤 PSC Trap: 'sitting on' എന്ന സ്ഥിരം കൂട്ടുകെട്ട് ഓർമ്മയിൽ വന്ന് കുടുക്കുന്നു.

• (B) in — "ഉള്ളിൽ" എന്നർഥം; 'in the pool' എന്നാൽ വെള്ളത്തിനുള്ളിൽ.
• വെള്ളത്തിനുള്ളിൽ ഇരുന്ന് പുസ്തകം വായിക്കുന്നത് യുക്തിക്ക് നിരക്കുന്നില്ല.
• 🪤 PSC Trap: 'in the room, in the garden' പോലെ സ്ഥലത്തിന് in ആകാമെന്ന് തോന്നിപ്പിക്കുന്നു.

• (C) into — പുറത്തുനിന്ന് ഉള്ളിലേക്കുള്ള ചലനം (jump into, walk into).
• 'Sitting' ഒരു ചലനമല്ലാത്തതിനാൽ into ചേരില്ല.
• 🪤 PSC Trap: Pool എന്ന് കേട്ടാൽ 'jump into the pool' ഓർമ്മ വരും — അതാണ് കെണി.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "BESIDE-ന് S കൂടിയാൽ BESIDES — അധികമായി ഒരു S, അർഥവും 'അധികം' (കൂടാതെ)!" Beside = അരികിൽ, Besides = പുറമെ.
• ഒരുമിച്ച് പഠിക്കുക: in ✕ into | on ✕ onto | beside ✕ besides | between (രണ്ടു പേർക്കിടയിൽ) ✕ among (പലർക്കിടയിൽ).
• PSC strategy: Preposition ചോദ്യത്തിൽ വാക്യം ഒരു ചിത്രം പോലെ മനസ്സിൽ കാണുക — ആൾ എവിടെ? ചലിക്കുന്നുണ്ടോ? ചിത്രം പറയും ശരിയായ preposition!"""),

q(86, "Correction of Sentences",
"The corrected sentence for :\n\"Every of the student have their own laptop\" is ________.",
"Each of the students has their own laptops.", "Every student have their own laptops.",
"Each of the students have their own laptops.", "Every of the students has his own laptop.", "A",
"""✅ ശരിയുത്തരം: (A) Each of the students has their own laptops.
• മൂലവാക്യത്തിൽ രണ്ട് തെറ്റുകൾ ഉണ്ട്: 'Every of' എന്ന പ്രയോഗവും, singular subject-നോടൊപ്പം 'have' എന്ന plural verb-ഉം.
• 'Each of the + plural noun' ആണ് ശരിയായ രൂപം — Each of the students. Subject 'each' singular ആയതിനാൽ verb 'has'.
• 'Every' ഒരിക്കലും 'of'-നോടൊപ്പം നേരിട്ട് വരില്ല — 'Every student' അല്ലെങ്കിൽ 'Every one of the students' എന്നേ പറയാവൂ.
• ചെറിയൊരു കുറവ്: ഓരോ വിദ്യാർഥിക്കും ഒരു laptop ആയതിനാൽ 'laptop' എന്ന singular ആയിരുന്നു ഏറ്റവും കൃത്യം. എങ്കിലും നൽകിയ ഓപ്ഷനുകളിൽ subject-verb agreement പൂർണ്ണമായും ശരിയായത് (A) മാത്രം.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: EACH OF THE + Plural Noun + Singular Verb | EVERY + Singular Noun + Singular Verb | ❌ EVERY OF
• Each, every, either, neither, everyone, everybody — ഇവയെല്ലാം singular verb എടുക്കുന്നു.
• 'Every' ഒരു determiner മാത്രം; അത് pronoun പോലെ 'of'-നോടൊപ്പം വരില്ല. 'Each' ന് determiner ആയും pronoun ആയും (each of) വരാൻ കഴിയും.
• ⭐ PSC ആവർത്തനം: 'Each of the boys has…', 'Every one of them is…' — Subject-Verb Agreement-ലെ ഏറ്റവും പ്രിയപ്പെട്ട ചോദ്യരൂപം!
• ഉദാഹരണ sentences:
1. Each of the players has a jersey.
   → ഓരോ കളിക്കാരനും ഒരു ജേഴ്സിയുണ്ട്.
2. Every student has to attend the class.
   → ഓരോ വിദ്യാർഥിയും ക്ലാസ്സിൽ പങ്കെടുക്കണം.
3. Every one of the girls was present.
   → പെൺകുട്ടികളിൽ ഓരോരുത്തരും ഹാജരുണ്ടായിരുന്നു.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (B) Every student have their own laptops. — 'Every student' ശരി, പക്ഷേ singular subject-നോടൊപ്പം 'have' തെറ്റ്; 'has' വേണം.
• Subject-verb agreement തെറ്റിയതിനാൽ ഈ ഓപ്ഷൻ പുറത്ത്.
• 🪤 PSC Trap: 'Every of' മാറ്റിയതുകൊണ്ട് മുഴുവൻ ശരിയായെന്ന് തോന്നിപ്പിക്കുന്നു.

• (C) Each of the students have their own laptops. — 'Each of the students' ശരി, പക്ഷേ verb 'have' തെറ്റ്.
• Verb-ന് തൊട്ടുമുമ്പുള്ള 'students' plural ആണെങ്കിലും യഥാർഥ subject 'each' ആണ് — singular.
• 🪤 PSC Trap: Verb-ന് അടുത്തുള്ള plural noun കണ്ട് 'have' ഇടുന്നവരെ കുടുക്കാനുള്ള ക്ലാസിക് കെണി!

• (D) Every of the students has his own laptop. — Verb ശരിയാണെങ്കിലും 'Every of' എന്ന തെറ്റ് അതേപടി നിലനിൽക്കുന്നു.
• 'Every of' ഇംഗ്ലീഷിൽ ഒരിക്കലും ശരിയല്ല.
• 🪤 PSC Trap: 'has his own laptop' ഏറ്റവും കൃത്യമായി കാണപ്പെടുന്നതിനാൽ വാക്യത്തിന്റെ തുടക്കം ശ്രദ്ധിക്കാത്തവർ വീഴും.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "EACH-ന് OF എന്ന കൂട്ടുകാരനുണ്ട്, EVERY ഒറ്റയ്ക്കാണ്!" — Each of ✓, Every of ✗. Every-ക്ക് കൂട്ട് വേണമെങ്കിൽ 'one' ചേർക്കണം: Every one of.
• Singular family ഒരുമിച്ച്: each, every, either, neither, everyone, someone, nobody, many a — എല്ലാം + singular verb.
• PSC strategy: Sentence correction-ൽ ആദ്യം 'Every of' പോലുള്ള വ്യക്തമായ തെറ്റുള്ള ഓപ്ഷനുകൾ വെട്ടുക, പിന്നെ verb നോക്കുക — രണ്ട് പടി കൊണ്ട് ഉത്തരം കിട്ടും!"""),

q(87, "Idioms",
"The new employee was ________ during her first week on the job.",
"under the weather", "at sea", "out of the woods", "barking up the wrong tree", "B",
"""✅ ശരിയുത്തരം: (B) at sea
• 'At sea' എന്ന idiom-ന് "ആശയക്കുഴപ്പത്തിൽ, എന്തുചെയ്യണമെന്നറിയാതെ" എന്നർഥം.
• പുതിയ ജോലിയിലെ ആദ്യ ആഴ്ച — പുതിയ ഓഫീസ്, പുതിയ ആളുകൾ, പുതിയ രീതികൾ — ആരും ഒന്ന് പകച്ചുപോകും! അതാണ് ഈ വാക്യം പറയുന്നത്.
• നടുക്കടലിൽ കര കാണാതെ ദിശയറിയാതെ നിൽക്കുന്ന കപ്പലിനെ ഓർക്കൂ — അതാണ് 'at sea'.

⚠️ ശ്രദ്ധിക്കുക — 2 ഉത്തരങ്ങൾക്ക് സാധ്യത:
• (A) under the weather (അസുഖമായി) എന്നതും വ്യാകരണപരമായി ഈ വാക്യത്തിൽ ചേരും — "ആദ്യ ആഴ്ചയിൽ അവൾക്ക് സുഖമില്ലായിരുന്നു" എന്ന് വായിക്കാം.
• എങ്കിലും 'new employee… first week on the job' എന്ന context പുതിയ ജോലിയിലെ ആശയക്കുഴപ്പത്തിലേക്കാണ് വ്യക്തമായി വിരൽ ചൂണ്ടുന്നത് — അതുകൊണ്ട് (B) ആണ് ഏറ്റവും അനുയോജ്യം.
• Provisional key വരുമ്പോൾ ഈ ചോദ്യത്തിൽ complaint വരാൻ സാധ്യതയുണ്ട് — key പുറത്തുവന്നശേഷം ഉറപ്പാക്കുക.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: At sea = ആശയക്കുഴപ്പം | Under the weather = അസുഖം | Out of the woods = അപകടനില തരണം ചെയ്തു | Barking up the wrong tree = തെറ്റായ ആളെ/വഴിയെ പിന്തുടരുക
• Idiom-ന്റെ അർഥം വാക്കുകളുടെ അക്ഷരാർഥത്തിൽ നിന്ന് വ്യത്യസ്തമാണ്; context നോക്കി വേണം തീരുമാനിക്കാൻ.
• 'Confused' അർഥമുള്ള മറ്റു idioms: at sixes and sevens, all at sea, in a fix, at one's wits' end.
• ⭐ PSC ആവർത്തനം: under the weather, at sea, out of the woods — PSC idiom ചോദ്യങ്ങളിലെ സ്ഥിരം സാന്നിധ്യം!
• ഉദാഹരണ sentences:
1. I was completely at sea with the new software.
   → പുതിയ സോഫ്റ്റ്‌വെയറിനു മുന്നിൽ ഞാൻ ആകെ പകച്ചുപോയി.
2. Grandfather is feeling under the weather today.
   → ഇന്ന് മുത്തച്ഛന് സുഖമില്ല.
3. The patient is out of the woods now.
   → രോഗി ഇപ്പോൾ അപകടനില തരണം ചെയ്തു.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) under the weather — "അസുഖമായി, സുഖമില്ലാതെ" എന്നർഥം.
• വ്യാകരണപരമായി ചേരുമെങ്കിലും 'പുതിയ ജോലി' എന്ന context-നോട് ആശയക്കുഴപ്പമാണ് കൂടുതൽ യോജിക്കുന്നത് (മുകളിലെ note കാണുക).
• 🪤 PSC Trap: ഏറ്റവും ശക്തമായ distractor — ഏറ്റവും പ്രശസ്തമായ idiom ആയതിനാൽ ആദ്യം കണ്ണിൽ പെടും.

• (C) out of the woods — "അപകടം/പ്രതിസന്ധി തരണം ചെയ്തു" എന്നർഥം.
• പുതിയ ജീവനക്കാരിക്ക് ആദ്യ ആഴ്ചയിൽ തന്നെ പ്രതിസന്ധി തരണം ചെയ്യേണ്ട സാഹചര്യം വാക്യത്തിലില്ല.
• 🪤 PSC Trap: 'Woods' എന്ന പ്രകൃതി ചിത്രം 'sea'-യോട് സാമ്യം തോന്നിപ്പിക്കുന്നു.

• (D) barking up the wrong tree — "തെറ്റായ ആളെ കുറ്റപ്പെടുത്തുക / തെറ്റായ വഴിയിൽ ശ്രമിക്കുക" എന്നർഥം.
• ഒരാളുടെ അവസ്ഥയെ വിവരിക്കാൻ ഇത് 'was' എന്ന verb-നോടൊപ്പം ഈ വാക്യത്തിൽ ചേരില്ല.
• 🪤 PSC Trap: നീളമുള്ള idiom കണ്ട് 'ഇതായിരിക്കും ഉത്തരം' എന്ന് തോന്നിപ്പിക്കാൻ.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "കടലിൽ പെട്ടാൽ കര കാണില്ല — AT SEA = ദിശയറിയാതെ!" | "മഴക്കാലാവസ്ഥയുടെ കീഴിൽ — UNDER THE WEATHER = പനി!" | "കാട്ടിൽ നിന്ന് പുറത്ത് — OUT OF THE WOODS = രക്ഷപ്പെട്ടു!"
• Idiom family: all at sea, at sixes and sevens (ആശയക്കുഴപ്പം) | under the weather, off colour (അസുഖം) | out of the woods, out of danger (രക്ഷ).
• PSC strategy: Idiom ചോദ്യത്തിൽ വാക്യത്തിലെ context clue (ഇവിടെ 'new employee', 'first week') അടിവരയിടുക — clue-നോട് ഏറ്റവും ചേരുന്ന idiom ആണ് ഉത്തരം!"""),

q(88, "Foreign Words and Phrases",
"\"He swallowed his self-respect and apologized\". The word 'self-respect' can be replaced with ________.",
"amour propre", "mon amour", "primier amour", "amour fou", "A",
"""✅ ശരിയുത്തരം: (A) amour propre
• 'Amour propre' എന്നത് French പ്രയോഗമാണ് — "ആത്മാഭിമാനം, സ്വാഭിമാനം (self-respect / self-esteem)" എന്നർഥം.
• French-ൽ 'amour' = സ്നേഹം, 'propre' = സ്വന്തം → "സ്വന്തത്തോടുള്ള സ്നേഹം" = ആത്മാഭിമാനം.
• "അവൻ തന്റെ ആത്മാഭിമാനം വിഴുങ്ങി ക്ഷമ ചോദിച്ചു" — ഈഗോ മാറ്റിവെച്ച് മാപ്പ് പറഞ്ഞു എന്നർഥം.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: AMOUR = സ്നേഹം | amour propre = ആത്മാഭിമാനം | mon amour = എന്റെ പ്രിയനേ | premier amour = ആദ്യ പ്രണയം | amour fou = ഭ്രാന്തമായ പ്രണയം
• Foreign phrases ഇംഗ്ലീഷിൽ അതേപടി ഉപയോഗിക്കുന്നു; ഓരോന്നിന്റെയും കൃത്യമായ അർഥം ഓർക്കണം.
• French phrase family: esprit de corps (കൂട്ടായ്മാബോധം), raison d'être (നിലനിൽപ്പിന്റെ കാരണം), faux pas (സാമൂഹിക അബദ്ധം), fait accompli (നടന്നുകഴിഞ്ഞ കാര്യം), déjà vu.
• ⭐ PSC ആവർത്തനം: French foreign phrases — esprit de corps, faux pas, amour propre — PSC ഇടയ്ക്കിടെ ചോദിക്കുന്നു!
• Etymology hint: Latin 'amor' (സ്നേഹം) → French 'amour'; Latin 'proprius' (സ്വന്തം) → 'propre'.
• ഉദാഹരണ sentences:
1. The insult wounded his amour propre.
   → ആ അപമാനം അവന്റെ ആത്മാഭിമാനത്തെ മുറിവേൽപ്പിച്ചു.
2. She refused the offer out of amour propre.
   → ആത്മാഭിമാനം കൊണ്ട് അവൾ ആ വാഗ്ദാനം നിരസിച്ചു.
3. Losing the match hurt the team's amour propre.
   → മത്സരത്തിലെ തോൽവി ടീമിന്റെ അഭിമാനത്തിന് ക്ഷതമേൽപ്പിച്ചു.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (B) mon amour — "എന്റെ പ്രിയനേ / എന്റെ സ്നേഹമേ" എന്ന് പ്രിയപ്പെട്ടവരെ വിളിക്കുന്ന വാക്ക്.
• ആത്മാഭിമാനവുമായി ഇതിന് യാതൊരു ബന്ധവുമില്ല.
• 🪤 PSC Trap: 'amour' എന്ന പൊതു വാക്ക് എല്ലാ ഓപ്ഷനിലും ഇട്ട് ആശയക്കുഴപ്പം ഉണ്ടാക്കുന്നു.

• (C) primier amour — ശരിയായ French spelling 'premier amour' ആണ്; "ആദ്യ പ്രണയം" എന്നർഥം.
• Self-respect എന്ന അർഥം ഇതിനില്ല.
• 🪤 PSC Trap: 'Prime/premier' = ഒന്നാമത്തെ, പ്രധാനപ്പെട്ട എന്ന അർഥം 'സ്വയം പ്രധാനം' എന്ന് തെറ്റിദ്ധരിപ്പിക്കാം.

• (D) amour fou — "ഭ്രാന്തമായ, അമിതമായ പ്രണയം" എന്നർഥം (fou = ഭ്രാന്തൻ).
• ആത്മാഭിമാനവുമായി ബന്ധമില്ല.
• 🪤 PSC Trap: അപരിചിതമായ French വാക്ക് കണ്ട് ഊഹിക്കുന്നവരെ കുടുക്കാൻ.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "PROPRE = PROPERTY — സ്വന്തം സ്വത്ത്!" — സ്വന്തം (propre) ആളോടുള്ള സ്നേഹം (amour) = ആത്മാഭിമാനം. Proprietor (ഉടമസ്ഥൻ) എന്ന വാക്കും ഇതേ കുടുംബത്തിൽ നിന്നാണ്!
• 'Amour' family ഒരുമിച്ച്: amour propre (ആത്മാഭിമാനം), mon amour (എന്റെ പ്രിയൻ), premier amour (ആദ്യ പ്രണയം), amour fou (ഭ്രാന്തൻ പ്രണയം).
• PSC strategy: എല്ലാ ഓപ്ഷനിലും ഒരേ വാക്ക് (amour) ഉണ്ടെങ്കിൽ, വ്യത്യാസമുള്ള രണ്ടാമത്തെ വാക്കിന്റെ അർഥം മാത്രം നോക്കുക — propre = സ്വന്തം → self!"""),

q(89, "Direct and Indirect Speech",
"He said, \"You saw me see you.\"\nThis can be reported as ________.",
"He said that he saw me see him.", "He said that he saw him see me.",
"He said that I had seen him see me.", "He said that I saw him see me.", "C",
"""✅ ശരിയുത്തരം: (C) He said that I had seen him see me.
• Speaker 'He' ആണ്; അവൻ 'You' എന്ന് വിളിക്കുന്നത് കേട്ടുനിൽക്കുന്ന എന്നോടാണ് (reporter = I).
• Pronoun മാറ്റം: You → I (കേൾവിക്കാരൻ ഞാൻ), me → him (speaker അവൻ), you → me.
• Tense മാറ്റം: Reporting verb 'said' past ആയതിനാൽ Simple Past 'saw' → Past Perfect 'had seen'.
• 'see' എന്നത് 'saw'-നു ശേഷം വരുന്ന bare infinitive ആണ് (saw me see) — അതിന് tense മാറ്റമില്ല, അതേപടി നിൽക്കും.

⚠️ ശ്രദ്ധിക്കുക — 2 ഉത്തരങ്ങൾക്ക് സാധ്യത:
• Modern English-ൽ Simple Past-നെ Past Perfect ആക്കുന്നത് നിർബന്ധമല്ല (optional backshift). അങ്ങനെ നോക്കിയാൽ (D) 'He said that I saw him see me' എന്നതും സ്വീകാര്യമാണ്.
• എന്നാൽ PSC പിന്തുടരുന്ന traditional rule പ്രകാരം Past → Past Perfect ആണ് — അതുകൊണ്ട് (C) ആണ് ഏറ്റവും ശരിയായ ഉത്തരം.
• Pronoun മാറ്റം (C), (D) രണ്ടിലും ഒരുപോലെ ശരിയാണ് — key പുറത്തുവന്നശേഷം ഉറപ്പാക്കുക.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: saw → had seen | Pronoun: SON rule
• Reporting verb (said) past tense-ൽ ആണെങ്കിൽ, ഉദ്ധരണിക്കുള്ളിലെ Simple Past, Past Perfect ആയി മാറുന്നു.
• SON rule: ഒന്നാം പുരുഷൻ (I/me) പറയുന്ന ആളിനനുസരിച്ച് മാറും, രണ്ടാം പുരുഷൻ (you) കേൾക്കുന്ന ആളിനനുസരിച്ച് മാറും, മൂന്നാം പുരുഷന് മാറ്റമില്ല.
• See, hear, watch, make, let എന്നീ verbs-ന് ശേഷം വരുന്ന bare infinitive-ന് indirect speech-ൽ ഒരു മാറ്റവും വരില്ല — അത് അതേപടി നിൽക്കും.
• Backshift table: is → was | saw → had seen | will → would | can → could.
• ⭐ PSC ആവർത്തനം: Pronoun മാറ്റം പരീക്ഷിക്കുന്ന 'You saw me…' പോലുള്ള കുഴപ്പം പിടിച്ച വാക്യങ്ങൾ PSC ഇഷ്ടപ്പെടുന്നു!
• ഉദാഹരണ sentences:
1. She said, "I met you yesterday." → She said that she had met me the previous day.
   → ഇന്നലെ എന്നെ കണ്ടിരുന്നുവെന്ന് അവൾ പറഞ്ഞു.
2. He said to me, "You helped me." → He told me that I had helped him.
   → ഞാൻ അവനെ സഹായിച്ചിരുന്നുവെന്ന് അവൻ എന്നോട് പറഞ്ഞു.
3. Ravi said, "I heard you sing." → Ravi said that he had heard me sing.
   → ഞാൻ പാടുന്നത് താൻ കേട്ടിരുന്നുവെന്ന് രവി പറഞ്ഞു.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) He said that he saw me see him. — 'You' എന്നതിനെ 'he' ആക്കി; അതായത് subject തന്നെ മാറിപ്പോയി.
• യഥാർഥ വാക്യത്തിൽ കണ്ടത് 'You' (ഞാൻ) ആണ്, അവനല്ല. Tense-ഉം backshift ചെയ്തിട്ടില്ല.
• 🪤 PSC Trap: 'He said that he…' എന്ന സ്ഥിരം തുടക്കം കണ്ട് ശരിയാണെന്ന് തോന്നിപ്പിക്കുന്നു.

• (B) He said that he saw him see me. — Subject-ഉം object-ഉം രണ്ടും തെറ്റ്; അർഥം തന്നെ മാറിപ്പോയി.
• 'He saw him' എന്നത് മൂന്നാമതൊരാളെ കൊണ്ടുവരുന്നു — മൂലവാക്യത്തിൽ അങ്ങനെയൊരാളില്ല.
• 🪤 PSC Trap: Pronoun-കൾ കുഴച്ചുമറിച്ച് കണ്ണുകളെ ആശയക്കുഴപ്പത്തിലാക്കുന്നു.

• (D) He said that I saw him see me. — Pronoun മാറ്റം പൂർണ്ണമായും ശരി; പക്ഷേ 'saw' backshift ചെയ്തിട്ടില്ല.
• Traditional rule പ്രകാരം 'had seen' വേണം (മുകളിലെ note കാണുക — modern usage-ൽ ഇതും സ്വീകാര്യം).
• 🪤 PSC Trap: Pronoun മാത്രം ശ്രദ്ധിച്ച് tense മറന്നുപോകുന്നവരെ കുടുക്കാൻ.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "SON — മകനെ ഓർക്കൂ!" → ഒന്നാം പുരുഷൻ പറയുന്നവന്റെ കൂടെ പോകും, രണ്ടാം പുരുഷൻ കേൾക്കുന്നവന്റെ കൂടെ പോകും, മൂന്നാം പുരുഷൻ അനങ്ങില്ല. ഇവിടെ പറഞ്ഞത് അവൻ, കേട്ടത് ഞാൻ — അതുകൊണ്ട് me → him, you → I.
• ഒരുമിച്ച് പഠിക്കേണ്ട tense മാറ്റങ്ങൾ: saw → had seen, went → had gone, did → had done.
• PSC strategy: ആദ്യം pronoun ശരിയായ ഓപ്ഷനുകൾ മാത്രം വേർതിരിക്കുക (ഇവിടെ C, D), പിന്നെ tense നോക്കി 'had + V3' ഉള്ളത് തിരഞ്ഞെടുക്കുക. രണ്ടു പടി കൊണ്ട് ഉറപ്പായ മാർക്ക്!"""),

q(90, "Correlatives",
"________ my father ________ his brother were born in Canada.",
"Neither - nor", "Both - and", "Either - or", "Whether - or", "B",
"""✅ ശരിയുത്തരം: (B) Both - and
• "എന്റെ അച്ഛനും അദ്ദേഹത്തിന്റെ സഹോദരനും കാനഡയിലാണ് ജനിച്ചത്" — രണ്ടുപേരെയും ഒരുമിച്ച് ചേർത്ത് പറയുന്നു.
• വാക്യത്തിലെ verb 'were' plural ആണ് — ഇതാണ് ഏറ്റവും വലിയ clue! 'Both… and' രണ്ട് subject-നെ ചേർക്കുന്നതിനാൽ എപ്പോഴും plural verb എടുക്കുന്നു.
• Either/Neither ആയിരുന്നെങ്കിൽ verb അടുത്തുള്ള subject 'his brother' (singular) അനുസരിച്ച് 'was' ആകേണ്ടിയിരുന്നു.""",
"""📌 വ്യാകരണ നിയമം
• 🔑 Quick Formula: BOTH + A + AND + B → Plural Verb | EITHER/NEITHER + A + OR/NOR + B → Verb നോക്കുന്നത് B-യെ (Proximity rule)
• Correlative ജോടികൾ ഒരിക്കലും മാറ്റിക്കലർത്തരുത്: both–and, either–or, neither–nor, not only–but also, whether–or, no sooner–than.
• Whether–or സംശയത്തെയോ രണ്ട് സാധ്യതകളെയോ കാണിക്കാനാണ് (I don't know whether he will come or not) — വാക്യത്തിന്റെ subject ആയി ഈ രീതിയിൽ വരില്ല.
• ⭐ PSC ആവർത്തനം: Correlative + subject-verb agreement — 'were/was' clue വെച്ചുള്ള ചോദ്യം PSC-യുടെ പ്രിയപ്പെട്ട രൂപമാണ്!
• ഉദാഹരണ sentences:
1. Both Anu and Manu are doctors.
   → അനുവും മനുവും ഡോക്ടർമാരാണ്.
2. Neither the teacher nor the students were present.
   → അധ്യാപകനോ വിദ്യാർഥികളോ ഹാജരുണ്ടായിരുന്നില്ല.
3. Either you or he is responsible.
   → നീയോ അവനോ ആണ് ഉത്തരവാദി.""",
"""❌ തെറ്റായ ഉത്തരങ്ങൾ
• (A) Neither - nor — "രണ്ടുപേരുമല്ല" എന്ന negative അർഥം.
• Proximity rule പ്രകാരം verb 'his brother' അനുസരിച്ച് 'was' ആകണം; 'were' ചേരില്ല.
• 🪤 PSC Trap: ഏറ്റവും പ്രശസ്തമായ correlative ആയതിനാൽ ആദ്യം മനസ്സിൽ വരും.

• (C) Either - or — "രണ്ടിൽ ഒരാൾ" എന്ന അർഥം — ഒരാൾ മാത്രം ജനിച്ചുവെന്ന് പറയുന്നതുപോലെ.
• ഇവിടെയും verb 'was' ആകേണ്ടിവരും.
• 🪤 PSC Trap: Grammar ശരിയാണെന്ന് തോന്നിക്കുന്ന ജോടി — verb clue ശ്രദ്ധിക്കാത്തവർ വീഴും.

• (D) Whether - or — സംശയം/സാധ്യത കാണിക്കുന്ന conjunction (whether… or not).
• ഒരു പ്രസ്താവനയുടെ subject-കളെ ചേർക്കാൻ ഇത് ഉപയോഗിക്കില്ല.
• 🪤 PSC Trap: '-or' ജോടി ആയതിനാൽ either-or-ന്റെ ബന്ധുവാണെന്ന് തോന്നിപ്പിക്കുന്നു.""",
"""💡 HOW COME Tip
• 🧠 Memory trick: "BOTH = രണ്ടും = ഇരട്ട = PLURAL!" — Both കണ്ടാൽ രണ്ടുപേരും ഒരുമിച്ച്, അതുകൊണ്ട് were/are/have. Either/Neither കണ്ടാൽ 'അടുത്തുള്ളവന്റെ വാക്ക് കേൾക്കൂ' (Proximity)!
• Correlative family: both–and, either–or, neither–nor, not only–but also, whether–or, no sooner–than, hardly–when, lest–should.
• PSC strategy: Correlative blank ചോദ്യത്തിൽ ആദ്യം verb നോക്കുക — രണ്ട് singular subject ഉണ്ടായിട്ടും verb plural (were/are) ആണെങ്കിൽ, 'Both–and' ആണ് ഉറപ്പായ ഉത്തരം. ഇത് ഓർത്തിരുന്നാൽ ഈ ചോദ്യം ഒരിക്കലും miss ആകില്ല!"""),
]

if __name__ == "__main__":
    import re, sys
    bad = 0
    for x in questions:
        for k, t in x["explanation"].items():
            m = len(re.findall(r"[ഀ-ൿ]", t)); e = len(re.findall(r"[A-Za-z]", t))
            pct = round(100 * m / (m + e))
            if pct < 40:
                bad += 1
                print("LOW", x["id"], k, pct)
    print("checked", len(questions), "bad", bad)
    if len(sys.argv) > 1 and sys.argv[1] == "write":
        base = sys.argv[2]
        pp, qp = base + "/papers.json", base + "/questions.json"
        papers = json.load(open(pp, encoding="utf-8"))
        qs = json.load(open(qp, encoding="utf-8"))
        assert not any(p["id"] == PID for p in papers), "paper exists"
        assert not any(z["paperId"] == PID for z in qs), "questions exist"
        papers.append(paper); qs.extend(questions)
        json.dump(papers, open(pp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        json.dump(qs, open(qp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        p2 = json.load(open(pp, encoding="utf-8")); q2 = json.load(open(qp, encoding="utf-8"))
        print("papers:", len(p2), "questions:", len(q2), "new qs:", sum(1 for z in q2 if z["paperId"] == PID))
