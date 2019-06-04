import capitalize from './capitalize'

const wordsToTranscript = (receivedWords, reservedKeywords) => {
  const newKeywords = []

  // Postprocessing is formatting of the text, punkt, uppercase etc
  // Textprocess is where we find a code, keywords and save in workflow

  const precessedWords = []
  let allmäntillståndUsed = false
  let words = receivedWords
  words.forEach((word) => {
    // Postprocess
    if (word === 'punkt') {
      precessedWords.push('. ')
    } else if (word === 'kolon' || word === ':') {
      precessedWords.push('')
    } else if (word === 'allmäntillstånd' || word.toLowerCase().trim() === 'at') {
      if (allmäntillståndUsed === false) {
        precessedWords.push('at')
        allmäntillståndUsed = true
      } else {
        precessedWords.push('')
      }
    } else if (word === 'trettio') {
      precessedWords.push('30')
    } else if (word === 'ett') {
      precessedWords.push('1')
    } else {
      precessedWords.push(`${word} `)
    }
  })

  words = precessedWords


  // Remove space before punkt
  for (let i = 0; i < words.length; i += 1) {
    if (words[i] === '. ' && i !== 0) {
      words[i - 1] = words[i - 1].trim()
    }
  }

  // Capitalize
  for (let i = 0; i < words.length; i += 1) {
    const reserved = `${words[i].toLowerCase()}`
    if (i < words.length - 1 && words[i - 1] === '. ' && !reservedKeywords.includes(reserved)) {
      words[i] = capitalize(words[i])
    }
  }


  words.forEach((word) => {
    if (reservedKeywords.includes(word)) {
      newKeywords.push(word)
    }
  })


  const transcriptsToBeAppended = []
  let currentKeyword = ''
  let tempObj = {
    keyword: currentKeyword,
    segments: []
  }

  words.forEach((word) => {
    if (reservedKeywords.includes(word)) {
      tempObj.keyword = currentKeyword
      transcriptsToBeAppended.push(tempObj)
      currentKeyword = word
      tempObj = {
        keyword: currentKeyword,
        segments: []
      }
    } else {
      tempObj.segments.push(word)
    }
  })
  tempObj.keyword = currentKeyword
  transcriptsToBeAppended.push(tempObj)

  const receivedTranscripts = []
  transcriptsToBeAppended.forEach((transcriptToBeAppended) => {
    if (transcriptToBeAppended.segments.length !== 0) {
      receivedTranscripts.push(transcriptToBeAppended)
    }
  })

  const receivedTranscriptsWithTimeInfo = []
  receivedTranscripts.forEach((receivedTranscript) => {
    tempObj = {
      keyword: receivedTranscript.keyword,
      segments: []
    }

    receivedTranscript.segments.forEach((word) => {
      tempObj.segments.push({
        endTime: 0,
        startTime: 0,
        words: `${word}`
      })
    })
    receivedTranscriptsWithTimeInfo.push(tempObj)
  })

  return receivedTranscriptsWithTimeInfo
}

export default wordsToTranscript
