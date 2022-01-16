// @ts-ignore
import {dictionary} from './wordle-dictionary.ts'; // Dictionary of legal guesses
// @ts-ignore
import {commonWords} from './common-words.ts'; // Smaller dictionary, more likely to be the answer

// Everything is lower case!


export class Solver {
  private guesses:number;
  private positionedLetters:[string, number][] // Letters that are present and we know their position
  private vagueLetters:[string, number][] // letters are present but we only know a wrong position
  private absentLetters:string[] // Letters we know are not in the solution at all
  private letterCounts:{[letter:string]: number} // Letters we know the number of
  private remainingLegalWords: string[] // We'll guess from here to narrow things down
  private remainingCommonWords: string[] // And guess from here if we think we have a winner

  // The trick to Wordle is guessing words that you know are wrong, but tell you something useful
  // All indicator words must not contain letters we know are absent
  private strongIndicators: string[] // Contain no known letters
  private weakIndicators: string[] // Contain known letters, ignore positions

  constructor() {
    this.guesses = 0;
    this.positionedLetters = [];
    this.vagueLetters = [];
    this.absentLetters = [];
    this.letterCounts = {};
    this.remainingCommonWords = commonWords.slice()
    this.remainingLegalWords = dictionary.slice();
    this.weakIndicators = dictionary.slice();
    this.strongIndicators = dictionary.slice();
  }

  // Find the best word to guess from the remaining words
  getNextGuess(): string {
    this.guesses++;
    if (this.guesses === 1)
      return 'teach'; // Seems like a good first guess
    if (this.guesses === 6) { // Last guess!
      if (this.remainingCommonWords.length)
        return this.remainingCommonWords[0]; // Best shot
      return this.remainingLegalWords[0]; // Best shot plan B
    }

    // If there's only one common word left, guess it
    if (this.remainingCommonWords.length === 1)
      return this.remainingCommonWords[0];
    // If there's only one legal word left, guess it
    if (this.remainingLegalWords.length === 1)
      return this.remainingLegalWords[0];

    // ... Otherwise we'll try more indicator words
    if (this.strongIndicators.length)
      return this.strongIndicators[0];
    if (this.weakIndicators.length)
      return this.weakIndicators[0];

    // If indicator words are all somehow exhausted, make best guesses
    if (this.remainingCommonWords.length)
      return this.remainingCommonWords[0];
    return this.remainingLegalWords[0];
  }


  // Take in the result of the last guess and turn it into Knowledge
  // result is a 10-character string with letters and symbols for their result
  // Eg '+t-e~a-c-h':
  // t is correct, a is present but in a different position, e, c, and h are absent
  interpretResult(result:string): void {
    for (let i = 0; i < result.length; i += 2) {
      const letterResult = result[i];
      const letter = result[i + 1];
      const position = i / 2;
      const lettersFound:{[letter:string]: number} = {};

      switch (letterResult) {
        // In all cases we check whether we already know this thing
        case '+': // Letter is in correct position
          if (!this.positionedLetters.some(([_letter, _position]) => _letter === letter && _position === position))
            this.positionedLetters.push([letter, position]);
          if (lettersFound[letter])
            lettersFound[letter]++;
          else
            lettersFound[letter] = 1;
            break;
        case '~': // Letter is present but in wrong position
          if (!this.vagueLetters.some(([_letter, _position]) => _letter === letter && _position === position))
            this.vagueLetters.push([letter, position]);
          if (lettersFound[letter])
            lettersFound[letter]++;
          else
            lettersFound[letter] = 1;
          break;
        case '-': // Letter is found to be absent
          // If we've already seen this letter, we now know how many there are
          if (lettersFound[letter])
            this.letterCounts[letter] = lettersFound[letter];
          else if (!this.absentLetters.some(_letter => _letter === letter))
            this.absentLetters.push(letter);
          break;
      }
    }

    // Now that knowldge is updated, filter our word lists
    this.filterRemainingWords();
    this.filterStrongIndicatorWords();
    this.filterWeakIndicatorWords();
  }


  filterRemainingWords(): void {
    this.remainingLegalWords = this.remainingLegalWords.filter(word =>
      !this.includesAbsentLetters(word)
      && this.matchesPositionedLetters(word)
      && this.matchesVagueLetters(word)
      && this.matchesLetterCounts(word)
    );
    this.remainingCommonWords = this.remainingCommonWords.filter(word =>
      !this.includesAbsentLetters(word)
      && this.matchesPositionedLetters(word)
      && this.matchesVagueLetters(word)
      && this.matchesLetterCounts(word)
    );
  }


  // Strong indicators are words with no known letters and no absent letters
  // They help us find new letters entirely
  filterStrongIndicatorWords(): void {
    this.strongIndicators = this.strongIndicators.filter(word =>
      !this.includesAbsentLetters(word)
      && !this.includesPositionedLetters(word)
      && !this.includesVagueLetters(word)
    );
  }


  // Weak indicators are words with known letters, but not necessarily in the right position
  filterWeakIndicatorWords(): void {
    this.weakIndicators = this.weakIndicators.filter(word =>
      !this.includesAbsentLetters(word)
      && this.includesPositionedLetters(word)
      && this.includesVagueLetters(word)
    );
  }


  includesAbsentLetters(word:string) {
    return this.absentLetters.some(letter => word.includes(letter));
  }


  matchesPositionedLetters(word:string): boolean {
    if (!this.positionedLetters.length)
      return true;
    return this.positionedLetters.every(([letter, position]) => word[position] === letter);
  }


  includesPositionedLetters(word:string) {
    return this.positionedLetters.every(([letter]) => word.includes(letter));
  }


  matchesVagueLetters(word:string): boolean {
    if (!this.vagueLetters.length)
      return true;
    // Don't forget, vague letters tell us a position that a letter is NOT in
    return this.vagueLetters.every(([letter, position]) => word.includes(letter) && word[position] !== letter);
  }


  includesVagueLetters(word:string) {
    return this.vagueLetters.every(([letter]) => word.includes(letter));
  }


  matchesLetterCounts(word:string): boolean {
    for (const letter in this.letterCounts) {
      const countInWord = word.split(letter).length - 1;
      if (countInWord !== this.letterCounts[letter])
        return false;
    }
    return true;
  }
}
