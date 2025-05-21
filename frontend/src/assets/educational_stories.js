/**
 * Educational Stories Collection
 * 
 * This file contains a collection of educational stories with associated questions
 * that test reading comprehension. Each story consists of 2-5 sentences and is
 * followed by a multiple-choice question.
 * 
 * Format:
 * {
 *   id: unique identifier,
 *   title: story title,
 *   sentences: array of sentences that make up the story,
 *   question: multiple-choice question about the story,
 *   choices: array of 4 possible answers [A, B, C, D],
 *   correctAnswer: index of the correct answer (0-3)
 * }
 */

const educationalStories = [
  {
    id: 1,
    title: "The Water Cycle",
    sentences: [
      "Water on Earth continuously moves in a cycle of evaporation, condensation, and precipitation.",
      "The sun's heat causes water from oceans, lakes, and rivers to evaporate into the atmosphere as water vapor.",
      "As water vapor rises, it cools and condenses to form clouds.",
      "When clouds become heavy with water droplets, the water falls back to Earth as rain, snow, or hail."
    ],
    question: "What causes water vapor to condense into clouds?",
    choices: [
      "Sunlight hitting the water vapor",
      "Wind pushing the water vapor together",
      "The water vapor cooling as it rises",
      "Pollution in the atmosphere"
    ],
    correctAnswer: 2
  },
  {
    id: 2,
    title: "Ancient Egypt",
    sentences: [
      "Ancient Egypt was one of the world's first great civilizations, flourishing along the Nile River.",
      "The Egyptians built massive pyramids as tombs for their pharaohs, using simple tools and incredible engineering skills.",
      "Hieroglyphics was their writing system, using pictures and symbols to represent words and sounds.",
      "The ancient Egyptians developed a solar calendar with 365 days, very similar to our modern calendar."
    ],
    question: "What was the purpose of the pyramids in ancient Egypt?",
    choices: [
      "To store grain for times of famine",
      "As tombs for pharaohs",
      "To study the stars and planets",
      "As government buildings"
    ],
    correctAnswer: 1
  },
  {
    id: 3,
    title: "Plant Growth",
    sentences: [
      "Plants create their own food through a process called photosynthesis.",
      "During photosynthesis, plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
      "The glucose provides energy for the plant to grow, while oxygen is released into the air.",
      "Plants need nutrients from the soil, such as nitrogen and phosphorus, to grow healthy and strong."
    ],
    question: "What gas do plants release during photosynthesis?",
    choices: [
      "Carbon dioxide",
      "Nitrogen",
      "Hydrogen",
      "Oxygen"
    ],
    correctAnswer: 3
  },
  {
    id: 4,
    title: "The Solar System",
    sentences: [
      "Our solar system consists of the Sun, eight planets, dwarf planets, moons, asteroids, and comets.",
      "Mercury, Venus, Earth, and Mars are the inner, rocky planets closest to the Sun.",
      "Jupiter, Saturn, Uranus, and Neptune are the outer, gaseous planets with rings and many moons.",
      "Pluto was once considered the ninth planet but was reclassified as a dwarf planet in 2006."
    ],
    question: "Which of these is NOT one of the inner, rocky planets?",
    choices: [
      "Mercury",
      "Venus",
      "Saturn",
      "Mars"
    ],
    correctAnswer: 2
  },
  {
    id: 5,
    title: "Animal Adaptations",
    sentences: [
      "Animals have special features called adaptations that help them survive in their environments.",
      "The thick fur of polar bears keeps them warm in the freezing Arctic climate.",
      "Camels have humps to store fat, which provides energy and water when food is scarce.",
      "Giraffes have long necks that allow them to reach leaves high in trees that other animals cannot access."
    ],
    question: "What is the purpose of a camel's hump?",
    choices: [
      "To store water directly",
      "To store fat for energy and water",
      "To regulate body temperature",
      "To attract mates"
    ],
    correctAnswer: 1
  },
  {
    id: 6,
    title: "Recycling Matters",
    sentences: [
      "Recycling is the process of converting waste materials into new, useful products.",
      "By recycling, we reduce the amount of waste sent to landfills and conserve natural resources.",
      "Common recyclable materials include paper, plastic, glass, and metals like aluminum.",
      "Composting food scraps and yard waste is another form of recycling that creates nutrient-rich soil."
    ],
    question: "What is one benefit of recycling mentioned in the story?",
    choices: [
      "It creates more landfills",
      "It increases pollution",
      "It conserves natural resources",
      "It uses more energy than creating new products"
    ],
    correctAnswer: 2
  },
  {
    id: 7,
    title: "World of Insects",
    sentences: [
      "Insects are the most diverse group of animals on Earth, with over a million known species.",
      "All insects have six legs and bodies divided into three parts: head, thorax, and abdomen.",
      "Many insects, like bees and butterflies, help plants reproduce by carrying pollen from flower to flower.",
      "Some insects, such as ants and termites, live in large, organized colonies with different roles for each member."
    ],
    question: "How many body parts do all insects have?",
    choices: [
      "Two",
      "Three",
      "Four",
      "Five"
    ],
    correctAnswer: 1
  },
  {
    id: 8,
    title: "Ocean Exploration",
    sentences: [
      "Oceans cover more than 70% of Earth's surface, yet humans have explored less than 5% of them.",
      "The deepest part of the ocean is the Mariana Trench, which reaches depths of nearly 11 kilometers.",
      "Coral reefs are diverse underwater ecosystems often called the 'rainforests of the sea'.",
      "Scientists use specialized submarines and remotely operated vehicles to study the ocean depths."
    ],
    question: "What percentage of Earth's oceans have humans explored?",
    choices: [
      "Less than 5%",
      "About 25%",
      "Nearly 50%",
      "More than 70%"
    ],
    correctAnswer: 0
  },
  {
    id: 9,
    title: "Human Heart",
    sentences: [
      "The human heart is a muscular organ about the size of a closed fist.",
      "It pumps blood throughout the body, delivering oxygen and nutrients to cells.",
      "A healthy heart beats about 100,000 times per day, or about 35 million times in a year.",
      "The heart has four chambers: two atria on top and two ventricles on the bottom."
    ],
    question: "How many chambers does the human heart have?",
    choices: [
      "Two",
      "Three",
      "Four",
      "Six"
    ],
    correctAnswer: 2
  },
  {
    id: 10,
    title: "Weather Patterns",
    sentences: [
      "Weather is the state of the atmosphere at a specific time and place.",
      "Meteorologists study weather patterns and use technology like radar and satellites to make forecasts.",
      "Air pressure, temperature, humidity, and wind all influence the weather we experience.",
      "Climate refers to the average weather conditions in an area over a long period of time."
    ],
    question: "What is the difference between weather and climate?",
    choices: [
      "Weather is always hot, climate is always cold",
      "Weather is local, climate is global",
      "Weather relates to specific events, climate refers to average conditions over time",
      "There is no difference; they mean the same thing"
    ],
    correctAnswer: 2
  }
];

export default educationalStories;
