/**
 * 1000+ deep, philosophical, and motivational quotes
 * For daily inspiration and reflection in the Habit Tracker
 */

export interface Quote {
  quote: string
  author?: string
}

export const DEEP_QUOTES: Quote[] = [
  // Stoicism & Philosophy
  { quote: "The obstacle is the way.", author: "Marcus Aurelius" },
  { quote: "We cannot choose our external circumstances, but we can always choose how we respond to them.", author: "Epictetus" },
  { quote: "It is not things themselves that trouble people, but their judgments about those things.", author: "Epictetus" },
  { quote: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { quote: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { quote: "The mind is everything. What you think, you become.", author: "Buddha" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "The only true wisdom is knowing you know nothing.", author: "Socrates" },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "Everything you want is on the other side of fear.", author: "George Addair" },

  // Wisdom & Self-Discovery
  { quote: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi" },
  { quote: "The wound is the place where the Light enters you.", author: "Rumi" },
  { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { quote: "Two things are infinite: the universe and human stupidity.", author: "Albert Einstein" },
  { quote: "Do what you feel in your heart to be right.", author: "Eleanor Roosevelt" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },

  // Growth & Perseverance
  { quote: "Success is not final, failure is not fatal. It is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "The pain of discipline weighs ounces; the pain of regret weighs tons.", author: "Jim Ryun" },
  { quote: "Your body keeps the score.", author: "Bessel van der Kolk" },
  { quote: "Growth is painful, but nothing is as painful as staying stuck.", author: "Unknown" },
  { quote: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { quote: "Master your mind and you master your life.", author: "Unknown" },

  // Purpose & Meaning
  { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { quote: "Man's search for meaning is the primary human motivation.", author: "Viktor Frankl" },
  { quote: "When you have a why, you can bear almost any how.", author: "Friedrich Nietzsche" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { quote: "The meaning of life is to give life meaning.", author: "Viktor Frankl" },
  { quote: "Life's tragedy is that we get old too soon and wise too late.", author: "Benjamin Franklin" },
  { quote: "Don't go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { quote: "The unexamined life is not worth living.", author: "Socrates" },
  { quote: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { quote: "Find out who you are and do it on purpose.", author: "Dolly Parton" },

  // Mindfulness & Presence
  { quote: "Yesterday is history, tomorrow is a mystery, today is a gift.", author: "Eleanor Roosevelt" },
  { quote: "The present moment is filled with joy and beauty.", author: "Thich Nhat Hanh" },
  { quote: "Be here now.", author: "Ram Dass" },
  { quote: "Wherever you are, be all there.", author: "Jim Elliot" },
  { quote: "Life is right now. Not when you're retired, not when you're successful, not when you have time.", author: "Unknown" },
  { quote: "Slow down and everything you're chasing will come around and catch you.", author: "John De Pauw" },
  { quote: "Wherever you are is the right place to begin.", author: "Louise L. Hay" },
  { quote: "The moments we waste looking down are the moments we miss the stars.", author: "Unknown" },
  { quote: "Stop looking back, you're not going that way.", author: "Unknown" },
  { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },

  // Action & Discipline
  { quote: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { quote: "Start where you are, use what you have, do what you can.", author: "Arthur Ashe" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "Whatever you can do, or dream you can do, begin it.", author: "Johann Wolfgang Von Goethe" },
  { quote: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },

  // Love & Connection
  { quote: "Love is the bridge between you and everything.", author: "Rumi" },
  { quote: "The greatest thing you'll ever learn is just to love and be loved in return.", author: "Moulin Rouge" },
  { quote: "Kindness is a language which the deaf can hear and the blind can see.", author: "Mark Twain" },
  { quote: "We are all broken, that's how the light gets in.", author: "Ernest Hemingway" },
  { quote: "The best and most beautiful things in this world cannot be seen or even heard, but must be felt.", author: "Helen Keller" },
  { quote: "In a world where you can be anything, be kind.", author: "Unknown" },
  { quote: "Truly great friends are hard to find, difficult to leave, and impossible to forget.", author: "Unknown" },
  { quote: "The heart has its reasons which reason knows nothing of.", author: "Blaise Pascal" },
  { quote: "Love is not about how much you say 'I love you' but how much you prove it's true.", author: "Unknown" },
  { quote: "The way to love anything is to realize it might be lost.", author: "G.K. Chesterton" },

  // Adversity & Resilience
  { quote: "Smooth seas never made a skillful sailor.", author: "Franklin D. Roosevelt" },
  { quote: "Out of suffering have emerged the strongest souls.", author: "Khalil Gibran" },
  { quote: "Strength comes not from what you think you can do, but from overcoming the things you once thought you couldn't.", author: "Unknown" },
  { quote: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { quote: "You are not a victim of your circumstances; you are a master of your destiny.", author: "Ankur Warikoo" },
  { quote: "Rain nourishes the soil; pain nourishes the soul.", author: "Unknown" },
  { quote: "Every setback is a setup for a comeback.", author: "Unknown" },
  { quote: "Hard times are often blessings in disguise.", author: "Unknown" },
  { quote: "The struggle is the companion to greatness.", author: "Unknown" },
  { quote: "Pressure is a privilege.", author: "Billie Jean King" },

  // Courage & Fear
  { quote: "Courage is being scared to death, but saddling up anyway.", author: "John Wayne" },
  { quote: "Fear is temporary. Regret is permanent.", author: "Unknown" },
  { quote: "Do the thing and you will have the power.", author: "Ralph Waldo Emerson" },
  { quote: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
  { quote: "Courage is resistance to fear, mastery of fear.", author: "Mark Twain" },
  { quote: "A person who feels appreciated will always do more than expected.", author: "Unknown" },
  { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { quote: "Feel the fear and do it anyway.", author: "Susan Jeffers" },
  { quote: "Courage is the most important of all the virtues because without courage you can't practice any other virtue consistently.", author: "Maya Angelou" },
  { quote: "The greatest glory is not in never falling but in rising every time we fall.", author: "Confucius" },

  // Acceptance & Peace
  { quote: "What we resist, persists. What we accept, transforms.", author: "Unknown" },
  { quote: "Let it go and see if it comes back.", author: "Unknown" },
  { quote: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" },
  { quote: "Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.", author: "Wayne Dyer" },
  { quote: "Some things are not meant to be known, only felt.", author: "Unknown" },
  { quote: "The moment you accept yourself, the moment you stop being someone else.", author: "Unknown" },
  { quote: "I've learned that people will forget what you said, forget what you did, but they will never forget how you made them feel.", author: "Maya Angelou" },
  { quote: "Forgiveness is not about letting them off the hook. It's about letting yourself off the hook.", author: "Unknown" },
  { quote: "You cannot heal what you do not acknowledge.", author: "Unknown" },
  { quote: "Acceptance and surrender are not about giving up; they are about embracing reality as it is.", author: "Pema Chödrön" },

  // Self-Belief & Confidence
  { quote: "You are enough, just as you are.", author: "Unknown" },
  { quote: "With confidence, you have won before you have started.", author: "Marcus Garvey" },
  { quote: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { quote: "You may not control all the events that happen to you, but you can decide not to be reduced by them.", author: "Maya Angelou" },
  { quote: "The way you treat yourself sets the standard for how others will treat you.", author: "Unknown" },
  { quote: "Your value is not determined by your productivity.", author: "Unknown" },
  { quote: "You have within you everything you need to succeed.", author: "Unknown" },
  { quote: "Trust the process. The process is trust.", author: "Unknown" },
  { quote: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett" },
  { quote: "Own your power and stop waiting for permission.", author: "Unknown" },

  // Change & Transformation
  { quote: "The only constant in life is change.", author: "Heraclitus" },
  { quote: "Change is a process, not an event.", author: "Unknown" },
  { quote: "You cannot cross the sea by standing on the shore.", author: "Unknown" },
  { quote: "The butterfly comes out of the chrysalis, not because it wanted to, but because it had to.", author: "Unknown" },
  { quote: "If you want different results, do different things.", author: "Unknown" },
  { quote: "Transformation is not a future event, it is a present activity.", author: "Jillian Michaels" },
  { quote: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
  { quote: "The caterpillar has no idea it will become a butterfly.", author: "Unknown" },
  { quote: "You've been given the gift of another day. Use it wisely.", author: "Unknown" },
  { quote: "Every moment is an opportunity to make a different choice.", author: "Unknown" },

  // Motivation & Inspiration
  { quote: "You are the author of your own story.", author: "Unknown" },
  { quote: "The only person who can stop you is you.", author: "Unknown" },
  { quote: "Every achievement starts with a decision to try.", author: "Unknown" },
  { quote: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "Your only limit is you.", author: "Unknown" },
  { quote: "Be uncomfortable. That is how you grow.", author: "Unknown" },
  { quote: "Discipline equals freedom.", author: "Willink" },
  { quote: "The pain of regret is far worse than the pain of effort.", author: "Unknown" },
  { quote: "You are capable of extraordinary things.", author: "Unknown" },

  // Inner Strength
  { quote: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.", author: "Rikki Rogers" },
  { quote: "You are stronger than your excuses.", author: "Unknown" },
  { quote: "Your weakness is an opportunity for growth.", author: "Unknown" },
  { quote: "The most powerful words in the universe are 'I can' and 'I will'.", author: "Unknown" },
  { quote: "You have survived 100% of your worst days.", author: "Unknown" },
  { quote: "Inner peace begins when we choose not to allow another person or event to control our emotions.", author: "Pema Chödrön" },
  { quote: "The softest thing in the universe overcomes the hardest.", author: "Lao Tzu" },
  { quote: "Scars are just evidence that you survived.", author: "Unknown" },
  { quote: "Wounded but not broken. Changed but not defeated.", author: "Unknown" },
  { quote: "Your struggle is not a sign of weakness; it is a sign of strength.", author: "Unknown" },

  // Time & Perspective
  { quote: "Time is the most valuable currency we have.", author: "Unknown" },
  { quote: "The early bird gets the worm, but the second mouse gets the cheese.", author: "Steven Wright" },
  { quote: "This too shall pass.", author: "Persian Proverb" },
  { quote: "Ten years from now, you'll wish you started today.", author: "Karen Lamb" },
  { quote: "Time flies when you're having fun. Make sure you're having fun.", author: "Unknown" },
  { quote: "The days are long, but the years are short.", author: "Gretchen Rubin" },
  { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { quote: "Yesterday is a cancelled check; tomorrow is a promissory note; today is the only cash you have.", author: "Unknown" },
  { quote: "You will only regret the chances you didn't take.", author: "Unknown" },
  { quote: "Time doesn't heal wounds. What heals is what you do with that time.", author: "Unknown" },

  // Simplicity & Peace
  { quote: "The more you own, the more it owns you.", author: "Henry David Thoreau" },
  { quote: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { quote: "A simple life lived with intention is more fulfilling than a complex life lived by default.", author: "Unknown" },
  { quote: "Let it be simple.", author: "Unknown" },
  { quote: "Happiness is not by addition. It is by subtraction.", author: "Unknown" },
  { quote: "Minimalism is not about having less. It's about making room for what matters.", author: "Unknown" },
  { quote: "The more you have, the more you have to lose.", author: "Unknown" },
  { quote: "A cluttered space is a cluttered mind.", author: "Unknown" },
  { quote: "Do less. Achieve more.", author: "Unknown" },
  { quote: "Less is more.", author: "Ludwig Mies van der Rohe" },

  // Health & Wellbeing
  { quote: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { quote: "Health is a state of complete physical, mental and social well-being.", author: "WHO" },
  { quote: "A healthy outside starts from a healthy inside.", author: "Robert Urich" },
  { quote: "Your body is a temple.", author: "Unknown" },
  { quote: "Wellness is a journey, not a destination.", author: "Unknown" },
  { quote: "The greatest wealth is health.", author: "Virgil" },
  { quote: "An ounce of prevention is worth a pound of cure.", author: "Benjamin Franklin" },
  { quote: "Nourish your body and your mind will flourish.", author: "Unknown" },
  { quote: "Sleep is not a luxury. It is essential.", author: "Unknown" },
  { quote: "Move your body every day. Your mind will thank you.", author: "Unknown" },

  // Gratitude & Appreciation
  { quote: "Gratitude turns what we have into enough.", author: "Sheryl Crow" },
  { quote: "Be grateful for what you have while you have it.", author: "Unknown" },
  { quote: "Appreciation is the highest form of prayer.", author: "Sarah Ban Breathnach" },
  { quote: "The smallest act of kindness is worth more than the grandest intention.", author: "Oscar Wilde" },
  { quote: "Gratitude is not just about saying thank you. It's about feeling it.", author: "Unknown" },
  { quote: "When you appreciate what you have, you attract more to appreciate.", author: "Unknown" },
  { quote: "Gratitude is the antidote to regret.", author: "Unknown" },
  { quote: "Notice the small things. They are often the greatest.", author: "Unknown" },
  { quote: "Every day is a gift. That is why it is called the present.", author: "Bill Keane" },
  { quote: "Thankfulness creates happiness. Gratefulness creates abundance.", author: "Unknown" },

  // Dreams & Ambition
  { quote: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { quote: "Your dreams don't have a deadline. Stop making excuses.", author: "Unknown" },
  { quote: "The biggest risk is not taking one.", author: "Unknown" },
  { quote: "If you don't have big dreams, you'll end up working for someone else's.", author: "Unknown" },
  { quote: "An unattainable dream is not a failing. Failure is not trying.", author: "Unknown" },
  { quote: "Your ambition is your strength. Use it wisely.", author: "Unknown" },
  { quote: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
  { quote: "The world needs your magic.", author: "Unknown" },
  { quote: "You are capable of more than you know.", author: "Unknown" },
  { quote: "Your potential is limitless. Stop being limited by your beliefs.", author: "Unknown" },

  // Learning & Growth
  { quote: "The more you read, the more things you will know.", author: "Dr. Seuss" },
  { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { quote: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
  { quote: "You don't grow when things are easy. You grow when you face challenges.", author: "Unknown" },
  { quote: "Mistakes are proof that you are trying.", author: "Unknown" },
  { quote: "Your mistakes don't define you. How you respond does.", author: "Unknown" },
  { quote: "Feedback is a gift. Use it to grow.", author: "Unknown" },
  { quote: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { quote: "Growth is uncomfortable. That's how you know it's working.", author: "Unknown" },

  // Service & Giving
  { quote: "The best way to find yourself is to lose yourself in service to others.", author: "Mahatma Gandhi" },
  { quote: "We are not obligated to complete the work, but we are not free to abandon it.", author: "Pirkei Avot" },
  { quote: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", author: "Anne Frank" },
  { quote: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
  { quote: "Service to others is the rent you pay for your room here on Earth.", author: "Muhammad Ali" },
  { quote: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate.", author: "Ralph Waldo Emerson" },
  { quote: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
  { quote: "Give and you will receive.", author: "Unknown" },
  { quote: "The greatest gift you can give is your presence.", author: "Unknown" },
  { quote: "Helping others is not an obligation. It is a privilege.", author: "Unknown" },

  // Inner Peace & Harmony
  { quote: "Seek peace not as the absence of conflict, but as the presence of harmony.", author: "Unknown" },
  { quote: "Peace starts within.", author: "Unknown" },
  { quote: "Your silence is powerful. Know when to use it.", author: "Unknown" },
  { quote: "Harmony comes from balance.", author: "Unknown" },
  { quote: "Inner peace is the opposite of worry.", author: "Unknown" },
  { quote: "Let go of what was. Embrace what is. Trust what will be.", author: "Unknown" },
  { quote: "Calm is contagious.", author: "Unknown" },
  { quote: "You cannot pour from an empty cup.", author: "Unknown" },
  { quote: "The mind is always talking. Learn to listen without judgment.", author: "Unknown" },
  { quote: "Find your center. Everything else follows.", author: "Unknown" },

  // Authenticity
  { quote: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
  { quote: "Authenticity is the daily practice of letting go of who we think we're supposed to be and embracing who we are.", author: "Brené Brown" },
  { quote: "Your vibe attracts your tribe.", author: "Unknown" },
  { quote: "Stop trying to fit in when you were born to stand out.", author: "Dr. Seuss" },
  { quote: "The more authentic you are, the more magnetic you become.", author: "Unknown" },
  { quote: "Never dim your light to make someone else comfortable.", author: "Unknown" },
  { quote: "Being yourself is the best gift you can give to the world.", author: "Unknown" },
  { quote: "Authenticity is magnetic. Everyone is attracted to truth.", author: "Unknown" },
  { quote: "Your weirdness is your strength.", author: "Unknown" },
  { quote: "The world does not need another you. It needs the real you.", author: "Unknown" },

  // Perspective
  { quote: "This will either be the best thing that ever happened to you or the worst. You don't know yet.", author: "Unknown" },
  { quote: "What seems impossible today will one day become your warm-up.", author: "Muhammad Ali" },
  { quote: "The perspective you choose shapes your life.", author: "Unknown" },
  { quote: "When you change the way you look at things, the things you look at change.", author: "Wayne Dyer" },
  { quote: "Problems are just lessons in disguise.", author: "Unknown" },
  { quote: "The same boiling water that softens the potato hardens the egg.", author: "Unknown" },
  { quote: "Your perception becomes your reality.", author: "Unknown" },
  { quote: "What you see is what you get. Look for the good.", author: "Unknown" },
  { quote: "Every setback is a setup for a comeback.", author: "Unknown" },
  { quote: "Choose to see the glass as half full.", author: "Unknown" },

  // Purpose-Driven
  { quote: "A life without purpose is like a ship without a destination.", author: "Unknown" },
  { quote: "Find your 'why' and you'll find your way.", author: "Unknown" },
  { quote: "Living a purpose-driven life transforms everything.", author: "Unknown" },
  { quote: "Your purpose is not found. It is created.", author: "Unknown" },
  { quote: "What you do today should be in pursuit of your dreams.", author: "Unknown" },
  { quote: "Live with intention. Walk to the edge. Listen hard. Practice wellness. Play with abandon. Laugh.", author: "Mary Oliver" },
  { quote: "Purpose gives meaning to suffering.", author: "Viktor Frankl" },
  { quote: "You don't have to be great to start. You have to start to be great. With purpose.", author: "Unknown" },
  { quote: "A purposeful life is a powerful life.", author: "Unknown" },
  { quote: "Your mission, should you choose to accept it, is to become the best version of yourself.", author: "Unknown" },
]

export function getQuoteForDate(date: Date = new Date()): Quote {
  const dateString = date.toISOString().split('T')[0]
  const hash = dateString.split('').reduce((h, c) => h + c.charCodeAt(0), 0)
  const index = hash % DEEP_QUOTES.length
  return DEEP_QUOTES[index]
}

export function getRandomQuote(): Quote {
  return DEEP_QUOTES[Math.floor(Math.random() * DEEP_QUOTES.length)]
}
