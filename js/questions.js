/* Banco de perguntas do Show do Milhão.
   Cada nível (1 a 10) tem um pool de perguntas; a cada partida uma é
   sorteada aleatoriamente de cada pool para permitir replay.

   DEFAULT_LEVELS / DEFAULT_QUESTION_POOL são o conjunto embutido (fallback).
   LEVELS / QUESTION_POOL são a fonte realmente usada pelo jogo: começam como
   uma cópia do padrão e podem ser substituídas em tempo de execução por um
   arquivo JSON carregado pelo usuário (ver loadCustomQuestionData abaixo).
   Tudo roda no navegador, sem backend — compatível com GitHub Pages. */

const DEFAULT_LEVELS = [
  { value: 1000,    label: "R$ 1.000"    },
  { value: 2000,    label: "R$ 2.000"    },
  { value: 5000,    label: "R$ 5.000"    },
  { value: 10000,   label: "R$ 10.000"   },
  { value: 20000,   label: "R$ 20.000",  checkpoint: true },
  { value: 40000,   label: "R$ 40.000"   },
  { value: 80000,   label: "R$ 80.000"   },
  { value: 160000,  label: "R$ 160.000"  },
  { value: 320000,  label: "R$ 320.000"  },
  { value: 1000000, label: "R$ 1.000.000" },
];

