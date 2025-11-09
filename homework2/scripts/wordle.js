
window.onload = function () {
    let board = document.getElementById('board');
    let guessButton = this.document.getElementById('guessButton');
    let guessInput = this.document.getElementById('guessInput');

    let newGameButton = this.document.getElementById('newGameButton');

    for (let i = 0; i < 6; i++) {
        let row = this.document.createElement('div');
        row.classList.add('row');
        board.append(row);

        for (let j = 0; j < 5; j++) {
            let cell = this.document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-column', j);
            row.append(cell);
        }
    }

    const wordList = ["table", "chair", "piano", "mouse", "house",
        "plant", "brain", "cloud", "beach", "fruit", "media"];




    let word;
    let tries = 0;
    let gameOver = false;

    function resetGame() {
        word = wordList[Math.floor(Math.random() * wordList.length)];
        tries = 0;
        gameOver = false;
        guessInput.value = '';
        newGameButton.classList.add('hidden');
        let allCells = document.querySelectorAll('.cell');
        for (let cell of allCells) {
            cell.textContent = ''; // Clear text
            cell.classList.remove('green', 'yellow', 'red'); // Remove colors
        }
    }

    resetGame();
    guessButton.addEventListener('click', function () {
        if (gameOver == true) {
            alert("Game is already over.Click 'New Game' to play again.");
            return;
        }

        let guess = guessInput.value.toLowerCase();
        if (guess.length !== 5) {
            alert("Your guess must be 5 letters long.");
            return;
        }
        let feedback = new Array(5).fill('');
        let wordBank = word.split('');
        for (let i = 0; i < 5; i++) {
            if (guess[i] == word[i]) {
                feedback[i] = 'green';
                wordBank[i] = null;
            }
        }
        for (let i = 0; i < 5; i++) {

            if (feedback[i] === 'green') {
                continue;
            }
            let yellowIndex = wordBank.indexOf(guess[i]);

            if (yellowIndex > -1) {
                feedback[i] = 'yellow';
                wordBank[yellowIndex] = null;
            } else {
                feedback[i] = 'red';
            }
        }

        for (let i = 0; i < 5; i++) {
            let currentCell = document.querySelector(
                `[data-row="${tries}"][data-column="${i}"]`
            );
            let currentLetter = document.createTextNode(guess[i]);
            currentCell.append(currentLetter);
            currentCell.classList.add(feedback[i]);

            if (guess[i] == word[i]) {
                //green cell, letter on right position
                currentCell.classList.add('green');
            }
            else {
                if (word.indexOf(guess[i]) < 0) {
                    //red cell, letter not found
                    currentCell.classList.add('red');
                }
                else {
                    //yellow cell
                    currentCell.classList.add('yellow');
                }
            }
        }
        if (word == guess) {
            alert("You won");
            gameOver = true;
            // guessButton.setAttribute('disabled', 'disabled');
            newGameButton.classList.remove('hidden');
            return;
        };
        if (tries == 5) {
            alert(`You lost! The word was: ${word.toUpperCase()}`);
            gameOver = true;
            newGameButton.classList.remove('hidden');
            return;
        }

        tries++;
        guessInput.value = '';
    });
    newGameButton.addEventListener('click', resetGame);
    guessInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            guessButton.click();
        }
    });
}