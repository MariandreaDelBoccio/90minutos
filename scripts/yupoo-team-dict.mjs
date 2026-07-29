/**
 * Diccionario de equipos/selecciones para el catálogo Yupoo.
 * aliases: nombres en EN/ES/otros; se hace match por palabra completa (case-insensitive).
 * Orden: aliases más largos/específicos ganan (p.ej. "manchester united" > "united").
 */

export const YUPOO_TEAMS = [
  // Selecciones
  { id: "spain", name: "España", aliases: ["spain", "españa", "espana", "spanish national"] },
  { id: "brazil", name: "Brasil", aliases: ["brazil", "brasil"] },
  { id: "argentina", name: "Argentina", aliases: ["argentina"] },
  { id: "portugal", name: "Portugal", aliases: ["portugal"] },
  { id: "france", name: "Francia", aliases: ["france", "francia"] },
  { id: "germany", name: "Alemania", aliases: ["germany", "alemania", "deutschland"] },
  { id: "italy", name: "Italia", aliases: ["italy", "italia"] },
  { id: "england", name: "Inglaterra", aliases: ["england", "inglaterra"] },
  { id: "netherlands", name: "Países Bajos", aliases: ["netherlands", "holland", "holanda"] },
  { id: "belgium", name: "Bélgica", aliases: ["belgium", "belgica", "bélgica"] },
  { id: "croatia", name: "Croacia", aliases: ["croatia", "croacia"] },
  { id: "uruguay", name: "Uruguay", aliases: ["uruguay"] },
  { id: "colombia", name: "Colombia", aliases: ["colombia"] },
  { id: "mexico", name: "México", aliases: ["mexico", "méxico"] },
  { id: "usa", name: "Estados Unidos", aliases: ["usa", "united states", "estados unidos", "usmnt"] },
  { id: "japan", name: "Japón", aliases: ["japan", "japón", "japon"] },
  { id: "korea", name: "Corea del Sur", aliases: ["south korea", "korea", "corea"] },
  { id: "australia", name: "Australia", aliases: ["australia"] },
  { id: "morocco", name: "Marruecos", aliases: ["morocco", "marruecos"] },
  { id: "senegal", name: "Senegal", aliases: ["senegal"] },
  { id: "nigeria", name: "Nigeria", aliases: ["nigeria"] },
  { id: "ghana", name: "Ghana", aliases: ["ghana"] },
  { id: "egypt", name: "Egipto", aliases: ["egypt", "egipto"] },
  { id: "canada", name: "Canadá", aliases: ["canada", "canadá"] },
  { id: "chile", name: "Chile", aliases: ["chile"] },
  { id: "peru", name: "Perú", aliases: ["peru", "perú"] },
  { id: "ecuador", name: "Ecuador", aliases: ["ecuador"] },
  { id: "venezuela", name: "Venezuela", aliases: ["venezuela"] },
  { id: "turkey", name: "Turquía", aliases: ["turkey", "turquia", "türkiye", "turkiye"] },
  { id: "switzerland", name: "Suiza", aliases: ["switzerland", "suiza"] },
  { id: "austria", name: "Austria", aliases: ["austria"] },
  { id: "poland", name: "Polonia", aliases: ["poland", "polonia"] },
  { id: "sweden", name: "Suecia", aliases: ["sweden", "suecia"] },
  { id: "denmark", name: "Dinamarca", aliases: ["denmark", "dinamarca"] },
  { id: "norway", name: "Noruega", aliases: ["norway", "noruega"] },
  { id: "scotland", name: "Escocia", aliases: ["scotland", "escocia"] },
  { id: "wales", name: "Gales", aliases: ["wales", "gales"] },
  { id: "ireland", name: "Irlanda", aliases: ["ireland", "irlanda", "republic of ireland"] },
  { id: "czech", name: "República Checa", aliases: ["czech republic", "czech", "chequia"] },
  { id: "serbia", name: "Serbia", aliases: ["serbia"] },
  { id: "ukraine", name: "Ucrania", aliases: ["ukraine", "ucrania"] },
  { id: "saudi", name: "Arabia Saudí", aliases: ["saudi arabia", "saudi", "arabia saud"] },
  { id: "qatar", name: "Catar", aliases: ["qatar", "catar"] },
  { id: "ivory-coast", name: "Costa de Marfil", aliases: ["ivory coast", "cote d'ivoire", "costa de marfil"] },
  { id: "cameroon", name: "Camerún", aliases: ["cameroon", "camerun", "camerún"] },
  { id: "algeria", name: "Argelia", aliases: ["algeria", "argelia"] },
  { id: "tunisia", name: "Túnez", aliases: ["tunisia", "tunez", "túnez"] },
  { id: "iran", name: "Irán", aliases: ["iran", "irán"] },
  { id: "china", name: "China", aliases: ["china"] },
  { id: "honduras", name: "Honduras", aliases: ["honduras"] },
  { id: "panama", name: "Panamá", aliases: ["panama", "panamá"] },
  { id: "costa-rica", name: "Costa Rica", aliases: ["costa rica"] },
  { id: "jamaica", name: "Jamaica", aliases: ["jamaica"] },
  { id: "new-zealand", name: "Nueva Zelanda", aliases: ["new zealand", "nueva zelanda"] },

  // LaLiga / España
  { id: "real-madrid", name: "Real Madrid", aliases: ["real madrid"] },
  { id: "barcelona", name: "FC Barcelona", aliases: ["fc barcelona", "barcelona", "barça", "barca"] },
  { id: "atletico", name: "Atlético Madrid", aliases: ["atletico madrid", "atlético madrid", "atletico de madrid", "atlético de madrid"] },
  { id: "sevilla", name: "Sevilla", aliases: ["sevilla fc", "sevilla", "seville"] },
  { id: "valencia", name: "Valencia", aliases: ["valencia cf", "valencia"] },
  { id: "athletic", name: "Athletic Club", aliases: ["athletic bilbao", "athletic club", "athletic"] },
  { id: "real-sociedad", name: "Real Sociedad", aliases: ["real sociedad"] },
  { id: "villarreal", name: "Villarreal", aliases: ["villarreal"] },
  { id: "betis", name: "Real Betis", aliases: ["real betis", "betis"] },
  { id: "osasuna", name: "Osasuna", aliases: ["osasuna"] },
  { id: "celta", name: "Celta de Vigo", aliases: ["celta vigo", "celta de vigo", "celta"] },
  { id: "getafe", name: "Getafe", aliases: ["getafe"] },
  { id: "mallorca", name: "Mallorca", aliases: ["mallorca", "rcd mallorca"] },
  { id: "girona", name: "Girona", aliases: ["girona"] },
  { id: "espanyol", name: "Espanyol", aliases: ["espanyol", "rcd espanyol"] },
  { id: "las-palmas", name: "Las Palmas", aliases: ["las palmas"] },
  { id: "cadiz", name: "Cádiz", aliases: ["cadiz", "cádiz"] },
  { id: "alaves", name: "Alavés", aliases: ["alaves", "alavés", "deportivo alaves"] },
  { id: "leganes", name: "Leganés", aliases: ["leganes", "leganés"] },
  { id: "rayo", name: "Rayo Vallecano", aliases: ["rayo vallecano", "rayo"] },

  // Premier
  { id: "man-united", name: "Manchester United", aliases: ["manchester united", "man united", "man utd"] },
  { id: "man-city", name: "Manchester City", aliases: ["manchester city", "man city"] },
  { id: "liverpool", name: "Liverpool", aliases: ["liverpool"] },
  { id: "chelsea", name: "Chelsea", aliases: ["chelsea"] },
  { id: "arsenal", name: "Arsenal", aliases: ["arsenal"] },
  { id: "tottenham", name: "Tottenham", aliases: ["tottenham", "spurs"] },
  { id: "newcastle", name: "Newcastle", aliases: ["newcastle united", "newcastle"] },
  { id: "aston-villa", name: "Aston Villa", aliases: ["aston villa"] },
  { id: "west-ham", name: "West Ham", aliases: ["west ham"] },
  { id: "brighton", name: "Brighton", aliases: ["brighton"] },
  { id: "everton", name: "Everton", aliases: ["everton"] },
  { id: "wolves", name: "Wolverhampton", aliases: ["wolverhampton", "wolves"] },
  { id: "crystal-palace", name: "Crystal Palace", aliases: ["crystal palace"] },
  { id: "fulham", name: "Fulham", aliases: ["fulham"] },
  { id: "brentford", name: "Brentford", aliases: ["brentford"] },
  { id: "nottingham", name: "Nottingham Forest", aliases: ["nottingham forest", "nottingham"] },
  { id: "bournemouth", name: "Bournemouth", aliases: ["bournemouth"] },
  { id: "leicester", name: "Leicester", aliases: ["leicester city", "leicester"] },
  { id: "leeds", name: "Leeds United", aliases: ["leeds united", "leeds"] },
  { id: "southampton", name: "Southampton", aliases: ["southampton"] },
  { id: "ipswich", name: "Ipswich Town", aliases: ["ipswich"] },

  // Serie A
  { id: "juventus", name: "Juventus", aliases: ["juventus", "juve"] },
  { id: "inter", name: "Inter de Milán", aliases: ["inter milan", "inter de milan", "internazionale", "inter"] },
  { id: "ac-milan", name: "AC Milan", aliases: ["ac milan", "a.c. milan"] },
  { id: "napoli", name: "Napoli", aliases: ["ssc napoli", "ssc napol", "napoli"] },
  { id: "roma", name: "AS Roma", aliases: ["as roma", "roma"] },
  { id: "lazio", name: "Lazio", aliases: ["lazio"] },
  { id: "fiorentina", name: "Fiorentina", aliases: ["fiorentina", "florence"] },
  { id: "atalanta", name: "Atalanta", aliases: ["atalanta"] },
  { id: "torino", name: "Torino", aliases: ["torino"] },
  { id: "bologna", name: "Bologna", aliases: ["bologna"] },

  // Bundesliga
  { id: "bayern", name: "Bayern Múnich", aliases: ["bayern munich", "bayern múnich", "bayern munchen", "fc bayern", "bayern"] },
  { id: "dortmund", name: "Borussia Dortmund", aliases: ["borussia dortmund", "dortmund", "bvb"] },
  { id: "leverkusen", name: "Bayer Leverkusen", aliases: ["bayer leverkusen", "leverkusen"] },
  { id: "leipzig", name: "RB Leipzig", aliases: ["rb leipzig", "leipzig"] },
  { id: "frankfurt", name: "Eintracht Frankfurt", aliases: ["eintracht frankfurt", "frankfurt"] },
  { id: "gladbach", name: "Borussia M'gladbach", aliases: ["monchengladbach", "mönchengladbach", "gladbach"] },
  { id: "wolfsburg", name: "Wolfsburg", aliases: ["wolfsburg", "vfl wolfsburg"] },
  { id: "st-pauli", name: "FC St. Pauli", aliases: ["st. pauli", "st pauli", "fc st. pauli"] },

  // Ligue 1 / Francia
  { id: "psg", name: "PSG", aliases: ["paris saint-germain", "paris saint germain", "paris saint", "psg"] },
  { id: "marseille", name: "Olympique Marsella", aliases: ["olympique marseille", "marseille", "marsella"] },
  { id: "lyon", name: "Olympique Lyon", aliases: ["olympique lyon", "lyon", "ol lyon"] },
  { id: "monaco", name: "AS Monaco", aliases: ["as monaco", "monaco"] },
  { id: "lille", name: "Lille", aliases: ["lille"] },
  { id: "nice", name: "Nice", aliases: ["ogc nice", "nice"] },

  // Portugal
  { id: "benfica", name: "Benfica", aliases: ["benfica", "sl benfica"] },
  { id: "porto", name: "FC Porto", aliases: ["fc porto", "porto"] },
  { id: "sporting", name: "Sporting CP", aliases: ["sporting lisbon", "sporting lisboa", "sporting cp", "sporting"] },

  // Países Bajos
  { id: "ajax", name: "Ajax", aliases: ["ajax"] },
  { id: "psv", name: "PSV", aliases: ["psv eindhoven", "psv"] },
  { id: "feyenoord", name: "Feyenoord", aliases: ["feyenoord"] },

  // MLS / América
  { id: "inter-miami", name: "Inter Miami", aliases: ["inter miami"] },
  { id: "lafc", name: "LAFC", aliases: ["lafc", "los angeles fc"] },
  { id: "lagalaxy", name: "LA Galaxy", aliases: ["la galaxy", "los angeles galaxy"] },
  { id: "nycfc", name: "New York City FC", aliases: ["new york city fc", "nycfc"] },
  { id: "nyredbulls", name: "New York Red Bulls", aliases: ["new york red bulls"] },
  { id: "atlanta-united", name: "Atlanta United", aliases: ["atlanta united"] },
  { id: "seattle", name: "Seattle Sounders", aliases: ["seattle sounders"] },
  { id: "chivas", name: "Chivas", aliases: ["chivas", "guadalajara", "cd guadalajara"] },
  { id: "america-mx", name: "Club América", aliases: ["club america", "america mexico", "américa"] },
  { id: "monterrey", name: "Monterrey", aliases: ["monterrey", "rayados"] },
  { id: "tigres", name: "Tigres", aliases: ["tigres uanl", "tigres"] },

  // Brasil
  { id: "flamengo", name: "Flamengo", aliases: ["flamengo"] },
  { id: "palmeiras", name: "Palmeiras", aliases: ["palmeiras"] },
  { id: "santos", name: "Santos", aliases: ["santos fc", "santos"] },
  { id: "corinthians", name: "Corinthians", aliases: ["corinthians"] },
  { id: "sao-paulo", name: "São Paulo", aliases: ["sao paulo", "são paulo"] },
  { id: "gremio", name: "Grêmio", aliases: ["gremio", "grêmio"] },
  { id: "internacional", name: "Internacional", aliases: ["internacional", "s.c internacional", "sc internacional"] },
  { id: "cruzeiro", name: "Cruzeiro", aliases: ["cruzeiro"] },
  { id: "botafogo", name: "Botafogo", aliases: ["botafogo"] },
  { id: "vasco", name: "Vasco da Gama", aliases: ["vasco da gama", "vasco"] },
  { id: "fluminense", name: "Fluminense", aliases: ["fluminense"] },
  { id: "atletico-mg", name: "Atlético Mineiro", aliases: ["atletico mineiro", "atlético mineiro", "atletico mg"] },

  // Argentina
  { id: "river", name: "River Plate", aliases: ["river plate"] },
  { id: "boca", name: "Boca Juniors", aliases: ["boca juniors", "boca"] },
  { id: "racing", name: "Racing Club", aliases: ["racing club", "racing"] },
  { id: "independiente", name: "Independiente", aliases: ["independiente"] },
  { id: "san-lorenzo", name: "San Lorenzo", aliases: ["san lorenzo"] },

  // Otros clubes frecuentes
  { id: "galatasaray", name: "Galatasaray", aliases: ["galatasaray"] },
  { id: "fenerbahce", name: "Fenerbahçe", aliases: ["fenerbahce", "fenerbahçe"] },
  { id: "besiktas", name: "Beşiktaş", aliases: ["besiktas", "beşiktaş"] },
  { id: "olympiacos", name: "Olympiacos", aliases: ["olympiacos", "olympiakos"] },
  { id: "celtic", name: "Celtic", aliases: ["celtic"] },
  { id: "rangers", name: "Rangers", aliases: ["rangers fc", "glasgow rangers", "rangers"] },
  { id: "al-nassr", name: "Al Nassr", aliases: ["al nassr", "alnassr"] },
  { id: "al-hilal", name: "Al Hilal", aliases: ["al hilal", "alhilal"] },
  { id: "al-ahli", name: "Al Ahli", aliases: ["al ahli"] },
  { id: "al-ittihad", name: "Al Ittihad", aliases: ["al ittihad"] },
];

/** Lista plana alias → team, ordenada por longitud de alias desc. */
export function buildAliasIndex(teams = YUPOO_TEAMS) {
  const rows = [];
  for (const team of teams) {
    for (const alias of team.aliases) {
      const a = String(alias).trim().toLowerCase();
      if (!a) continue;
      rows.push({ alias: a, team });
    }
  }
  rows.sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));
  return rows;
}

const ALIAS_INDEX = buildAliasIndex();

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Devuelve el equipo cuyo alias más largo aparece como token en el título. */
export function matchTeamFromTitle(title, aliasIndex = ALIAS_INDEX) {
  const t = String(title || "");
  if (!t) return null;
  const lower = t.toLowerCase();
  for (const { alias, team } of aliasIndex) {
    // límites de palabra aproximados (letras/números)
    const re = new RegExp(`(?:^|[^a-zà-ÿ0-9])${escapeRegExp(alias)}(?:[^a-zà-ÿ0-9]|$)`, "i");
    if (re.test(lower)) return team;
  }
  return null;
}
