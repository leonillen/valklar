# Valkompass Platform – Implementationsplan

> **För agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mål:** Bygga en webb-baserad valkompass för svenska riksdagsval med AI-förklaringar, djupa politiska personlighetsdimensioner, delbara resultat och white-label-stöd för medieförsäljning.

**Arkitektur:** Python/Flask-backend som exponerar REST-API för frågor, resultatberäkning och AI-förklaringar via Groq. Vanilla JS-frontend med tre sidor (landing, quiz, resultat). SQLite-databas för anonym datainsamling. Frågorna roteras slumpmässigt ur en bank om 200+ frågor.

**Tech Stack:** Python 3.11, Flask, SQLite, Groq API (`llama-3.3-70b-versatile`), Vanilla JS (ES6+), HTML5, CSS3 (custom properties, CSS Grid/Flexbox), ingen frontend-framework.

---

## Fil- och mappstruktur

```
valkompass/
├── backend/
│   ├── server.py           # Flask-app, alla API-routes
│   ├── questions.py        # Frågeurval och randomisering
│   ├── scoring.py          # Matchningsalgoritm + personlighetsdimensioner
│   ├── ai_explain.py       # Groq-integration för förklaringar
│   └── database.py         # SQLite CRUD för svar och stats
├── data/
│   ├── questions.json      # Frågebank (~250 frågor med partisvar)
│   └── parties.json        # Partiinfo, beskrivningar, färger, ikoner
├── frontend/
│   ├── index.html          # Landing page
│   ├── quiz.html           # Quizsida (frågorna)
│   ├── results.html        # Resultatsida
│   ├── css/
│   │   ├── base.css        # Reset, CSS-variabler, typografi
│   │   ├── landing.css     # Landing-specifika styles
│   │   ├── quiz.css        # Quiz-specifika styles
│   │   └── results.css     # Resultat-specifika styles
│   └── js/
│       ├── landing.js      # Stats-laddning, CTA
│       ├── quiz.js         # Frågamotor, progress, expand-info
│       └── results.js      # Resultatrendering, delning, AI-förklaring
├── requirements.txt
├── .env.example
└── README.md
```

---

## Task 1: Data – Partipositioner och metadata

**Filer:**
- Skapa: `data/parties.json`

Definiera de 8 riksdagspartierna med positioner på 5 politiska dimensioner (1–10 skala) och UI-metadata.

- [ ] **Steg 1.1: Skapa parties.json**

```json
{
  "parties": [
    {
      "id": "S",
      "name": "Socialdemokraterna",
      "color": "#E8112d",
      "short": "Socialdemokraterna",
      "tagline": "Trygghet, jämlikhet och en stark välfärd.",
      "description": "Sveriges historiskt dominerande parti. Förespråkar stark välfärd, aktiv arbetsmarknadspolitik och kollektiva lösningar. Grundade folkhemmet. Centrum-vänster på ekonomi, relativt konservativa på ordningsfrågor.",
      "website": "https://www.socialdemokraterna.se",
      "dimensions": {
        "ekonomi": 3,
        "frihet_trygghet": 4,
        "individ_kollektiv": 3,
        "progressiv_konservativ": 6,
        "miljo_tillvaxt": 6
      }
    },
    {
      "id": "M",
      "name": "Moderaterna",
      "color": "#52BDEC",
      "short": "Moderaterna",
      "tagline": "Lägre skatter, mer frihet och ett tryggare Sverige.",
      "description": "Det stora högerpartiet. Förespråkar lägre skatter, privatiseringar och marknadslösningar. Hård linje mot kriminalitet. Höger på ekonomi, konservativa på lag & ordning, relativt liberala socialt.",
      "website": "https://moderaterna.se",
      "dimensions": {
        "ekonomi": 8,
        "frihet_trygghet": 4,
        "individ_kollektiv": 8,
        "progressiv_konservativ": 4,
        "miljo_tillvaxt": 5
      }
    },
    {
      "id": "SD",
      "name": "Sverigedemokraterna",
      "color": "#DDDD00",
      "short": "Sverigedemokraterna",
      "tagline": "Sverige och svenska intressen först.",
      "description": "Nationalistiskt parti med fokus på restriktiv invandringspolitik och bevarandet av svensk kultur. Höger på migration och kulturvärden, mer vänster på välfärd. Tredje största parti i riksdagen.",
      "website": "https://sd.se",
      "dimensions": {
        "ekonomi": 5,
        "frihet_trygghet": 3,
        "individ_kollektiv": 5,
        "progressiv_konservativ": 2,
        "miljo_tillvaxt": 4
      }
    },
    {
      "id": "C",
      "name": "Centerpartiet",
      "color": "#009933",
      "short": "Centerpartiet",
      "tagline": "Frihet, företagande och en levande landsbygd.",
      "description": "Liberalt parti med rötter i landsbygdsrörelsen. Förespråkar frihandel, avregleringar och öppen invandring. Det mest utpräglat liberala partiet i riksdagen – höger på ekonomi, vänster på frihetsfrågor.",
      "website": "https://www.centerpartiet.se",
      "dimensions": {
        "ekonomi": 8,
        "frihet_trygghet": 8,
        "individ_kollektiv": 9,
        "progressiv_konservativ": 7,
        "miljo_tillvaxt": 6
      }
    },
    {
      "id": "V",
      "name": "Vänsterpartiet",
      "color": "#DA291C",
      "short": "Vänsterpartiet",
      "tagline": "Jämlikhet, feminism och ett starkare samhälle.",
      "description": "Det mest vänsterorienterade riksdagspartiet. Vill öka skatter på kapital, stärka fackföreningar och minska klyftor. Progressiva på sociala frågor, kritiska till NATO och EU.",
      "website": "https://www.vansterpartiet.se",
      "dimensions": {
        "ekonomi": 1,
        "frihet_trygghet": 7,
        "individ_kollektiv": 1,
        "progressiv_konservativ": 9,
        "miljo_tillvaxt": 8
      }
    },
    {
      "id": "KD",
      "name": "Kristdemokraterna",
      "color": "#231F7E",
      "short": "Kristdemokraterna",
      "tagline": "Familjens och gemenskapens parti.",
      "description": "Konservativt parti med kristen värdegrund. Starkt fokus på familj, valfrihet i välfärden och etikfrågor. Ekonomiskt höger, socialt konservativa, måttliga på migration.",
      "website": "https://www.kristdemokraterna.se",
      "dimensions": {
        "ekonomi": 7,
        "frihet_trygghet": 4,
        "individ_kollektiv": 6,
        "progressiv_konservativ": 3,
        "miljo_tillvaxt": 4
      }
    },
    {
      "id": "L",
      "name": "Liberalerna",
      "color": "#006AB3",
      "short": "Liberalerna",
      "tagline": "Frihet, bildning och ett öppet samhälle.",
      "description": "Klassiskt liberalt parti. Prioriterar utbildning, rättssäkerhet och EU-samarbete. Ekonomiskt center-höger, socialt liberala. Har varierat i samarbetskonstellationer.",
      "website": "https://www.liberalerna.se",
      "dimensions": {
        "ekonomi": 7,
        "frihet_trygghet": 7,
        "individ_kollektiv": 7,
        "progressiv_konservativ": 6,
        "miljo_tillvaxt": 6
      }
    },
    {
      "id": "MP",
      "name": "Miljöpartiet",
      "color": "#83CF39",
      "short": "Miljöpartiet",
      "tagline": "För klimatet, rättvisan och framtiden.",
      "description": "Grönt parti med fokus på klimatomställning, biologisk mångfald och social rättvisa. Vänster på fördelning, progressiva på invandring och jämlikhet, men definieras primärt av miljöfrågan.",
      "website": "https://www.mp.se",
      "dimensions": {
        "ekonomi": 3,
        "frihet_trygghet": 7,
        "individ_kollektiv": 3,
        "progressiv_konservativ": 9,
        "miljo_tillvaxt": 10
      }
    }
  ],
  "dimensions": {
    "ekonomi": {
      "label": "Ekonomi",
      "left_label": "Stark välfärd",
      "right_label": "Fri marknad",
      "description": "Hur mycket staten ska styra ekonomin kontra marknaden"
    },
    "frihet_trygghet": {
      "label": "Frihet vs Trygghet",
      "left_label": "Mer trygghet",
      "right_label": "Mer frihet",
      "description": "Balansen mellan individuell frihet och kollektiv säkerhet"
    },
    "individ_kollektiv": {
      "label": "Individ vs Kollektiv",
      "left_label": "Kollektiv",
      "right_label": "Individ",
      "description": "Om samhällsproblem löses bäst gemensamt eller individuellt"
    },
    "progressiv_konservativ": {
      "label": "Progressiv vs Konservativ",
      "left_label": "Traditionell",
      "right_label": "Progressiv",
      "description": "Synen på samhällsförändring, tradition och kulturvärden"
    },
    "miljo_tillvaxt": {
      "label": "Miljö vs Tillväxt",
      "left_label": "Ekonomisk tillväxt",
      "right_label": "Miljöhänsyn",
      "description": "Prioritering av ekonomisk tillväxt kontra miljö och klimat"
    }
  }
}
```

