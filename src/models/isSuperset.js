const isSuperset = (set, subset) => {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false
        }
    }
    return true
}

export default isSuperset