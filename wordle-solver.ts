// @ts-ignore
import {dictionary} from './wordle-dictionary.ts';

// Everything is lower case!

// knowledge is what we have learned so far about the word
// "position" is where in the final word a letter appears
type Knowledge = {
  positionedLetters?:[string, number][], // Letters that are present and we know their position
  vagueLetters?:[string, number][] // letters are present but we only know a wrong position
  absentLetters?:string[] // Letters we know are not in the solution at all
  letterCounts?:[string, number][] // Letters we know the number of
}

export class Solver {
  private guesses:number;
  private positionedLetters:[string, number][] // Letters that are present and we know their position
  private vagueLetters:[string, number][] // letters are present but we only know a wrong position
  private absentLetters:string[] // Letters we know are not in the solution at all
  private letterCounts:[string, number][] // Letters we know the number of
  private remainingWords: string[]

  constructor() {
    this.guesses = 0;
    this.positionedLetters = [];
    this.vagueLetters = [];
    this.absentLetters = [];
    this.letterCounts = [];
    this.remainingWords = dictionary.slice();
  }

  // Find the best word to guess from the remaining words
  getNextGuess(): string {
    this.guesses++;
    if (this.guesses === 1)
      return 'teach'; // Seems like a good first guess
    if (this.remainingWords.length === 1 || this.guesses === 6)
      return this.remainingWords[0];
    return this.remainingWords[0];
  }


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
  }


  filterRemainingWords(): void {
    this.remainingWords = this.remainingWords.filter(word =>
      !this.includesAbsentLetters(word)
      && this.matchesPositionedLetters(word)
      && this.matchesVagueLetters(word)
      && this.matchesLetterCounts(word)
    );
  }
  }


  includesAbsentLetters(word:string) {
    return this.absentLetters.some(letter => word.includes(letter));
  }


  matchesPositionedLetters(word:string): boolean {
    if (!this.positionedLetters.length)
      return true;
    return this.positionedLetters.every(([letter, position]) => word[position] === letter);
  }


  matchesVagueLetters(word:string): boolean {
    if (!this.vagueLetters.length)
      return true;
    // Don't forget, vague letters tell us a position that a letter is NOT in
    return this.vagueLetters.every(([letter, position]) => word.includes(letter) && word[position] !== letter);
  }


  matchesLetterCounts(word:string): boolean {
    if (!this.letterCounts.length)
      return true;
    return this.letterCounts.every(([letter, count]) => word.split(letter).length === count + 1);
  }
}
