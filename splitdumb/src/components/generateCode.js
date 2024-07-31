const adjectives = ["Affectionate", "Majestic", "Playful", "Graceful", "Loyal",
    "Intelligent", "Gentle", "Energetic", "Vibrant", "Friendly", "Brave",
    "Cheerful", "Curious", "Loving", "Noble", "Quick", "Speedy", "Sneaky"];
const colours = ["Red", "Blue", "Green", "Yellow", "Pink", "Orange", "Brown",
    "Purple", "White", "Black", "Violet", "Aquamarine", "Magenta", "Maroon",
    "Silver"];
const animals = ["Dog", "Cat", "Elephant", "Lion", "Tiger", "Giraffe", "Bear",
    "Dolphin", "Horse", "Penguin", "Monkey", "Kangaroo", "Zebra", "Rabbit",
    "Panda", "Snake", "Mouse", "Pig", "Dragon", "Deer", "Unicorn", "Chicken",
    "Cow", "Koala", "Emu", "Crow", "Raven", "Turkey", "Kingfisher", "Hummingbird",
    "Whale", "Shark", "Eel", "Mudskipper", "Stingray", "Seahorse", "Dolphin",
    "Crab", "Lobster", "Crayfish", "Guppy", "Tuna", "Salmon", "Eagle",
    "Panther", "Leopard", "Hawk", "Cod", "Swordfish", "Rhino", "Sardines",
    "Wolf", "Turtle", "Capybara", "Frog", "Slug", "Sloth", "Goat", "Hamster"];
  // 15930 possibilities
const numbers = ['1','2','3','4','5','6','7','8','9','0','11','22','33','44','55','66','77','88','99','00'];
 // 318600 possibilities

 export const GenerateCode = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = colours[Math.floor(Math.random() * colours.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = numbers[Math.floor(Math.random() * numbers.length)];
  return `${adjective}${color}${animal}${number}`;
};