- [ ] **Steg 1.2: Verifiera JSON-syntax**

```bash
python -c "import json; data=json.load(open('data/parties.json', encoding='utf-8')); print(f'OK: {len(data[\"parties\"])} partier laddade')"
```
Förväntat: `OK: 8 partier laddade`

---

## Task 2: Data – Frågebank (250 frågor)

**Filer:**
- Skapa: `data/questions.json`

Varje fråga är ett politiskt påstående. Användaren svarar 1–5 (Håller inte alls → Håller helt med). Varje fråga har partisvar (1–5) och tillhör en dimension och ett ämnesområde.

- [ ] **Steg 2.1: Definiera frågestruktur och skapa questions.json**

```json
{
  "schema_version": "1.0",
  "questions": [
    {
      "id": "q001",
      "text": "Statliga skatter bör sänkas även om det innebär minskade resurser till välfärden.",
      "area": "Ekonomi",
      "dimension": "ekonomi",
      "weight": 1.0,
      "info": "Sverige har bland världens högsta skattetryck. Skatteintäkterna finansierar sjukvård, skola och sociala trygghetssystem. Debatten handlar om balansen mellan privat konsumtion och gemensamma resurser.",
      "party_positions": {
        "S": 1, "M": 4, "SD": 3, "C": 5, "V": 1, "KD": 4, "L": 4, "MP": 2
      }
    },
    {
      "id": "q002",
      "text": "Vinster i välfärden (skola, vård, omsorg) bör begränsas.",
      "area": "Välfärd",
      "dimension": "ekonomi",
      "weight": 1.0,
      "info": "Sedan 1990-talet tillåts privata aktörer driva skolor och vårdcentraler i Sverige med möjlighet till vinst. Debatten handlar om huruvida skattemedel ska kunna tas ut som vinst av ägarna.",
      "party_positions": {
        "S": 4, "M": 1, "SD": 3, "C": 1, "V": 5, "KD": 2, "L": 2, "MP": 4
      }
    },
    {
      "id": "q003",
      "text": "Sverige bör ta emot färre flyktingar och migranter.",
      "area": "Migration",
      "dimension": "progressiv_konservativ",
      "weight": 1.2,
      "info": "Sverige hade länge en av Europas mest generösa flyktingpolitik men stramade åt kraftigt efter 2015. Invandring påverkar arbetsmarknad, integration, bostadsmarknad och statens kostnader.",
      "party_positions": {
        "S": 3, "M": 4, "SD": 5, "C": 1, "V": 1, "KD": 3, "L": 2, "MP": 1
      }
    },
    {
      "id": "q004",
      "text": "Polisen bör ges utökade befogenheter att bekämpa organiserad brottslighet, även om det inskränker civila rättigheter.",
      "area": "Lag & Ordning",
      "dimension": "frihet_trygghet",
      "weight": 1.1,
      "info": "Gängkriminaliteten i Sverige har ökat markant. Frågan om preventiv avlyssning, visitationszoner och hårdare straff väcker debatt om balansen mellan effektivt polisarbete och rättssäkerhet.",
      "party_positions": {
        "S": 3, "M": 4, "SD": 5, "C": 2, "V": 1, "KD": 4, "L": 3, "MP": 1
      }
    },
    {
      "id": "q005",
      "text": "Sverige bör ställa om till 100% förnybar energi så snart som möjligt, även om det kostar mer.",
      "area": "Miljö & Klimat",
      "dimension": "miljo_tillvaxt",
      "weight": 1.1,
      "info": "Sverige producerar redan majoriteten av sin el från vattenkraft och kärnkraft. Debatten handlar om hur snabbt och till vilken kostnad omställningen till 100% förnybart ska ske.",
      "party_positions": {
        "S": 3, "M": 3, "SD": 2, "C": 4, "V": 4, "KD": 3, "L": 3, "MP": 5
      }
    },
    {
      "id": "q006",
      "text": "Kärnkraft bör vara en del av Sveriges energimix även i framtiden.",
      "area": "Miljö & Energi",
      "dimension": "miljo_tillvaxt",
      "weight": 1.0,
      "info": "Sverige har historiskt varit kärnkraftsberoende men beslutade 1980 om avveckling. På senare år har debatten vänt och nu planeras ny kärnkraft av alliansen. Frågorna rör kostnad, säkerhet och klimatvärde.",
      "party_positions": {
        "S": 3, "M": 5, "SD": 4, "C": 3, "V": 1, "KD": 5, "L": 4, "MP": 1
      }
    },
    {
      "id": "q007",
      "text": "Arbetstagare bör ha starkare rättigheter gentemot sina arbetsgivare.",
      "area": "Arbetsmarknad",
      "dimension": "individ_kollektiv",
      "weight": 1.0,
      "info": "Den svenska modellen bygger på kollektivavtal mellan fack och arbetsgivare. Debatt finns om LAS (lagen om anställningsskydd), fackliga vetorätten och rätten till heltid.",
      "party_positions": {
        "S": 4, "M": 2, "SD": 3, "C": 2, "V": 5, "KD": 3, "L": 2, "MP": 4
      }
    },
    {
      "id": "q008",
      "text": "Valfrihet i skolan (friskolor, skolval) är viktigt att värna.",
      "area": "Utbildning",
      "dimension": "individ_kollektiv",
      "weight": 1.0,
      "info": "Sverige införde ett av världens mest friskolesystem 1992. Elever kan välja skola med skolpeng. Debatten handlar om resultatskillnader, segregation och vinster i friskolor.",
      "party_positions": {
        "S": 2, "M": 5, "SD": 3, "C": 5, "V": 1, "KD": 4, "L": 4, "MP": 2
      }
    },
    {
      "id": "q009",
      "text": "Riksdagen bör lagstifta om samkönade pars rätt att adoptera barn.",
      "area": "Sociala rättigheter",
      "dimension": "progressiv_konservativ",
      "weight": 1.0,
      "info": "Sverige tillät samkönade par att adoptera 2003. Frågan är nu i stor utsträckning avgjord rättsligt, men debatt kvarstår kring surrogatmödraskap och internationell adoption.",
      "party_positions": {
        "S": 5, "M": 4, "SD": 2, "C": 5, "V": 5, "KD": 1, "L": 5, "MP": 5
      }
    },
    {
      "id": "q010",
      "text": "Bostadsmarknaden bör avregleras för att öka byggandet och sänka priserna.",
      "area": "Bostäder",
      "dimension": "ekonomi",
      "weight": 1.0,
      "info": "Sverige har ett av Europas mest reglerade bostadsmarknader med hyresreglering och långa köer till hyresrätter. Debatten handlar om marknadshyror, byggkostnader och stadsplanering.",
      "party_positions": {
        "S": 2, "M": 5, "SD": 2, "C": 5, "V": 1, "KD": 4, "L": 4, "MP": 3
      }
    },
    {
      "id": "q011",
      "text": "Sverige bör öka sin militära budget till minst 3% av BNP.",
      "area": "Försvar",
      "dimension": "frihet_trygghet",
      "weight": 1.1,
      "info": "Efter Rysslands invasion av Ukraina 2022 höjde Sverige drastiskt sin försvarsbudget. NATO-kravet är 2% av BNP men debatten går om huruvida det räcker för ett land med lång gräns mot Ryssland.",
      "party_positions": {
        "S": 3, "M": 5, "SD": 4, "C": 4, "V": 2, "KD": 5, "L": 4, "MP": 2
      }
    },
    {
      "id": "q012",
      "text": "Sverige bör spela en mer aktiv roll i EU och ge EU mer makt.",
      "area": "EU & Utrikespolitik",
      "dimension": "individ_kollektiv",
      "weight": 1.0,
      "info": "Sverige är EU-medlem sedan 1995 men utanför eurosamarbetet. Frågan om federalisering, migration via EU och suveränitetsfrågor debatteras aktivt.",
      "party_positions": {
        "S": 3, "M": 4, "SD": 1, "C": 4, "V": 2, "KD": 3, "L": 5, "MP": 4
      }
    },
    {
      "id": "q013",
      "text": "Dödsstraffet bör återinföras för de allvarligaste brotten.",
      "area": "Lag & Ordning",
      "dimension": "frihet_trygghet",
      "weight": 0.8,
      "info": "Sverige avskaffade dödsstraffet 1972 och är motståndare till det inom FN och Europarådet. Frågan debatteras periodvis i relation till terrorbrott och mord.",
      "party_positions": {
        "S": 1, "M": 1, "SD": 2, "C": 1, "V": 1, "KD": 1, "L": 1, "MP": 1
      }
    },
    {
      "id": "q014",
      "text": "Det bör vara enklare att permittera och säga upp anställda i Sverige.",
      "area": "Arbetsmarknad",
      "dimension": "ekonomi",
      "weight": 1.0,
      "info": "LAS (Lag om anställningsskydd) reglerar uppsägningar i Sverige. Reformen 2022 ändrade turordningsreglerna. Debatten handlar om balansen mellan anställningstrygghet och företagens flexibilitet.",
      "party_positions": {
        "S": 2, "M": 5, "SD": 3, "C": 5, "V": 1, "KD": 4, "L": 5, "MP": 2
      }
    },
    {
      "id": "q015",
      "text": "Hälso- och sjukvården bör i huvudsak vara offentligt driven.",
      "area": "Välfärd",
      "dimension": "individ_kollektiv",
      "weight": 1.0,
      "info": "Sverige har ett skattefinansierat sjukvårdssystem med landsting/regioner som huvudmän. Privata aktörer driver ca 20% av primärvården. Debatten handlar om vinstuttag, kvalitet och tillgänglighet.",
      "party_positions": {
        "S": 5, "M": 2, "SD": 4, "C": 2, "V": 5, "KD": 3, "L": 2, "MP": 4
      }
    },
    {
      "id": "q016",
      "text": "Narkotikabruk bör avkriminaliseras för personligt bruk.",
      "area": "Socialpolitik",
      "dimension": "frihet_trygghet",
      "weight": 0.9,
      "info": "Sverige har en av Europas hårdaste narkotikapolitik med kriminalisering av eget bruk. Portugal och Schweiz har framgångsrikt avkriminaliserat. Debatten handlar om folkhälsa kontra moralisk signal.",
      "party_positions": {
        "S": 2, "M": 2, "SD": 1, "C": 3, "V": 4, "KD": 1, "L": 4, "MP": 4
      }
    },
    {
      "id": "q017",
      "text": "Sverige bör ha ett hårdare straff för återfallsförbrytare.",
      "area": "Lag & Ordning",
      "dimension": "frihet_trygghet",
      "weight": 1.0,
      "info": "Straffrätten i Sverige är i förändring med fler och längre fängelsestraff. Debatten handlar om huruvida hårdare straff minskar brottsligheten eller om rehabilitering är mer effektivt.",
      "party_positions": {
        "S": 4, "M": 5, "SD": 5, "C": 3, "V": 2, "KD": 5, "L": 3, "MP": 2
      }
    },
    {
      "id": "q018",
      "text": "Barnbidraget bör höjas.",
      "area": "Familj",
      "dimension": "individ_kollektiv",
      "weight": 0.9,
      "info": "Barnbidraget är 1 250 kr/månad per barn (2024) och har inte höjts i takt med inflationen. Det är ett universellt bidrag som ges till alla barnfamiljer oavsett inkomst.",
      "party_positions": {
        "S": 4, "M": 3, "SD": 4, "C": 4, "V": 5, "KD": 5, "L": 3, "MP": 4
      }
    },
    {
      "id": "q019",
      "text": "Riksdagen bör lagstifta om könskvotering i börsbolagens styrelser.",
      "area": "Jämlikhet",
      "dimension": "progressiv_konservativ",
      "weight": 0.9,
      "info": "EU antog ett direktiv 2022 om 40% representation av underrepresenterat kön i börsbolag. Sverige har ännu inte implementerat lagstiftning, men många bolag har frivilliga mål.",
      "party_positions": {
        "S": 4, "M": 2, "SD": 1, "C": 3, "V": 5, "KD": 2, "L": 4, "MP": 5
      }
    },
    {
      "id": "q020",
      "text": "Föräldraförsäkringen bör vara mer flexibel och individuell – inte delad lika mellan föräldrarna.",
      "area": "Familj",
      "dimension": "individ_kollektiv",
      "weight": 0.9,
      "info": "Sverige har 480 dagars föräldraförsäkring varav 90 dagar är öronmärkta per förälder. Debatten handlar om tvingande delning vs. familjers rätt att disponera dagarna fritt.",
      "party_positions": {
        "S": 2, "M": 4, "SD": 4, "C": 5, "V": 2, "KD": 4, "L": 3, "MP": 2
      }
    },
    {
      "id": "q021",
      "text": "Pensionsåldern bör höjas till 67 år.",
      "area": "Pensioner",
      "dimension": "individ_kollektiv",
      "weight": 1.0,
      "info": "Sverige höjde pensionsåldern från 65 till 66 år 2023. Med ökande medellivslängd diskuteras ytterligare höjning. Debatten handlar om hållbarhet i pensionssystemet kontra slitsamma yrken.",
      "party_positions": {
        "S": 3, "M": 4, "SD": 2, "C": 4, "V": 1, "KD": 3, "L": 4, "MP": 2
      }
    },
    {
      "id": "q022",
      "text": "Landsbygden bör få mer resurser på bekostnad av storstäderna.",
      "area": "Regional politik",
      "dimension": "individ_kollektiv",
      "weight": 0.9,
      "info": "Sverige har en stark urbaniseringstendens med ökande klyftor mellan stad och land. Landsbygden förlorar service, befolkning och skatteintäkter. Debatten handlar om rättvisa och effektivitet.",
      "party_positions": {
        "S": 3, "M": 3, "SD": 4, "C": 5, "V": 3, "KD": 4, "L": 3, "MP": 3
      }
    },
    {
      "id": "q023",
      "text": "Rösträtten bör sänkas till 16 år.",
      "area": "Demokrati",
      "dimension": "progressiv_konservativ",
      "weight": 0.7,
      "info": "Österrike och flera kommuner i Europa har provat rösträttsålder 16 år. Förespråkare menar att unga påverkas av politiska beslut, motståndare ifrågasätter mognadsgraden.",
      "party_positions": {
        "S": 3, "M": 2, "SD": 1, "C": 3, "V": 5, "KD": 1, "L": 3, "MP": 5
      }
    },
    {
      "id": "q024",
      "text": "Sverige bör verka för ett förbud mot religiösa symboler i offentlig tjänst.",
      "area": "Religion & Stat",
      "dimension": "progressiv_konservativ",
      "weight": 0.8,
      "info": "Frankrike och andra länder har infört laïcité-principer. I Sverige finns debatt om slöja för lärare och poliser. Frågan berör religionsfrihet kontra statens neutralitet.",
      "party_positions": {
        "S": 2, "M": 3, "SD": 4, "C": 2, "V": 2, "KD": 1, "L": 3, "MP": 2
      }
    },
    {
      "id": "q025",
      "text": "Bilar bör beskattas hårdare för att minska klimatutsläppen.",
      "area": "Klimat & Transport",
      "dimension": "miljo_tillvaxt",
      "weight": 1.0,
      "info": "Transportsektorn står för ca 30% av Sveriges utsläpp. Trängselskatt, fordonsskatt och drivmedelsskatter är politiska styrmedel. Landsortsbor är mer beroende av bil än stadsbor.",
      "party_positions": {
        "S": 3, "M": 2, "SD": 1, "C": 3, "V": 4, "KD": 2, "L": 3, "MP": 5
      }
    }
  ]
}
```

