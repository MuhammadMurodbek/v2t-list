const getQueryStringValue = (key) => {
  return decodeURIComponent(
    window.location.href.replace(
      new RegExp(
        `^(?:.*[&\\?]${encodeURIComponent(key).replace(
          /[.+*]/g,
          '\\$&'
        )}(?:\\=([^&]*))?)?.*$`,
        'i'
      ),
      '$1'
    )
  )
}

export default getQueryStringValue