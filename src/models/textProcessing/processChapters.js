const processChapters = (finalText, updatedSections) => {  
  let usedKeywords = ["KONTAKTORSAK"]
  const words = finalText.split(' ')
    let tempChapters = [{ keyword: "KONTAKTORSAK", segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] }]
    words.forEach((word) => {
      if (updatedSections.includes(word.toUpperCase()) && !usedKeywords.includes(word.toUpperCase())) {
        tempChapters.push({ keyword: word.toUpperCase(), segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
        usedKeywords.push(word.toUpperCase())
      } else if (word === "allmäntillstånd") {
        tempChapters.push({ keyword: "AT", segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
        usedKeywords.push("AT")
      } else {
        if (word === '\n') {
          console.log('found ny rad')
          // tempChapters[tempChapters.length - 1].segments[0].words = tempChapters[tempChapters.length - 1].segments[0].words + "\n"
          tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words} `
         } else {
           tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words}  ${word}`
         }
      }
    })
  return tempChapters
}

export default processChapters