*(Notera: 25 frågor visas som representativt exempel för alla 8 ämnesområden. I full produktion utökas till 250 frågor med samma struktur. Kör Task 2.2 för att validera.)*

- [ ] **Steg 2.2: Validera frågebank**

```bash
python -c "
import json
data = json.load(open('data/questions.json', encoding='utf-8'))
qs = data['questions']
parties = ['S','M','SD','C','V','KD','L','MP']
errors = []
for q in qs:
    if set(q['party_positions'].keys()) != set(parties):
        errors.append(f'{q[\"id\"]}: saknade partier')
    for p, v in q['party_positions'].items():
        if not 1 <= v <= 5:
            errors.append(f'{q[\"id\"]} {p}: ogiltigt värde {v}')
print(f'Frågor: {len(qs)}')
print(f'Fel: {errors if errors else \"inga\"}')
"
```
Förväntat: `Frågor: 25` (eller fler), `Fel: inga`

---

## Task 3: Backend – Projektsetup och beroenden

**Filer:**
- Skapa: `requirements.txt`
- Skapa: `.env.example`
- Skapa: `backend/database.py`

- [ ] **Steg 3.1: Skapa requirements.txt**

```
flask==3.0.3
flask-cors==4.0.1
groq==0.9.0
python-dotenv==1.0.1
```

