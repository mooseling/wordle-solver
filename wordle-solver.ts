// @ts-ignore
import {dictionary} from './wordle-dictionary.ts'; // Dictionary of legal guesses
// @ts-ignore
import {commonWords} from './common-words.ts'; // Smaller dictionary, more likely to be the answer
// @ts-ignore
import {countUniqueLetters} from './utils.js';

// ================ Current strategy ================
// The aim is to reduce the common word list as fast as possible
// So we must decide which is the best word to guess
// We want words with as many different letters as possible
// And we're particularly looking for "divisive" letters:
// Letters that appear in nearly 50% of the remaining words
// Each such letter guessed should cut the pool down by ~50%


export class Solver {
  private guesses:number;
  private positionedLetters:[string, number][] // Letters that are present and we know their position
  private vagueLetters:[string, number][] // letters are present but we only know a wrong position
  private absentLetters:string[] // Letters we know are not in the solution at all
  private letterCounts:{[letter:string]: number} // Letters we know the number of
  private remainingLegalWords: string[] // We'll guess from here to narrow things down
  private remainingCommonWords: string[] // And guess from here if we think we have a winner

  constructor() {
    this.guesses = 0;
    this.positionedLetters = [];
    this.vagueLetters = [];
    this.absentLetters = [];
    this.letterCounts = {};
    this.remainingCommonWords = commonWords.slice()
    this.remainingLegalWords = dictionary.slice();
  }


  // Find the best word to guess from the remaining words
  getNextGuess(): string {
    this.guesses++;

    if (this.guesses === 6) { // Last guess!
      if (this.remainingCommonWords.length)
        return this.remainingCommonWords[0]; // Best shot
      return this.remainingLegalWords[0]; // Best shot plan B
    }

    // If we're down to 1 or 2 options, we just go for it
    if (this.remainingCommonWords.length === 1 || this.remainingCommonWords.length === 2)
      return this.remainingCommonWords[0];
    if (this.remainingLegalWords.length === 1 || this.remainingLegalWords.length === 2)
      return this.remainingLegalWords[0];

    if (this.remainingCommonWords.length)
      return this.sortDictionary(dictionary, this.remainingCommonWords)[0];
    return this.sortDictionary(dictionary, this.remainingLegalWords)[0];
  }


  // Take in the result of the last guess and turn it into Knowledge
  // result is a 10-character string with letters and symbols for their result
  // Eg '+t-e~a-c-h':
  // t is correct, a is present but in a different position, e, c, and h are absent
  interpretResult(result:string): void {
    const lettersFound:{[letter:string]: number} = {};

    for (let i = 0; i < result.length; i += 2) {
      const letterResult = result[i];
      const letter = result[i + 1];
      const position = i / 2;

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
          else if (!this.absentLetters.includes(letter))
            this.absentLetters.push(letter);
          break;
      }
    }

    // Now that knowldge is updated, filter our word lists
    this.filterRemainingWords();

    console.log(`Remaining: ${this.remainingCommonWords.length} common words, ${this.remainingLegalWords.length} legal words`);
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


  includesAbsentLetters(word:string) {
    return this.absentLetters.some(letter => word.includes(letter));
  }


  // Does this word have the known positioned letters in the right places?
  matchesPositionedLetters(word:string): boolean {
    if (!this.positionedLetters.length)
      return true;
    return this.positionedLetters.every(([letter, position]) => word[position] === letter);
  }


  // Does this word include vague letters, but not in positions we know are wrong?
  matchesVagueLetters(word:string): boolean {
    if (!this.vagueLetters.length)
      return true;
    // Don't forget, vague letters tell us a position that a letter is NOT in
    return this.vagueLetters.every(([letter, position]) => word.includes(letter) && word[position] !== letter);
  }


  matchesLetterCounts(word:string): boolean {
    for (const letter in this.letterCounts) {
      const countInWord = word.split(letter).length - 1;
      if (countInWord !== this.letterCounts[letter])
        return false;
    }
    return true;
  }


  // Some letters are more important to guess
  // It depends on the remaining words
  sortDictionary(dictionaryToSort:string[], weightingDictionary:string[]): string[] {
    const letterScores: {[letter:string]: number} = getLetterDivisivenesses(weightingDictionary);

    // Sort primarily by number of unique letters in the word
    // And secondly by the divisiveness of the letters in words
    // We want to test letters that will split the guess pool in half
    return dictionaryToSort.sort((a, b) => {
      const aUniqueLetters = countUniqueLetters(a);
      const bUniqueLetters = countUniqueLetters(b);
      if (aUniqueLetters === bUniqueLetters)
        return getWordScore(b) - getWordScore(a);
      return bUniqueLetters - aUniqueLetters;
    });


    // Word weight based on how useful its letters are
    function getWordScore(word: string) {
      return word.split('').reduce(
        (total, letter) => total += letterScores[letter],
        0);
    }
  }
}



// Score letters by how closely to 50% of the words they appear in
function getLetterDivisivenesses(dictionary: string[]): {[letter:string]:number} {
  const letterAppearances:{[letter:string]:number} = getAlphabetObject(0);
  const letterScores:{[letter:string]:number} = getAlphabetObject(0);

  dictionary.forEach(word => {
    const wordLetterAppearances = getAlphabetObject(false);
    word.split('').forEach(letter => {
      if (!wordLetterAppearances[letter]) { // Only count letters once per words
        wordLetterAppearances[letter] = true;
        letterAppearances[letter]++;
      }
    });
  });

  for (const letter in letterAppearances) {
    const appearances = letterAppearances[letter];
    letterScores[letter] = 1/Math.abs((dictionary.length / 2) - appearances);
  }

  return letterScores;
}


// In a few places we need to record data against letters
// Simpler syntax if we can initialise the whole thing in one go
function getAlphabetObject<Type>(initialValue: Type): {[letter:string]: Type} {
  return {
    a: initialValue,
    b: initialValue,
    c: initialValue,
    d: initialValue,
    e: initialValue,
    f: initialValue,
    g: initialValue,
    h: initialValue,
    i: initialValue,
    j: initialValue,
    k: initialValue,
    l: initialValue,
    m: initialValue,
    n: initialValue,
    o: initialValue,
    p: initialValue,
    q: initialValue,
    r: initialValue,
    s: initialValue,
    t: initialValue,
    u: initialValue,
    v: initialValue,
    w: initialValue,
    x: initialValue,
    y: initialValue,
    z: initialValue,
  };
}
