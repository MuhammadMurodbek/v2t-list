import getQueryStringValue from '../models/getQueryStringValue'

const getTokenData = () => {
    const tokenFromStorage = localStorage.getItem('token')
    const tokenFromQuery = getQueryStringValue.prototype.decodeToken('token')
    let token
    let tokenStub = ''
    if (tokenFromStorage) {
        token = tokenFromStorage
    }

    if (tokenFromQuery) {
        token = tokenFromQuery
        tokenStub = `?token=${token}`
    }
    return {
        token,
        tokenStub
    }
}

export default getTokenData