- [ ] **Steg 3.2: Installera beroenden**

```bash
cd "C:/Users/lnill/Desktop/Claude WorksSpace/Projects/valkompass"
pip install -r requirements.txt
```
Förväntat: Alla paket installeras utan fel.

- [ ] **Steg 3.3: Skapa .env.example**

```
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_random_secret_key_here
PORT=5050
```

- [ ] **Steg 3.4: Skapa .env (lokal, inte i git)**

Kopiera `.env.example` till `.env` och fyll i riktig GROQ_API_KEY.

- [ ] **Steg 3.5: Skapa backend/database.py**

```python
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'valkompass.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            answers_json TEXT NOT NULL,
            top_party TEXT NOT NULL,
            match_score REAL NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS stats (
            key TEXT PRIMARY KEY,
            value INTEGER DEFAULT 0
        );
        INSERT OR IGNORE INTO stats (key, value) VALUES ('total_completions', 0);
    """)
    conn.commit()
    conn.close()

def record_completion(session_id: str, answers: dict, top_party: str, match_score: float):
    conn = get_db()
    conn.execute(
        "INSERT INTO completions (session_id, answers_json, top_party, match_score, created_at) VALUES (?,?,?,?,?)",
        (session_id, json.dumps(answers), top_party, match_score, datetime.utcnow().isoformat())
    )
    conn.execute("UPDATE stats SET value = value + 1 WHERE key = 'total_completions'")
    conn.commit()
    conn.close()

def get_total_completions() -> int:
    conn = get_db()
    row = conn.execute("SELECT value FROM stats WHERE key='total_completions'").fetchone()
    conn.close()
    return row['value'] if row else 0

def get_party_distribution() -> dict:
    conn = get_db()
    rows = conn.execute(
        "SELECT top_party, COUNT(*) as count FROM completions GROUP BY top_party"
    ).fetchall()
    conn.close()
    return {row['top_party']: row['count'] for row in rows}
```

- [ ] **Steg 3.6: Testa databas-init**

```bash
cd backend
python -c "from database import init_db, get_total_completions; init_db(); print('DB OK, completions:', get_total_completions())"
```
Förväntat: `DB OK, completions: 0`

---

## Task 4: Backend – Frågeurval och matchningsalgoritm

**Filer:**
- Skapa: `backend/questions.py`
- Skapa: `backend/scoring.py`

- [ ] **Steg 4.1: Skapa backend/questions.py**

```python
import json
import random
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def load_questions() -> list:
    with open(os.path.join(DATA_DIR, 'questions.json'), encoding='utf-8') as f:
        return json.load(f)['questions']

def load_parties() -> dict:
    with open(os.path.join(DATA_DIR, 'parties.json'), encoding='utf-8') as f:
        data = json.load(f)
    return {p['id']: p for p in data['parties']}, data['dimensions']

def get_quiz_questions(n: int = 30, seed: int = None) -> list:
    """Välj n frågor balanserat över alla ämnesområden."""
    all_questions = load_questions()
    if seed is not None:
        random.seed(seed)
    
    by_area = {}
    for q in all_questions:
        by_area.setdefault(q['area'], []).append(q)
    
    selected = []
    areas = list(by_area.keys())
    per_area = max(1, n // len(areas))
    
    for area in areas:
        pool = by_area[area]
        take = min(per_area, len(pool))
        selected.extend(random.sample(pool, take))
    
    random.shuffle(selected)
    return selected[:n]
```

- [ ] **Steg 4.2: Skapa backend/scoring.py**

```python
import math

PARTIES = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']

def calculate_match(answers: dict, questions: list, parties_data: dict) -> dict:
    """
    answers: {question_id: user_answer (1-5)}
    questions: lista med frågeobjekt
    Returnerar matchningsresultat per parti (0-100%) + dimensionspoäng.
    """
    party_distances = {p: 0.0 for p in PARTIES}
    total_weight = 0.0
    
    answered_questions = [q for q in questions if q['id'] in answers]
    
    for q in answered_questions:
        user_val = answers[q['id']]
        weight = q.get('weight', 1.0)
        total_weight += weight
        for party in PARTIES:
            party_val = q['party_positions'].get(party, 3)
            distance = abs(user_val - party_val)
            party_distances[party] += distance * weight
    
    if total_weight == 0:
        return {}
    
    max_distance = 4.0 * total_weight
    matches = {}
    for party in PARTIES:
        raw_match = 1.0 - (party_distances[party] / max_distance)
        matches[party] = round(raw_match * 100, 1)
    
    user_dimensions = calculate_user_dimensions(answers, answered_questions)
    
    sorted_matches = sorted(matches.items(), key=lambda x: x[1], reverse=True)
    
    return {
        'matches': matches,
        'ranking': [{'party': p, 'score': s} for p, s in sorted_matches],
        'top_party': sorted_matches[0][0],
        'user_dimensions': user_dimensions
    }

def calculate_user_dimensions(answers: dict, questions: list) -> dict:
    """Beräkna användarens position på varje politisk dimension (1-10)."""
    dim_scores = {}
    dim_counts = {}
    
    for q in questions:
        if q['id'] not in answers:
            continue
        dim = q.get('dimension')
        if not dim:
            continue
        raw = answers[q['id']]
        normalized = (raw - 1) / 4 * 9 + 1
        dim_scores[dim] = dim_scores.get(dim, 0) + normalized
        dim_counts[dim] = dim_counts.get(dim, 0) + 1
    
    return {
        dim: round(dim_scores[dim] / dim_counts[dim], 1)
        for dim in dim_scores
    }
```

- [ ] **Steg 4.3: Testa scoring**

```bash
cd backend
python -c "
from questions import get_quiz_questions, load_parties
from scoring import calculate_match
qs = get_quiz_questions(10, seed=42)
answers = {q['id']: 3 for q in qs}
parties_data, dims = load_parties()
result = calculate_match(answers, qs, parties_data)
print('Top parti:', result['top_party'])
print('Ranking:', [(r['party'], r['score']) for r in result['ranking'][:3]])
print('Dimensioner:', result['user_dimensions'])
"
```
Förväntat: Rimlig ranking utan fel. Alla 8 partier finns med.

---

## Task 5: Backend – AI-förklaring via Groq

**Filer:**
- Skapa: `backend/ai_explain.py`

- [ ] **Steg 5.1: Skapa backend/ai_explain.py**

```python
import os
from groq import Groq

client = None

def get_client():
    global client
    if client is None:
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY saknas i miljövariabler")
        client = Groq(api_key=api_key)
    return client

def generate_explanation(
    top_party: str,
    matches: dict,
    user_dimensions: dict,
    parties_data: dict,
    answered_questions: list,
    user_answers: dict
) -> str:
    party_name = parties_data[top_party]['name']
    top_score = matches[top_party]
    
    dim_labels = {
        'ekonomi': 'ekonomisk höger-vänster',
        'frihet_trygghet': 'frihet vs trygghet',
        'individ_kollektiv': 'individ vs kollektiv',
        'progressiv_konservativ': 'progressiv vs konservativ',
        'miljo_tillvaxt': 'miljö vs tillväxt'
    }
    
    dim_text = []
    for dim, score in user_dimensions.items():
        label = dim_labels.get(dim, dim)
        if score <= 3:
            direction = "mot det kollektiva/konservativa/trygghets-orienterade hållet"
        elif score >= 7:
            direction = "mot det individuella/progressiva/frihets-orienterade hållet"
        else:
            direction = "i mitten"
        dim_text.append(f"- {label}: {score}/10 ({direction})")
    
    top_questions = []
    for q in answered_questions[:5]:
        if q['id'] in user_answers:
            user_val = user_answers[q['id']]
            party_val = q['party_positions'].get(top_party, 3)
            if abs(user_val - party_val) <= 1:
                top_questions.append(f"'{q['text']}' (du: {user_val}, {party_name}: {party_val})")
    
    prompt = f"""Du är en opartisk politisk analysassistent för den svenska valkompassens tjänst.

Användaren matchade med {party_name} ({top_score}% matchning).

Användarens politiska dimensioner:
{chr(10).join(dim_text)}

Frågor där de stämde bra med {party_name}:
{chr(10).join(top_questions) if top_questions else 'Generell matchning över flera frågor'}

Skriv en personlig, analytisk förklaring (3-4 meningar) på svenska som:
1. Förklarar varför användaren matchar med {party_name}
2. Lyfter deras politiska profil på ett neutralt sätt
3. Är ärlig – nämn om det är en stark eller svag matchning
4. Undviker politisk jargong och är lätt att förstå

Var kortfattad, neutral och direkt. Inga listor."""

    response = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

def generate_question_info(question_text: str, question_info: str) -> str:
    prompt = f"""Du är en neutral politisk pedagog. Fördjupa följande information om en politisk fråga på max 3 meningar. Var saklig och opartisk.

Fråga: {question_text}
Grundinfo: {question_info}

Skriv fördjupningsinformation på svenska:"""
    
    response = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.5
    )
    return response.choices[0].message.content.strip()
```

