const DEFAULT_CARDS_PER_PLAYER = 6;
const DEFAULT_PLAYERS = ["Player 1", "Player 2"];

function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
  this.symbol = () => {
    return `&${suit};`;
  }
  this.getClass = () => {
    return `rank-${this.rank} ${this.suit}`;
  }
}

function Player(name) {
  this.name = name;
  this.cards = [];
  this.score = 0;
}

window.onload = function() {
  // https://www.w3schools.com/howto/howto_js_rangeslider.asp
  let cardsPerPlayerInput = document.getElementById("cardsPerPlayerInput");
  let cardsPerPlayerCounter = document.getElementById("cardsPerPlayer");
  cardsPerPlayerInput.value = DEFAULT_CARDS_PER_PLAYER;
  cardsPerPlayerCounter.innerHTML = DEFAULT_CARDS_PER_PLAYER;

  cardsPerPlayerInput.oninput = function() {
    cardsPerPlayerCounter.innerHTML = cardsPerPlayerInput.value;
  }

  let playersInput = document.getElementById("playerNamesInput");
  playersInput.value = DEFAULT_PLAYERS.join("\n");
}

var app = new Vue({
  el: '#app',
  data: {
    numCards: DEFAULT_CARDS_PER_PLAYER,
    ranks: ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q',
      'k'
    ],
    suits: ['diams', 'hearts', 'spades', 'clubs'],
    deck: [],
    players: DEFAULT_PLAYERS.map(name => new Player(name)),
    currPlayer: null,
    gameOver: false,
    winner: null,
  },
  created() {
    this.reset();
  },
  methods: {
    randomIndex(length) {
      return Math.floor(Math.random() * length);
    },
    randomCard() {
      return this.deck.splice(this.randomIndex(this.deck.length), 1)[0];
    },
    resetDecks() {
      let numDecks = Math.ceil(this.numCards * this.players.length / 52);

      this.deck = [];
      while (numDecks > 0) {
        this.suits.forEach(suit => {
          this.ranks.forEach(rank => {
            this.deck.push(new Card(suit, rank));
          });
        });
        numDecks--;
      }
    },
    reset() {
      this.resetDecks();
      this.players.forEach(player => {
        Vue.set(player, 'cards', [this.randomCard()]);
      });
      this.currPlayer = this.randomIndex(this.players.length);
      this.gameOver = false;
    },
    updateSettings(e) {
      e.preventDefault();

      let cardsPerPlayerInput = document.getElementById("cardsPerPlayerInput");
      this.numCards = cardsPerPlayerInput.value;

      let playersInput = document.getElementById("playerNamesInput");
      Vue.set(this, 'players', []);
      playersInput.value.trim().split("\n").forEach(playerName => {
        Vue.set(this.players, this.players.length, new Player(playerName));
      });

      let darkModeInput = document.getElementById("darkModeInput");
      if (darkModeInput.checked) {
        document.body.classList.add('darkMode');
      } else {
        document.body.classList.remove('darkMode');
      }

      this.reset();
    },
    cardsRemaining(player) {
      return this.numCards - player.cards.length;
    },
    nextPlayer() {
      /* Return the index of the next player that has unrevealed cards,
         return null if there are no other players with unrevealed cards. */
      let nextPlayer = this.currPlayer;
      do {
        nextPlayer = (nextPlayer + 1) % this.players.length;
      } while (nextPlayer != this.currPlayer &&
        this.players[nextPlayer].cards.length == this.numCards);
      return nextPlayer == this.currPlayer ? null : nextPlayer;
    },
    correctGuess(rank1, rank2, guessedHigher) {
      if (rank1 == rank2) {
        return false;
      }
      let higher = this.ranks.indexOf(rank2) > this.ranks.indexOf(rank1);
      return higher === guessedHigher;
    },
    play(guessedHigher) {
      let currCards = this.players[this.currPlayer].cards;
      let currCard = currCards[currCards.length - 1];

      // Select the next card.
      let nextCard = this.randomCard();
      currCards.push(nextCard);

      // Check whether the guess was correct.
      let correct = this.correctGuess(currCard.rank, nextCard.rank,
        guessedHigher);

      if (!correct) {
        let nextPlayer = this.nextPlayer();
        if (nextPlayer == null) {
          // Every player has lost.
          this.gameOver = true;
          this.winner = null;
        } else {
          // Move to the next player.
          this.currPlayer = nextPlayer;
        }
        return;
      }

      if (currCards.length == this.numCards) {
        // Player has correctly guessed the final card.
        this.gameOver = true;
        this.winner = this.players[this.currPlayer];
        this.winner.score++;
        return;
      }

      // Player correctly guessed the card, so can play again.
    },
    subtitle() {
      let player = this.players[this.currPlayer];
      if (!this.gameOver) {
        return `Current Player: <u>${player.name}</u>`;
      }

      let players = this.players.length == 1 ? "You" : "All players";
      if (this.winner == null) {
        return `Game over... ${players} lost &#x1F622;`;
      }

      return `Game over... <u>${this.winner.name}</u> won! &#x1F3C6;`;
    }
  }
});
