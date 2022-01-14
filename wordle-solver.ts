import {dictionary} from './wordle-dictionary.js';

// Everything is lower case!

// knowledge is what we have learned so far about the word
// "position" is where in the final word a letter appears
type Knowledge = {
  positionedLetters:PositionedLetter[], // Letters that are present and we know their position
  vagueLetters:PositionedLetter[] // letters are present but we only know a wrong position
  absentLetters:string[] // Letters we know are not in the solution at all
}
type PositionedLetter = [string, number]

export class Solver {
  private positionedLetters:PositionedLetter[] // Letters that are present and we know their position
  private vagueLetters:PositionedLetter[] // letters are present but we only know a wrong position
  private absentLetters:string[] // Letters we know are not in the solution at all
  private remainingWords: string[]

  constructor() {
    this.positionedLetters = [];
    this.vagueLetters = [];
    this.absentLetters = [];
    this.remainingWords = dictionary.slice();
  }

  // Find the best word to guess from the remaining words
  getNextGuess(): string {
    return this.remainingWords[0];
  }


  // Input the results from a guess
  addToKnowledge({positionedLetters, vagueLetters, absentLetters}:Knowledge): void {
    this.positionedLetters.push(...positionedLetters);
    this.vagueLetters.push(...vagueLetters);
    this.absentLetters.push(...absentLetters);
    this.filterRemainingWords();
  }


  filterRemainingWords(): void {
    const validWords:string[] = [];
    this.remainingWords.forEach(word => {
      if (this.includesAbsentLetters(word))
        return;
      if (!this.matchesPositionedLetters(word))
        return;
      if (!this.matchesVagueLetters(word))
        return;

      validWords.push(word);
    });
    this.remainingWords = validWords;
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
}