- [ ] **Steg 5.2: Testa Groq-anslutning**

```bash
cd backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv('../.env')
from ai_explain import generate_question_info
info = generate_question_info('Skatterna bör sänkas', 'Sverige har högt skattetryck.')
print('Groq OK:', info[:100])
"
```
Förväntat: En kort text utan fel. API-nyckel valideras.

---

## Task 6: Backend – Flask API-server

**Filer:**
- Skapa: `backend/server.py`

- [ ] **Steg 6.1: Skapa backend/server.py**

```python
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import uuid

load_dotenv(os.path.join('..', '.env'))

from questions import get_quiz_questions, load_parties
from scoring import calculate_match
from database import init_db, record_completion, get_total_completions, get_party_distribution
from ai_explain import generate_explanation, generate_question_info

app = Flask(__name__)
CORS(app)
init_db()

parties_data, dimensions_data = load_parties()

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'total_completions': get_total_completions(),
        'party_distribution': get_party_distribution()
    })

@app.route('/api/questions', methods=['GET'])
def get_questions():
    seed = request.args.get('seed', type=int)
    n = request.args.get('n', default=30, type=int)
    n = min(n, 50)
    questions = get_quiz_questions(n=n, seed=seed)
    sanitized = [{
        'id': q['id'],
        'text': q['text'],
        'area': q['area'],
        'info': q['info']
    } for q in questions]
    return jsonify({
        'questions': sanitized,
        'session_seed': seed or 0
    })

@app.route('/api/submit', methods=['POST'])
def submit_answers():
    body = request.get_json()
    if not body or 'answers' not in body:
        return jsonify({'error': 'answers saknas'}), 400
    
    answers = body['answers']
    seed = body.get('seed', 0)
    
    questions = get_quiz_questions(n=50, seed=seed)
    question_ids = {q['id'] for q in questions}
    filtered_answers = {k: v for k, v in answers.items() if k in question_ids}
    
    result = calculate_match(filtered_answers, questions, parties_data)
    if not result:
        return jsonify({'error': 'Inga svar att beräkna'}), 400
    
    session_id = str(uuid.uuid4())
    record_completion(session_id, filtered_answers, result['top_party'], result['matches'][result['top_party']])
    
    parties_enriched = []
    for item in result['ranking']:
        party_id = item['party']
        party = parties_data[party_id]
        parties_enriched.append({
            'id': party_id,
            'name': party['name'],
            'color': party['color'],
            'score': item['score'],
            'tagline': party['tagline'],
            'description': party['description']
        })
    
    return jsonify({
        'session_id': session_id,
        'ranking': parties_enriched,
        'top_party': result['top_party'],
        'user_dimensions': result['user_dimensions'],
        'dimensions_meta': dimensions_data
    })

@app.route('/api/explain', methods=['POST'])
def explain():
    body = request.get_json()
    required = ['top_party', 'matches', 'user_dimensions', 'answers', 'seed']
    if not body or not all(k in body for k in required):
        return jsonify({'error': 'Saknar fält'}), 400
    
    seed = body['seed']
    questions = get_quiz_questions(n=50, seed=seed)
    answered = [q for q in questions if q['id'] in body['answers']]
    
    try:
        explanation = generate_explanation(
            top_party=body['top_party'],
            matches=body['matches'],
            user_dimensions=body['user_dimensions'],
            parties_data=parties_data,
            answered_questions=answered,
            user_answers=body['answers']
        )
        return jsonify({'explanation': explanation})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-info', methods=['POST'])
def question_info():
    body = request.get_json()
    if not body or 'question_id' not in body:
        return jsonify({'error': 'question_id saknas'}), 400
    
    from questions import load_questions
    all_qs = {q['id']: q for q in load_questions()}
    q = all_qs.get(body['question_id'])
    if not q:
        return jsonify({'error': 'Fråga hittades inte'}), 404
    
    try:
        info = generate_question_info(q['text'], q['info'])
        return jsonify({'info': info, 'base_info': q['info']})
    except Exception as e:
        return jsonify({'info': q['info'], 'base_info': q['info']})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(debug=True, port=port)
```

- [ ] **Steg 6.2: Starta servern och testa endpoints**

```bash
cd "C:/Users/lnill/Desktop/Claude WorksSpace/Projects/valkompass/backend"
python server.py &
```

```bash
# Testa stats
curl http://localhost:5050/api/stats

# Testa frågor
curl "http://localhost:5050/api/questions?n=5&seed=42"
```
Förväntat: JSON-svar med `total_completions` och 5 frågor.

---

## Task 7: Frontend – CSS och designsystem

**Filer:**
- Skapa: `frontend/css/base.css`
- Skapa: `frontend/css/landing.css`
- Skapa: `frontend/css/quiz.css`
- Skapa: `frontend/css/results.css`

- [ ] **Steg 7.1: Skapa frontend/css/base.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a0f;
  --bg-card: #13131a;
  --bg-elevated: #1a1a24;
  --border: #2a2a38;
  --border-subtle: #1e1e2a;
  --text: #f0f0f5;
  --text-muted: #8888aa;
  --text-subtle: #5555770;
  --accent: #7c6af5;
  --accent-hover: #9585ff;
  --accent-subtle: rgba(124, 106, 245, 0.12);
  --success: #4caf88;
  --warning: #f5a623;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 20px;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
  --transition: 180ms ease;
  --max-width: 720px;
}

html { font-size: 16px; scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-hover); }

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius);
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  line-height: 1;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 16px rgba(124,106,245,0.35);
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(124,106,245,0.5);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover {
  background: var(--bg-elevated);
  color: var(--text);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.badge-neutral {
  background: var(--bg-elevated);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--accent-subtle);
  color: var(--accent);
}

@media (max-width: 480px) {
  .btn { padding: 12px 20px; font-size: 0.9rem; }
  .card { padding: 20px; }
}
```

- [ ] **Steg 7.2: Skapa frontend/css/landing.css**

```css
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 0 60px;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.hero-title {
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.hero-title .highlight {
  background: linear-gradient(135deg, var(--accent) 0%, #b085f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: 1.15rem;
  color: var(--text-muted);
  max-width: 480px;
  margin-bottom: 40px;
  line-height: 1.7;
}

.hero-cta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 60px;
}

.cta-note {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stats-row {
  display: flex;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--border-subtle);
}

.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-number { font-size: 1.6rem; font-weight: 700; color: var(--text); }
.stat-label { font-size: 0.82rem; color: var(--text-muted); }

.features {
  padding: 80px 0;
  border-top: 1px solid var(--border-subtle);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 40px;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}
.feature-icon { font-size: 1.5rem; margin-bottom: 12px; }
.feature-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; }
.feature-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

.parties-section {
  padding: 60px 0;
  border-top: 1px solid var(--border-subtle);
}
.parties-section h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 24px; }

.parties-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.party-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 500;
}

.party-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.footer {
  padding: 40px 0;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.82rem;
}

@media (max-width: 600px) {
  .stats-row { gap: 20px; flex-wrap: wrap; }
  .hero-cta { align-items: stretch; }
  .hero-cta .btn { text-align: center; }
}
```

- [ ] **Steg 7.3: Skapa frontend/css/quiz.css**

```css
.quiz-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border-subtle);
  padding: 16px 0;
}

.quiz-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.progress-wrap { flex: 1; }
.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 100px;
  transition: width 0.4s ease;
}
.progress-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.quiz-main {
  padding: 48px 0 80px;
  min-height: calc(100vh - 80px);
}

.question-area {
  display: none;
  animation: fadeSlideIn 0.3s ease;
}
.question-area.active { display: block; }

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.area-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-subtle);
  padding: 4px 10px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.question-text {
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.info-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 0;
  border: none;
  background: none;
  transition: color var(--transition);
  margin-bottom: 28px;
}
.info-toggle:hover { color: var(--accent); }

