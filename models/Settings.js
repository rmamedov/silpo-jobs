const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  heroTitle:     { type: String, default: 'Знайди роботу в Сільпо' },
  heroSubtitle:  { type: String, default: 'Обирай з 100+ вакансій у своєму місті' },
  primaryCities: [String],
  allCities:     [String],
  categories:    [String],
  contactEmail:  { type: String, default: '' },
  contactPhone:  { type: String, default: '' }
}, { timestamps: true });

// Singleton pattern
settingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      primaryCities: ['Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів'],
      allCities: ['Київ','Харків','Одеса','Дніпро','Львів','Запоріжжя','Вінниця','Полтава','Чернігів','Черкаси','Суми','Хмельницький','Житомир','Рівне','Тернопіль','Івано-Франківськ','Ужгород','Луцьк','Кропивницький','Миколаїв','Херсон','Чернівці','Біла Церква','Кременчук','Маріуполь','Краматорськ','Бровари','Ірпінь','Буча'],
      categories: ['Магазин', 'Склад', 'Офіс', "Кур'єр"]
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
