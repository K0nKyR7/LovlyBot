// Initial starter memories and love letters
// Users can easily add, edit, or remove these at any time

export const INITIAL_CONFIG = {
  startDate: "2024-12-21T00:00:00",
  coupleNames: "Мы вместе",
  partnerName: "Моя любимая",
  defaultPin: "2112", // 21 декабря (21.12)
  quote: "В тебе есть весь мой мир, всё мое счастье и всё моё спокойствие."
};

export const INITIAL_MOMENTS = [
  {
    id: "moment-1",
    title: "День, когда всё началось",
    date: "2024-12-21",
    category: "Памятные даты",
    location: "Тот самый зимний вечер",
    description: "Наш первый день, с которого началась эта невероятная история. Помню каждую секунду, твою улыбку и то ощущение, что теперь всё будет совершенно иначе.",
    imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    likes: 12,
    isLiked: true,
    createdAt: "2024-12-21T18:00:00Z"
  },
  {
    id: "moment-2",
    title: "Кофе, снег и твои тёплые варежки",
    date: "2025-01-08",
    category: "Свидания",
    location: "Уютная кофейня в центре",
    description: "На улице был мороз, а мы грелись пряным капучино и говорили обо всём на свете. Твой смех заставляет забыть о любых проблемах.",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    likes: 7,
    isLiked: false,
    createdAt: "2025-01-08T15:30:00Z"
  },
  {
    id: "moment-3",
    title: "Наше первое совместное путешествие",
    date: "2025-05-18",
    category: "Путешествия",
    location: "Поездка на выходные",
    description: "Дорога, музыка, закат и ты рядом. Сколько бы городов мы ни посетили, главное место на земле — там, где мы держимся за руки.",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    likes: 19,
    isLiked: true,
    createdAt: "2025-05-18T19:40:00Z"
  },
  {
    id: "moment-4",
    title: "Пикник на закате",
    date: "2025-07-24",
    category: "Уютные дни",
    location: "Парк у воды",
    description: "Клубника, мягкий плед и бесконечные разговоры под заходящее солнце. Самые простые моменты рядом с тобой становятся бесценными.",
    imageUrl: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
    likes: 9,
    isLiked: false,
    createdAt: "2025-07-24T20:15:00Z"
  },
  {
    id: "moment-5",
    title: "Когда мы просто дурачились",
    date: "2025-09-12",
    category: "Смешные моменты",
    location: "Дома на кухне",
    description: "Пытались приготовить ужин по новому рецепту, в итоге испачкались мукой и хохотали до слез. Обожаю твою непосредственность!",
    imageUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80",
    likes: 15,
    isLiked: true,
    createdAt: "2025-09-12T21:00:00Z"
  }
];

export const INITIAL_LETTERS = [
  {
    id: "letter-1",
    triggerTitle: "Открыть, когда скучаешь по мне",
    badge: "Для грустных минут",
    color: "from-rose-500 to-pink-500",
    content: "Знай, что где бы я ни был прямо сейчас, мои мысли возвращаются к тебе. Закрой на секунду глаза и представь, как я крепко обнимаю тебя. Я тебя очень сильно люблю и уже спешу к тебе."
  },
  {
    id: "letter-2",
    triggerTitle: "Открыть, когда выдался тяжелый день",
    badge: "Для поддержки",
    color: "from-amber-500 to-rose-400",
    content: "Ты у меня самая сильная, умная и прекрасная. Этот день обязательно закончится, а всё плохое развеется. Сделай глубокий вдох, завари вкусный чай, а дома тебя ждет тепло, забота и массаж плеч!"
  },
  {
    id: "letter-3",
    triggerTitle: "Открыть в нашу годовщину",
    badge: "21 декабря",
    color: "from-red-600 to-rose-600",
    content: "Каждый день с 21 декабря 2024 года — это подарок судьбы. Спасибо тебе за твою нежность, понимание и за то, как ты озаряешь мою жизнь. Я выбираю тебя вчера, сегодня и каждый следующий день."
  },
  {
    id: "letter-4",
    triggerTitle: "Открыть, когда сомневаешься в себе",
    badge: "Вдохновение",
    color: "from-purple-500 to-pink-500",
    content: "Ты даже не представляешь, сколько в тебе таланта, красоты и света. Я верю в тебя безоговорочно. У тебя всё получится, а я всегда буду твоей главной поддержкой и опорой."
  }
];

export const CATEGORIES = [
  "Все",
  "Свидания",
  "Путешествия",
  "Уютные дни",
  "Смешные моменты",
  "Памятные даты"
];
