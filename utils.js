/* jshint esversion:6 */

// We want to sort the dictionary so that the best guesses are at the top
// Currently this is just based on a letter-variety score
// Words like "doddy" that guess a single letter 3 times are really bad
export function sort(dictionary) {
  const gradedDictionary = dictionary.map(word => ({word, grade:countUniqueLetters(word)}));
  const sortedGradedDictionary = gradedDictionary.sort((a, b) => b.grade - a.grade); // Sort desc
  return sortedGradedDictionary.map(({word}) => word);
}


export function countUniqueLetters(word) {
  const lettersInWord = [];
  [...word].forEach(letter => {
    if (!lettersInWord.includes(letter))
      lettersInWord.push(letter);
  });
  return lettersInWord.length;
}


// Here's how I grab the data from the Wiktionary pages
// The words are in tables, ranked by commonness
// We want both the word and how common it is
// Word frequency informs letter frequency, which we use to improve our guesses
function getWordsFromTBody(tBody) {
  return Array.from(tBody.children) // Extract table-rows
    .splice(1) // Remove head
    .map(tr => Array.from(tr.children) // Get array of table-cells
      .splice(1) // Remove rank
      .map(td => td.innerText) // Extract text
      .map(text => text.split(' ')[0]) // Remove annotations
    )
    .filter(([word, frequency]) => word.match(/^[a-z]{5}$/)) // 5 letters, no punctuation or names
    .map(([word, frequency]) => [word, Number(frequency)]); // Convert frequency string to number
}


// The common word list from wiktionary is full of weird things
// We know for sure we can remove anything that is not in the Wordle dictionary
// In this function we are expecting an array of words with frequencies (from the function above)
function filterWordsAgainstDictionary(wordsToFilter, dictionary) {
  return wordsToFilter.filter(([word]) => dictionary.includes(word));
}
