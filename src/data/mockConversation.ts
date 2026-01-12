export interface SimulatedMessage {
  id: number;
  sender: 'ai' | 'user';
  text: string;
}

export const mockConversation: SimulatedMessage[] = [
  {
    id: 1,
    sender: 'ai',
    text: "I see you have some tomatoes, onions, and garlic. Are you thinking of making a pasta sauce?",
  },
  {
    id: 2,
    sender: 'user',
    text: "Yes, exactly! What else would I need?",
  },
  {
    id: 3,
    sender: 'ai',
    text: "For a classic marinara, you'll need some basil, oregano, and perhaps a pinch of red pepper flakes for heat. I don't see any pasta in your pantry.",
  },
  {
    id: 4,
    sender: 'user',
    text: "You're right. Add spaghetti and red pepper flakes to my shopping list.",
  },
  {
    id: 5,
    sender: 'ai',
    text: "Done. I've added spaghetti and red pepper flakes to your list. I also noticed your olive oil is running low.",
  },
  {
    id: 6,
    sender: 'user',
    text: "Good catch! Add that too.",
  },
  {
    id: 7,
    sender: 'ai',
    text: "I also see you have some fresh chicken breasts and a bell pepper. Would you like some dinner ideas using those?",
  },
  {
    id: 8,
    sender: 'user',
    text: "Sounds great! What do you suggest?",
  },
  {
    id: 9,
    sender: 'ai',
    text: "How about a quick chicken and bell pepper stir-fry with some rice? Or perhaps chicken fajitas if you have tortillas and chili powder.",
  },
  {
    id: 10,
    sender: 'user',
    text: "Stir-fry sounds perfect. Do I have soy sauce?",
  },
  {
    id: 11,
    sender: 'ai',
    text: "Checking... Yes, you have a bottle of low-sodium soy sauce and some sesame oil. You're good to go!",
  },
  {
    id: 12,
    sender: 'user',
    text: "Awesome! Any suggestions for using up those ripe bananas on the counter?",
  },
  {
    id: 13,
    sender: 'ai',
    text: "Absolutely! Banana bread is always a classic, or you could make a quick smoothie with some yogurt and oats for breakfast.",
  },
  {
    id: 14,
    sender: 'user',
    text: "Banana bread it is! I think I have all the ingredients for that.",
  },
  {
    id: 15,
    sender: 'ai',
    text: "Checking your pantry... Yes, you have flour, sugar, eggs, and baking soda. You're all set for banana bread!",
  },
  {
    id: 16,
    sender: 'user',
    text: "Fantastic! What about the leftover mashed potatoes from last night?",
  },
  {
    id: 17,
    sender: 'ai',
    text: "You could easily turn those into potato cakes or add them to a shepherd's pie. Do you have any ground beef or lentils?",
  },
  {
    id: 18,
    sender: 'user',
    text: "I have some ground beef. Shepherd's pie sounds delicious!",
  },
  {
    id: 19,
    sender: 'ai',
    text: "Great! For shepherd's pie, you'll want some peas, carrots, and a bit of beef broth. I can add those to your shopping list if you don't have them.",
  },
  {
    id: 20,
    sender: 'user',
    text: "Please add peas and beef broth to the list. I have carrots.",
  },
  {
    id: 21,
    sender: 'ai',
    text: "Consider it done. Anything else I can help you with today regarding your kitchen?",
  },
]; 