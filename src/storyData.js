export const modules = [
  {
    id: 'dreamer',
    title: 'The Dreamer',
    milestoneTitle: 'The Coat of Many Colours',
    milestonePlace: 'Canaan',
    art: 'assets/joseph-coat-art.png',
    reference: 'Genesis 37:1-11',
    theme: 'God can plant a calling before people understand it.',
    location: 'Hebron hills',
    summary:
      'Joseph was the favored son of Jacob, born to him in his old age. His father set him above his brothers and gave him an ornate robe. Joseph also dreamed dreams that placed him above his family, and his brothers despised him for both the favor and the dreams.',
    scripture:
      'Now Israel loved Joseph more than all his children, because he was the son of his old age: and he made him a coat of many colours.',
    scriptureReference: 'Genesis 37:3 (KJV)',
    challengeName: 'Gather the Dreams',
    story: [
      'Joseph is the beloved son of Jacob, and his colorful robe makes the family tension impossible to miss.',
      'He dreams that his brothers bow before him, then he dreams that the sun, moon, and stars bow too.',
      'Joseph tells the dreams plainly. His brothers feel jealousy, and even Jacob wonders what the dreams mean.'
    ],
    questions: [
      {
        prompt: 'Who gave Joseph the coat of many colours?',
        answers: ['Jacob, his father', 'Pharaoh', 'Potiphar'],
        correctIndex: 0
      },
      {
        prompt: 'Why did Jacob especially love Joseph?',
        answers: ['Joseph was the son of his old age.', 'Joseph owned many sheep.', 'Joseph ruled Egypt already.'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph’s brothers feel toward him?',
        answers: ['Hatred and jealousy', 'Complete trust', 'Fear of Pharaoh'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph see in his first dream?',
        answers: ['His brothers’ sheaves bowed to his sheaf.', 'A ladder reaching heaven', 'A burning bush'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph see in his second dream?',
        answers: ['The sun, moon, and eleven stars bowed to him.', 'Seven thin cows ate seven fat cows.', 'A vine with three branches.'],
        correctIndex: 0
      },
      {
        prompt: 'How did Joseph speak about his dreams?',
        answers: ['He told them plainly to his family.', 'He hid them forever.', 'He wrote them to Pharaoh.'],
        correctIndex: 0
      },
      {
        prompt: 'How did Jacob respond to Joseph’s second dream?',
        answers: ['He rebuked Joseph but observed the saying.', 'He sold Joseph immediately.', 'He ignored Joseph completely.'],
        correctIndex: 0
      },
      {
        prompt: 'What family problem does this milestone show?',
        answers: ['Favoritism and jealousy', 'Famine in Egypt', 'Prison leadership'],
        correctIndex: 0
      },
      {
        prompt: 'What early sign of Joseph’s calling appears here?',
        answers: ['Dreams that point toward future authority', 'A royal decree from Pharaoh', 'A battle victory'],
        correctIndex: 0
      },
      {
        prompt: 'Where does this part of Joseph’s story begin?',
        answers: ['Canaan', 'Babylon', 'Jerusalem'],
        correctIndex: 0
      }
    ],
    game: {
      type: 'collect',
      objective: 'Collect 7 dream stars, then bring them to Jacob.',
      winMessage: 'You gathered the dream symbols and brought them back to Jacob.'
    }
  },
  {
    id: 'pit',
    title: 'The Pit',
    milestoneTitle: 'Cast Into the Pit',
    milestonePlace: 'Dothan',
    art: 'assets/joseph-pit-art.png',
    reference: 'Genesis 37:12-36',
    theme: 'Betrayal does not get the final word.',
    location: 'Dothan road',
    summary:
      'Joseph obeyed his father and went to seek his brothers. Their jealousy had hardened into violence, and they stripped him of the robe, cast him into a pit, and sold him to a caravan headed toward Egypt.',
    scripture:
      'And they took him, and cast him into a pit: and the pit was empty, there was no water in it.',
    scriptureReference: 'Genesis 37:24 (KJV)',
    challengeName: 'Find the Caravan',
    story: [
      'Jacob sends Joseph to check on his brothers and their flocks.',
      'His brothers throw him into a pit, then sell him to traders traveling toward Egypt.',
      'Joseph is taken far from home, but the story keeps moving under God’s care.'
    ],
    questions: [
      {
        prompt: 'Why did Jacob send Joseph to his brothers?',
        answers: ['To check on them and the flocks', 'To buy grain in Egypt', 'To interpret Pharaoh’s dream'],
        correctIndex: 0
      },
      {
        prompt: 'Where did Joseph find his brothers?',
        answers: ['Dothan', 'Jericho', 'Nineveh'],
        correctIndex: 0
      },
      {
        prompt: 'What did the brothers do first when Joseph arrived?',
        answers: ['They stripped off his coat.', 'They crowned him king.', 'They sent him home with gifts.'],
        correctIndex: 0
      },
      {
        prompt: 'Where did the brothers place Joseph?',
        answers: ['In an empty pit', 'In Pharaoh’s palace', 'In a boat'],
        correctIndex: 0
      },
      {
        prompt: 'Which brother argued that Joseph should not be killed?',
        answers: ['Reuben', 'Benjamin', 'Simeon'],
        correctIndex: 0
      },
      {
        prompt: 'To whom was Joseph sold?',
        answers: ['A company of traders going to Egypt', 'The king of Canaan', 'A Roman soldier'],
        correctIndex: 0
      },
      {
        prompt: 'What did the brothers use to deceive Jacob?',
        answers: ['Joseph’s coat dipped in blood', 'A forged letter from Egypt', 'A broken prison chain'],
        correctIndex: 0
      },
      {
        prompt: 'How did Jacob respond when he saw the coat?',
        answers: ['He mourned deeply.', 'He celebrated a feast.', 'He traveled to Pharaoh.'],
        correctIndex: 0
      },
      {
        prompt: 'Where was Joseph taken after he was sold?',
        answers: ['Egypt', 'Nineveh', 'Jericho'],
        correctIndex: 0
      },
      {
        prompt: 'What truth does this milestone emphasize?',
        answers: ['Betrayal does not end God’s story.', 'Joseph’s dreams were forgotten by God.', 'Jacob planned the sale.'],
        correctIndex: 0
      }
    ],
    game: {
      type: 'locked',
      objective: 'Future mini-game: guide Joseph toward the caravan while avoiding hazards.',
      winMessage: 'Module game coming next.'
    }
  },
  {
    id: 'faithful',
    title: 'Faithful in Hard Places',
    milestoneTitle: "Potiphar's House",
    milestonePlace: 'Egypt',
    art: 'assets/joseph-potiphar-art.png',
    reference: 'Genesis 39',
    theme: 'Character matters when nobody is applauding.',
    location: 'Potiphar’s house',
    summary:
      'In Egypt, Joseph served in Potiphar’s house with diligence. God was with him, and Joseph became trusted with responsibility even while living far from home.',
    scripture:
      'And his master saw that the LORD was with him, and that the LORD made all that he did to prosper in his hand.',
    scriptureReference: 'Genesis 39:3 (KJV)',
    challengeName: 'Steward the House',
    story: [
      'Joseph serves in Potiphar’s house, and the Lord gives success to his work.',
      'When tempted to do wrong, Joseph chooses faithfulness.',
      'He is falsely accused and imprisoned, yet God remains with him.'
    ],
    questions: [
      {
        prompt: 'Whose house did Joseph serve in Egypt?',
        answers: ["Potiphar’s house", 'Pharaoh’s prison', 'Jacob’s tent'],
        correctIndex: 0
      },
      {
        prompt: 'What did Potiphar notice about Joseph?',
        answers: ['The Lord was with him.', 'Joseph wanted revenge.', 'Joseph had forgotten his family.'],
        correctIndex: 0
      },
      {
        prompt: 'What responsibility did Potiphar give Joseph?',
        answers: ['Oversight of his house', 'Command of Pharaoh’s armies', 'Care of Jacob’s flocks'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph choose when he was tempted?',
        answers: ['Faithfulness to God', 'Revenge on his brothers', 'Returning to Canaan'],
        correctIndex: 0
      },
      {
        prompt: 'What reason did Joseph give for refusing sin?',
        answers: ['He would not sin against God.', 'He feared losing his coat.', 'He wanted Pharaoh’s throne.'],
        correctIndex: 0
      },
      {
        prompt: 'What happened after Joseph refused temptation?',
        answers: ['He was falsely accused.', 'He became Pharaoh immediately.', 'He returned to Canaan.'],
        correctIndex: 0
      },
      {
        prompt: 'Where was Joseph sent after the false accusation?',
        answers: ['Prison', 'Dothan', 'Hebron'],
        correctIndex: 0
      },
      {
        prompt: 'What stayed true even in prison?',
        answers: ['The Lord was with Joseph.', 'Joseph was forgotten by God.', 'Joseph ruled Egypt already.'],
        correctIndex: 0
      },
      {
        prompt: 'What character quality stands out in this milestone?',
        answers: ['Integrity', 'Bitterness', 'Laziness'],
        correctIndex: 0
      },
      {
        prompt: 'What does Joseph’s service show?',
        answers: ['Faithfulness matters in hard places.', 'Success only matters in palaces.', 'Dreams should always be hidden.'],
        correctIndex: 0
      }
    ],
    game: {
      type: 'locked',
      objective: 'Future mini-game: organize rooms and make wise choices under pressure.',
      winMessage: 'Module game coming next.'
    }
  },
  {
    id: 'prison',
    title: 'Dreams in Prison',
    milestoneTitle: 'Dreams in Prison',
    milestonePlace: "Pharaoh's prison",
    art: 'assets/joseph-prison-art.png',
    reference: 'Genesis 40',
    theme: 'God can use gifts in overlooked places.',
    location: 'Royal prison',
    summary:
      'Joseph was falsely accused and placed in prison, yet he continued to serve. When Pharaoh’s cupbearer and baker were troubled by dreams, Joseph pointed them back to God.',
    scripture:
      'Do not interpretations belong to God? tell me them, I pray you.',
    scriptureReference: 'Genesis 40:8 (KJV)',
    challengeName: 'Interpret the Symbols',
    story: [
      'Joseph cares for Pharaoh’s cupbearer and baker while they are troubled by dreams.',
      'He says interpretations belong to God, then explains what each dream means.',
      'The cupbearer is restored, but he forgets Joseph for a time.'
    ],
    questions: [
      {
        prompt: 'Which two officials were imprisoned with Joseph?',
        answers: ['The cupbearer and the baker', 'The shepherd and the scribe', 'The captain and the priest'],
        correctIndex: 0
      },
      {
        prompt: 'Why were the cupbearer and baker troubled?',
        answers: ['They each had a dream.', 'They lost Pharaoh’s treasure.', 'They saw Joseph’s coat.'],
        correctIndex: 0
      },
      {
        prompt: 'Who did Joseph say interpretations belong to?',
        answers: ['God', 'Pharaoh', 'The cupbearer'],
        correctIndex: 0
      },
      {
        prompt: 'What did the cupbearer see in his dream?',
        answers: ['A vine with three branches', 'Seven thin cows', 'A pit with no water'],
        correctIndex: 0
      },
      {
        prompt: 'What happened to the cupbearer?',
        answers: ['He was restored to his place.', 'He was sold to traders.', 'He became king of Canaan.'],
        correctIndex: 0
      },
      {
        prompt: 'What did the baker carry in his dream?',
        answers: ['Baskets of baked goods', 'A coat of many colours', 'A silver cup'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph ask the cupbearer to do?',
        answers: ['Remember him to Pharaoh', 'Bring his brothers to prison', 'Hide the dream from everyone'],
        correctIndex: 0
      },
      {
        prompt: 'What did the cupbearer do after being restored?',
        answers: ['He forgot Joseph for a time.', 'He immediately freed Joseph.', 'He sold Joseph again.'],
        correctIndex: 0
      },
      {
        prompt: 'What gift did Joseph use in prison?',
        answers: ['Interpreting dreams by God’s help', 'Building storehouses', 'Commanding armies'],
        correctIndex: 0
      },
      {
        prompt: 'What does this milestone show?',
        answers: ['God can use gifts in overlooked places.', 'Prison ended Joseph’s calling.', 'The dreams had no meaning.'],
        correctIndex: 0
      }
    ],
    game: {
      type: 'locked',
      objective: 'Future mini-game: match dream symbols to their meanings.',
      winMessage: 'Module game coming next.'
    }
  },
  {
    id: 'palace',
    title: 'From Prison to Palace',
    milestoneTitle: "Pharaoh's Dreams",
    milestonePlace: 'The throne of Egypt',
    art: 'assets/joseph-pharaoh-art.png',
    reference: 'Genesis 41',
    theme: 'Wisdom prepares people to serve others.',
    location: 'Pharaoh’s court',
    summary:
      'Joseph was brought before Pharaoh to interpret dreams no one else could explain. God gave Joseph wisdom to warn Egypt about famine and prepare a plan that would save many lives.',
    scripture:
      'Can we find such a one as this is, a man in whom the Spirit of God is?',
    scriptureReference: 'Genesis 41:38 (KJV)',
    challengeName: 'Store the Grain',
    story: [
      'Pharaoh dreams of seven healthy cows and seven thin cows, then full grain and thin grain.',
      'Joseph explains that seven years of plenty will be followed by seven years of famine.',
      'Pharaoh appoints Joseph to prepare Egypt and preserve life.'
    ],
    questions: [
      {
        prompt: 'Who had dreams that no one could explain?',
        answers: ['Pharaoh', 'Jacob', 'Benjamin'],
        correctIndex: 0
      },
      {
        prompt: 'Who remembered Joseph before Pharaoh?',
        answers: ['The cupbearer', 'Potiphar’s wife', 'Reuben'],
        correctIndex: 0
      },
      {
        prompt: 'Who did Joseph credit for the interpretation?',
        answers: ['God', 'Himself alone', 'The magicians'],
        correctIndex: 0
      },
      {
        prompt: 'What did the seven good cows and ears represent?',
        answers: ['Seven years of plenty', 'Seven brothers', 'Seven prisons'],
        correctIndex: 0
      },
      {
        prompt: 'What did the seven thin cows and ears represent?',
        answers: ['Seven years of famine', 'Seven new dreams', 'Seven journeys to Canaan'],
        correctIndex: 0
      },
      {
        prompt: 'What plan did Joseph recommend?',
        answers: [
          'Store grain during the years of plenty.',
          'Ignore the dreams until famine came.',
          'Send all the grain away immediately.'
        ],
        correctIndex: 0
      },
      {
        prompt: 'What did Pharaoh see in Joseph?',
        answers: ['The Spirit of God', 'A dangerous enemy', 'A careless servant'],
        correctIndex: 0
      },
      {
        prompt: 'What position did Pharaoh give Joseph?',
        answers: ['Ruler under Pharaoh over Egypt', 'Keeper of sheep in Canaan', 'Prison guard only'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph’s wisdom prepare Egypt to survive?',
        answers: ['A severe famine', 'A flood', 'A battle with Canaan'],
        correctIndex: 0
      },
      {
        prompt: 'What does this milestone emphasize?',
        answers: ['Wisdom prepares people to serve others.', 'Dreams should be ignored.', 'Power is only for revenge.'],
        correctIndex: 0
      }
    ],
    game: {
      type: 'locked',
      objective: 'Future mini-game: collect grain and fill storehouses before famine arrives.',
      winMessage: 'Module game coming next.'
    }
  },
  {
    id: 'reunion',
    title: 'Forgiveness and Rescue',
    milestoneTitle: 'Reunion and Forgiveness',
    milestonePlace: 'Egypt',
    art: 'assets/joseph-reunion-art.png',
    reference: 'Genesis 42-50',
    theme: 'God can turn harm toward rescue and reconciliation.',
    location: 'Egyptian storehouses',
    summary:
      'When Joseph’s brothers came to Egypt for food, Joseph eventually revealed himself. Instead of revenge, he chose forgiveness and saw God’s providence at work through his suffering.',
    scripture:
      'Ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.',
    scriptureReference: 'Genesis 50:20 (KJV)',
    challengeName: 'Bring the Family Home',
    story: [
      'Joseph’s brothers come to Egypt for food, not knowing he is the ruler before them.',
      'Joseph tests their hearts, then reveals himself with tears.',
      'He forgives them and says God used what was meant for harm to save many lives.'
    ],
    questions: [
      {
        prompt: 'Why did Joseph’s brothers come to Egypt?',
        answers: ['To buy food during famine', 'To crown Joseph king', 'To find the lost coat'],
        correctIndex: 0
      },
      {
        prompt: 'Did Joseph’s brothers recognize him at first?',
        answers: ['No, they did not recognize him.', 'Yes, immediately.', 'Only Benjamin recognized him.'],
        correctIndex: 0
      },
      {
        prompt: 'Which younger brother was especially important in Joseph’s testing?',
        answers: ['Benjamin', 'Esau', 'Manasseh'],
        correctIndex: 0
      },
      {
        prompt: 'How did Joseph feel when he revealed himself?',
        answers: ['He wept.', 'He laughed cruelly.', 'He felt nothing.'],
        correctIndex: 0
      },
      {
        prompt: 'How did Joseph respond when he revealed himself?',
        answers: ['With forgiveness', 'With permanent exile', 'With silence'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph say God had done through his suffering?',
        answers: ['Sent him ahead to preserve life', 'Forgotten his family', 'Ended the promise to Jacob'],
        correctIndex: 0
      },
      {
        prompt: 'Who moved to Egypt after Joseph revealed himself?',
        answers: ['Jacob and his family', 'Only Pharaoh', 'The people of Jericho'],
        correctIndex: 0
      },
      {
        prompt: 'What did Joseph provide for his family?',
        answers: ['Food and a place to live', 'A prison sentence', 'A new coat for each enemy'],
        correctIndex: 0
      },
      {
        prompt: 'What does Genesis 50:20 teach in this story?',
        answers: ['God meant for good what others meant for evil.', 'Evil is stronger than God.', 'Joseph’s brothers were never forgiven.'],
        correctIndex: 0
      },
      {
        prompt: 'What theme closes Joseph’s story?',
        answers: ['Rescue and reconciliation', 'Permanent revenge', 'A forgotten dream'],
        correctIndex: 0
      }
    ],
    game: {
      type: 'locked',
      objective: 'Future mini-game: reunite family members and deliver grain.',
      winMessage: 'Module game coming next.'
    }
  }
];