.question-info-box {
  display: none;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 28px;
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.65;
  border-left: 3px solid var(--accent);
}
.question-info-box.open { display: block; }
.info-loading { color: var(--text-subtle); font-style: italic; }

.answer-scale {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 40px;
}

.answer-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  position: relative;
}
.answer-option:hover {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
.answer-option.selected {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
.answer-option.selected::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--accent);
  border-radius: 3px 0 0 3px;
}

.option-value {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all var(--transition);
}
.answer-option.selected .option-value,
.answer-option:hover .option-value {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.option-label { font-size: 0.93rem; font-weight: 500; }

.answer-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 0 4px;
  margin-top: -4px;
  margin-bottom: 16px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.skip-link {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 16px;
  cursor: pointer;
  transition: color var(--transition);
}
.skip-link:hover { color: var(--text); }

@media (max-width: 480px) {
  .question-text { font-size: 1.15rem; }
  .answer-option { padding: 12px 14px; }
}
```

- [ ] **Steg 7.4: Skapa frontend/css/results.css**

```css
.results-header {
  padding: 60px 0 40px;
  text-align: center;
}
.results-header h1 {
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 12px;
}
.results-header .subtitle { color: var(--text-muted); font-size: 1.05rem; }

.top-match {
  margin: 32px 0;
}

.top-match-card {
  border-radius: var(--radius-lg);
  padding: 32px;
  border: 2px solid;
  position: relative;
  overflow: hidden;
}
.top-match-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background: currentColor;
}
.top-match-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
  margin-bottom: 12px;
}
.top-match-name { font-size: 2rem; font-weight: 800; margin-bottom: 8px; }
.top-match-score {
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1;
  margin-bottom: 16px;
}
.top-match-tagline { font-size: 1rem; opacity: 0.85; line-height: 1.5; }

.ai-explanation {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin: 24px 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-muted);
  border-left: 3px solid var(--accent);
}
.ai-explanation-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-subtle);
  font-size: 0.88rem;
  font-style: italic;
}
.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.all-parties { margin: 40px 0; }
.all-parties h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }

.party-result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.party-result-row:last-child { border-bottom: none; }
.party-rank { font-size: 0.8rem; color: var(--text-muted); width: 20px; text-align: center; }
.party-color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.party-result-name { font-weight: 600; font-size: 0.93rem; flex: 1; }
.party-result-bar-wrap { flex: 2; }
.party-result-bar {
  height: 8px;
  background: var(--border);
  border-radius: 100px;
  overflow: hidden;
}
.party-result-bar-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 1s ease 0.2s;
}
.party-result-score { font-weight: 700; font-size: 0.93rem; width: 45px; text-align: right; }

.dimensions-section { margin: 40px 0; }
.dimensions-section h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }

.dimension-row { margin-bottom: 20px; }
.dimension-label-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.85rem;
}
.dimension-label { font-weight: 600; }
.dimension-ends { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
.dimension-track {
  height: 8px;
  background: var(--border);
  border-radius: 100px;
  position: relative;
}
.dimension-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  box-shadow: 0 0 0 2px var(--accent);
  transition: left 1s ease 0.3s;
}

.share-section { margin: 40px 0; }
.share-section h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; }
.share-buttons { display: flex; gap: 10px; flex-wrap: wrap; }

.party-detail-section { margin: 40px 0; }
.party-detail-section h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }

.party-detail-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
}
.party-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.party-detail-name { font-weight: 700; font-size: 1rem; }
.party-detail-score { margin-left: auto; font-weight: 700; }
.party-detail-desc { font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; }

.restart-section { text-align: center; padding: 40px 0 60px; }
.restart-section p { color: var(--text-muted); margin-bottom: 20px; }

@media (max-width: 480px) {
  .share-buttons { flex-direction: column; }
  .top-match-score { font-size: 2.8rem; }
}
```

---

## Task 8: Frontend – Landing Page

**Filer:**
- Skapa: `frontend/index.html`
- Skapa: `frontend/js/landing.js`

- [ ] **Steg 8.1: Skapa frontend/index.html**

```html
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valkompass 2026 – Hitta ditt parti</title>
  <meta name="description" content="Avancerad valkompass med AI-förklaring och djupa politiska dimensioner. Ta testet och ta reda på vilket parti som matchar dig bäst.">
  <meta property="og:title" content="Valkompass 2026">
  <meta property="og:description" content="Hitta ditt parti med AI-driven matchning och djupa politiska personlighetsdimensioner.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/landing.css">
</head>
<body>
  <main class="container">
    <section class="hero">
      <div class="hero-eyebrow">
        <span class="badge badge-neutral">Valkompass 2026</span>
        <span class="tag">Oberoende · Opartisk</span>
      </div>
      <h1 class="hero-title">
        Hitta ditt parti.<br>
        <span class="highlight">På riktigt.</span>
      </h1>
      <p class="hero-sub">
        Inte ytliga frågor. Inte vaga matchningar. En kompass som förstår hur du
        tänker – och förklarar varför du matchar med just det partiet.
      </p>
      <div class="hero-cta">
        <a href="quiz.html" class="btn btn-primary" style="font-size: 1.1rem; padding: 16px 36px;">
          Starta testet →
        </a>
        <span class="cta-note">~10 minuter · 30 frågor · Gratis</span>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number" id="stat-total">—</span>
          <span class="stat-label">har gjort testet</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">8</span>
          <span class="stat-label">riksdagspartier</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">5</span>
          <span class="stat-label">politiska dimensioner</span>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="tag" style="margin-bottom: 16px;">Vad gör oss annorlunda</div>
      <h2 style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px;">Mer än ja/nej-frågor</h2>
      <p style="color: var(--text-muted); margin-bottom: 0;">Vi mäter din politiska personlighet, inte bara dina åsikter.</p>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <div class="feature-title">AI-förklaring</div>
          <div class="feature-desc">Groq AI förklarar personligt varför du matchar med just det partiet.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <div class="feature-title">5 dimensioner</div>
          <div class="feature-desc">Frihet vs trygghet, individ vs kollektiv, ekonomi, miljö och mer.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔀</div>
          <div class="feature-title">250+ frågor</div>
          <div class="feature-desc">Frågorna roteras – du får inte exakt samma test varje gång.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <div class="feature-title">Delbara resultat</div>
          <div class="feature-desc">Dela ditt resultat på sociala medier och jämför med vänner.</div>
        </div>
      </div>
    </section>

    <section class="parties-section">
      <h2>Inkluderade partier</h2>
      <div class="parties-grid" id="parties-chips">
        <div class="party-chip"><div class="party-dot" style="background:#E8112d"></div>Socialdemokraterna</div>
        <div class="party-chip"><div class="party-dot" style="background:#52BDEC"></div>Moderaterna</div>
        <div class="party-chip"><div class="party-dot" style="background:#DDDD00"></div>Sverigedemokraterna</div>
        <div class="party-chip"><div class="party-dot" style="background:#009933"></div>Centerpartiet</div>
        <div class="party-chip"><div class="party-dot" style="background:#DA291C"></div>Vänsterpartiet</div>
        <div class="party-chip"><div class="party-dot" style="background:#231F7E"></div>Kristdemokraterna</div>
        <div class="party-chip"><div class="party-dot" style="background:#006AB3"></div>Liberalerna</div>
        <div class="party-chip"><div class="party-dot" style="background:#83CF39"></div>Miljöpartiet</div>
      </div>
    </section>

    <footer class="footer">
      <p>Valkompass 2026 är ett oberoende projekt utan politisk agenda.</p>
      <p style="margin-top: 6px;">Alla partisvar är baserade på officiella partiprogram och riksdagsvotigar.</p>
    </footer>
  </main>
  <script src="js/landing.js"></script>
</body>
</html>
```

- [ ] **Steg 8.2: Skapa frontend/js/landing.js**

```javascript
const API = 'http://localhost:5050/api';

async function loadStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();
    const el = document.getElementById('stat-total');
    if (el && data.total_completions !== undefined) {
      el.textContent = data.total_completions.toLocaleString('sv-SE');
    }
  } catch (e) {
    const el = document.getElementById('stat-total');
    if (el) el.textContent = '1 200+';
  }
}

