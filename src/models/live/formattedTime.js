const formattedTime = (currentTime) => {
  const hours = Math.floor(currentTime / 3600)
  const minutes = Math.floor((currentTime / 60) - (hours * 60))
  const seconds = Math.floor(currentTime - (minutes*60) - (hours * 3600))
  const formatttedHour = hours < 10 ? `0${hours}` : `${hours}`
  const formatttedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`
  const formatttedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`
  const formattedCurrentTime = `${formatttedHour}:${formatttedMinutes}:${formatttedSeconds}`
  return formattedCurrentTime
}

export default formattedTime


