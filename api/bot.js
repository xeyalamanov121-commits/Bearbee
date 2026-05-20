const suits = ["♠", "♥", "♦", "♣"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

let deck = [];

function createDeck() {
  deck = [];

  for (let suit of suits) {
    for (let value of values) {
      deck.push({
        value,
        suit,
      });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCard() {
  return deck.pop();
}

function renderCard(card) {
  return `${card.value}${card.suit}`;
}

createDeck();
shuffleDeck();

const playerCards = [
  dealCard(),
  dealCard()
];

const enemyCards = [
  dealCard(),
  dealCard()
];

const communityCards = [
  dealCard(),
  dealCard(),
  dealCard(),
  dealCard(),
  dealCard()
];

const playerCardDivs =
  document.querySelectorAll(".bottom-player .card");

playerCardDivs[0].innerHTML =
  renderCard(playerCards[0]);

playerCardDivs[1].innerHTML =
  renderCard(playerCards[1]);

const communityDiv =
  document.querySelector(".community");

communityDiv.innerHTML = "";

communityCards.forEach(card => {
  const div = document.createElement("div");

  div.classList.add("card");

  div.innerHTML = renderCard(card);

  communityDiv.appendChild(div);
});

console.log("Player:", playerCards);
console.log("Enemy:", enemyCards);
console.log("Community:", communityCards);