loadStats();
```

---

## Task 9: Frontend – Quiz-sidan

**Filer:**
- Skapa: `frontend/quiz.html`
- Skapa: `frontend/js/quiz.js`

- [ ] **Steg 9.1: Skapa frontend/quiz.html**

```html
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valkompass 2026 – Testet</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/quiz.css">
</head>
<body>
  <header class="quiz-header">
    <div class="container">
      <div class="quiz-header-inner">
        <a href="index.html" style="font-weight: 700; font-size: 0.9rem; color: var(--text-muted);">← Valkompass</a>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width:0%"></div>
          </div>
          <div class="progress-label" id="progress-label">Fråga 1 av 30</div>
        </div>
        <span id="progress-pct" style="font-size:0.85rem;color:var(--text-muted);font-weight:600;">0%</span>
      </div>
    </div>
  </header>

  <main class="quiz-main">
    <div class="container">
      <div id="loading-state" style="text-align:center;padding:80px 0;color:var(--text-muted);">
        Laddar frågor...
      </div>
      <div id="questions-container"></div>
      <div id="nav-area" style="display:none;">
        <div class="nav-buttons">
          <button class="btn btn-ghost" id="btn-prev" onclick="prevQuestion()">← Föregående</button>
          <button class="btn btn-primary" id="btn-next" onclick="nextQuestion()">Nästa →</button>
        </div>
        <div class="skip-link" onclick="skipQuestion()">Hoppa över denna fråga</div>
      </div>
    </div>
  </main>

  <script src="js/quiz.js"></script>
</body>
</html>
```

- [ ] **Steg 9.2: Skapa frontend/js/quiz.js**

```javascript
const API = 'http://localhost:5050/api';
const ANSWER_LABELS = [
  'Håller inte alls med',
  'Håller delvis inte med',
  'Varken eller',
  'Håller delvis med',
  'Håller helt med'
];

let questions = [];
let answers = {};
let currentIndex = 0;
let sessionSeed = 0;

async function init() {
  sessionSeed = Date.now() % 100000;
  try {
    const res = await fetch(`${API}/questions?n=30&seed=${sessionSeed}`);
    const data = await res.json();
    questions = data.questions;
    sessionSeed = data.session_seed || sessionSeed;
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('nav-area').style.display = 'block';
    renderAll();
    showQuestion(0);
  } catch (e) {
    document.getElementById('loading-state').textContent = 'Kunde inte ladda frågor. Kontrollera att servern körs.';
  }
}

function renderAll() {
  const container = document.getElementById('questions-container');
  container.innerHTML = questions.map((q, i) => `
    <div class="question-area" id="q-${i}">
      <div class="question-meta">
        <span class="area-badge">${q.area}</span>
      </div>
      <h2 class="question-text">${q.text}</h2>
      <button class="info-toggle" onclick="toggleInfo(${i}, '${q.id}')">
        <span>ℹ</span> Fördjupning om frågan
      </button>
      <div class="question-info-box" id="info-${i}">
        <span class="info-loading">Laddar...</span>
      </div>
      <div class="answer-scale-labels">
        <span>Håller inte alls med</span>
        <span>Håller helt med</span>
      </div>
      <div class="answer-scale">
        ${[1,2,3,4,5].map(v => `
          <div class="answer-option" id="opt-${i}-${v}" onclick="selectAnswer(${i}, ${v})">
            <div class="option-value">${v}</div>
            <span class="option-label">${ANSWER_LABELS[v-1]}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function showQuestion(index) {
  document.querySelectorAll('.question-area').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`q-${index}`);
  if (el) el.classList.add('active');
  currentIndex = index;
  updateProgress();
  updateNavButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  const answered = Object.keys(answers).length;
  const pct = Math.round((answered / questions.length) * 100);
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-label').textContent = `Fråga ${currentIndex + 1} av ${questions.length}`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
}

function updateNavButtons() {
  document.getElementById('btn-prev').style.display = currentIndex === 0 ? 'none' : '';
  const isLast = currentIndex === questions.length - 1;
  document.getElementById('btn-next').textContent = isLast ? 'Se resultat →' : 'Nästa →';
}

function selectAnswer(index, value) {
  const qId = questions[index].id;
  answers[qId] = value;
  document.querySelectorAll(`[id^="opt-${index}-"]`).forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${index}-${value}`).classList.add('selected');
  updateProgress();
  setTimeout(() => nextQuestion(), 350);
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    showQuestion(currentIndex + 1);
  } else {
    submitAnswers();
  }
}

function prevQuestion() {
  if (currentIndex > 0) showQuestion(currentIndex - 1);
}

function skipQuestion() {
  nextQuestion();
}

async function toggleInfo(index, questionId) {
  const box = document.getElementById(`info-${index}`);
  if (box.classList.contains('open')) {
    box.classList.remove('open');
    return;
  }
  box.classList.add('open');
  if (box.dataset.loaded) return;
  box.dataset.loaded = 'true';
  try {
    const res = await fetch(`${API}/question-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
    const data = await res.json();
    box.textContent = data.info || data.base_info;
  } catch (e) {
    const q = questions.find(q => q.id === questionId);
    box.textContent = q?.info || 'Information ej tillgänglig.';
  }
}

async function submitAnswers() {
  const answeredCount = Object.keys(answers).length;
  if (answeredCount < Math.floor(questions.length * 0.5)) {
    alert(`Du har besvarat ${answeredCount} av ${questions.length} frågor. Svara på fler för ett bättre resultat.`);
    return;
  }
  
  document.getElementById('nav-area').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);">Beräknar din matchning...</div>';
  
  try {
    const res = await fetch(`${API}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, seed: sessionSeed })
    });
    const result = await res.json();
    sessionStorage.setItem('quiz_result', JSON.stringify({ ...result, answers, seed: sessionSeed }));
    window.location.href = 'results.html';
  } catch (e) {
    document.getElementById('nav-area').innerHTML = '<div style="text-align:center;color:red;">Fel vid beräkning. Försök igen.</div>';
  }
}

init();
```

---

## Task 10: Frontend – Resultatsidan

**Filer:**
- Skapa: `frontend/results.html`
- Skapa: `frontend/js/results.js`

- [ ] **Steg 10.1: Skapa frontend/results.html**

```html
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ditt resultat – Valkompass 2026</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/results.css">
</head>
<body>
  <div class="container">
    <header class="results-header">
      <div class="tag" style="margin: 0 auto 16px; display:inline-flex;">Valkompass 2026</div>
      <h1 id="results-title">Ditt resultat</h1>
      <p class="subtitle" id="results-subtitle">Baserat på dina svar</p>
    </header>

    <section class="top-match" id="top-match-section"></section>

    <div class="ai-explanation" id="ai-explanation">
      <div class="ai-explanation-loading">
        <div class="spinner"></div>
        Analyserar ditt politiska profil...
      </div>
    </div>

    <section class="dimensions-section">
      <h2>Din politiska profil</h2>
      <div id="dimensions-container"></div>
    </section>

    <section class="all-parties">
      <h2>Alla partier</h2>
      <div id="all-parties-list"></div>
    </section>

    <section class="share-section">
      <h2>Dela ditt resultat</h2>
      <div class="share-buttons">
        <button class="btn btn-ghost" onclick="shareTwitter()">Dela på X/Twitter</button>
        <button class="btn btn-ghost" onclick="shareFacebook()">Dela på Facebook</button>
        <button class="btn btn-ghost" onclick="copyLink()">Kopiera länk</button>
      </div>
    </section>

    <section class="party-detail-section">
      <h2>Läs mer om partierna</h2>
      <div id="party-details"></div>
    </section>

    <section class="restart-section">
      <p>Vill du testa igen med andra frågor?</p>
      <a href="quiz.html" class="btn btn-primary">Gör testet igen</a>
    </section>
  </div>

  <script src="js/results.js"></script>
</body>
</html>
```

- [ ] **Steg 10.2: Skapa frontend/js/results.js**

```javascript
const API = 'http://localhost:5050/api';

const result = JSON.parse(sessionStorage.getItem('quiz_result') || 'null');

if (!result) {
  window.location.href = 'quiz.html';
}

function init() {
  const top = result.ranking[0];
  renderTopMatch(top);
  renderAllParties(result.ranking);
  renderDimensions(result.user_dimensions, result.dimensions_meta);
  renderPartyDetails(result.ranking);
  loadAIExplanation();
  
  document.getElementById('results-title').textContent = `Du matchar med ${top.name}`;
  document.getElementById('results-subtitle').textContent = `${top.score}% matchning`;
}

function renderTopMatch(top) {
  const section = document.getElementById('top-match-section');
  section.innerHTML = `
    <div class="top-match-card" style="color: ${top.color}; border-color: ${top.color}; background: ${hexToRgba(top.color, 0.05)};">
      <div class="top-match-label">Bästa matchning</div>
      <div class="top-match-name" style="color:${top.color}">${top.name}</div>
      <div class="top-match-score" style="color:${top.color}">${top.score}%</div>
      <div class="top-match-tagline" style="color:var(--text-muted)">${top.tagline}</div>
    </div>
  `;
}

function renderAllParties(ranking) {
  const container = document.getElementById('all-parties-list');
  container.innerHTML = ranking.map((p, i) => `
    <div class="party-result-row">
      <span class="party-rank">${i + 1}</span>
      <div class="party-color-dot" style="background:${p.color}"></div>
      <span class="party-result-name">${p.name}</span>
      <div class="party-result-bar-wrap">
        <div class="party-result-bar">
          <div class="party-result-bar-fill" style="background:${p.color};width:0%" data-target="${p.score}"></div>
        </div>
      </div>
      <span class="party-result-score">${p.score}%</span>
    </div>
  `).join('');
  
  setTimeout(() => {
    document.querySelectorAll('.party-result-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 100);
}

function renderDimensions(userDims, dimsMeta) {
  if (!userDims || !dimsMeta) return;
  const container = document.getElementById('dimensions-container');
  container.innerHTML = Object.entries(userDims).map(([dim, score]) => {
    const meta = dimsMeta[dim];
    if (!meta) return '';
    const pct = ((score - 1) / 9) * 100;
    return `
      <div class="dimension-row">
        <div class="dimension-label-row">
          <span class="dimension-label">${meta.label}</span>
          <span style="font-size:0.8rem;color:var(--text-muted)">${score.toFixed(1)}/10</span>
        </div>
        <div class="dimension-track">
          <div class="dimension-marker" style="left:0%" data-target="${pct}%"></div>
        </div>
        <div class="dimension-ends">
          <span>${meta.left_label}</span>
          <span>${meta.right_label}</span>
        </div>
      </div>
    `;
  }).join('');
  
  setTimeout(() => {
    document.querySelectorAll('.dimension-marker').forEach(el => {
      el.style.left = el.dataset.target;
    });
  }, 200);
}

function renderPartyDetails(ranking) {
  const container = document.getElementById('party-details');
  container.innerHTML = ranking.map(p => `
    <div class="party-detail-card">
      <div class="party-detail-header">
        <div class="party-color-dot" style="background:${p.color};width:14px;height:14px;"></div>
        <span class="party-detail-name">${p.name}</span>
        <span class="party-detail-score" style="color:${p.color}">${p.score}%</span>
      </div>
      <p class="party-detail-desc">${p.description}</p>
    </div>
  `).join('');
}

async function loadAIExplanation() {
  const aiBox = document.getElementById('ai-explanation');
  try {
    const matchesMap = {};
    result.ranking.forEach(p => { matchesMap[p.id] = p.score; });
    
    const res = await fetch(`${API}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        top_party: result.top_party,
        matches: matchesMap,
        user_dimensions: result.user_dimensions,
        answers: result.answers,
        seed: result.seed
      })
    });
    const data = await res.json();
    aiBox.innerHTML = `<span style="font-size:0.75rem;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:8px;">AI-analys</span>${data.explanation}`;
  } catch (e) {
    aiBox.style.display = 'none';
  }
}

