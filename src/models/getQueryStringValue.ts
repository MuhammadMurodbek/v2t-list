export default class getQueryStringValue {
  public decodeToken(key: string): string {    
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
    );
  };
};