const DEFAULT_QUESTION_POOL = [
  // Nível 1 — R$ 1.000
  [
    { q: "Qual é a capital do Brasil?", opts: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], correct: 2 },
    { q: "Quantos dias tem o mês de fevereiro em um ano bissexto?", opts: ["28", "29", "30", "31"], correct: 1 },
    { q: "Qual é o maior planeta do Sistema Solar?", opts: ["Terra", "Marte", "Júpiter", "Saturno"], correct: 2 },
    { q: "Em que país fica a Torre Eiffel?", opts: ["Itália", "França", "Espanha", "Alemanha"], correct: 1 },
    { q: "Qual animal é conhecido como o \"rei da selva\"?", opts: ["Tigre", "Leão", "Elefante", "Leopardo"], correct: 1 },
  ],
  // Nível 2 — R$ 2.000
  [
    { q: "Quem pintou a Mona Lisa?", opts: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"], correct: 2 },
    { q: "Qual é o menor país do mundo?", opts: ["Mônaco", "Vaticano", "San Marino", "Liechtenstein"], correct: 1 },
    { q: "Quantos continentes existem no planeta Terra?", opts: ["5", "6", "7", "8"], correct: 2 },
    { q: "Qual é o oceano mais extenso do mundo?", opts: ["Atlântico", "Índico", "Pacífico", "Ártico"], correct: 2 },
    { q: "Quem escreveu \"Dom Casmurro\"?", opts: ["José de Alencar", "Machado de Assis", "Castro Alves", "Monteiro Lobato"], correct: 1 },
  ],
  // Nível 3 — R$ 5.000
  [
    { q: "Qual é a fórmula química da água?", opts: ["CO2", "H2O", "O2", "NaCl"], correct: 1 },
    { q: "Em que ano o homem pisou na Lua pela primeira vez?", opts: ["1965", "1969", "1972", "1958"], correct: 1 },
    { q: "Qual é o maior rio em volume de água do mundo?", opts: ["Nilo", "Amazonas", "Mississippi", "Yangtzé"], correct: 1 },
    { q: "Quantos ossos tem, aproximadamente, o corpo humano adulto?", opts: ["186", "206", "226", "256"], correct: 1 },
    { q: "Qual é a moeda oficial do Japão?", opts: ["Won", "Yuan", "Iene", "Rupia"], correct: 2 },
  ],
  // Nível 4 — R$ 10.000
  [
    { q: "Quem foi o primeiro presidente do Brasil?", opts: ["Getúlio Vargas", "Deodoro da Fonseca", "Prudente de Morais", "Floriano Peixoto"], correct: 1 },
    { q: "Qual é o elemento químico de símbolo \"Au\"?", opts: ["Prata", "Alumínio", "Ouro", "Argônio"], correct: 2 },
    { q: "Em que continente está localizado o Egito?", opts: ["Ásia", "África", "Europa", "Oceania"], correct: 1 },
    { q: "Qual compositor, mesmo tendo ficado surdo, compôs a \"Sinfonia nº 9\"?", opts: ["Mozart", "Bach", "Beethoven", "Chopin"], correct: 2 },
    { q: "Qual é a capital da Austrália?", opts: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
  ],
  // Nível 5 — R$ 20.000 (checkpoint)
  [
    { q: "Quem escreveu \"Os Lusíadas\"?", opts: ["Fernando Pessoa", "Luís de Camões", "José Saramago", "Eça de Queirós"], correct: 1 },
    { q: "Qual é a montanha mais alta do mundo?", opts: ["K2", "Everest", "Kilimanjaro", "Aconcágua"], correct: 1 },
    { q: "Em que ano começou a Segunda Guerra Mundial?", opts: ["1914", "1939", "1945", "1929"], correct: 1 },
    { q: "Qual é o maior órgão do corpo humano?", opts: ["Fígado", "Coração", "Pele", "Pulmão"], correct: 2 },
    { q: "Qual país é conhecido como a \"terra do sol nascente\"?", opts: ["China", "Coreia do Sul", "Japão", "Tailândia"], correct: 2 },
  ],
  // Nível 6 — R$ 40.000
  [
    { q: "Quem foi a primeira mulher a ganhar um Prêmio Nobel?", opts: ["Marie Curie", "Rosalind Franklin", "Dorothy Hodgkin", "Ada Lovelace"], correct: 0 },
    { q: "Qual é a capital da Rússia?", opts: ["São Petersburgo", "Moscou", "Kiev", "Minsk"], correct: 1 },
    { q: "Qual das opções abaixo é um sistema operacional?", opts: ["Photoshop", "Linux", "Excel", "Chrome"], correct: 1 },
    { q: "Quem pintou \"A Noite Estrelada\"?", opts: ["Claude Monet", "Vincent van Gogh", "Salvador Dalí", "Edvard Munch"], correct: 1 },
    { q: "Qual é o nome do processo de divisão celular que forma os gametas?", opts: ["Mitose", "Meiose", "Osmose", "Citocinese"], correct: 1 },
  ],
  // Nível 7 — R$ 80.000
  [
    { q: "Qual tratado oficializou o fim da Primeira Guerra Mundial?", opts: ["Tratado de Versalhes", "Tratado de Tordesilhas", "Tratado de Paris", "Congresso de Viena"], correct: 0 },
    { q: "Qual é, aproximadamente, a velocidade da luz no vácuo?", opts: ["300 mil km/s", "150 mil km/s", "3 mil km/s", "30 mil km/s"], correct: 0 },
    { q: "Quem escreveu \"Cem Anos de Solidão\"?", opts: ["Jorge Amado", "Gabriel García Márquez", "Mario Vargas Llosa", "Pablo Neruda"], correct: 1 },
    { q: "Qual é a capital da Coreia do Sul?", opts: ["Busan", "Seul", "Incheon", "Daegu"], correct: 1 },
    { q: "Qual elemento químico tem número atômico 1?", opts: ["Hélio", "Hidrogênio", "Lítio", "Carbono"], correct: 1 },
  ],
  // Nível 8 — R$ 160.000
  [
    { q: "Em que ano foi assinada a Lei Áurea no Brasil?", opts: ["1822", "1888", "1891", "1850"], correct: 1 },
    { q: "Qual é o nome do fenômeno que curva a luz ao redor de corpos muito massivos?", opts: ["Refração", "Lente gravitacional", "Difração", "Polarização"], correct: 1 },
    { q: "Quem escreveu a obra \"O Príncipe\"?", opts: ["Thomas Hobbes", "Nicolau Maquiavel", "John Locke", "Rousseau"], correct: 1 },
    { q: "Qual é a capital da Mongólia?", opts: ["Ulan Bator", "Astana", "Bishkek", "Dushanbe"], correct: 0 },
    { q: "Qual tratado dividiu as terras recém-descobertas entre Espanha e Portugal em 1494?", opts: ["Tratado de Madrid", "Tratado de Tordesilhas", "Tratado de Utrecht", "Tratado de Methuen"], correct: 1 },
  ],
  // Nível 9 — R$ 320.000
  [
    { q: "Qual cientista formulou a Lei Periódica dos elementos químicos?", opts: ["Antoine Lavoisier", "Dmitri Mendeleev", "John Dalton", "Niels Bohr"], correct: 1 },
    { q: "Qual é o nome do vírus causador da Covid-19?", opts: ["H1N1", "SARS-CoV-2", "MERS-CoV", "Ebola"], correct: 1 },
    { q: "Qual imperador romano se converteu ao cristianismo e fundou Constantinopla?", opts: ["Nero", "Constantino", "Augusto", "Justiniano"], correct: 1 },
    { q: "Qual é a unidade de medida de resistência elétrica?", opts: ["Ampère", "Volt", "Ohm", "Watt"], correct: 2 },
    { q: "Em que ano caiu o Muro de Berlim?", opts: ["1985", "1989", "1991", "1979"], correct: 1 },
  ],
  // Nível 10 — R$ 1.000.000
  [
    { q: "Qual matemático grego é considerado o \"pai da geometria\"?", opts: ["Pitágoras", "Arquimedes", "Euclides", "Tales de Mileto"], correct: 2 },
    { q: "Qual partícula subatômica, confirmada em 2012, é responsável por conferir massa a outras partículas?", opts: ["Fóton", "Bóson de Higgs", "Glúon", "Neutrino"], correct: 1 },
    { q: "Quem escreveu \"Ulysses\", marco do modernismo literário?", opts: ["James Joyce", "Virginia Woolf", "T.S. Eliot", "William Faulkner"], correct: 0 },
    { q: "Qual tratado estabeleceu a criação da União Europeia, em 1993?", opts: ["Tratado de Roma", "Tratado de Maastricht", "Tratado de Lisboa", "Tratado de Amsterdã"], correct: 1 },
    { q: "Como se chama o fenômeno em que uma estrela colapsa totalmente, criando uma região da qual nada escapa?", opts: ["Supernova", "Buraco negro", "Pulsar", "Quasar"], correct: 1 },
  ],
];

/* ---------- Fonte de dados ativa (mutável) ---------- */
function cloneLevels(levels) {
  return levels.map((l) => ({ ...l }));
}
function cloneQuestionPool(pool) {
  return pool.map((level) => level.map((item) => ({ ...item, opts: [...item.opts] })));
}

const LEVELS = cloneLevels(DEFAULT_LEVELS);
const QUESTION_POOL = cloneQuestionPool(DEFAULT_QUESTION_POOL);
let activeQuizTitle = null; // título do quiz personalizado carregado, se houver

function resetQuestionsToDefault() {
  LEVELS.length = 0;
  LEVELS.push(...cloneLevels(DEFAULT_LEVELS));
  QUESTION_POOL.length = 0;
  QUESTION_POOL.push(...cloneQuestionPool(DEFAULT_QUESTION_POOL));
  activeQuizTitle = null;
}

/* ---------- Carregamento de perguntas personalizadas (JSON) ----------
   Formato esperado:
   {
     "titulo": "Nome opcional do quiz",
     "niveis": [                         // opcional — 10 itens, substitui os valores padrão
       { "valor": 1000 },
       ...
       { "valor": 20000, "checkpoint": true },
       ...
     ],
     "perguntas": [
       {
         "nivel": 1,                     // 1 a 10
         "pergunta": "Texto da pergunta",
         "alternativas": ["A", "B", "C", "D"],  // exatamente 4 opções
         "correta": 2                    // índice 0-3, ou letra "A"-"D"
       },
       ...
     ]
   }
   Cada nível de 1 a 10 precisa ter pelo menos uma pergunta.
   Retorna { ok: true, count, title } ou { ok: false, errors: [...] }. */
function loadCustomQuestionData(raw) {
  const errors = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["O arquivo não contém um objeto JSON válido (esperado um objeto com a chave \"perguntas\")."] };
  }
  if (!Array.isArray(raw.perguntas) || raw.perguntas.length === 0) {
    return { ok: false, errors: ['O JSON precisa de um campo "perguntas" (lista) com pelo menos uma pergunta.'] };
  }

  const letterMap = { A: 0, B: 1, C: 2, D: 3 };
  const pools = Array.from({ length: 10 }, () => []);

  raw.perguntas.forEach((item, idx) => {
    const pos = idx + 1;
    if (!item || typeof item !== "object") {
      errors.push(`Pergunta #${pos}: item inválido.`);
      return;
    }
    const nivel = Number(item.nivel);
    if (!Number.isInteger(nivel) || nivel < 1 || nivel > 10) {
      errors.push(`Pergunta #${pos}: "nivel" deve ser um número inteiro de 1 a 10.`);
      return;
    }
    const texto = typeof item.pergunta === "string" ? item.pergunta.trim() : "";
    if (!texto) {
      errors.push(`Pergunta #${pos}: campo "pergunta" vazio ou ausente.`);
      return;
    }
    const opts = item.alternativas;
    if (!Array.isArray(opts) || opts.length !== 4 || opts.some((o) => typeof o !== "string" || !o.trim())) {
      errors.push(`Pergunta #${pos}: "alternativas" deve ser uma lista com exatamente 4 textos não vazios.`);
      return;
    }
    let correct = item.correta;
    if (typeof correct === "string") correct = letterMap[correct.trim().toUpperCase()];
    if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
      errors.push(`Pergunta #${pos}: "correta" deve ser um índice de 0 a 3, ou uma letra de "A" a "D".`);
      return;
    }
    pools[nivel - 1].push({ q: texto, opts: opts.map((o) => o.trim()), correct });
  });

  const missingLevels = pools.map((p, i) => (p.length === 0 ? i + 1 : null)).filter((n) => n !== null);
  if (missingLevels.length > 0) {
    errors.push(`Faltam perguntas para o(s) nível(is): ${missingLevels.join(", ")}. Cada nível de 1 a 10 precisa de ao menos uma pergunta.`);
  }

  let newLevels = cloneLevels(DEFAULT_LEVELS);
  if (raw.niveis !== undefined) {
    if (!Array.isArray(raw.niveis) || raw.niveis.length !== 10) {
      errors.push('O campo "niveis", se enviado, precisa ser uma lista com exatamente 10 itens.');
    } else {
      const parsedLevels = [];
      raw.niveis.forEach((lvl, i) => {
        const valor = Number(lvl && lvl.valor);
        if (!Number.isFinite(valor) || valor <= 0) {
          errors.push(`"niveis[${i + 1}]": campo "valor" ausente ou inválido.`);
          return;
        }
        parsedLevels.push({
          value: valor,
          label: "R$ " + valor.toLocaleString("pt-BR"),
          checkpoint: !!(lvl && lvl.checkpoint),
        });
      });
      if (parsedLevels.length === 10) {
        if (!parsedLevels.some((l) => l.checkpoint)) parsedLevels[4].checkpoint = true;
        newLevels = parsedLevels;
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  LEVELS.length = 0;
  LEVELS.push(...newLevels);
  QUESTION_POOL.length = 0;
  QUESTION_POOL.push(...pools);
  activeQuizTitle = typeof raw.titulo === "string" && raw.titulo.trim() ? raw.titulo.trim() : null;

  return { ok: true, count: raw.perguntas.length, title: activeQuizTitle };
}