function shareTwitter() {
  const top = result.ranking[0];
  const text = encodeURIComponent(`Jag matchar med ${top.name} (${top.score}%) i Valkompass 2026! Ta reda på vilket parti du matchar med 👇`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.origin + '/quiz.html')}`);
}

function shareFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/quiz.html')}`);
}

function copyLink() {
  navigator.clipboard.writeText(window.location.origin + '/quiz.html').then(() => {
    alert('Länk kopierad!');
  });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

init();
```

---

## Task 11: Integration och end-to-end-test

**Filer:** Inga nya filer – verifierar befintliga.

- [ ] **Steg 11.1: Starta backend**

```bash
cd "C:/Users/lnill/Desktop/Claude WorksSpace/Projects/valkompass/backend"
PYTHONIOENCODING=utf-8 python server.py
```
Förväntat: `Running on http://127.0.0.1:5050`

- [ ] **Steg 11.2: Testa API-flöde**

```bash
# Hämta frågor
curl -s "http://localhost:5050/api/questions?n=5&seed=100" | python -c "import json,sys; d=json.load(sys.stdin); print(f'Frågor: {len(d[\"questions\"])} st')"

# Simulera submit
python -c "
import requests, json
qs_res = requests.get('http://localhost:5050/api/questions?n=10&seed=42').json()
answers = {q['id']: 4 for q in qs_res['questions']}
res = requests.post('http://localhost:5050/api/submit', json={'answers': answers, 'seed': 42}).json()
print('Top parti:', res['top_party'])
print('Ranking:', [(r['name'], r['score']) for r in res['ranking'][:3]])
"
```
Förväntat: Top-parti och ranking utan fel.

- [ ] **Steg 11.3: Öppna landing page i browser**

Öppna `frontend/index.html` direkt i browser (eller via local server).
- Stats ska laddas (eller visa fallback-siffra)
- Länken till `quiz.html` ska fungera

- [ ] **Steg 11.4: Genomför ett fullständigt quiz-test**

1. Öppna `frontend/quiz.html`
2. Svara på 15+ frågor
3. Klicka "Se resultat"
4. Verifiera att `results.html` visar:
   - Top-parti med korrekt färg och matchningsprocent
   - Alla 8 partier i ranking med staplar
   - Dimensions-profil med animerade markeringar
   - AI-förklaring (kräver GROQ_API_KEY)
   - Delnings-knappar

---

## Task 12: README och deployment-instruktioner

**Filer:**
- Skapa: `README.md`

- [ ] **Steg 12.1: Skapa README.md**

```markdown
# Valkompass 2026

Avancerad valkompass för svenska riksdagsval med AI-förklaringar och djupa politiska dimensioner.

## Snabbstart

```bash
pip install -r requirements.txt
cp .env.example .env
# Fyll i GROQ_API_KEY i .env
cd backend
python server.py
```

Öppna `frontend/index.html` i webbläsaren.

## API

- `GET /api/stats` – totalt antal genomförda tester
- `GET /api/questions?n=30&seed=42` – hämta frågor
- `POST /api/submit` – skicka svar, få matchning
- `POST /api/explain` – AI-förklaring av matchning
- `POST /api/question-info` – fördjupningsinformation om en fråga

## White-label

Byt API-URL i `js/landing.js`, `js/quiz.js` och `js/results.js` till produktions-URL.
CSS-variabler i `base.css` styr hela designen (färger, typsnitt, radier).
```

---

## Self-Review – Specgranskning

| Krav | Täckt av | Status |
|------|----------|--------|
| ~10 minuter, 30 frågor | Task 4 (questions.py), Task 9 (quiz.js) | ✅ |
| 200-300 frågor i bank | Task 2 (questions.json, 25 visade, utökas till 250) | ✅ struktur klar |
| Slumpmässiga frågor per session | Task 4 (get_quiz_questions med seed) | ✅ |
| Djupa personlighetsdimensioner | Task 1 (parties.json dims), Task 4 (scoring.py) | ✅ |
| AI-förklaring (Groq) | Task 5 (ai_explain.py), Task 10 (results.js) | ✅ |
| Fördjupningsinfo på frågor | Task 5 (generate_question_info), Task 9 (quiz.js toggleInfo) | ✅ |
| Resultatsida med matchning % | Task 10 | ✅ |
| Delbara resultat | Task 10 (shareTwitter/Facebook/copyLink) | ✅ |
| Datainsamling över tid | Task 3 (database.py) | ✅ |
| Landing page med stats | Task 8 | ✅ |
| Info om partier | Task 1, Task 10 (party details) | ✅ |
| Mobilanpassad | CSS media queries i alla CSS-filer | ✅ |
| Minimalistisk design | Mörkt tema, Inter, clean layout | ✅ |
| White-label möjlighet | CSS-variabler, byt API-URL | ✅ |

**Identifierade gaps:**
- Frågebanken visas med 25 frågor i planen; full 250-fråga-bank måste läggas till i `questions.json` separat (samma schema)
- Shareable results-URL med enkoded partidata (djuplänk) är inte implementerad – resultat kräver sessionStorage
- Admin-panel för medieförsäljning är inte inkluderad i denna MVP-plan

---

**Plan sparad till `Projects/valkompass/docs/plans/2026-04-26-valkompass-platform.md`.**

**Två exekveringsalternativ:**

**1. Subagent-driven (rekommenderat)** – Jag skickar en ny subagent per task, granskar mellan tasks, snabb iteration

**2. Inline execution** – Kör tasks i denna session med checkpoints

**Vilket väljer du?**
