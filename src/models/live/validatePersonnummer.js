const validatePersonnummer = (personnummer) => {
  let val = personnummer.replace(/[^0-9]/g, '').toString()
  
  //Trim length to 10 chars, stripping preceding 19xx
  if (val.length > 10) {
    val = val.substring(val.length, val.length - 10)
  }

  //Check for date errors
  if (!val.match(/[0-9]{10}/)) {
    return {
      status: false,
      message: 'Invalid length of Personnummer'
    }
  }

  //  Year
  if (!val.match(/([0-9][0-9]).{8}/)) {
    return {
      status: false,
      message: `Bad year in date: ${val}`
    }
  }

  //  Month
  if (!val.match(/.{2}(0[1-9]|1[0-2]).{6}/)) {
    return {
      status: false,
      message: 'Bad month in date'
    }
  }

  //  Day
  if (!val.match(/.{4}(0[1-9]|[1-2][0-9]|3[0-1]).{4}/)) {
    return {
      status: false,
      message: 'Bad month in date'
    }
  }

  //Calculate control number (last digit)
  let valArr = val.split('')
  let luhn = (valArr[0] * 2).toString() +
    (valArr[1] * 1).toString() +
    (valArr[2] * 2).toString() +
    (valArr[3] * 1).toString() +
    (valArr[4] * 2).toString() +
    (valArr[5] * 1).toString() +
    (valArr[6] * 2).toString() +
    (valArr[7] * 1).toString() +
    (valArr[8] * 2).toString()
  const luhnArr = luhn.split('')
  let result = 0
  luhnArr.forEach((l) => {
    result += parseInt(l)
  })
  result = 10 - (result % 10)
  const controlNr = parseInt(val.substring(9, 10))

  if (controlNr === result) {
    const finalPersonnummer = 
      `${val.match(/([0-9]{6}).{4}/)[1]  }-${  val.match(/.{6}([0-9]{4})/)[1]}`
    return {
      status: true,
      message: finalPersonnummer
    }
  } else {
    return {
      status: false,
      message: 'Invalid personnummer'
    }
  }
}

export default validatePersonnummer
