// @ts-ignore
import {dictionary} from './wordle-dictionary.ts';

// Everything is lower case!

// knowledge is what we have learned so far about the word
// "position" is where in the final word a letter appears
type Knowledge = {
  positionedLetters?:[string, number][], // Letters that are present and we know their position
  vagueLetters?:[string, number][] // letters are present but we only know a wrong position
  absentLetters?:string[] // Letters we know are not in the solution at all
  letterCounts?:{[letter:string]: number} // Letters we know the number of
}

export class Solver {
  private guesses:number;
  private positionedLetters:[string, number][] // Letters that are present and we know their position
  private vagueLetters:[string, number][] // letters are present but we only know a wrong position
  private absentLetters:string[] // Letters we know are not in the solution at all
  private letterCounts:{[letter:string]: number} // Letters we know the number of
  private remainingWords: string[]

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
    this.remainingWords = dictionary.slice();
    this.weakIndicators = dictionary.slice();
    this.strongIndicators = dictionary.slice();
  }

  // Find the best word to guess from the remaining words
  getNextGuess(): string {
    this.guesses++;
    if (this.guesses === 1)
      return 'teach'; // Seems like a good first guess
    if (this.remainingWords.length === 1 || this.guesses === 6)
      return this.remainingWords[0];
    if (this.strongIndicators.length)
      return this.strongIndicators[0];
    if (this.weakIndicators.length)
      return this.weakIndicators[0];
    return this.remainingWords[0];
  }


  // Take in the result of the last guess and turn it into Knowledge
  // result is a 10-character string with letters and symbols for their result
  // Input the results from a guess
  addToKnowledge({positionedLetters, vagueLetters, absentLetters, letterCounts}:Knowledge): void {
    if (positionedLetters)
      this.positionedLetters.push(...positionedLetters);
    if (vagueLetters)
      this.vagueLetters.push(...vagueLetters);
    if (absentLetters)
      this.absentLetters.push(...absentLetters);
    if (letterCounts)
      this.letterCounts.push(...letterCounts);
    this.filterRemainingWords();
    this.filterStrongIndicatorWords();
    this.filterWeakIndicatorWords();
  }


  filterRemainingWords(): void {
    this.remainingWords = this.remainingWords.filter(word =>
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
    return this.positionedLetters.some(([letter]) => word.includes(letter));
  }


  matchesVagueLetters(word:string): boolean {
    if (!this.vagueLetters.length)
      return true;
    // Don't forget, vague letters tell us a position that a letter is NOT in
    return this.vagueLetters.every(([letter, position]) => word.includes(letter) && word[position] !== letter);
  }


  includesVagueLetters(word:string) {
    return this.vagueLetters.some(([letter]) => word.includes(letter));
  }


  matchesLetterCounts(word:string): boolean {
    for (const letter in this.letterCounts) {
      const count = this.letterCounts[letter];
      if (!(word.split(letter).length >= count + 1))
        return false;
    }
    return true;
  }
}
