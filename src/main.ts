import {Solver} from './wordle-solver.js';

let solver = new Solver();
let guessesMade = 0;

document.addEventListener('DOMContentLoaded', function() {
  attachResultClickHandlers();
  showNextGuess();
});


function attachResultClickHandlers(): void {
  const letterResultWrappers = document.querySelectorAll<HTMLDivElement>('.letter-result-input');
  letterResultWrappers.forEach(wrapper => {
    const position = Number(wrapper.getAttribute('position'));
    const resultButtons = wrapper.querySelectorAll<HTMLDivElement>('.letter-result');
    resultButtons.forEach(button => {
      const result = button.getAttribute('result'); // "correct", "present", or "absent"
      button.onclick = () => inputLetterResult(position, result);
    });
  });

}


function showNextGuess(): void {
  const firstWord = solver.getNextGuess();
  showWord(firstWord, guessesMade + 1);
  guessesMade++;
}


function showWord(word:string, guess:number): void {
  // Update guess classes
  document.querySelector('.guess.current').classList.remove('current');
  const guessElem = document.querySelector(`.guess[guess="${guess}"]`);
  guessElem.classList.remove('future');
  guessElem.classList.add('current');

  // Set letters
  const letters:string[] = word.split('');
  letters.forEach((letter, index) => {
    const letterElem:HTMLDivElement = guessElem.querySelector(`.letter[position="${index}"]`);
    letterElem.innerText = letter;
  });
}


function inputLetterResult(position:number, result:string): void {
  document.querySelector('.guess.current')
    .querySelector(`.letter[position="${position}"]`)
    .setAttribute('result', result);
  handleWordResult();
}


// Once all the letter results have been input we process the results
function handleWordResult(): void {
  const letterElems = document.querySelectorAll<HTMLDivElement>('.guess.current .letter[result]');
  if (letterElems.length !== 5)
    return; // We're not done tagging all the letters with results

  let resultString = '';
  letterElems.forEach(elem => {
    const letter = elem.innerText.toLowerCase();
    const result = elem.getAttribute('result');
    switch (result) {
      case 'correct': resultString += '+'; break;
      case 'present': resultString += '~'; break;
      case 'absent': resultString += '-';
    }
    resultString += letter;
  });
  solver.interpretResult(resultString);
  showNextGuess();
}
