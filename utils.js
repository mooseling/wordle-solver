/* jshint esversion:6 */

// We want to sort the dictionary so that the best guesses are at the top
// Currently this is just based on a letter-variety score
// Words like "doddy" that guess a single letter 3 times are really bad
export function sort(dictionary) {
  const gradedDictionary = dictionary.map(word => ({word, grade:grade(word)}));
  const sortedGradedDictionary = gradedDictionary.sort((a, b) => b.grade - a.grade); // Sort desc
  return sortedGradedDictionary.map(({word}) => word);
}


function grade(word) {
  const lettersInWord = [];
  [...word].forEach(letter => {
    if (!lettersInWord.includes(letter))
      lettersInWord.push(letter);
  });
  return lettersInWord.length;
}
