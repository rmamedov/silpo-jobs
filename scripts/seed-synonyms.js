/**
 * Seed synonym groups for fuzzy search.
 * Usage: node scripts/seed-synonyms.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Synonym = require('../models/Synonym');

const SYNONYM_DATA = [
  {
    canonical: "Кур'єр",
    synonyms: [
      // common misspellings
      "курьєр", "курєр", "курер", "кур'єр", "куръєр", "кур єр", "куреєр",
      "курйер", "кур'ер", "курьер", "курэр",
      // wrong keyboard layout (EN typing UA word)
      "rehm'h", "reh'h", "rehm\"h", "rehmth", "rehth",
      // related words / synonyms
      "возильщик", "доставщик", "доставка", "кур'єрська", "доставляти",
      "розвізник", "експедитор", "рознощик",
      // slang / informal
      "курьер", "курєрська", "курірська", "delivery", "deliver"
    ]
  },
  {
    canonical: "Касир",
    synonyms: [
      "кассир", "касір", "кассір", "касер", "кассер",
      // wrong layout
      "rfcsh", "rfcbh",
      // related
      "каса", "касса", "кашир", "розрахунок", "касовий",
      "на касі", "на кассі", "на касу", "cashier"
    ]
  },
  {
    canonical: "Продавець",
    synonyms: [
      "продавец", "прадавець", "продавєць", "продавеч", "продавці",
      "продавець-консультант", "продавец-консультант",
      // wrong layout
      "ghjlfdtpm", "ghjlfdtw",
      // related
      "консультант", "консультація", "продаж", "торгівля",
      "seller", "sales", "продажник", "реалізатор"
    ]
  },
  {
    canonical: "Пекар",
    synonyms: [
      "пекарь", "пікар", "пекарь", "пекарка", "пекарня",
      // wrong layout
      "gtrfh",
      // related
      "хлібопек", "випічка", "хліб", "булочник", "baker",
      "тістоміс", "пічник"
    ]
  },
  {
    canonical: "Кухар",
    synonyms: [
      "кухарь", "кухарка", "повар", "повір", "кухарь",
      "кухор", "кухарр", "кухарі",
      // wrong layout
      "re[fh",
      // related
      "готувати", "кулінар", "шеф-кухар", "шефкухар", "cook", "chef",
      "кок", "стравник", "кухня"
    ]
  },
  {
    canonical: "Кондитер",
    synonyms: [
      "кондітер", "кондитор", "кондітор", "кондитерка",
      // wrong layout
      "rjylbnth",
      // related
      "десерт", "торт", "тістечка", "цукерник", "pastry",
      "кондитерська", "солодощі"
    ]
  },
  {
    canonical: "Вантажник",
    synonyms: [
      "ваньтажник", "вантажнік", "вантажнак", "вантажщик",
      "грузчик", "грузщик", "грущик",
      // wrong layout
      "dfynf;ybr",
      // related
      "вантаж", "навантаження", "розвантаження", "loader",
      "підсобник", "підсобний", "переноска"
    ]
  },
  {
    canonical: "Водій",
    synonyms: [
      "водитель", "водій", "водій", "водії", "водителі",
      "шофер", "шофьор", "шофір",
      // wrong layout
      "djlsq",
      // related
      "driver", "водіння", "за кермом", "автомобіль"
    ]
  },
  {
    canonical: "Охоронник",
    synonyms: [
      "охоронець", "охранник", "охоронік", "охранік",
      "сторож", "сторожка", "секьюріті", "секюріті",
      // wrong layout
      "j[jhjyybr",
      // related
      "security", "безпека", "охорона", "guard", "watchman",
      "варта", "вартовий", "караул"
    ]
  },
  {
    canonical: "Комплектувальник",
    synonyms: [
      "комплектовщик", "комплектувальнік", "комплектовщік",
      "комплектуваник", "комплектовальник",
      // wrong layout
      "rjvgktrnedfkmybr",
      // related
      "збирання", "комплектація", "picker", "складальник",
      "збирач", "пакувальник", "формувальник замовлень"
    ]
  },
  {
    canonical: "Укладальник-пакувальник",
    synonyms: [
      "пакувальник", "укладальник", "пакувальнік", "пакувальнице",
      "укладчик", "пакувач", "пакировщик", "упаковщик",
      // related
      "пакування", "фасування", "фасувальник", "packer"
    ]
  },
  {
    canonical: "Оброблювач риби",
    synonyms: [
      "обробщик риби", "рибообробник", "різник риби",
      "рибник", "рибний цех", "рибний відділ",
      // related
      "риба", "рибна продукція", "філетувальник"
    ]
  },
  {
    canonical: "Фахівець м'ясного виробництва",
    synonyms: [
      "м'ясник", "мясник", "мясо", "м'ясо",
      "різник", "обвалювальник", "жиловщик",
      "мясне виробництво", "мясний цех", "мясний відділ",
      // related
      "butcher", "ковбасник", "м'ясна продукція"
    ]
  },
  {
    canonical: "Оператор лінії виробництва",
    synonyms: [
      "оператор лінії", "оператор виробництва",
      "оператор", "линейний оператор",
      // related
      "виробництво", "лінія", "конвеєр", "цех", "operator"
    ]
  },
  {
    canonical: "Завідувач відділу",
    synonyms: [
      "завідуючий", "завідувач", "заведующий",
      "завмаг", "зав відділу", "завідувачка",
      // related
      "керівник", "начальник", "менеджер відділу", "manager",
      "управляючий", "старший зміни"
    ]
  },
  {
    canonical: "Фахівець ЗЕД",
    synonyms: [
      "зед", "ЗЕД", "зовнішньоекономічна", "зовнішня торгівля",
      "import", "export", "імпорт", "експорт",
      "логіст", "логістика", "закупівлі"
    ]
  },
  {
    canonical: "Інженер-проєктувальник",
    synonyms: [
      "інженер", "проектувальник", "проєктант", "проектант",
      "інженер-проектувальник", "інжинір",
      // related
      "engineer", "проєктування", "будівництво", "креслення",
      "autocad", "автокад"
    ]
  },
  {
    canonical: "Маркетинг-менеджер",
    synonyms: [
      "маркетинг", "маркетолог", "маркетинг менеджер",
      "маркетінг", "маркетолог", "smm",
      // related
      "реклама", "marketing", "просування", "піар", "PR",
      "бренд менеджер"
    ]
  },
  {
    canonical: "Фінансовий аналітик",
    synonyms: [
      "фінансист", "аналітик", "фінаналітик",
      "финансист", "финансовый", "financial analyst",
      // related
      "фінанси", "finance", "analyst", "бухгалтер", "економіст"
    ]
  },
  {
    canonical: "SEO Team Lead",
    synonyms: [
      "seo", "сео", "SEO-спеціаліст", "сеошник",
      "search engine", "оптимізація", "тімлід",
      "team lead", "тім лід", "teamlead"
    ]
  },
  {
    canonical: "Менеджер з операційних процесів",
    synonyms: [
      "операційний менеджер", "менеджер операцій",
      "operations manager", "operations",
      "процеси", "процесний менеджер"
    ]
  },
  {
    canonical: "Фахівець з приймання та обліку товарів",
    synonyms: [
      "приймальник", "приймальщик", "комірник",
      "приймання товарів", "облік товарів",
      "складський облік", "товарознавець",
      // related
      "склад", "приймання", "облік", "інвентаризація"
    ]
  },
  {
    canonical: "Комплектувальник інтернет-замовлень",
    synonyms: [
      "інтернет замовлення", "збирач замовлень", "онлайн замовлення",
      "e-commerce", "ecommerce", "інтернет магазин",
      "збір замовлень", "online picker", "піккер"
    ]
  },
  {
    canonical: "Старший продавець",
    synonyms: [
      "старший", "ст. продавець", "старший консультант",
      "senior seller", "бригадир"
    ]
  },
  {
    canonical: "Робота в офісі",
    synonyms: [
      "офіс", "офісна робота", "office", "сидяча робота",
      "в офісі", "офис", "офісний"
    ]
  }
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Synonym.deleteMany({});
  console.log('Cleared existing synonyms');

  const result = await Synonym.insertMany(SYNONYM_DATA);
  console.log('Inserted', result.length, 'synonym groups');

  let totalSynonyms = 0;
  result.forEach(r => totalSynonyms += r.synonyms.length);
  console.log('Total synonym entries:', totalSynonyms);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
